import { Platform } from "react-native";
import { apiRequest } from "./api";
import { getToken } from "./auth";

// Analytics event names
export const AnalyticsEvents = {
  // App lifecycle
  APP_OPEN: "app_open",
  APP_BACKGROUND: "app_background",

  // Fasting events
  FAST_STARTED: "fast_started",
  FAST_COMPLETED: "fast_completed",
  FAST_CANCELLED: "fast_cancelled",
  FAST_EXTENDED: "fast_extended",

  // Achievement events
  BADGE_UNLOCKED: "badge_unlocked",
  MILESTONE_REACHED: "milestone_reached",

  // Navigation events
  SCREEN_VIEW: "screen_view",

  // Plan events
  PLAN_SELECTED: "plan_selected",
  PLAN_VIEWED: "plan_viewed",

  // Onboarding events
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  ONBOARDING_SKIPPED: "onboarding_skipped",

  // Premium events (for future use)
  PREMIUM_VIEWED: "premium_viewed",
  PREMIUM_PURCHASED: "premium_purchased",

  // Engagement events
  PROFILE_UPDATED: "profile_updated",
  WEIGHT_LOGGED: "weight_logged",
  WATER_LOGGED: "water_logged",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

interface TrackEventParams {
  eventName: AnalyticsEventName;
  eventData?: Record<string, unknown>;
}

// Queue for batching events
let eventQueue: TrackEventParams[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_QUEUE_SIZE = 10;

// Get platform info
function getPlatformInfo(): string {
  return `${Platform.OS}-${Platform.Version}`;
}

// Flush event queue to server
async function flushEventQueue(): Promise<void> {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  // Send events in parallel
  await Promise.allSettled(
    eventsToSend.map((event) =>
      apiRequest("/api/analytics/track", {
        method: "POST",
        body: {
          eventName: event.eventName,
          eventData: event.eventData,
          platform: getPlatformInfo(),
        },
        requireAuth: false, // Analytics can work without auth
      })
    )
  );
}

// Schedule flush
function scheduleFlush(): void {
  if (flushTimeout) return;

  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushEventQueue();
  }, FLUSH_INTERVAL);
}

// Track an event
export async function trackEvent(
  eventName: AnalyticsEventName,
  eventData?: Record<string, unknown>
): Promise<void> {
  const event: TrackEventParams = {
    eventName,
    eventData: {
      ...eventData,
      timestamp: Date.now(),
    },
  };

  eventQueue.push(event);

  // Flush immediately if queue is full
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }
    await flushEventQueue();
  } else {
    scheduleFlush();
  }
}

// Track screen view
export function trackScreenView(screenName: string): void {
  trackEvent(AnalyticsEvents.SCREEN_VIEW, { screenName });
}

// Track fast started
export function trackFastStarted(planId: string, planName: string): void {
  trackEvent(AnalyticsEvents.FAST_STARTED, { planId, planName });
}

// Track fast completed
export function trackFastCompleted(
  planId: string,
  durationMinutes: number,
  completedTarget: boolean
): void {
  trackEvent(AnalyticsEvents.FAST_COMPLETED, {
    planId,
    durationMinutes,
    completedTarget,
  });
}

// Track fast cancelled
export function trackFastCancelled(
  planId: string,
  durationMinutes: number
): void {
  trackEvent(AnalyticsEvents.FAST_CANCELLED, { planId, durationMinutes });
}

// Track badge unlocked
export function trackBadgeUnlocked(badgeId: string, badgeName: string): void {
  trackEvent(AnalyticsEvents.BADGE_UNLOCKED, { badgeId, badgeName });
}

// Track plan selected
export function trackPlanSelected(planId: string, planName: string): void {
  trackEvent(AnalyticsEvents.PLAN_SELECTED, { planId, planName });
}

// Track onboarding events
export function trackOnboardingStarted(): void {
  trackEvent(AnalyticsEvents.ONBOARDING_STARTED);
}

export function trackOnboardingStepCompleted(
  step: number,
  stepName: string
): void {
  trackEvent(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, { step, stepName });
}

export function trackOnboardingCompleted(data: {
  goal: string;
  experienceLevel: string;
  preferredPlan: string;
}): void {
  trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, data);
}

export function trackOnboardingSkipped(atStep: number): void {
  trackEvent(AnalyticsEvents.ONBOARDING_SKIPPED, { atStep });
}

// Force flush (call on app background)
export async function forceFlush(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  await flushEventQueue();
}
