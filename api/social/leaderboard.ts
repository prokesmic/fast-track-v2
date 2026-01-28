import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { db, schema } from "../_lib/db";
import { verifyAuth } from "../_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyAuth(req);
  if (!auth.success || !auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = auth.userId;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, period, challengeId } = req.query;

    // Challenge-specific leaderboard
    if (challengeId) {
      const participants = await db
        .select({
          id: schema.challengeParticipants.id,
          userId: schema.challengeParticipants.userId,
          progress: schema.challengeParticipants.progress,
          rank: schema.challengeParticipants.rank,
          joinedAt: schema.challengeParticipants.joinedAt,
          completedAt: schema.challengeParticipants.completedAt,
        })
        .from(schema.challengeParticipants)
        .where(eq(schema.challengeParticipants.challengeId, challengeId as string))
        .orderBy(desc(schema.challengeParticipants.progress))
        .limit(100);

      // Get user details
      const userIds = participants.map((p) => p.userId);
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
                sql`${schema.profiles.userId} IN ${userIds}`
              )
          : [];

      const userProfiles =
        userIds.length > 0
          ? await db
              .select({
                userId: schema.userProfiles.userId,
                username: schema.userProfiles.username,
              })
              .from(schema.userProfiles)
              .where(
                sql`${schema.userProfiles.userId} IN ${userIds}`
              )
          : [];

      const leaderboard = participants.map((p, index) => {
        const profile = profiles.find((pr) => pr.userId === p.userId);
        const userProfile = userProfiles.find((up) => up.userId === p.userId);
        return {
          rank: index + 1,
          userId: p.userId,
          displayName: profile?.displayName || "User",
          username: userProfile?.username,
          avatarId: profile?.avatarId || 0,
          progress: p.progress,
          completedAt: p.completedAt,
          isCurrentUser: p.userId === userId,
        };
      });

      return res.status(200).json({ leaderboard });
    }

    // Global leaderboard
    const leaderboardType = (type as string) || "streak";
    const periodFilter = (period as string) || "all";

    let startDate: Date | null = null;
    if (periodFilter === "week") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (periodFilter === "month") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get users who allow leaderboard display
    const visibleUsers = await db
      .select({ userId: schema.userProfiles.userId })
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.showOnLeaderboard, true));

    const visibleUserIds = visibleUsers.map((u) => u.userId);

    if (visibleUserIds.length === 0) {
      return res.status(200).json({ leaderboard: [] });
    }

    // Calculate stats based on type
    let leaderboardData: Array<{
      userId: string;
      value: number;
    }> = [];

    if (leaderboardType === "streak") {
      // This would require calculating streaks - simplified version
      // In production, you'd cache this or calculate on fast completion
      const fastsQuery = startDate
        ? db
            .select({
              userId: schema.fasts.userId,
              count: sql<number>`count(*)`,
            })
            .from(schema.fasts)
            .where(
              and(
                eq(schema.fasts.completed, true),
                gte(schema.fasts.endTime, startDate.getTime()),
                sql`${schema.fasts.userId} IN ${visibleUserIds}`
              )
            )
            .groupBy(schema.fasts.userId)
            .orderBy(desc(sql`count(*)`))
            .limit(50)
        : db
            .select({
              userId: schema.fasts.userId,
              count: sql<number>`count(*)`,
            })
            .from(schema.fasts)
            .where(
              and(
                eq(schema.fasts.completed, true),
                sql`${schema.fasts.userId} IN ${visibleUserIds}`
              )
            )
            .groupBy(schema.fasts.userId)
            .orderBy(desc(sql`count(*)`))
            .limit(50);

      const results = await fastsQuery;
      leaderboardData = results.map((r) => ({
        userId: r.userId,
        value: Number(r.count),
      }));
    } else if (leaderboardType === "hours") {
      // Total fasting hours
      const fastsQuery = startDate
        ? db
            .select({
              userId: schema.fasts.userId,
              totalHours: sql<number>`sum((${schema.fasts.endTime} - ${schema.fasts.startTime}) / 3600000.0)`,
            })
            .from(schema.fasts)
            .where(
              and(
                sql`${schema.fasts.endTime} IS NOT NULL`,
                gte(schema.fasts.endTime, startDate.getTime()),
                sql`${schema.fasts.userId} IN ${visibleUserIds}`
              )
            )
            .groupBy(schema.fasts.userId)
            .orderBy(desc(sql`sum((${schema.fasts.endTime} - ${schema.fasts.startTime}) / 3600000.0)`))
            .limit(50)
        : db
            .select({
              userId: schema.fasts.userId,
              totalHours: sql<number>`sum((${schema.fasts.endTime} - ${schema.fasts.startTime}) / 3600000.0)`,
            })
            .from(schema.fasts)
            .where(
              and(
                sql`${schema.fasts.endTime} IS NOT NULL`,
                sql`${schema.fasts.userId} IN ${visibleUserIds}`
              )
            )
            .groupBy(schema.fasts.userId)
            .orderBy(desc(sql`sum((${schema.fasts.endTime} - ${schema.fasts.startTime}) / 3600000.0)`))
            .limit(50);

      const results = await fastsQuery;
      leaderboardData = results.map((r) => ({
        userId: r.userId,
        value: Math.round(Number(r.totalHours) * 10) / 10,
      }));
    } else if (leaderboardType === "fasts") {
      // Number of completed fasts
      const fastsQuery = startDate
        ? db
            .select({
              userId: schema.fasts.userId,
              count: sql<number>`count(*)`,
            })
            .from(schema.fasts)
            .where(
              and(
                eq(schema.fasts.completed, true),
                gte(schema.fasts.endTime, startDate.getTime()),
                sql`${schema.fasts.userId} IN ${visibleUserIds}`
              )
            )
            .groupBy(schema.fasts.userId)
            .orderBy(desc(sql`count(*)`))
            .limit(50)
        : db
            .select({
              userId: schema.fasts.userId,
              count: sql<number>`count(*)`,
            })
            .from(schema.fasts)
            .where(
              and(
                eq(schema.fasts.completed, true),
                sql`${schema.fasts.userId} IN ${visibleUserIds}`
              )
            )
            .groupBy(schema.fasts.userId)
            .orderBy(desc(sql`count(*)`))
            .limit(50);

      const results = await fastsQuery;
      leaderboardData = results.map((r) => ({
        userId: r.userId,
        value: Number(r.count),
      }));
    }

    // Get user profiles
    const userIds = leaderboardData.map((d) => d.userId);
    const profiles =
      userIds.length > 0
        ? await db
            .select({
              userId: schema.profiles.userId,
              displayName: schema.profiles.displayName,
              avatarId: schema.profiles.avatarId,
            })
            .from(schema.profiles)
            .where(sql`${schema.profiles.userId} IN ${userIds}`)
        : [];

    const userProfiles =
      userIds.length > 0
        ? await db
            .select({
              userId: schema.userProfiles.userId,
              username: schema.userProfiles.username,
            })
            .from(schema.userProfiles)
            .where(sql`${schema.userProfiles.userId} IN ${userIds}`)
        : [];

    const leaderboard = leaderboardData.map((d, index) => {
      const profile = profiles.find((p) => p.userId === d.userId);
      const userProfile = userProfiles.find((up) => up.userId === d.userId);
      return {
        rank: index + 1,
        userId: d.userId,
        displayName: profile?.displayName || "User",
        username: userProfile?.username,
        avatarId: profile?.avatarId || 0,
        value: d.value,
        isCurrentUser: d.userId === userId,
      };
    });

    // Find current user's rank if not in top 50
    let userRank = leaderboard.find((l) => l.isCurrentUser);
    if (!userRank && visibleUserIds.includes(userId)) {
      // Calculate user's position
      const userStats = leaderboardData.find((d) => d.userId === userId);
      if (userStats) {
        const profile = profiles.find((p) => p.userId === userId);
        const userProfile = userProfiles.find((up) => up.userId === userId);
        userRank = {
          rank: leaderboardData.filter((d) => d.value > userStats.value).length + 1,
          userId,
          displayName: profile?.displayName || "You",
          username: userProfile?.username,
          avatarId: profile?.avatarId || 0,
          value: userStats.value,
          isCurrentUser: true,
        };
      }
    }

    return res.status(200).json({
      leaderboard,
      userRank,
      type: leaderboardType,
      period: periodFilter,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
}
