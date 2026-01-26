import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "../_lib/db";
import { eq, and } from "drizzle-orm";

// Internal API key check (for server-to-server calls)
function validateInternalKey(req: VercelRequest): boolean {
  const internalKey = req.headers["x-internal-key"];
  return internalKey === process.env.INTERNAL_API_KEY;
}

interface ExpoPushMessage {
  to: string;
  sound?: "default" | null;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
}

// Send push notification via Expo Push API
async function sendExpoPushNotifications(
  messages: ExpoPushMessage[]
): Promise<void> {
  if (messages.length === 0) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Expo Push API error:", error);
    throw new Error(`Failed to send notifications: ${error}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Internal-Key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validate internal key
  if (!validateInternalKey(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { userId, type, title, body, data } = req.body;

    if (!userId || !type || !title || !body) {
      return res.status(400).json({
        error: "userId, type, title, and body are required",
      });
    }

    // Get notification settings for user
    const settings = await db
      .select()
      .from(schema.notificationSettings)
      .where(eq(schema.notificationSettings.userId, userId))
      .limit(1);

    // Check if user has this notification type enabled
    const userSettings = settings[0];
    if (userSettings) {
      const typeEnabled = {
        fast_reminder: userSettings.fastReminder,
        milestone_reached: userSettings.milestoneReached,
        streak_at_risk: userSettings.streakAtRisk,
        daily_motivation: userSettings.dailyMotivation,
      }[type];

      if (typeEnabled === false) {
        return res.status(200).json({
          success: false,
          reason: "Notification type disabled by user",
        });
      }
    }

    // Get active device tokens for user
    const tokens = await db
      .select()
      .from(schema.deviceTokens)
      .where(
        and(
          eq(schema.deviceTokens.userId, userId),
          eq(schema.deviceTokens.isActive, true)
        )
      );

    if (tokens.length === 0) {
      return res.status(200).json({
        success: false,
        reason: "No active device tokens",
      });
    }

    // Create push messages
    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token.token,
      sound: "default",
      title,
      body,
      data: data || {},
    }));

    // Send notifications
    await sendExpoPushNotifications(messages);

    return res.status(200).json({
      success: true,
      sentTo: tokens.length,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
