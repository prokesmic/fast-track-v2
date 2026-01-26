import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  AnalyticsEvents,
  AnalyticsEventName,
  trackEvent,
  forceFlush,
} from "../lib/analytics";

interface AnalyticsContextType {
  track: (
    eventName: AnalyticsEventName,
    eventData?: Record<string, unknown>
  ) => void;
  trackScreenView: (screenName: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Track app open on mount
  useEffect(() => {
    trackEvent(AnalyticsEvents.APP_OPEN);

    // Handle app state changes
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "background" || nextAppState === "inactive") {
          // Track app background and flush events
          trackEvent(AnalyticsEvents.APP_BACKGROUND);
          forceFlush();
        } else if (nextAppState === "active") {
          trackEvent(AnalyticsEvents.APP_OPEN);
        }
      }
    );

    return () => {
      subscription.remove();
      // Flush any remaining events on unmount
      forceFlush();
    };
  }, []);

  const track = useCallback(
    (eventName: AnalyticsEventName, eventData?: Record<string, unknown>) => {
      trackEvent(eventName, eventData);
    },
    []
  );

  const trackScreenView = useCallback((screenName: string) => {
    trackEvent(AnalyticsEvents.SCREEN_VIEW, { screenName });
  }, []);

  return (
    <AnalyticsContext.Provider value={{ track, trackScreenView }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error(
      "useAnalyticsContext must be used within an AnalyticsProvider"
    );
  }
  return context;
}
