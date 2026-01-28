/**
 * Calendar Hook
 * Manage calendar data and device calendar sync
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Fast } from "@/lib/storage";
import {
  CalendarDay,
  MonthlyStats,
  requestCalendarPermissions,
  checkCalendarPermissions,
  getFastsForMonth,
  getStreakDays,
  getMonthlyStats,
  addFastToCalendar,
} from "@/lib/calendar";

export function useCalendar(fasts: Fast[]) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Check permission on mount
  useEffect(() => {
    checkCalendarPermissions().then(setHasPermission);
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestCalendarPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  // Get calendar data for current month
  const calendarData = useMemo(
    () => getFastsForMonth(fasts, currentMonth.year, currentMonth.month),
    [fasts, currentMonth.year, currentMonth.month]
  );

  // Get streak days
  const streakDays = useMemo(() => getStreakDays(fasts), [fasts]);

  // Get monthly stats
  const monthlyStats = useMemo(
    () => getMonthlyStats(fasts, currentMonth.year, currentMonth.month),
    [fasts, currentMonth.year, currentMonth.month]
  );

  // Navigation
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
  }, []);

  const goToDate = useCallback((date: Date) => {
    setCurrentMonth({ year: date.getFullYear(), month: date.getMonth() });
  }, []);

  // Sync fast to device calendar
  const syncFastToCalendar = useCallback(
    async (fast: Fast) => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) return null;
      }
      return addFastToCalendar(fast);
    },
    [hasPermission, requestPermission]
  );

  // Format month title
  const monthTitle = useMemo(() => {
    const date = new Date(currentMonth.year, currentMonth.month);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [currentMonth.year, currentMonth.month]);

  // Check if viewing current month
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      currentMonth.year === now.getFullYear() &&
      currentMonth.month === now.getMonth()
    );
  }, [currentMonth.year, currentMonth.month]);

  return {
    currentMonth,
    monthTitle,
    isCurrentMonth,
    calendarData,
    streakDays,
    monthlyStats,
    hasPermission,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    goToDate,
    requestPermission,
    syncFastToCalendar,
  };
}

// Hook for getting day details
export function useCalendarDay(
  calendarData: Map<string, CalendarDay>,
  dateStr: string
) {
  return useMemo(
    () => calendarData.get(dateStr) || null,
    [calendarData, dateStr]
  );
}

// Hook for week data (for week view)
export function useWeekView(fasts: Fast[], startDate: Date) {
  return useMemo(() => {
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

      const dayFasts = fasts.filter((fast) => {
        if (!fast.endTime) return false;
        const endDate = new Date(fast.endTime);
        return (
          endDate.getFullYear() === currentDate.getFullYear() &&
          endDate.getMonth() === currentDate.getMonth() &&
          endDate.getDate() === currentDate.getDate()
        );
      });

      const totalHours = dayFasts.reduce(
        (sum, fast) =>
          sum + (fast.endTime! - fast.startTime) / (1000 * 60 * 60),
        0
      );

      days.push({
        date: dateStr,
        fasts: dayFasts,
        totalHours,
        completed: dayFasts.length,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [fasts, startDate]);
}
