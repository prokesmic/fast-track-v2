/**
 * AI Coach API
 * Handles conversations with the AI fasting coach
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, and, desc, gte } from "drizzle-orm";
import { db, schema } from "../_lib/db";
import { verifyAuth } from "../_lib/auth";
import {
  generateCoachResponse,
  getQuickQuestions,
  UserContext,
} from "../_lib/claude-coach";

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
    console.error("[AI-COACH] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const action = req.query.action as string;

  // Get quick questions based on user context
  if (action === "quick-questions") {
    const context = await getUserContext(userId);
    const questions = getQuickQuestions(context);
    return res.status(200).json({ questions });
  }

  // Get conversation history
  if (action === "conversations") {
    const conversations = await db
      .select()
      .from(schema.aiConversations)
      .where(eq(schema.aiConversations.userId, userId))
      .orderBy(desc(schema.aiConversations.updatedAt))
      .limit(20);

    return res.status(200).json({ conversations });
  }

  // Get messages for a specific conversation
  if (action === "messages") {
    const conversationId = req.query.conversationId as string;
    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID required" });
    }

    // Verify ownership
    const [conversation] = await db
      .select()
      .from(schema.aiConversations)
      .where(
        and(
          eq(schema.aiConversations.id, conversationId),
          eq(schema.aiConversations.userId, userId)
        )
      )
      .limit(1);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await db
      .select()
      .from(schema.aiMessages)
      .where(eq(schema.aiMessages.conversationId, conversationId))
      .orderBy(schema.aiMessages.createdAt);

    return res.status(200).json({ conversation, messages });
  }

  // Get or create current conversation
  const [latestConversation] = await db
    .select()
    .from(schema.aiConversations)
    .where(eq(schema.aiConversations.userId, userId))
    .orderBy(desc(schema.aiConversations.updatedAt))
    .limit(1);

  // Check if latest conversation is from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let conversation = latestConversation;
  if (!conversation || new Date(conversation.updatedAt || conversation.createdAt || 0) < today) {
    // Create new conversation for today
    [conversation] = await db
      .insert(schema.aiConversations)
      .values({
        userId,
        title: `Chat ${today.toLocaleDateString()}`,
      })
      .returning();
  }

  // Get messages
  const messages = await db
    .select()
    .from(schema.aiMessages)
    .where(eq(schema.aiMessages.conversationId, conversation.id))
    .orderBy(schema.aiMessages.createdAt);

  // Get quick questions
  const context = await getUserContext(userId);
  const quickQuestions = getQuickQuestions(context);

  return res.status(200).json({
    conversation,
    messages,
    quickQuestions,
  });
}

async function handlePost(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const { message, conversationId } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message required" });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: "Message too long (max 2000 characters)" });
  }

  // Get or create conversation
  let conversation;
  if (conversationId) {
    [conversation] = await db
      .select()
      .from(schema.aiConversations)
      .where(
        and(
          eq(schema.aiConversations.id, conversationId),
          eq(schema.aiConversations.userId, userId)
        )
      )
      .limit(1);
  }

  if (!conversation) {
    // Create new conversation
    [conversation] = await db
      .insert(schema.aiConversations)
      .values({
        userId,
        title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
      })
      .returning();
  }

  // Save user message
  const [userMessage] = await db
    .insert(schema.aiMessages)
    .values({
      conversationId: conversation.id,
      role: "user",
      content: message.trim(),
    })
    .returning();

  // Get conversation history
  const history = await db
    .select()
    .from(schema.aiMessages)
    .where(eq(schema.aiMessages.conversationId, conversation.id))
    .orderBy(schema.aiMessages.createdAt);

  // Get user context
  const context = await getUserContext(userId);

  // Generate AI response
  const conversationHistory = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const aiResponse = await generateCoachResponse(
    message.trim(),
    conversationHistory,
    context
  );

  // Save AI response
  const [assistantMessage] = await db
    .insert(schema.aiMessages)
    .values({
      conversationId: conversation.id,
      role: "assistant",
      content: aiResponse,
    })
    .returning();

  // Update conversation timestamp
  await db
    .update(schema.aiConversations)
    .set({ updatedAt: new Date() })
    .where(eq(schema.aiConversations.id, conversation.id));

  return res.status(200).json({
    userMessage,
    assistantMessage,
    conversationId: conversation.id,
  });
}

async function handleDelete(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const { conversationId } = req.body;

  if (!conversationId) {
    return res.status(400).json({ error: "Conversation ID required" });
  }

  // Verify ownership
  const [conversation] = await db
    .select()
    .from(schema.aiConversations)
    .where(
      and(
        eq(schema.aiConversations.id, conversationId),
        eq(schema.aiConversations.userId, userId)
      )
    )
    .limit(1);

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  // Delete messages
  await db
    .delete(schema.aiMessages)
    .where(eq(schema.aiMessages.conversationId, conversationId));

  // Delete conversation
  await db
    .delete(schema.aiConversations)
    .where(eq(schema.aiConversations.id, conversationId));

  return res.status(200).json({ success: true });
}

async function getUserContext(userId: string): Promise<UserContext> {
  // Get user profile
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  // Get user profile for language
  const [userProfile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .limit(1);

  // Get fasting stats
  const fasts = await db
    .select()
    .from(schema.fasts)
    .where(
      and(
        eq(schema.fasts.userId, userId),
        eq(schema.fasts.completed, true)
      )
    );

  // Calculate stats
  const totalFasts = fasts.length;
  const totalHours = fasts.reduce((sum, f) => {
    if (!f.endTime || !f.startTime) return sum;
    return sum + (f.endTime - f.startTime) / (1000 * 60 * 60);
  }, 0);
  const averageDuration = totalFasts > 0 ? totalHours / totalFasts : 0;

  // Calculate streak
  let currentStreak = 0;
  let longestStreak = 0;
  const sortedFasts = [...fasts].sort((a, b) => (b.startTime || 0) - (a.startTime || 0));

  if (sortedFasts.length > 0) {
    let streak = 0;
    let lastDate: string | null = null;

    for (const fast of sortedFasts) {
      const fastDate = new Date(fast.startTime).toDateString();
      if (!lastDate) {
        streak = 1;
        lastDate = fastDate;
      } else {
        const prevDate: Date = new Date(lastDate);
        prevDate.setDate(prevDate.getDate() - 1);
        if (fastDate === prevDate.toDateString()) {
          streak++;
          lastDate = fastDate;
        } else if (fastDate !== lastDate) {
          longestStreak = Math.max(longestStreak, streak);
          streak = 1;
          lastDate = fastDate;
        }
      }
    }
    longestStreak = Math.max(longestStreak, streak);

    // Check if current streak is active
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const latestFastDate = sortedFasts[0] ? new Date(sortedFasts[0].startTime).toDateString() : null;

    if (latestFastDate === today || latestFastDate === yesterday.toDateString()) {
      currentStreak = streak;
    }
  }

  // Check for active fast
  const [activeFast] = await db
    .select()
    .from(schema.fasts)
    .where(
      and(
        eq(schema.fasts.userId, userId),
        eq(schema.fasts.completed, false)
      )
    )
    .limit(1);

  const isCurrentlyFasting = !!activeFast;
  let currentFastHours = 0;
  let targetHours = 0;

  if (activeFast) {
    currentFastHours = (Date.now() - activeFast.startTime) / (1000 * 60 * 60);
    targetHours = activeFast.targetDuration;
  }

  return {
    totalFasts,
    currentStreak,
    longestStreak,
    totalHours,
    averageDuration,
    preferredPlanId: profile?.preferredPlanId || undefined,
    fastingGoal: profile?.fastingGoal || undefined,
    experienceLevel: profile?.experienceLevel || undefined,
    isCurrentlyFasting,
    currentFastHours,
    targetHours,
    language: userProfile?.language || "en",
  };
}
