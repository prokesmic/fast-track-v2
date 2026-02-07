/**
 * Consolidated Social API
 * Handles friends, challenges, leaderboard, feed, and profile via query params
 * Route: /api/social?route=friends|challenges|leaderboard|feed|profile
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, or, and, desc, sql, ne, isNull, gte, lt, count } from "drizzle-orm";
import { db, schema } from "./_lib/db";
import { verifyAuth } from "./_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyAuth(req);
  if (!auth.success || !auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = auth.userId;
  const route = req.query.route as string;

  try {
    switch (route) {
      case "friends":
        return handleFriends(req, res, userId);
      case "challenges":
        return handleChallenges(req, res, userId);
      case "leaderboard":
        return handleLeaderboard(req, res, userId);
      case "feed":
        return handleFeed(req, res, userId);
      case "profile":
        return handleProfile(req, res, userId);
      default:
        return res.status(400).json({ error: "Invalid route" });
    }
  } catch (error) {
    console.error(`[SOCIAL/${route}] Error:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Friends handlers
async function handleFriends(req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method === "GET") {
    const friendships = await db
      .select()
      .from(schema.friendships)
      .where(
        or(
          eq(schema.friendships.requesterId, userId),
          eq(schema.friendships.addresseeId, userId)
        )
      )
      .orderBy(desc(schema.friendships.updatedAt));

    const accepted = friendships.filter(f => f.status === "accepted");
    const pending = friendships.filter(f => f.status === "pending" && f.addresseeId === userId);
    const sent = friendships.filter(f => f.status === "pending" && f.requesterId === userId);

    return res.status(200).json({ accepted, pending, sent });
  }

  if (req.method === "POST") {
    const { action, friendId, requestId } = req.body;

    if (action === "send") {
      const existing = await db
        .select()
        .from(schema.friendships)
        .where(
          or(
            and(
              eq(schema.friendships.requesterId, userId),
              eq(schema.friendships.addresseeId, friendId)
            ),
            and(
              eq(schema.friendships.requesterId, friendId),
              eq(schema.friendships.addresseeId, userId)
            )
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ error: "Friendship already exists" });
      }

      const [friendship] = await db
        .insert(schema.friendships)
        .values({
          id: `fr_${Date.now()}`,
          requesterId: userId,
          addresseeId: friendId,
          status: "pending",
        })
        .returning();

      return res.status(201).json(friendship);
    }

    if (action === "accept" && requestId) {
      await db
        .update(schema.friendships)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(
          and(
            eq(schema.friendships.id, requestId),
            eq(schema.friendships.addresseeId, userId)
          )
        );
      return res.status(200).json({ success: true });
    }

    if (action === "reject" && requestId) {
      await db
        .delete(schema.friendships)
        .where(
          and(
            eq(schema.friendships.id, requestId),
            eq(schema.friendships.addresseeId, userId)
          )
        );
      return res.status(200).json({ success: true });
    }

    if (action === "remove" && friendId) {
      await db
        .delete(schema.friendships)
        .where(
          or(
            and(
              eq(schema.friendships.requesterId, userId),
              eq(schema.friendships.addresseeId, friendId)
            ),
            and(
              eq(schema.friendships.requesterId, friendId),
              eq(schema.friendships.addresseeId, userId)
            )
          )
        );
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// Challenges handlers
async function handleChallenges(req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method === "GET") {
    const now = new Date();
    const active = await db
      .select()
      .from(schema.challenges)
      .where(
        gte(schema.challenges.endDate, now)
      )
      .orderBy(desc(schema.challenges.createdAt));

    const myParticipations = await db
      .select()
      .from(schema.challengeParticipants)
      .where(eq(schema.challengeParticipants.userId, userId));

    return res.status(200).json({
      challenges: active,
      myParticipations: myParticipations.map(p => p.challengeId),
    });
  }

  if (req.method === "POST") {
    const { action, challengeId, name, description, type, target, startDate, endDate, isPublic } = req.body;

    if (action === "create") {
      const [challenge] = await db
        .insert(schema.challenges)
        .values({
          id: `ch_${Date.now()}`,
          creatorId: userId,
          name,
          description,
          type: type || "total_hours",
          targetValue: target || 100,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isPublic: isPublic ?? true,
        })
        .returning();

      await db.insert(schema.challengeParticipants).values({
        id: `cp_${Date.now()}`,
        challengeId: challenge.id,
        userId,
        progress: 0,
      });

      return res.status(201).json(challenge);
    }

    if (action === "join" && challengeId) {
      const existing = await db
        .select()
        .from(schema.challengeParticipants)
        .where(
          and(
            eq(schema.challengeParticipants.challengeId, challengeId),
            eq(schema.challengeParticipants.userId, userId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ error: "Already joined" });
      }

      await db.insert(schema.challengeParticipants).values({
        id: `cp_${Date.now()}`,
        challengeId,
        userId,
        progress: 0,
      });

      return res.status(200).json({ success: true });
    }

    if (action === "leave" && challengeId) {
      await db
        .delete(schema.challengeParticipants)
        .where(
          and(
            eq(schema.challengeParticipants.challengeId, challengeId),
            eq(schema.challengeParticipants.userId, userId)
          )
        );
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// Leaderboard handlers
async function handleLeaderboard(req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const period = (req.query.period as string) || "week";
  const type = (req.query.type as string) || "hours";

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "day":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default: // week
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
  }

  // Both startTime and endTime are stored as bigint milliseconds
  // Calculate hours: (endTime - startTime) / (1000 * 60 * 60)
  const hoursExpr = sql<number>`SUM((${schema.fasts.endTime} - ${schema.fasts.startTime}) / 3600000.0)`;

  const fasts = await db
    .select({
      odUserId: schema.fasts.userId,
      totalHours: hoursExpr,
      fastCount: count(schema.fasts.id),
    })
    .from(schema.fasts)
    .where(
      and(
        gte(schema.fasts.endTime, startDate.getTime()),
        sql`${schema.fasts.endTime} IS NOT NULL`,
        eq(schema.fasts.completed, true)
      )
    )
    .groupBy(schema.fasts.userId)
    .orderBy(type === "count" ? desc(count(schema.fasts.id)) : desc(hoursExpr))
    .limit(50);

  // Format the response with ranks
  const leaderboard = fasts.map((entry, index) => ({
    rank: index + 1,
    userId: entry.odUserId,
    totalHours: Math.round((entry.totalHours || 0) * 10) / 10,
    fastCount: entry.fastCount,
    isCurrentUser: entry.odUserId === userId,
  }));

  return res.status(200).json({ leaderboard, period, type });
}

// Feed handlers
async function handleFeed(req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method === "GET") {
    const posts = await db
      .select()
      .from(schema.communityPosts)
      .orderBy(desc(schema.communityPosts.createdAt))
      .limit(50);

    return res.status(200).json({ posts });
  }

  if (req.method === "POST") {
    const { action, postId, content, type, data } = req.body;

    if (action === "create") {
      const [post] = await db
        .insert(schema.communityPosts)
        .values({
          id: `post_${Date.now()}`,
          userId,
          type: type || "achievement",
          content,
          metadata: data ? JSON.stringify(data) : null,
          likesCount: 0,
        })
        .returning();

      return res.status(201).json(post);
    }

    if (action === "like" && postId) {
      const existing = await db
        .select()
        .from(schema.postLikes)
        .where(
          and(
            eq(schema.postLikes.postId, postId),
            eq(schema.postLikes.userId, userId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .delete(schema.postLikes)
          .where(
            and(
              eq(schema.postLikes.postId, postId),
              eq(schema.postLikes.userId, userId)
            )
          );
        await db
          .update(schema.communityPosts)
          .set({ likesCount: sql`${schema.communityPosts.likesCount} - 1` })
          .where(eq(schema.communityPosts.id, postId));
        return res.status(200).json({ liked: false });
      }

      await db.insert(schema.postLikes).values({
        id: `like_${Date.now()}`,
        postId,
        userId,
      });
      await db
        .update(schema.communityPosts)
        .set({ likesCount: sql`${schema.communityPosts.likesCount} + 1` })
        .where(eq(schema.communityPosts.id, postId));
      return res.status(200).json({ liked: true });
    }

    if (action === "delete" && postId) {
      await db
        .delete(schema.communityPosts)
        .where(
          and(
            eq(schema.communityPosts.id, postId),
            eq(schema.communityPosts.userId, userId)
          )
        );
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// Profile handlers
async function handleProfile(req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method === "GET") {
    const targetUserId = (req.query.userId as string) || userId;

    const [profile] = await db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, targetUserId))
      .limit(1);

    return res.status(200).json({ profile: profile || null });
  }

  if (req.method === "POST") {
    const { username, bio, isPublic } = req.body;

    const existing = await db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(schema.userProfiles)
        .set({
          username: username ?? existing[0].username,
          bio: bio ?? existing[0].bio,
          isPublic: isPublic ?? existing[0].isPublic,
          updatedAt: new Date(),
        })
        .where(eq(schema.userProfiles.userId, userId))
        .returning();
      return res.status(200).json(updated);
    }

    const [created] = await db
      .insert(schema.userProfiles)
      .values({
        userId,
        username,
        bio,
        isPublic: isPublic ?? true,
      })
      .returning();

    return res.status(201).json(created);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
