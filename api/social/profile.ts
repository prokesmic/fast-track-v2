import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, ilike } from "drizzle-orm";
import { db, schema } from "../_lib/db";
import { verifyAuth } from "../_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyAuth(req);
  if (!auth.success || !auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = auth.userId;

  // GET - Get user's social profile or search users
  if (req.method === "GET") {
    try {
      const { search, userId: targetUserId } = req.query;

      // Search for users
      if (search) {
        const searchTerm = (search as string).toLowerCase();

        const users = await db
          .select({
            userId: schema.userProfiles.userId,
            username: schema.userProfiles.username,
            bio: schema.userProfiles.bio,
            isPublic: schema.userProfiles.isPublic,
          })
          .from(schema.userProfiles)
          .where(
            ilike(schema.userProfiles.username, `%${searchTerm}%`)
          )
          .limit(20);

        // Get display names and avatars
        const userIds = users.map((u) => u.userId);
        const profiles =
          userIds.length > 0
            ? await db
                .select({
                  userId: schema.profiles.userId,
                  displayName: schema.profiles.displayName,
                  avatarId: schema.profiles.avatarId,
                })
                .from(schema.profiles)
                .where(
                  eq(schema.profiles.userId, userIds[0]) // TODO: fix for multiple
                )
            : [];

        const results = users
          .filter((u) => u.isPublic && u.userId !== userId)
          .map((u) => {
            const profile = profiles.find((p) => p.userId === u.userId);
            return {
              userId: u.userId,
              username: u.username,
              displayName: profile?.displayName || "User",
              avatarId: profile?.avatarId || 0,
              bio: u.bio,
            };
          });

        return res.status(200).json({ users: results });
      }

      // Get specific user's profile
      if (targetUserId) {
        const userProfile = await db
          .select()
          .from(schema.userProfiles)
          .where(eq(schema.userProfiles.userId, targetUserId as string))
          .limit(1);

        if (userProfile.length === 0 || !userProfile[0].isPublic) {
          return res.status(404).json({ error: "User not found" });
        }

        const profile = await db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.userId, targetUserId as string))
          .limit(1);

        return res.status(200).json({
          ...userProfile[0],
          displayName: profile[0]?.displayName || "User",
          avatarId: profile[0]?.avatarId || 0,
        });
      }

      // Get own social profile
      const userProfile = await db
        .select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.userId, userId))
        .limit(1);

      if (userProfile.length === 0) {
        return res.status(200).json({
          userId,
          username: null,
          bio: null,
          isPublic: true,
          showOnLeaderboard: true,
        });
      }

      return res.status(200).json(userProfile[0]);
    } catch (error) {
      console.error("Error fetching social profile:", error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  // POST/PUT - Create or update social profile
  if (req.method === "POST" || req.method === "PUT") {
    try {
      const { username, bio, isPublic, showOnLeaderboard } = req.body;

      // Validate username
      if (username) {
        const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");

        if (cleanUsername.length < 3 || cleanUsername.length > 20) {
          return res
            .status(400)
            .json({ error: "Username must be 3-20 characters" });
        }

        // Check if username is taken
        const existing = await db
          .select()
          .from(schema.userProfiles)
          .where(eq(schema.userProfiles.username, cleanUsername))
          .limit(1);

        if (existing.length > 0 && existing[0].userId !== userId) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }

      // Check if profile exists
      const existingProfile = await db
        .select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.userId, userId))
        .limit(1);

      if (existingProfile.length === 0) {
        // Create new profile
        const newProfile = await db
          .insert(schema.userProfiles)
          .values({
            userId,
            username: username?.toLowerCase().replace(/[^a-z0-9_]/g, "") || null,
            bio: bio || null,
            isPublic: isPublic ?? true,
            showOnLeaderboard: showOnLeaderboard ?? true,
          })
          .returning();

        return res.status(201).json(newProfile[0]);
      } else {
        // Update existing profile
        const updates: Record<string, any> = { updatedAt: new Date() };

        if (username !== undefined) {
          updates.username = username?.toLowerCase().replace(/[^a-z0-9_]/g, "") || null;
        }
        if (bio !== undefined) {
          updates.bio = bio;
        }
        if (isPublic !== undefined) {
          updates.isPublic = isPublic;
        }
        if (showOnLeaderboard !== undefined) {
          updates.showOnLeaderboard = showOnLeaderboard;
        }

        const updatedProfile = await db
          .update(schema.userProfiles)
          .set(updates)
          .where(eq(schema.userProfiles.userId, userId))
          .returning();

        return res.status(200).json(updatedProfile[0]);
      }
    } catch (error) {
      console.error("Error updating social profile:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
