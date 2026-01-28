import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, or, and, desc, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "../_lib/db";
import { verifyAuth } from "../_lib/auth";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyAuth(req);
  if (!auth.success || !auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = auth.userId;

  // GET - List challenges (user's challenges + public)
  if (req.method === "GET") {
    try {
      const { type } = req.query; // "mine", "public", "active"
      const now = new Date();

      let challenges;

      if (type === "mine") {
        // Challenges user is participating in
        const participations = await db
          .select({ challengeId: schema.challengeParticipants.challengeId })
          .from(schema.challengeParticipants)
          .where(eq(schema.challengeParticipants.userId, userId));

        const challengeIds = participations.map((p) => p.challengeId);

        if (challengeIds.length === 0) {
          return res.status(200).json({ challenges: [] });
        }

        challenges = await db
          .select()
          .from(schema.challenges)
          .where(
            or(...challengeIds.map((id) => eq(schema.challenges.id, id)))
          )
          .orderBy(desc(schema.challenges.startDate));
      } else if (type === "public") {
        // Public challenges that haven't ended
        challenges = await db
          .select()
          .from(schema.challenges)
          .where(
            and(
              eq(schema.challenges.isPublic, true),
              gte(schema.challenges.endDate, now)
            )
          )
          .orderBy(desc(schema.challenges.startDate))
          .limit(20);
      } else {
        // Active challenges (started but not ended)
        const participations = await db
          .select({ challengeId: schema.challengeParticipants.challengeId })
          .from(schema.challengeParticipants)
          .where(eq(schema.challengeParticipants.userId, userId));

        const challengeIds = participations.map((p) => p.challengeId);

        if (challengeIds.length === 0) {
          return res.status(200).json({ challenges: [] });
        }

        challenges = await db
          .select()
          .from(schema.challenges)
          .where(
            and(
              or(...challengeIds.map((id) => eq(schema.challenges.id, id))),
              lte(schema.challenges.startDate, now),
              gte(schema.challenges.endDate, now)
            )
          )
          .orderBy(desc(schema.challenges.startDate));
      }

      // Get participant counts for each challenge
      const enrichedChallenges = await Promise.all(
        challenges.map(async (challenge) => {
          const participants = await db
            .select()
            .from(schema.challengeParticipants)
            .where(eq(schema.challengeParticipants.challengeId, challenge.id));

          const userParticipation = participants.find(
            (p) => p.userId === userId
          );

          return {
            ...challenge,
            participantCount: participants.length,
            isJoined: !!userParticipation,
            userProgress: userParticipation?.progress || 0,
            userRank: userParticipation?.rank,
          };
        })
      );

      return res.status(200).json({ challenges: enrichedChallenges });
    } catch (error) {
      console.error("Error fetching challenges:", error);
      return res.status(500).json({ error: "Failed to fetch challenges" });
    }
  }

  // POST - Create or join challenge
  if (req.method === "POST") {
    try {
      const { action } = req.body;

      if (action === "create") {
        const { name, description, type, targetValue, startDate, endDate, isPublic } =
          req.body;

        if (!name || !type || !targetValue || !startDate || !endDate) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const inviteCode = generateInviteCode();

        const challenge = await db
          .insert(schema.challenges)
          .values({
            creatorId: userId,
            name,
            description,
            type,
            targetValue,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isPublic: isPublic ?? true,
            inviteCode,
          })
          .returning();

        // Auto-join creator
        await db.insert(schema.challengeParticipants).values({
          challengeId: challenge[0].id,
          userId,
          progress: 0,
        });

        return res.status(201).json(challenge[0]);
      }

      if (action === "join") {
        const { challengeId, inviteCode } = req.body;

        let challenge;

        if (challengeId) {
          challenge = await db
            .select()
            .from(schema.challenges)
            .where(eq(schema.challenges.id, challengeId))
            .limit(1);
        } else if (inviteCode) {
          challenge = await db
            .select()
            .from(schema.challenges)
            .where(eq(schema.challenges.inviteCode, inviteCode.toUpperCase()))
            .limit(1);
        }

        if (!challenge || challenge.length === 0) {
          return res.status(404).json({ error: "Challenge not found" });
        }

        const targetChallenge = challenge[0];

        // Check if already joined
        const existing = await db
          .select()
          .from(schema.challengeParticipants)
          .where(
            and(
              eq(schema.challengeParticipants.challengeId, targetChallenge.id),
              eq(schema.challengeParticipants.userId, userId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          return res.status(400).json({ error: "Already joined this challenge" });
        }

        // Check participant limit
        const participantCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.challengeParticipants)
          .where(eq(schema.challengeParticipants.challengeId, targetChallenge.id));

        if (
          targetChallenge.maxParticipants &&
          Number(participantCount[0].count) >= targetChallenge.maxParticipants
        ) {
          return res.status(400).json({ error: "Challenge is full" });
        }

        await db.insert(schema.challengeParticipants).values({
          challengeId: targetChallenge.id,
          userId,
          progress: 0,
        });

        return res.status(200).json({ success: true, challenge: targetChallenge });
      }

      return res.status(400).json({ error: "Invalid action" });
    } catch (error) {
      console.error("Error with challenge:", error);
      return res.status(500).json({ error: "Failed to process challenge" });
    }
  }

  // DELETE - Leave challenge
  if (req.method === "DELETE") {
    try {
      const { challengeId } = req.body;

      if (!challengeId) {
        return res.status(400).json({ error: "Challenge ID required" });
      }

      await db
        .delete(schema.challengeParticipants)
        .where(
          and(
            eq(schema.challengeParticipants.challengeId, challengeId),
            eq(schema.challengeParticipants.userId, userId)
          )
        );

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error leaving challenge:", error);
      return res.status(500).json({ error: "Failed to leave challenge" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
