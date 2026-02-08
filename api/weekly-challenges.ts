/**
 * Weekly Challenges API
 * Handles weekly challenge CRUD, participation, and progress
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, and, desc, gte, count, sql } from "drizzle-orm";
import { db, schema } from "./_lib/db";
import { verifyAuth } from "./_lib/auth";
import {
  getWeekNumber,
  generateWeeklyChallenge,
} from "./_lib/challenge-templates";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyAuth(req);
  if (!auth.success || !auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = auth.userId;
  const action = req.query.action as string;

  try {
    switch (req.method) {
      case "GET":
        return handleGet(req, res, userId, action);
      case "POST":
        return handlePost(req, res, userId);
      case "DELETE":
        return handleDelete(req, res, userId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("[WEEKLY-CHALLENGES] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  action: string
) {
  if (action === "current") {
    return getCurrentChallenge(res, userId);
  }

  if (action === "leaderboard") {
    const challengeId = req.query.challengeId as string;
    return getLeaderboard(res, challengeId);
  }

  // Default: get all active challenges
  return getActiveChallenges(res, userId);
}

async function getCurrentChallenge(res: VercelResponse, userId: string) {
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  // Check if weekly challenge exists for current week
  let [challenge] = await db
    .select()
    .from(schema.weeklyChallenges)
    .where(
      and(
        eq(schema.weeklyChallenges.weekNumber, currentWeek),
        eq(schema.weeklyChallenges.year, currentYear)
      )
    )
    .limit(1);

  // If no challenge exists, create one
  if (!challenge) {
    const newChallenge = generateWeeklyChallenge(currentYear, currentWeek);
    [challenge] = await db
      .insert(schema.weeklyChallenges)
      .values(newChallenge)
      .returning();
  }

  // Get participant count
  const [participantResult] = await db
    .select({ count: count() })
    .from(schema.weeklyChallengeParticipants)
    .where(eq(schema.weeklyChallengeParticipants.weeklyChallengeId, challenge.id));

  // Check if user has joined
  const [participation] = await db
    .select()
    .from(schema.weeklyChallengeParticipants)
    .where(
      and(
        eq(schema.weeklyChallengeParticipants.weeklyChallengeId, challenge.id),
        eq(schema.weeklyChallengeParticipants.userId, userId)
      )
    )
    .limit(1);

  // Calculate user progress if joined
  let userProgress = 0;
  if (participation) {
    userProgress = await calculateProgress(userId, challenge);

    // Update progress in DB
    await db
      .update(schema.weeklyChallengeParticipants)
      .set({
        progress: userProgress,
        completed: userProgress >= challenge.targetValue,
        completedAt: userProgress >= challenge.targetValue ? new Date() : null,
      })
      .where(eq(schema.weeklyChallengeParticipants.id, participation.id));
  }

  // Calculate time remaining
  const endTime = challenge.endDate ? new Date(challenge.endDate).getTime() : 0;
  const hoursLeft = Math.max(0, Math.floor((endTime - now.getTime()) / (1000 * 60 * 60)));
  const daysLeft = Math.floor(hoursLeft / 24);

  return res.status(200).json({
    challenge: {
      ...challenge,
      participantCount: participantResult?.count || 0,
      isJoined: !!participation,
      userProgress,
      completed: participation?.completed || false,
      daysLeft,
      hoursLeft: hoursLeft % 24,
    },
  });
}

async function calculateProgress(userId: string, challenge: { type: string; startDate: Date | null; endDate: Date | null }) {
  const startTime = challenge.startDate ? new Date(challenge.startDate).getTime() : 0;
  const endTime = challenge.endDate ? new Date(challenge.endDate).getTime() : Date.now();

  const fasts = await db
    .select()
    .from(schema.fasts)
    .where(
      and(
        eq(schema.fasts.userId, userId),
        eq(schema.fasts.completed, true),
        gte(schema.fasts.endTime, startTime)
      )
    );

  // Filter fasts that ended within the challenge period
  const relevantFasts = fasts.filter(
    (f) => f.endTime && f.endTime >= startTime && f.endTime <= endTime
  );

  switch (challenge.type) {
    case "complete_fasts":
      return relevantFasts.length;

    case "total_hours":
      return Math.round(
        relevantFasts.reduce((sum, f) => {
          if (!f.endTime || !f.startTime) return sum;
          return sum + (f.endTime - f.startTime) / (1000 * 60 * 60);
        }, 0)
      );

    case "longest_fast":
      return Math.round(
        Math.max(
          0,
          ...relevantFasts.map((f) => {
            if (!f.endTime || !f.startTime) return 0;
            return (f.endTime - f.startTime) / (1000 * 60 * 60);
          })
        )
      );

    case "streak":
      // Calculate current streak
      return calculateStreak(relevantFasts);

    default:
      return 0;
  }
}

function calculateStreak(fasts: { startTime: number; endTime: number | null }[]): number {
  if (fasts.length === 0) return 0;

  // Sort fasts by start time descending
  const sortedFasts = [...fasts].sort((a, b) => b.startTime - a.startTime);

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const fast of sortedFasts) {
    const fastDate = new Date(fast.startTime);
    fastDate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor((currentDate.getTime() - fastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === streak) {
      streak++;
    } else if (dayDiff > streak) {
      break;
    }
  }

  return streak;
}

async function getActiveChallenges(res: VercelResponse, userId: string) {
  const now = new Date();

  const challenges = await db
    .select()
    .from(schema.weeklyChallenges)
    .where(gte(schema.weeklyChallenges.endDate, now))
    .orderBy(desc(schema.weeklyChallenges.startDate));

  // Get user's participations
  const participations = await db
    .select()
    .from(schema.weeklyChallengeParticipants)
    .where(eq(schema.weeklyChallengeParticipants.userId, userId));

  const participationMap = new Map(
    participations.map((p) => [p.weeklyChallengeId, p])
  );

  const enrichedChallenges = await Promise.all(
    challenges.map(async (challenge) => {
      const [participantResult] = await db
        .select({ count: count() })
        .from(schema.weeklyChallengeParticipants)
        .where(eq(schema.weeklyChallengeParticipants.weeklyChallengeId, challenge.id));

      const participation = participationMap.get(challenge.id);

      return {
        ...challenge,
        participantCount: participantResult?.count || 0,
        isJoined: !!participation,
        userProgress: participation?.progress || 0,
        completed: participation?.completed || false,
      };
    })
  );

  return res.status(200).json({ challenges: enrichedChallenges });
}

async function getLeaderboard(res: VercelResponse, challengeId: string) {
  if (!challengeId) {
    return res.status(400).json({ error: "Challenge ID required" });
  }

  const participants = await db
    .select({
      id: schema.weeklyChallengeParticipants.id,
      userId: schema.weeklyChallengeParticipants.userId,
      progress: schema.weeklyChallengeParticipants.progress,
      completed: schema.weeklyChallengeParticipants.completed,
      completedAt: schema.weeklyChallengeParticipants.completedAt,
    })
    .from(schema.weeklyChallengeParticipants)
    .where(eq(schema.weeklyChallengeParticipants.weeklyChallengeId, challengeId))
    .orderBy(desc(schema.weeklyChallengeParticipants.progress))
    .limit(50);

  // Enrich with user info
  const enrichedParticipants = await Promise.all(
    participants.map(async (p, index) => {
      const [profile] = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, p.userId))
        .limit(1);

      const [userProfile] = await db
        .select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.userId, p.userId))
        .limit(1);

      return {
        rank: index + 1,
        userId: p.userId,
        displayName: profile?.displayName || "Anonymous",
        username: userProfile?.username || null,
        avatarId: profile?.avatarId || 0,
        progress: p.progress || 0,
        completed: p.completed || false,
      };
    })
  );

  return res.status(200).json({ leaderboard: enrichedParticipants });
}

async function handlePost(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const { action, challengeId } = req.body;

  if (action === "join" && challengeId) {
    // Check if already joined
    const [existing] = await db
      .select()
      .from(schema.weeklyChallengeParticipants)
      .where(
        and(
          eq(schema.weeklyChallengeParticipants.weeklyChallengeId, challengeId),
          eq(schema.weeklyChallengeParticipants.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return res.status(400).json({ error: "Already joined" });
    }

    // Get challenge to calculate initial progress
    const [challenge] = await db
      .select()
      .from(schema.weeklyChallenges)
      .where(eq(schema.weeklyChallenges.id, challengeId))
      .limit(1);

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    // Calculate initial progress
    const progress = await calculateProgress(userId, challenge);

    // Join the challenge
    await db.insert(schema.weeklyChallengeParticipants).values({
      weeklyChallengeId: challengeId,
      userId,
      progress,
      completed: progress >= challenge.targetValue,
    });

    return res.status(200).json({ success: true, progress });
  }

  return res.status(400).json({ error: "Invalid action" });
}

async function handleDelete(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const { challengeId } = req.body;

  if (!challengeId) {
    return res.status(400).json({ error: "Challenge ID required" });
  }

  await db
    .delete(schema.weeklyChallengeParticipants)
    .where(
      and(
        eq(schema.weeklyChallengeParticipants.weeklyChallengeId, challengeId),
        eq(schema.weeklyChallengeParticipants.userId, userId)
      )
    );

  return res.status(200).json({ success: true });
}
