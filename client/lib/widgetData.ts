/**
 * Widget Data Service
 * Prepares and shares fasting data for home screen widgets
 *
 * Note: Full widget implementation requires native code:
 * - iOS: WidgetKit with SwiftUI (requires EAS Build with custom native code)
 * - Android: AppWidgetProvider with RemoteViews
 *
 * This module provides the data layer that widgets will read from.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getFasts, getActiveFast } from "./storage";

// Widget data storage key (shared with native widget code)
const WIDGET_DATA_KEY = "fast_track_widget_data";

export interface WidgetData {
  // Current fast info
  isActiveFast: boolean;
  fastStartTime: number | null;
  targetDuration: number | null;
  planName: string | null;

  // Progress (pre-calculated for widget efficiency)
  elapsedHours: number;
  progressPercent: number;
  remainingHours: number;

  // Stats
  currentStreak: number;
  totalFasts: number;
  lastFastDate: string | null;

  // Timestamps
  lastUpdated: number;
}

/**
 * Calculate widget data from current app state
 */
export async function calculateWidgetData(): Promise<WidgetData> {
  const activeFast = await getActiveFast();
  const allFasts = await getFasts();

  // Calculate streak
  const completedFasts = allFasts
    .filter(f => f.endTime)
    .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < completedFasts.length; i++) {
    const fastDate = new Date(completedFasts[i].endTime!);
    fastDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (fastDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0 && fastDate.getTime() === today.getTime() - 86400000) {
      // Allow yesterday as start of streak
      streak++;
    } else {
      break;
    }
  }

  // Calculate active fast progress
  let elapsedHours = 0;
  let progressPercent = 0;
  let remainingHours = 0;

  if (activeFast) {
    const now = Date.now();
    elapsedHours = (now - activeFast.startTime) / (1000 * 60 * 60);
    progressPercent = Math.min((elapsedHours / activeFast.targetDuration) * 100, 100);
    remainingHours = Math.max(activeFast.targetDuration - elapsedHours, 0);
  }

  const lastFast = completedFasts[0];

  return {
    isActiveFast: !!activeFast,
    fastStartTime: activeFast?.startTime || null,
    targetDuration: activeFast?.targetDuration || null,
    planName: activeFast?.planName || null,
    elapsedHours: Math.round(elapsedHours * 10) / 10,
    progressPercent: Math.round(progressPercent),
    remainingHours: Math.round(remainingHours * 10) / 10,
    currentStreak: streak,
    totalFasts: completedFasts.length,
    lastFastDate: lastFast ? new Date(lastFast.endTime!).toISOString().split("T")[0] : null,
    lastUpdated: Date.now(),
  };
}

/**
 * Save widget data to shared storage
 * On iOS, this would write to App Groups shared container
 * On Android, this writes to SharedPreferences accessible by widget
 */
export async function updateWidgetData(): Promise<void> {
  const data = await calculateWidgetData();

  try {
    // Store in AsyncStorage (accessible by JS)
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));

    // Platform-specific native storage would go here
    // iOS: Write to App Groups UserDefaults
    // Android: Write to SharedPreferences
    if (Platform.OS === "ios") {
      // Would call native module: NativeWidgetModule.updateWidgetData(data)
      // Requires custom native code with WidgetKit
    } else if (Platform.OS === "android") {
      // Would call native module: NativeWidgetModule.updateWidgetData(data)
      // Requires custom native code with AppWidgetProvider
    }

    console.log("[WIDGET] Data updated:", data);
  } catch (error) {
    console.error("[WIDGET] Failed to update widget data:", error);
  }
}

/**
 * Get cached widget data
 */
export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("[WIDGET] Failed to get widget data:", error);
    return null;
  }
}

/**
 * Request widget refresh (triggers native widget update)
 * This would be called after fast state changes
 */
export async function refreshWidget(): Promise<void> {
  await updateWidgetData();

  // Platform-specific widget refresh
  // iOS: WidgetCenter.shared.reloadAllTimelines()
  // Android: AppWidgetManager.updateAppWidget()
  if (Platform.OS === "ios") {
    // Would call: NativeWidgetModule.reloadWidgets()
  } else if (Platform.OS === "android") {
    // Would call: NativeWidgetModule.updateWidgets()
  }
}

/**
 * Format time remaining for widget display
 */
export function formatWidgetTime(hours: number): string {
  if (hours >= 1) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  } else {
    return `${Math.round(hours * 60)}m`;
  }
}
