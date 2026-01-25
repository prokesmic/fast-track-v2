import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "./_lib/db";
import { authenticate, AuthenticatedRequest } from "./_lib/auth";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Authenticate
  const authResult = await authenticate(req as AuthenticatedRequest);
  if ("error" in authResult) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.userId;

  try {
    if (req.method === "GET") {
      // Get profile
      const profiles = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, userId))
        .limit(1);

      if (profiles.length === 0) {
        // Create default profile if not exists
        const [newProfile] = await db
          .insert(schema.profiles)
          .values({ userId })
          .returning();
        return res.status(200).json({ profile: newProfile });
      }

      return res.status(200).json({ profile: profiles[0] });
    }

    if (req.method === "PUT") {
      // Update profile
      const profileData = req.body;

      // Check if profile exists
      const existingProfile = await db
        .select({ userId: schema.profiles.userId })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, userId))
        .limit(1);

      if (existingProfile.length === 0) {
        // Create profile
        const [newProfile] = await db
          .insert(schema.profiles)
          .values({
            userId,
            displayName: profileData.displayName,
            avatarId: profileData.avatarId,
            customAvatarUri: profileData.customAvatarUri,
            weightUnit: profileData.weightUnit,
            notificationsEnabled: profileData.notificationsEnabled,
            unlockedBadges: profileData.unlockedBadges,
          })
          .returning();
        return res.status(201).json({ profile: newProfile });
      }

      // Update existing profile
      const [updatedProfile] = await db
        .update(schema.profiles)
        .set({
          displayName: profileData.displayName,
          avatarId: profileData.avatarId,
          customAvatarUri: profileData.customAvatarUri,
          weightUnit: profileData.weightUnit,
          notificationsEnabled: profileData.notificationsEnabled,
          unlockedBadges: profileData.unlockedBadges,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.userId, userId))
        .returning();

      return res.status(200).json({ profile: updatedProfile });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
