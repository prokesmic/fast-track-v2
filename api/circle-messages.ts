/**
 * Circle Messages API
 * Handles chat messages within fasting circles
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, and, desc, lt, gte } from "drizzle-orm";
import { db, schema } from "./_lib/db";
import { verifyAuth } from "./_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyAuth(req);
  if (!auth.success || !auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = auth.userId;

  try {
    switch (req.method) {
      case "GET":
        return handleGet(req, res, userId);
      case "POST":
        return handlePost(req, res, userId);
      case "DELETE":
        return handleDelete(req, res, userId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("[CIRCLE-MESSAGES] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const circleId = req.query.circleId as string;
  const before = req.query.before as string; // cursor for pagination
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  if (!circleId) {
    return res.status(400).json({ error: "Circle ID required" });
  }

  // Verify membership
  const [membership] = await db
    .select()
    .from(schema.circleMembers)
    .where(
      and(
        eq(schema.circleMembers.circleId, circleId),
        eq(schema.circleMembers.userId, userId)
      )
    )
    .limit(1);

  if (!membership) {
    return res.status(403).json({ error: "Not a member of this circle" });
  }

  // Build query with pagination
  let query = db
    .select()
    .from(schema.circleMessages)
    .where(eq(schema.circleMessages.circleId, circleId))
    .orderBy(desc(schema.circleMessages.createdAt))
    .limit(limit);

  if (before) {
    const beforeDate = new Date(before);
    query = db
      .select()
      .from(schema.circleMessages)
      .where(
        and(
          eq(schema.circleMessages.circleId, circleId),
          lt(schema.circleMessages.createdAt, beforeDate)
        )
      )
      .orderBy(desc(schema.circleMessages.createdAt))
      .limit(limit);
  }

  const messages = await query;

  // Enrich with user profiles
  const enrichedMessages = await Promise.all(
    messages.map(async (message) => {
      const [profile] = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, message.userId))
        .limit(1);

      const [userProfile] = await db
        .select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.userId, message.userId))
        .limit(1);

      return {
        ...message,
        displayName: profile?.displayName || "Anonymous",
        avatarId: profile?.avatarId || 0,
        customAvatarUri: profile?.customAvatarUri || null,
        username: userProfile?.username || null,
        isOwn: message.userId === userId,
      };
    })
  );

  // Return in chronological order for display
  return res.status(200).json({
    messages: enrichedMessages.reverse(),
    hasMore: messages.length === limit,
  });
}

async function handlePost(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const { circleId, content, type, metadata } = req.body;

  if (!circleId) {
    return res.status(400).json({ error: "Circle ID required" });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: "Message content required" });
  }

  if (content.length > 2000) {
    return res.status(400).json({ error: "Message too long (max 2000 characters)" });
  }

  // Verify membership
  const [membership] = await db
    .select()
    .from(schema.circleMembers)
    .where(
      and(
        eq(schema.circleMembers.circleId, circleId),
        eq(schema.circleMembers.userId, userId)
      )
    )
    .limit(1);

  if (!membership) {
    return res.status(403).json({ error: "Not a member of this circle" });
  }

  // Create message
  const [message] = await db
    .insert(schema.circleMessages)
    .values({
      circleId,
      userId,
      type: type || "text",
      content: content.trim(),
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
    .returning();

  // Get user profile for response
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  const [userProfile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .limit(1);

  return res.status(201).json({
    message: {
      ...message,
      displayName: profile?.displayName || "Anonymous",
      avatarId: profile?.avatarId || 0,
      customAvatarUri: profile?.customAvatarUri || null,
      username: userProfile?.username || null,
      isOwn: true,
    },
  });
}

async function handleDelete(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const { messageId, circleId } = req.body;

  if (!messageId || !circleId) {
    return res.status(400).json({ error: "Message ID and Circle ID required" });
  }

  // Get the message
  const [message] = await db
    .select()
    .from(schema.circleMessages)
    .where(eq(schema.circleMessages.id, messageId))
    .limit(1);

  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  // Check if user is the message author or an admin
  const [membership] = await db
    .select()
    .from(schema.circleMembers)
    .where(
      and(
        eq(schema.circleMembers.circleId, circleId),
        eq(schema.circleMembers.userId, userId)
      )
    )
    .limit(1);

  if (!membership) {
    return res.status(403).json({ error: "Not a member of this circle" });
  }

  const canDelete = message.userId === userId || membership.role === "admin";

  if (!canDelete) {
    return res.status(403).json({ error: "Cannot delete this message" });
  }

  await db
    .delete(schema.circleMessages)
    .where(eq(schema.circleMessages.id, messageId));

  return res.status(200).json({ success: true });
}
