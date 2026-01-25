import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "./_lib/db";
import { authenticate, AuthenticatedRequest } from "./_lib/auth";
import { eq } from "drizzle-orm";

interface SyncData {
  fasts?: Array<{
    id: string;
    startTime: number;
    endTime?: number | null;
    targetDuration: number;
    planId: string;
    planName: string;
    completed?: boolean;
    note?: string | null;
  }>;
  weights?: Array<{
    id: string;
    date: string;
    weight: number;
  }>;
  profile?: {
    displayName?: string;
    avatarId?: number;
    customAvatarUri?: string | null;
    weightUnit?: string;
    notificationsEnabled?: boolean;
    unlockedBadges?: string[];
  };
  water?: Array<{
    date: string;
    cups: number;
  }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate
  const authResult = await authenticate(req as AuthenticatedRequest);
  if ("error" in authResult) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.userId;

  try {
    const syncData: SyncData = req.body;
    const results = {
      fasts: { synced: 0, errors: 0 },
      weights: { synced: 0, errors: 0 },
      profile: { synced: false },
      water: { synced: 0, errors: 0 },
    };

    // Sync fasts
    if (syncData.fasts && Array.isArray(syncData.fasts)) {
      for (const fast of syncData.fasts) {
        try {
          // Check if fast exists
          const existing = await db
            .select({ id: schema.fasts.id })
            .from(schema.fasts)
            .where(eq(schema.fasts.id, fast.id))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(schema.fasts)
              .set({
                startTime: fast.startTime,
                endTime: fast.endTime,
                targetDuration: fast.targetDuration,
                planId: fast.planId,
                planName: fast.planName,
                completed: fast.completed ?? false,
                note: fast.note,
                updatedAt: new Date(),
              })
              .where(eq(schema.fasts.id, fast.id));
          } else {
            await db.insert(schema.fasts).values({
              id: fast.id,
              userId,
              startTime: fast.startTime,
              endTime: fast.endTime,
              targetDuration: fast.targetDuration,
              planId: fast.planId,
              planName: fast.planName,
              completed: fast.completed ?? false,
              note: fast.note,
            });
          }
          results.fasts.synced++;
        } catch {
          results.fasts.errors++;
        }
      }
    }

    // Sync weights
    if (syncData.weights && Array.isArray(syncData.weights)) {
      for (const weight of syncData.weights) {
        try {
          const existing = await db
            .select({ id: schema.weights.id })
            .from(schema.weights)
            .where(eq(schema.weights.id, weight.id))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(schema.weights)
              .set({ date: weight.date, weight: weight.weight })
              .where(eq(schema.weights.id, weight.id));
          } else {
            await db.insert(schema.weights).values({
              id: weight.id,
              userId,
              date: weight.date,
              weight: weight.weight,
            });
          }
          results.weights.synced++;
        } catch {
          results.weights.errors++;
        }
      }
    }

    // Sync profile
    if (syncData.profile) {
      try {
        const existing = await db
          .select({ userId: schema.profiles.userId })
          .from(schema.profiles)
          .where(eq(schema.profiles.userId, userId))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(schema.profiles)
            .set({
              displayName: syncData.profile.displayName,
              avatarId: syncData.profile.avatarId,
              customAvatarUri: syncData.profile.customAvatarUri,
              weightUnit: syncData.profile.weightUnit,
              notificationsEnabled: syncData.profile.notificationsEnabled,
              unlockedBadges: syncData.profile.unlockedBadges,
              updatedAt: new Date(),
            })
            .where(eq(schema.profiles.userId, userId));
        } else {
          await db.insert(schema.profiles).values({
            userId,
            displayName: syncData.profile.displayName,
            avatarId: syncData.profile.avatarId,
            customAvatarUri: syncData.profile.customAvatarUri,
            weightUnit: syncData.profile.weightUnit,
            notificationsEnabled: syncData.profile.notificationsEnabled,
            unlockedBadges: syncData.profile.unlockedBadges,
          });
        }
        results.profile.synced = true;
      } catch {
        // Profile sync failed
      }
    }

    // Sync water
    if (syncData.water && Array.isArray(syncData.water)) {
      for (const entry of syncData.water) {
        try {
          // Water entries are keyed by date, so check if entry for date exists
          const existing = await db
            .select({ id: schema.water.id })
            .from(schema.water)
            .where(eq(schema.water.date, entry.date))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(schema.water)
              .set({ cups: entry.cups })
              .where(eq(schema.water.id, existing[0].id));
          } else {
            await db.insert(schema.water).values({
              userId,
              date: entry.date,
              cups: entry.cups,
            });
          }
          results.water.synced++;
        } catch {
          results.water.errors++;
        }
      }
    }

    // Fetch all cloud data to return
    const [cloudFasts, cloudWeights, cloudProfile, cloudWater] = await Promise.all([
      db
        .select()
        .from(schema.fasts)
        .where(eq(schema.fasts.userId, userId)),
      db
        .select()
        .from(schema.weights)
        .where(eq(schema.weights.userId, userId)),
      db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, userId))
        .limit(1),
      db.select().from(schema.water).where(eq(schema.water.userId, userId)),
    ]);

    return res.status(200).json({
      success: true,
      results,
      data: {
        fasts: cloudFasts,
        weights: cloudWeights,
        profile: cloudProfile[0] || null,
        water: cloudWater,
      },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
