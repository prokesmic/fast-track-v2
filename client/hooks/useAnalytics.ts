import { useCallback, useEffect, useRef } from "react";
import {
  AnalyticsEvents,
  AnalyticsEventName,
  trackEvent,
  trackScreenView,
  trackFastStarted,
  trackFastCompleted,
  trackFastCancelled,
  trackBadgeUnlocked,
  trackPlanSelected,
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
  trackOnboardingCompleted,
  trackOnboardingSkipped,
} from "../lib/analytics";

// Re-export event names for convenience
export { AnalyticsEvents };

// Hook for tracking analytics events
export function useAnalytics() {
  const track = useCallback(
    (eventName: AnalyticsEventName, eventData?: Record<string, unknown>) => {
      trackEvent(eventName, eventData);
    },
    []
  );

  return {
    track,
    trackScreenView,
    trackFastStarted,
    trackFastCompleted,
    trackFastCancelled,
    trackBadgeUnlocked,
    trackPlanSelected,
    trackOnboardingStarted,
    trackOnboardingStepCompleted,
    trackOnboardingCompleted,
    trackOnboardingSkipped,
  };
}

// Hook for tracking screen views automatically
export function useScreenTracking(screenName: string) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      trackScreenView(screenName);
      hasTracked.current = true;
    }
  }, [screenName]);
}

// Hook for tracking time on screen
export function useScreenTimeTracking(screenName: string) {
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      trackEvent(AnalyticsEvents.SCREEN_VIEW, {
        screenName,
        duration,
        action: "exit",
      });
    };
  }, [screenName]);
}
