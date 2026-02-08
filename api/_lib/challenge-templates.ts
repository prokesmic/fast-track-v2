/**
 * Weekly Challenge Templates
 * Used to auto-generate weekly challenges for the community
 */

export interface ChallengeTemplate {
  name: string;
  type: "complete_fasts" | "total_hours" | "longest_fast" | "streak";
  targetValue: number;
  description: string;
  badgeId?: string;
}

// Rotating set of challenge templates
export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    name: "Fast Five",
    type: "complete_fasts",
    targetValue: 5,
    description: "Complete 5 fasts this week to build consistency",
  },
  {
    name: "Hour Hunter",
    type: "total_hours",
    targetValue: 80,
    description: "Accumulate 80 hours of fasting this week",
  },
  {
    name: "Marathon Fast",
    type: "longest_fast",
    targetValue: 24,
    description: "Complete a 24-hour fast this week",
  },
  {
    name: "Streak Seeker",
    type: "streak",
    targetValue: 7,
    description: "Maintain a 7-day fasting streak",
  },
  {
    name: "The Daily Faster",
    type: "complete_fasts",
    targetValue: 7,
    description: "Fast every day this week",
  },
  {
    name: "Century Club",
    type: "total_hours",
    targetValue: 100,
    description: "Fast for 100 total hours this week",
  },
  {
    name: "Extended Challenge",
    type: "longest_fast",
    targetValue: 36,
    description: "Complete a 36-hour extended fast",
  },
  {
    name: "Triple Threat",
    type: "complete_fasts",
    targetValue: 3,
    description: "Complete at least 3 fasts this week",
  },
];

/**
 * Get the challenge template for a specific week
 * Rotates through templates based on week number
 */
export function getChallengeTemplateForWeek(weekNumber: number): ChallengeTemplate {
  const index = weekNumber % CHALLENGE_TEMPLATES.length;
  return CHALLENGE_TEMPLATES[index];
}

/**
 * Get the ISO week number for a date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get the start and end dates for a week
 */
export function getWeekDates(year: number, weekNumber: number): { startDate: Date; endDate: Date } {
  const jan4 = new Date(year, 0, 4);
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  // Find the Monday of week 1
  const dayOfWeek = jan4.getDay() || 7; // Sunday = 7
  const week1Monday = new Date(jan4.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);

  // Calculate the start of the target week
  const startDate = new Date(week1Monday.getTime() + (weekNumber - 1) * oneWeek);
  startDate.setHours(0, 0, 0, 0);

  // End date is Sunday of that week at 23:59:59
  const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Generate a weekly challenge object
 */
export function generateWeeklyChallenge(year: number, weekNumber: number) {
  const template = getChallengeTemplateForWeek(weekNumber);
  const { startDate, endDate } = getWeekDates(year, weekNumber);

  return {
    weekNumber,
    year,
    name: template.name,
    description: template.description,
    type: template.type,
    targetValue: template.targetValue,
    startDate,
    endDate,
    rewardBadgeId: template.badgeId || null,
  };
}
