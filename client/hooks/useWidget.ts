/**
 * Widget Hook
 * Manages widget data updates and synchronization
 */

import { useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { updateWidgetData, refreshWidget } from "@/lib/widgetData";

/**
 * Hook to automatically keep widget data in sync with app state
 * Call this in your main app component to ensure widgets stay updated
 */
export function useWidgetSync() {
  // Update widget when app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === "background" || nextAppState === "inactive") {
      // Update widget data when app goes to background
      updateWidgetData();
    }
  }, []);

  useEffect(() => {
    // Initial widget update
    updateWidgetData();

    // Listen for app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  // Return refresh function for manual updates
  return {
    refreshWidget,
  };
}

/**
 * Hook to trigger widget update after fast actions
 * Use this in components that modify fast state
 */
export function useWidgetUpdate() {
  const triggerUpdate = useCallback(async () => {
    await refreshWidget();
  }, []);

  return { triggerUpdate };
}
