/**
 * Claude AI Coach Logic
 * Handles conversational fasting coaching with context awareness
 */

import Anthropic from "@anthropic-ai/sdk";

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface UserContext {
  totalFasts: number;
  currentStreak: number;
  longestStreak: number;
  totalHours: number;
  averageDuration: number;
  preferredPlanId?: string;
  fastingGoal?: string;
  experienceLevel?: string;
  isCurrentlyFasting: boolean;
  currentFastHours?: number;
  targetHours?: number;
  language?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are a supportive, knowledgeable fasting coach assistant in the FastTrack app. Your role is to:

1. Answer questions about fasting with accurate, science-based information
2. Provide encouragement and motivation during difficult moments
3. Suggest optimal fasting schedules based on user goals
4. Explain the physiological stages of fasting
5. Help users troubleshoot common fasting challenges
6. Celebrate their achievements and progress

Guidelines:
- Keep responses concise (2-3 sentences typically, up to 4-5 for complex topics)
- Be warm, encouraging, and empathetic
- Use simple language, avoid jargon unless asked
- If the user is currently fasting, acknowledge it and provide relevant support
- Always prioritize safety - recommend breaking a fast if someone feels unwell
- Never provide medical advice - suggest consulting a doctor for health concerns
- Personalize responses based on the user's experience level and goals

Safety notes:
- Recommend hydration during fasts
- Suggest breaking fasts gradually with light foods
- Caution against extended fasts for beginners
- Never suggest fasting is appropriate for everyone`;

/**
 * Generate a coaching response using Claude
 */
export async function generateCoachResponse(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  userContext: UserContext
): Promise<string> {
  const contextPrompt = buildContextPrompt(userContext);

  // Build conversation messages for Claude
  const messages: { role: "user" | "assistant"; content: string }[] = [
    // Add context as first user message if we have it
    ...(contextPrompt
      ? [{ role: "user" as const, content: `[System Context: ${contextPrompt}]` }]
      : []),
    // Add conversation history
    ...conversationHistory.slice(-10), // Keep last 10 messages for context
    // Add current message
    { role: "user" as const, content: userMessage },
  ];

  // Determine language instruction
  const languageInstruction = userContext.language && userContext.language !== "en"
    ? `\n\nIMPORTANT: Respond in ${getLanguageName(userContext.language)}.`
    : "";

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SYSTEM_PROMPT + languageInstruction,
      messages,
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (textBlock && textBlock.type === "text") {
      return textBlock.text;
    }

    return getDefaultResponse(userContext);
  } catch (error) {
    console.error("Claude API error:", error);
    return getDefaultResponse(userContext);
  }
}

function buildContextPrompt(context: UserContext): string {
  const parts: string[] = [];

  if (context.isCurrentlyFasting) {
    parts.push(
      `Currently fasting: ${context.currentFastHours?.toFixed(1) || 0}h elapsed` +
      (context.targetHours ? ` of ${context.targetHours}h target` : "")
    );
  }

  if (context.totalFasts > 0) {
    parts.push(`Total fasts: ${context.totalFasts}`);
    parts.push(`Current streak: ${context.currentStreak} days`);
    parts.push(`Average duration: ${context.averageDuration.toFixed(1)}h`);
  }

  if (context.experienceLevel) {
    parts.push(`Experience: ${context.experienceLevel}`);
  }

  if (context.fastingGoal) {
    parts.push(`Goal: ${context.fastingGoal}`);
  }

  return parts.join("; ");
}

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: "English",
    es: "Spanish",
    de: "German",
    fr: "French",
  };
  return languages[code] || "English";
}

function getDefaultResponse(context: UserContext): string {
  if (context.isCurrentlyFasting && context.currentFastHours) {
    if (context.currentFastHours < 12) {
      return "You're doing great! The first 12 hours can be challenging, but your body is starting to tap into fat stores. Stay hydrated and keep going!";
    }
    if (context.currentFastHours < 16) {
      return "Excellent progress! You're in the fat-burning zone now. Your insulin levels are dropping and autophagy is beginning. Stay strong!";
    }
    return "Amazing work! You're in deep ketosis now. Your body is efficiently burning fat and cellular cleanup is in full swing. How are you feeling?";
  }

  if (context.currentStreak > 0) {
    return `You're on a ${context.currentStreak}-day streak! Consistency is key to seeing long-term benefits. What questions do you have about your fasting journey?`;
  }

  return "I'm here to help you on your fasting journey! Ask me anything about fasting schedules, the science behind fasting, or tips to make your fasts more successful.";
}

/**
 * Generate quick response suggestions based on context
 */
export function getQuickQuestions(context: UserContext): string[] {
  const questions: string[] = [];

  if (context.isCurrentlyFasting) {
    questions.push("I'm feeling hungry, what should I do?");
    questions.push("What stage of fasting am I in right now?");
    questions.push("Can I drink coffee during my fast?");
  } else {
    questions.push("When should I start my next fast?");
    questions.push("What fasting schedule is best for weight loss?");
  }

  if (context.experienceLevel === "beginner") {
    questions.push("What are the benefits of intermittent fasting?");
    questions.push("How do I handle hunger during a fast?");
  } else {
    questions.push("How can I optimize my fasting routine?");
    questions.push("Should I try a longer fast?");
  }

  return questions.slice(0, 4);
}
