import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, or, and, desc } from "drizzle-orm";
import { db, schema } from "../_lib/db";
import { verifyAuth } from "../_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyAuth(req);
  if (!auth.success || !auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = auth.userId;

  // GET - List friends and pending requests
  if (req.method === "GET") {
    try {
      // Get all friendships involving this user
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

      // Get user details for each friendship
      const friendIds = friendships.map((f) =>
        f.requesterId === userId ? f.addresseeId : f.requesterId
      );

      const friendProfiles = friendIds.length > 0
        ? await db
            .select({
              userId: schema.profiles.userId,
              displayName: schema.profiles.displayName,
              avatarId: schema.profiles.avatarId,
              customAvatarUri: schema.profiles.customAvatarUri,
            })
            .from(schema.profiles)
            .where(
              or(...friendIds.map((id) => eq(schema.profiles.userId, id)))
            )
        : [];

      // Get public profiles (username)
      const userProfiles = friendIds.length > 0
        ? await db
            .select()
            .from(schema.userProfiles)
            .where(
              or(...friendIds.map((id) => eq(schema.userProfiles.userId, id)))
            )
        : [];

      // Combine data
      const result = friendships.map((friendship) => {
        const friendId =
          friendship.requesterId === userId
            ? friendship.addresseeId
            : friendship.requesterId;
        const profile = friendProfiles.find((p) => p.userId === friendId);
        const userProfile = userProfiles.find((p) => p.userId === friendId);

        return {
          id: friendship.id,
          friendId,
          status: friendship.status,
          isRequester: friendship.requesterId === userId,
          displayName: profile?.displayName || "User",
          avatarId: profile?.avatarId || 0,
          customAvatarUri: profile?.customAvatarUri,
          username: userProfile?.username,
          createdAt: friendship.createdAt,
        };
      });

      // Separate into categories
      const friends = result.filter((r) => r.status === "accepted");
      const pendingReceived = result.filter(
        (r) => r.status === "pending" && !r.isRequester
      );
      const pendingSent = result.filter(
        (r) => r.status === "pending" && r.isRequester
      );

      return res.status(200).json({
        friends,
        pendingReceived,
        pendingSent,
      });
    } catch (error) {
      console.error("Error fetching friends:", error);
      return res.status(500).json({ error: "Failed to fetch friends" });
    }
  }

  // POST - Send friend request
  if (req.method === "POST") {
    try {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ error: "Username required" });
      }

      // Find user by username
      const targetUser = await db
        .select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.username, username.toLowerCase()))
        .limit(1);

      if (targetUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const targetUserId = targetUser[0].userId;

      if (targetUserId === userId) {
        return res.status(400).json({ error: "Cannot add yourself as friend" });
      }

      // Check if friendship already exists
      const existing = await db
        .select()
        .from(schema.friendships)
        .where(
          or(
            and(
              eq(schema.friendships.requesterId, userId),
              eq(schema.friendships.addresseeId, targetUserId)
            ),
            and(
              eq(schema.friendships.requesterId, targetUserId),
              eq(schema.friendships.addresseeId, userId)
            )
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ error: "Friend request already exists" });
      }

      // Create friendship request
      const friendship = await db
        .insert(schema.friendships)
        .values({
          requesterId: userId,
          addresseeId: targetUserId,
          status: "pending",
        })
        .returning();

      return res.status(201).json(friendship[0]);
    } catch (error) {
      console.error("Error sending friend request:", error);
      return res.status(500).json({ error: "Failed to send friend request" });
    }
  }

  // PATCH - Accept/reject friend request
  if (req.method === "PATCH") {
    try {
      const { friendshipId, action } = req.body;

      if (!friendshipId || !["accept", "reject"].includes(action)) {
        return res.status(400).json({ error: "Invalid request" });
      }

      // Verify user is the addressee
      const friendship = await db
        .select()
        .from(schema.friendships)
        .where(
          and(
            eq(schema.friendships.id, friendshipId),
            eq(schema.friendships.addresseeId, userId)
          )
        )
        .limit(1);

      if (friendship.length === 0) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      const newStatus = action === "accept" ? "accepted" : "rejected";

      await db
        .update(schema.friendships)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(schema.friendships.id, friendshipId));

      return res.status(200).json({ success: true, status: newStatus });
    } catch (error) {
      console.error("Error updating friend request:", error);
      return res.status(500).json({ error: "Failed to update friend request" });
    }
  }

  // DELETE - Remove friend
  if (req.method === "DELETE") {
    try {
      const { friendshipId } = req.body;

      if (!friendshipId) {
        return res.status(400).json({ error: "Friendship ID required" });
      }

      // Verify user is part of this friendship
      const friendship = await db
        .select()
        .from(schema.friendships)
        .where(
          and(
            eq(schema.friendships.id, friendshipId),
            or(
              eq(schema.friendships.requesterId, userId),
              eq(schema.friendships.addresseeId, userId)
            )
          )
        )
        .limit(1);

      if (friendship.length === 0) {
        return res.status(404).json({ error: "Friendship not found" });
      }

      await db
        .delete(schema.friendships)
        .where(eq(schema.friendships.id, friendshipId));

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error removing friend:", error);
      return res.status(500).json({ error: "Failed to remove friend" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
