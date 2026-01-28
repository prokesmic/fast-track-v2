/**
 * Calendar Integration Service
 * Sync fasts with device calendar and provide calendar data
 */

import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import { Fast } from "./storage";

const CALENDAR_NAME = "FastTrack";
const CALENDAR_COLOR = "#2DD4BF";

// Permission handling
export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === "granted";
}

export async function checkCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status === "granted";
}

// Get or create FastTrack calendar
async function getOrCreateFastTrackCalendar(): Promise<string | null> {
  const hasPermission = await checkCalendarPermissions();
  if (!hasPermission) {
    const granted = await requestCalendarPermissions();
    if (!granted) return null;
  }

  // Check if FastTrack calendar exists
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existingCalendar = calendars.find((c) => c.title === CALENDAR_NAME);

  if (existingCalendar) {
    return existingCalendar.id;
  }

  // Create new calendar
  const defaultCalendarSource =
    Platform.OS === "ios"
      ? await getDefaultCalendarSource()
      : { isLocalAccount: true, name: CALENDAR_NAME, type: "local" as const };

  if (!defaultCalendarSource) return null;

  try {
    const newCalendarId = await Calendar.createCalendarAsync({
      title: CALENDAR_NAME,
      color: CALENDAR_COLOR,
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendarSource.id,
      source: defaultCalendarSource as Calendar.Source,
      name: CALENDAR_NAME,
      ownerAccount: "personal",
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
    return newCalendarId;
  } catch (error) {
    console.error("[CALENDAR] Failed to create calendar:", error);
    return null;
  }
}

async function getDefaultCalendarSource(): Promise<Calendar.Source | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCalendars = calendars.filter(
    (c) => c.source.name === "iCloud" || c.source.name === "Default"
  );

  if (defaultCalendars.length > 0) {
    return defaultCalendars[0].source;
  }

  // Fallback to first local calendar
  const localCalendar = calendars.find(
    (c) => c.source.isLocalAccount
  );

  return localCalendar?.source || calendars[0]?.source || null;
}

// Add fast to calendar
export async function addFastToCalendar(fast: Fast): Promise<string | null> {
  const calendarId = await getOrCreateFastTrackCalendar();
  if (!calendarId) return null;

  const startDate = new Date(fast.startTime);
  const endDate = fast.endTime
    ? new Date(fast.endTime)
    : new Date(fast.startTime + fast.targetDuration * 60 * 60 * 1000);

  const duration = fast.endTime
    ? (fast.endTime - fast.startTime) / (1000 * 60 * 60)
    : fast.targetDuration;

  try {
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: `${fast.planName} Fast`,
      notes: `Target: ${fast.targetDuration}h | ${fast.endTime ? `Completed: ${duration.toFixed(1)}h` : "In progress"}`,
      startDate,
      endDate,
      allDay: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    return eventId;
  } catch (error) {
    console.error("[CALENDAR] Failed to create event:", error);
    return null;
  }
}

// Remove fast from calendar
export async function removeFastFromCalendar(eventId: string): Promise<boolean> {
  try {
    await Calendar.deleteEventAsync(eventId);
    return true;
  } catch (error) {
    console.error("[CALENDAR] Failed to delete event:", error);
    return false;
  }
}

// Update fast in calendar
export async function updateFastInCalendar(
  eventId: string,
  fast: Fast
): Promise<boolean> {
  const startDate = new Date(fast.startTime);
  const endDate = fast.endTime
    ? new Date(fast.endTime)
    : new Date(fast.startTime + fast.targetDuration * 60 * 60 * 1000);

  const duration = fast.endTime
    ? (fast.endTime - fast.startTime) / (1000 * 60 * 60)
    : fast.targetDuration;

  try {
    await Calendar.updateEventAsync(eventId, {
      title: `${fast.planName} Fast`,
      notes: `Target: ${fast.targetDuration}h | ${fast.endTime ? `Completed: ${duration.toFixed(1)}h` : "In progress"}`,
      startDate,
      endDate,
    });
    return true;
  } catch (error) {
    console.error("[CALENDAR] Failed to update event:", error);
    return false;
  }
}

// Schedule a future fast
export interface ScheduledFast {
  id: string;
  planId: string;
  planName: string;
  targetDuration: number;
  scheduledStart: number;
  calendarEventId?: string;
  reminderMinutes?: number;
}

export async function scheduleFuturesFast(
  scheduled: Omit<ScheduledFast, "id" | "calendarEventId">
): Promise<ScheduledFast | null> {
  const calendarId = await getOrCreateFastTrackCalendar();
  if (!calendarId) return null;

  const startDate = new Date(scheduled.scheduledStart);
  const endDate = new Date(
    scheduled.scheduledStart + scheduled.targetDuration * 60 * 60 * 1000
  );

  try {
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: `${scheduled.planName} Fast (Scheduled)`,
      notes: `Planned ${scheduled.targetDuration}h fast`,
      startDate,
      endDate,
      allDay: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: scheduled.reminderMinutes
        ? [{ relativeOffset: -scheduled.reminderMinutes }]
        : [{ relativeOffset: -30 }], // Default 30 min reminder
    });

    return {
      id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...scheduled,
      calendarEventId: eventId,
    };
  } catch (error) {
    console.error("[CALENDAR] Failed to schedule fast:", error);
    return null;
  }
}

// Get fasts for a date range (for calendar display)
export interface CalendarDay {
  date: string; // YYYY-MM-DD
  fasts: Fast[];
  totalHours: number;
  completed: number;
}

export function getFastsForMonth(
  fasts: Fast[],
  year: number,
  month: number
): Map<string, CalendarDay> {
  const result = new Map<string, CalendarDay>();

  // Initialize all days of the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    result.set(dateStr, {
      date: dateStr,
      fasts: [],
      totalHours: 0,
      completed: 0,
    });
  }

  // Add fasts to their respective days
  for (const fast of fasts) {
    if (!fast.endTime) continue;

    const endDate = new Date(fast.endTime);
    const dateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    if (result.has(dateStr)) {
      const day = result.get(dateStr)!;
      day.fasts.push(fast);
      day.totalHours += (fast.endTime - fast.startTime) / (1000 * 60 * 60);
      day.completed++;
    }
  }

  return result;
}

// Get streak data for calendar highlighting
export function getStreakDays(fasts: Fast[]): Set<string> {
  const streakDays = new Set<string>();

  // Get all days with completed fasts
  const completedFasts = fasts.filter((f) => f.endTime);

  for (const fast of completedFasts) {
    const endDate = new Date(fast.endTime!);
    const dateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
    streakDays.add(dateStr);
  }

  return streakDays;
}

// Calculate monthly stats
export interface MonthlyStats {
  totalFasts: number;
  totalHours: number;
  averageDuration: number;
  completionRate: number;
  bestDay: string | null;
  bestDayHours: number;
}

export function getMonthlyStats(
  fasts: Fast[],
  year: number,
  month: number
): MonthlyStats {
  const monthFasts = fasts.filter((fast) => {
    if (!fast.endTime) return false;
    const endDate = new Date(fast.endTime);
    return endDate.getFullYear() === year && endDate.getMonth() === month;
  });

  const totalHours = monthFasts.reduce((sum, fast) => {
    return sum + (fast.endTime! - fast.startTime) / (1000 * 60 * 60);
  }, 0);

  const targetReached = monthFasts.filter((fast) => {
    const duration = (fast.endTime! - fast.startTime) / (1000 * 60 * 60);
    return duration >= fast.targetDuration;
  });

  // Find best day
  const dayMap = getFastsForMonth(fasts, year, month);
  let bestDay: string | null = null;
  let bestDayHours = 0;

  dayMap.forEach((day, dateStr) => {
    if (day.totalHours > bestDayHours) {
      bestDayHours = day.totalHours;
      bestDay = dateStr;
    }
  });

  return {
    totalFasts: monthFasts.length,
    totalHours: Math.round(totalHours * 10) / 10,
    averageDuration:
      monthFasts.length > 0
        ? Math.round((totalHours / monthFasts.length) * 10) / 10
        : 0,
    completionRate:
      monthFasts.length > 0
        ? Math.round((targetReached.length / monthFasts.length) * 100)
        : 0,
    bestDay,
    bestDayHours: Math.round(bestDayHours * 10) / 10,
  };
}
