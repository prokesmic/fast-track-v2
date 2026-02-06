/**
 * Consolidated Notifications API
 * Handles register, settings, and send via query params
 * Route: /api/notifications?action=register|settings|send
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, and } from "drizzle-orm";
import { db, schema } from "./_lib/db";
import { authenticate, AuthenticatedRequest, verifyAuth } from "./_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = req.query.action as string;

  // Send notifications doesn't require user auth (internal use)
  if (action === "send" && req.method === "POST") {
    return handleSend(req, res);
  }

  // All other actions require authentication
  const authResult = await authenticate(req as AuthenticatedRequest);
  if ("error" in authResult) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.userId;

  try {
    switch (action) {
      case "register":
        return handleRegister(req, res, userId);
      case "settings":
        return handleSettings(req, res, userId);
      default:
        return res.status(400).json({ error: "Invalid action. Use: register, settings, or send" });
    }
  } catch (error) {
    console.error(`[NOTIFICATIONS/${action}] Error:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleRegister(req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method === "POST") {
    const { token, platform } = req.body;

    if (!token || !platform) {
      return res.status(400).json({ error: "token and platform are required" });
    }

    const existingTokens = await db
      .select()
      .from(schema.deviceTokens)
      .where(
        and(
          eq(schema.deviceTokens.userId, userId),
          eq(schema.deviceTokens.token, token)
        )
      )
      .limit(1);

    if (existingTokens.length > 0) {
      await db
        .update(schema.deviceTokens)
        .set({ isActive: true })
        .where(eq(schema.deviceTokens.id, existingTokens[0].id));

      return res.status(200).json({ success: true, tokenId: existingTokens[0].id });
    }

    await db
      .update(schema.deviceTokens)
      .set({ isActive: false })
      .where(
        and(
          eq(schema.deviceTokens.userId, userId),
          eq(schema.deviceTokens.platform, platform)
        )
      );

    const [newToken] = await db
      .insert(schema.deviceTokens)
      .values({
        userId,
        token,
        platform,
        isActive: true,
      })
      .returning();

    return res.status(201).json({ success: true, tokenId: newToken.id });
  }

  if (req.method === "DELETE") {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "token is required" });
    }

    await db
      .update(schema.deviceTokens)
      .set({ isActive: false })
      .where(
        and(
          eq(schema.deviceTokens.userId, userId),
          eq(schema.deviceTokens.token, token)
        )
      );

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

async function handleSettings(req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method === "GET") {
    const settings = await db
      .select()
      .from(schema.notificationSettings)
      .where(eq(schema.notificationSettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      return res.status(200).json({
        userId,
        fastReminder: true,
        milestoneReached: true,
        streakAtRisk: true,
        dailyMotivation: true,
        reminderHour: 20,
      });
    }

    return res.status(200).json(settings[0]);
  }

  if (req.method === "PUT") {
    const { fastReminder, milestoneReached, streakAtRisk, dailyMotivation, reminderHour } = req.body;

    const existing = await db
      .select()
      .from(schema.notificationSettings)
      .where(eq(schema.notificationSettings.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(schema.notificationSettings)
        .set({
          fastReminder: fastReminder ?? existing[0].fastReminder,
          milestoneReached: milestoneReached ?? existing[0].milestoneReached,
          streakAtRisk: streakAtRisk ?? existing[0].streakAtRisk,
          dailyMotivation: dailyMotivation ?? existing[0].dailyMotivation,
          reminderHour: reminderHour ?? existing[0].reminderHour,
        })
        .where(eq(schema.notificationSettings.userId, userId))
        .returning();

      return res.status(200).json(updated);
    }

    const [created] = await db
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

    return res.status(201).json(created);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

async function handleSend(req: VercelRequest, res: VercelResponse) {
  const { userId, title, body, data } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ error: "userId, title, and body are required" });
  }

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
    return res.status(200).json({ success: false, message: "No active tokens found" });
  }

  const messages = tokens.map((token) => ({
    to: token.token,
    sound: "default" as const,
    title,
    body,
    data: data || {},
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("[NOTIFICATIONS/send] Expo push error:", error);
    return res.status(500).json({ error: "Failed to send notification" });
  }
}
