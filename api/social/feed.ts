import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, or, and, desc, sql } from "drizzle-orm";
import { db, schema } from "../_lib/db";
import { verifyAuth } from "../_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyAuth(req);
  if (!auth.success || !auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = auth.userId;

  // GET - Fetch feed
  if (req.method === "GET") {
    try {
      const { type, limit = "20", offset = "0" } = req.query;

      // Get user's friends
      const friendships = await db
        .select()
        .from(schema.friendships)
        .where(
          and(
            eq(schema.friendships.status, "accepted"),
            or(
              eq(schema.friendships.requesterId, userId),
              eq(schema.friendships.addresseeId, userId)
            )
          )
        );

      const friendIds = friendships.map((f) =>
        f.requesterId === userId ? f.addresseeId : f.requesterId
      );

      // Include current user's posts
      const allowedUserIds = [...friendIds, userId];

      let whereClause;
      if (type === "public") {
        whereClause = eq(schema.communityPosts.visibility, "public");
      } else if (type === "mine") {
        whereClause = eq(schema.communityPosts.userId, userId);
      } else {
        // Default: friends + public
        whereClause = or(
          and(
            eq(schema.communityPosts.visibility, "friends"),
            sql`${schema.communityPosts.userId} IN ${allowedUserIds}`
          ),
          eq(schema.communityPosts.visibility, "public")
        );
      }

      const posts = await db
        .select()
        .from(schema.communityPosts)
        .where(whereClause)
        .orderBy(desc(schema.communityPosts.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Get user details for posts
      const postUserIds = [...new Set(posts.map((p) => p.userId))];
      const profiles =
        postUserIds.length > 0
          ? await db
              .select({
                userId: schema.profiles.userId,
                displayName: schema.profiles.displayName,
                avatarId: schema.profiles.avatarId,
                customAvatarUri: schema.profiles.customAvatarUri,
              })
              .from(schema.profiles)
              .where(sql`${schema.profiles.userId} IN ${postUserIds}`)
          : [];

      const userProfiles =
        postUserIds.length > 0
          ? await db
              .select({
                userId: schema.userProfiles.userId,
                username: schema.userProfiles.username,
              })
              .from(schema.userProfiles)
              .where(sql`${schema.userProfiles.userId} IN ${postUserIds}`)
          : [];

      // Check which posts user has liked
      const postIds = posts.map((p) => p.id);
      const userLikes =
        postIds.length > 0
          ? await db
              .select({ postId: schema.postLikes.postId })
              .from(schema.postLikes)
              .where(
                and(
                  sql`${schema.postLikes.postId} IN ${postIds}`,
                  eq(schema.postLikes.userId, userId)
                )
              )
          : [];

      const likedPostIds = new Set(userLikes.map((l) => l.postId));

      // Enrich posts with user data
      const enrichedPosts = posts.map((post) => {
        const profile = profiles.find((p) => p.userId === post.userId);
        const userProfile = userProfiles.find((up) => up.userId === post.userId);
        return {
          ...post,
          metadata: post.metadata ? JSON.parse(post.metadata) : null,
          displayName: profile?.displayName || "User",
          avatarId: profile?.avatarId || 0,
          customAvatarUri: profile?.customAvatarUri,
          username: userProfile?.username,
          isLiked: likedPostIds.has(post.id),
          isOwn: post.userId === userId,
        };
      });

      return res.status(200).json({ posts: enrichedPosts });
    } catch (error) {
      console.error("Error fetching feed:", error);
      return res.status(500).json({ error: "Failed to fetch feed" });
    }
  }

  // POST - Create post or like/unlike
  if (req.method === "POST") {
    try {
      const { action } = req.body;

      if (action === "create") {
        const { type, content, metadata, visibility } = req.body;

        if (!type) {
          return res.status(400).json({ error: "Post type required" });
        }

        const post = await db
          .insert(schema.communityPosts)
          .values({
            userId,
            type,
            content,
            metadata: metadata ? JSON.stringify(metadata) : null,
            visibility: visibility || "friends",
          })
          .returning();

        return res.status(201).json(post[0]);
      }

      if (action === "like") {
        const { postId } = req.body;

        if (!postId) {
          return res.status(400).json({ error: "Post ID required" });
        }

        // Check if already liked
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
          return res.status(400).json({ error: "Already liked" });
        }

        await db.insert(schema.postLikes).values({
          postId,
          userId,
        });

        // Increment like count
        await db
          .update(schema.communityPosts)
          .set({
            likesCount: sql`${schema.communityPosts.likesCount} + 1`,
          })
          .where(eq(schema.communityPosts.id, postId));

        return res.status(200).json({ success: true });
      }

      if (action === "unlike") {
        const { postId } = req.body;

        if (!postId) {
          return res.status(400).json({ error: "Post ID required" });
        }

        const deleted = await db
          .delete(schema.postLikes)
          .where(
            and(
              eq(schema.postLikes.postId, postId),
              eq(schema.postLikes.userId, userId)
            )
          )
          .returning();

        if (deleted.length > 0) {
          // Decrement like count
          await db
            .update(schema.communityPosts)
            .set({
              likesCount: sql`GREATEST(${schema.communityPosts.likesCount} - 1, 0)`,
            })
            .where(eq(schema.communityPosts.id, postId));
        }

        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: "Invalid action" });
    } catch (error) {
      console.error("Error with post:", error);
      return res.status(500).json({ error: "Failed to process post" });
    }
  }

  // DELETE - Delete own post
  if (req.method === "DELETE") {
    try {
      const { postId } = req.body;

      if (!postId) {
        return res.status(400).json({ error: "Post ID required" });
      }

      // Verify ownership
      const post = await db
        .select()
        .from(schema.communityPosts)
        .where(
          and(
            eq(schema.communityPosts.id, postId),
            eq(schema.communityPosts.userId, userId)
          )
        )
        .limit(1);

      if (post.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Delete likes first
      await db
        .delete(schema.postLikes)
        .where(eq(schema.postLikes.postId, postId));

      // Delete post
      await db
        .delete(schema.communityPosts)
        .where(eq(schema.communityPosts.id, postId));

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      return res.status(500).json({ error: "Failed to delete post" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
