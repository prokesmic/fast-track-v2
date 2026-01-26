import Anthropic from "@anthropic-ai/sdk";

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type InsightType = "recommendation" | "motivation" | "pattern" | "optimization";

interface FastingData {
  totalFasts: number;
  currentStreak: number;
  longestStreak: number;
  totalHours: number;
  averageDuration: number;
  preferredPlanId?: string;
  lastFastDate?: string;
  fastingGoal?: string;
  experienceLevel?: string;
}

// Generate AI insight using Claude
export async function generateInsight(
  insightType: InsightType,
  fastingData: FastingData
): Promise<string> {
  const systemPrompt = getSystemPrompt(insightType);
  const userPrompt = getUserPrompt(insightType, fastingData);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (textBlock && textBlock.type === "text") {
      return textBlock.text;
    }

    return getFallbackInsight(insightType, fastingData);
  } catch (error) {
    console.error("Claude API error:", error);
    return getFallbackInsight(insightType, fastingData);
  }
}

function getSystemPrompt(insightType: InsightType): string {
  const basePrompt =
    "You are a supportive fasting coach assistant. Be encouraging, concise, and helpful. " +
    "Keep responses under 100 words. Use a warm, motivational tone. " +
    "Focus on the user's progress and provide actionable advice.";

  switch (insightType) {
    case "recommendation":
      return (
        basePrompt +
        " Provide personalized fasting plan recommendations based on the user's history and goals."
      );
    case "motivation":
      return (
        basePrompt +
        " Provide a motivational message tailored to the user's current progress and streak."
      );
    case "pattern":
      return (
        basePrompt +
        " Analyze fasting patterns and provide insights about the user's fasting habits."
      );
    case "optimization":
      return (
        basePrompt +
        " Provide tips to optimize the user's fasting routine based on their history."
      );
    default:
      return basePrompt;
  }
}

function getUserPrompt(insightType: InsightType, data: FastingData): string {
  const stats = `
User's fasting statistics:
- Total completed fasts: ${data.totalFasts}
- Current streak: ${data.currentStreak} days
- Longest streak: ${data.longestStreak} days
- Total fasting hours: ${Math.round(data.totalHours)}
- Average fast duration: ${Math.round(data.averageDuration)} hours
- Preferred plan: ${data.preferredPlanId || "Not set"}
- Goal: ${data.fastingGoal || "General health"}
- Experience level: ${data.experienceLevel || "Unknown"}
${data.lastFastDate ? `- Last fast: ${data.lastFastDate}` : ""}
`;

  switch (insightType) {
    case "recommendation":
      return `${stats}\n\nBased on this user's fasting history and goals, recommend a fasting plan they should try next. Explain why it's a good fit for them.`;

    case "motivation":
      return `${stats}\n\nProvide a personalized motivational message for this user. Acknowledge their progress and encourage them to continue.`;

    case "pattern":
      return `${stats}\n\nAnalyze this user's fasting patterns. What insights can you provide about their habits? Are there any trends you notice?`;

    case "optimization":
      return `${stats}\n\nBased on this user's fasting data, provide specific tips to help them optimize their fasting routine and improve their results.`;

    default:
      return `${stats}\n\nProvide helpful fasting advice for this user.`;
  }
}

function getFallbackInsight(insightType: InsightType, data: FastingData): string {
  switch (insightType) {
    case "recommendation":
      if (data.totalFasts < 10) {
        return "You're building a solid foundation! Continue with 16:8 fasting to establish consistency. Once you complete 10 fasts, consider trying 18:6 for enhanced benefits.";
      }
      if (data.averageDuration < 16) {
        return "Great progress! You might be ready to extend your fasting window. Try the 16:8 protocol to unlock deeper fat-burning benefits.";
      }
      return "You're an experienced faster! Consider exploring 20:4 or OMAD to maximize autophagy and metabolic benefits.";

    case "motivation":
      if (data.currentStreak > 0) {
        return `Amazing! You're on a ${data.currentStreak}-day streak! Every fast strengthens your metabolic health. Keep going - you're building incredible discipline!`;
      }
      return "Every fast is a step toward better health. Your body thanks you for the metabolic reset. Start your next fast and continue your journey!";

    case "pattern":
      if (data.totalFasts > 0) {
        return `You've completed ${data.totalFasts} fasts, averaging ${Math.round(data.averageDuration)} hours each. Consistency is key, and you're proving you have what it takes!`;
      }
      return "Start tracking your fasts to discover your personal patterns. Understanding your habits helps optimize your fasting routine.";

    case "optimization":
      return "Stay hydrated during fasts, get quality sleep, and break your fast with protein-rich foods. These simple habits maximize your fasting benefits.";

    default:
      return "Keep up the great work on your fasting journey! Consistency is the key to long-term success.";
  }
}

// Cache duration in hours for each insight type
export const CACHE_DURATION: Record<InsightType, number> = {
  recommendation: 24,
  motivation: 12,
  pattern: 168, // 7 days
  optimization: 24,
};
