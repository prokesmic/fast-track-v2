/**
 * Fasting Circles API
 * Handles circles CRUD, membership, and management
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, and, desc, count, or } from "drizzle-orm";
import { db, schema } from "./_lib/db";
import { verifyAuth } from "./_lib/auth";

// Generate a 6-character alphanumeric invite code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

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
      case "PUT":
        return handlePut(req, res, userId);
      case "DELETE":
        return handleDelete(req, res, userId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("[CIRCLES] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const action = req.query.action as string;
  const circleId = req.query.circleId as string;

  // Get single circle details
  if (action === "detail" && circleId) {
    return getCircleDetail(res, userId, circleId);
  }

  // Get circle by invite code
  if (action === "lookup") {
    const inviteCode = req.query.code as string;
    return lookupByInviteCode(res, inviteCode);
  }

  // Get user's circles
  return getUserCircles(res, userId);
}

async function getUserCircles(res: VercelResponse, userId: string) {
  // Get all circles the user is a member of
  const memberships = await db
    .select({
      circleId: schema.circleMembers.circleId,
      role: schema.circleMembers.role,
      joinedAt: schema.circleMembers.joinedAt,
    })
    .from(schema.circleMembers)
    .where(eq(schema.circleMembers.userId, userId));

  const circleIds = memberships.map((m) => m.circleId);

  if (circleIds.length === 0) {
    return res.status(200).json({ circles: [] });
  }

  // Get circle details
  const circles = await Promise.all(
    circleIds.map(async (circleId) => {
      const [circle] = await db
        .select()
        .from(schema.fastingCircles)
        .where(eq(schema.fastingCircles.id, circleId))
        .limit(1);

      if (!circle) return null;

      // Get member count
      const [memberResult] = await db
        .select({ count: count() })
        .from(schema.circleMembers)
        .where(eq(schema.circleMembers.circleId, circleId));

      // Get last message
      const [lastMessage] = await db
        .select()
        .from(schema.circleMessages)
        .where(eq(schema.circleMessages.circleId, circleId))
        .orderBy(desc(schema.circleMessages.createdAt))
        .limit(1);

      const membership = memberships.find((m) => m.circleId === circleId);

      return {
        ...circle,
        memberCount: memberResult?.count || 0,
        userRole: membership?.role || "member",
        lastMessage: lastMessage || null,
      };
    })
  );

  return res.status(200).json({
    circles: circles.filter(Boolean),
  });
}

async function getCircleDetail(
  res: VercelResponse,
  userId: string,
  circleId: string
) {
  // Check if user is a member
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

  // Get circle
  const [circle] = await db
    .select()
    .from(schema.fastingCircles)
    .where(eq(schema.fastingCircles.id, circleId))
    .limit(1);

  if (!circle) {
    return res.status(404).json({ error: "Circle not found" });
  }

  // Get all members with their profiles
  const members = await db
    .select({
      id: schema.circleMembers.id,
      userId: schema.circleMembers.userId,
      role: schema.circleMembers.role,
      joinedAt: schema.circleMembers.joinedAt,
    })
    .from(schema.circleMembers)
    .where(eq(schema.circleMembers.circleId, circleId));

  // Enrich with user profiles
  const enrichedMembers = await Promise.all(
    members.map(async (member) => {
      const [profile] = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, member.userId))
        .limit(1);

      const [userProfile] = await db
        .select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.userId, member.userId))
        .limit(1);

      return {
        ...member,
        displayName: profile?.displayName || "Anonymous",
        avatarId: profile?.avatarId || 0,
        customAvatarUri: profile?.customAvatarUri || null,
        username: userProfile?.username || null,
      };
    })
  );

  return res.status(200).json({
    circle: {
      ...circle,
      memberCount: members.length,
      userRole: membership.role,
    },
    members: enrichedMembers,
  });
}

async function lookupByInviteCode(res: VercelResponse, inviteCode: string) {
  if (!inviteCode || inviteCode.length !== 6) {
    return res.status(400).json({ error: "Invalid invite code" });
  }

  const [circle] = await db
    .select()
    .from(schema.fastingCircles)
    .where(eq(schema.fastingCircles.inviteCode, inviteCode.toUpperCase()))
    .limit(1);

  if (!circle) {
    return res.status(404).json({ error: "Circle not found" });
  }

  // Get member count
  const [memberResult] = await db
    .select({ count: count() })
    .from(schema.circleMembers)
    .where(eq(schema.circleMembers.circleId, circle.id));

  return res.status(200).json({
    circle: {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      memberCount: memberResult?.count || 0,
      maxMembers: circle.maxMembers,
      isPrivate: circle.isPrivate,
    },
  });
}

async function handlePost(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const { action, name, description, maxMembers, isPrivate, inviteCode, circleId } = req.body;

  // Create new circle
  if (action === "create") {
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Circle name must be at least 2 characters" });
    }

    const code = generateInviteCode();

    const [circle] = await db
      .insert(schema.fastingCircles)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        creatorId: userId,
        inviteCode: code,
        maxMembers: maxMembers || 10,
        isPrivate: isPrivate ?? true,
      })
      .returning();

    // Add creator as admin
    await db.insert(schema.circleMembers).values({
      circleId: circle.id,
      userId,
      role: "admin",
    });

    return res.status(201).json({ circle });
  }

  // Join circle
  if (action === "join") {
    let targetCircleId = circleId;

    // If invite code provided, look up circle
    if (inviteCode && !circleId) {
      const [circle] = await db
        .select()
        .from(schema.fastingCircles)
        .where(eq(schema.fastingCircles.inviteCode, inviteCode.toUpperCase()))
        .limit(1);

      if (!circle) {
        return res.status(404).json({ error: "Invalid invite code" });
      }
      targetCircleId = circle.id;
    }

    if (!targetCircleId) {
      return res.status(400).json({ error: "Circle ID or invite code required" });
    }

    // Check if already a member
    const [existing] = await db
      .select()
      .from(schema.circleMembers)
      .where(
        and(
          eq(schema.circleMembers.circleId, targetCircleId),
          eq(schema.circleMembers.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      return res.status(400).json({ error: "Already a member" });
    }

    // Check member limit
    const [circle] = await db
      .select()
      .from(schema.fastingCircles)
      .where(eq(schema.fastingCircles.id, targetCircleId))
      .limit(1);

    if (!circle) {
      return res.status(404).json({ error: "Circle not found" });
    }

    const [memberResult] = await db
      .select({ count: count() })
      .from(schema.circleMembers)
      .where(eq(schema.circleMembers.circleId, targetCircleId));

    if (memberResult && circle.maxMembers && memberResult.count >= circle.maxMembers) {
      return res.status(400).json({ error: "Circle is full" });
    }

    // Join the circle
    await db.insert(schema.circleMembers).values({
      circleId: targetCircleId,
      userId,
      role: "member",
    });

    // Add a system message
    const [profile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userId))
      .limit(1);

    await db.insert(schema.circleMessages).values({
      circleId: targetCircleId,
      userId,
      type: "system",
      content: `${profile?.displayName || "Someone"} joined the circle`,
    });

    return res.status(200).json({ success: true, circleId: targetCircleId });
  }

  return res.status(400).json({ error: "Invalid action" });
}

async function handlePut(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const { circleId, name, description, maxMembers, isPrivate } = req.body;

  if (!circleId) {
    return res.status(400).json({ error: "Circle ID required" });
  }

  // Check if user is admin
  const [membership] = await db
    .select()
    .from(schema.circleMembers)
    .where(
      and(
        eq(schema.circleMembers.circleId, circleId),
        eq(schema.circleMembers.userId, userId),
        eq(schema.circleMembers.role, "admin")
      )
    )
    .limit(1);

  if (!membership) {
    return res.status(403).json({ error: "Only admins can update circle settings" });
  }

  const [updated] = await db
    .update(schema.fastingCircles)
    .set({
      name: name?.trim() || undefined,
      description: description?.trim() || undefined,
      maxMembers: maxMembers || undefined,
      isPrivate: isPrivate ?? undefined,
    })
    .where(eq(schema.fastingCircles.id, circleId))
    .returning();

  return res.status(200).json({ circle: updated });
}

async function handleDelete(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const { circleId, action } = req.body;

  if (!circleId) {
    return res.status(400).json({ error: "Circle ID required" });
  }

  // Leave circle
  if (action === "leave") {
    // Check if user is the only admin
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
      return res.status(400).json({ error: "Not a member" });
    }

    if (membership.role === "admin") {
      // Count other admins
      const admins = await db
        .select()
        .from(schema.circleMembers)
        .where(
          and(
            eq(schema.circleMembers.circleId, circleId),
            eq(schema.circleMembers.role, "admin")
          )
        );

      if (admins.length === 1) {
        // Check if there are other members
        const [memberCount] = await db
          .select({ count: count() })
          .from(schema.circleMembers)
          .where(eq(schema.circleMembers.circleId, circleId));

        if (memberCount && memberCount.count > 1) {
          return res.status(400).json({
            error: "Transfer admin role before leaving",
          });
        }
      }
    }

    // Leave the circle
    await db
      .delete(schema.circleMembers)
      .where(
        and(
          eq(schema.circleMembers.circleId, circleId),
          eq(schema.circleMembers.userId, userId)
        )
      );

    // Add leave message
    const [profile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userId))
      .limit(1);

    await db.insert(schema.circleMessages).values({
      circleId,
      userId,
      type: "system",
      content: `${profile?.displayName || "Someone"} left the circle`,
    });

    // If no members left, delete the circle
    const [remainingMembers] = await db
      .select({ count: count() })
      .from(schema.circleMembers)
      .where(eq(schema.circleMembers.circleId, circleId));

    if (!remainingMembers || remainingMembers.count === 0) {
      await db
        .delete(schema.circleMessages)
        .where(eq(schema.circleMessages.circleId, circleId));
      await db
        .delete(schema.fastingCircles)
        .where(eq(schema.fastingCircles.id, circleId));
    }

    return res.status(200).json({ success: true });
  }

  // Delete circle (admin only)
  if (action === "delete") {
    const [circle] = await db
      .select()
      .from(schema.fastingCircles)
      .where(eq(schema.fastingCircles.id, circleId))
      .limit(1);

    if (!circle) {
      return res.status(404).json({ error: "Circle not found" });
    }

    if (circle.creatorId !== userId) {
      return res.status(403).json({ error: "Only the creator can delete the circle" });
    }

    // Delete all messages
    await db
      .delete(schema.circleMessages)
      .where(eq(schema.circleMessages.circleId, circleId));

    // Delete all memberships
    await db
      .delete(schema.circleMembers)
      .where(eq(schema.circleMembers.circleId, circleId));

    // Delete circle
    await db
      .delete(schema.fastingCircles)
      .where(eq(schema.fastingCircles.id, circleId));

    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: "Invalid action" });
}
