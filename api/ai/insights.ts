import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "../_lib/db";
import { authenticate, AuthenticatedRequest } from "../_lib/auth";
import { eq, and, gt } from "drizzle-orm";
import { generateInsight, InsightType, CACHE_DURATION } from "../_lib/claude";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate
  const authResult = await authenticate(req as AuthenticatedRequest);
  if ("error" in authResult) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.userId;
  const insightType = (req.query.type as InsightType) || "motivation";

  // Validate insight type
  const validTypes: InsightType[] = [
    "recommendation",
    "motivation",
    "pattern",
    "optimization",
  ];
  if (!validTypes.includes(insightType)) {
    return res.status(400).json({ error: "Invalid insight type" });
  }

  try {
    // Check cache first
    const now = new Date();
    const cachedInsights = await db
      .select()
      .from(schema.aiInsightsCache)
      .where(
        and(
          eq(schema.aiInsightsCache.userId, userId),
          eq(schema.aiInsightsCache.insightType, insightType),
          gt(schema.aiInsightsCache.validUntil, now)
        )
      )
      .limit(1);

    if (cachedInsights.length > 0) {
      return res.status(200).json({
        insight: cachedInsights[0].content,
        type: insightType,
        cached: true,
        validUntil: cachedInsights[0].validUntil,
      });
    }

    // Fetch user's fasting data for context
    const [fasts, profile] = await Promise.all([
      db
        .select()
        .from(schema.fasts)
        .where(eq(schema.fasts.userId, userId))
        .orderBy(schema.fasts.startTime),
      db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, userId))
        .limit(1),
    ]);

    // Calculate statistics
    const completedFasts = fasts.filter((f) => f.completed);
    const totalFasts = completedFasts.length;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedFasts = completedFasts
      .filter((f) => f.endTime)
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

    for (let i = 0; i <= 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const hasFastOnDay = sortedFasts.some((f) => {
        const fastDate = new Date(f.endTime || 0).toISOString().split("T")[0];
        return fastDate === dateStr;
      });

      if (hasFastOnDay) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: string | null = null;

    const chronologicalFasts = sortedFasts.reverse();
    for (const fast of chronologicalFasts) {
      const fastDate = new Date(fast.endTime || 0).toISOString().split("T")[0];
      if (lastDate === null) {
        tempStreak = 1;
      } else {
        const lastDateObj = new Date(lastDate);
        const currentDateObj = new Date(fastDate);
        const diffDays = Math.floor(
          (currentDateObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 0) {
          // Same day
        } else if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      lastDate = fastDate;
    }

    // Calculate total hours
    const totalHours = completedFasts.reduce((sum, f) => {
      if (f.endTime) {
        return sum + (f.endTime - f.startTime) / (1000 * 60 * 60);
      }
      return sum;
    }, 0);

    // Calculate average duration
    const averageDuration = totalFasts > 0 ? totalHours / totalFasts : 0;

    // Get last fast date
    const lastFast = sortedFasts[0];
    const lastFastDate = lastFast
      ? new Date(lastFast.endTime || 0).toLocaleDateString()
      : undefined;

    // User profile data
    const userProfile = profile[0];

    // Generate insight using Claude
    const insightContent = await generateInsight(insightType, {
      totalFasts,
      currentStreak,
      longestStreak,
      totalHours,
      averageDuration,
      preferredPlanId: userProfile?.preferredPlanId || undefined,
      lastFastDate,
      fastingGoal: userProfile?.fastingGoal || undefined,
      experienceLevel: userProfile?.experienceLevel || undefined,
    });

    // Cache the insight
    const validUntil = new Date(
      now.getTime() + CACHE_DURATION[insightType] * 60 * 60 * 1000
    );

    // Delete old cached insights of this type for this user
    await db
      .delete(schema.aiInsightsCache)
      .where(
        and(
          eq(schema.aiInsightsCache.userId, userId),
          eq(schema.aiInsightsCache.insightType, insightType)
        )
      );

    // Insert new cached insight
    await db.insert(schema.aiInsightsCache).values({
      userId,
      insightType,
      content: insightContent,
      validUntil,
    });

    return res.status(200).json({
      insight: insightContent,
      type: insightType,
      cached: false,
      validUntil,
    });
  } catch (error) {
    console.error("AI insights error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
