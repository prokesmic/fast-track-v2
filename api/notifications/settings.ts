import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "../_lib/db";
import { authenticate, AuthenticatedRequest } from "../_lib/auth";
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
      // Get notification settings
      const settings = await db
        .select()
        .from(schema.notificationSettings)
        .where(eq(schema.notificationSettings.userId, userId))
        .limit(1);

      if (settings.length === 0) {
        // Return default settings if none exist
        return res.status(200).json({
          settings: {
            userId,
            fastReminder: true,
            milestoneReached: true,
            streakAtRisk: true,
            dailyMotivation: true,
            reminderHour: 20,
          },
        });
      }

      return res.status(200).json({ settings: settings[0] });
    }

    if (req.method === "PUT") {
      const {
        fastReminder,
        milestoneReached,
        streakAtRisk,
        dailyMotivation,
        reminderHour,
      } = req.body;

      // Check if settings exist
      const existingSettings = await db
        .select({ userId: schema.notificationSettings.userId })
        .from(schema.notificationSettings)
        .where(eq(schema.notificationSettings.userId, userId))
        .limit(1);

      if (existingSettings.length === 0) {
        // Create settings
        const [newSettings] = await db
          .insert(schema.notificationSettings)
          .values({
            userId,
            fastReminder: fastReminder ?? true,
            milestoneReached: milestoneReached ?? true,
            streakAtRisk: streakAtRisk ?? true,
            dailyMotivation: dailyMotivation ?? true,
            reminderHour: reminderHour ?? 20,
          })
          .returning();

        return res.status(201).json({ settings: newSettings });
      }

      // Update existing settings
      const [updatedSettings] = await db
        .update(schema.notificationSettings)
        .set({
          fastReminder,
          milestoneReached,
          streakAtRisk,
          dailyMotivation,
          reminderHour,
        })
        .where(eq(schema.notificationSettings.userId, userId))
        .returning();

      return res.status(200).json({ settings: updatedSettings });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Notification settings error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
