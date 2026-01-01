import { useState, useEffect, useCallback } from "react";
import {
  Fast,
  getFasts,
  saveFast,
  getActiveFast,
  setActiveFast,
  calculateStreak,
  calculateLongestStreak,
  calculateTotalHours,
  generateId,
} from "@/lib/storage";

export function useFasting() {
  const [fasts, setFasts] = useState<Fast[]>([]);
  const [activeFast, setActiveFastState] = useState<Fast | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fastsData, activeData] = await Promise.all([
        getFasts(),
        getActiveFast(),
      ]);
      setFasts(fastsData);
      setActiveFastState(activeData);
    } catch (error) {
      console.error("Error loading fasting data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startFast = useCallback(
    async (
      planId: string,
      planName: string,
      targetDuration: number,
      startTime?: number,
      note?: string
    ) => {
      const fast: Fast = {
        id: generateId(),
        startTime: startTime || Date.now(),
        targetDuration,
        planId,
        planName,
        completed: false,
        note,
      };

      await setActiveFast(fast);
      setActiveFastState(fast);
      return fast;
    },
    []
  );

  const endFast = useCallback(
    async (completed: boolean = true) => {
      if (!activeFast) return;

      const endedFast: Fast = {
        ...activeFast,
        endTime: Date.now(),
        completed,
      };

      await saveFast(endedFast);
      await setActiveFast(null);
      setActiveFastState(null);
      setFasts((prev) => [endedFast, ...prev]);

      return endedFast;
    },
    [activeFast]
  );

  const cancelFast = useCallback(async () => {
    await setActiveFast(null);
    setActiveFastState(null);
  }, []);

  const currentStreak = calculateStreak(fasts);
  const longestStreak = calculateLongestStreak(fasts);
  const totalHours = calculateTotalHours(fasts);
  const totalFasts = fasts.filter((f) => f.completed).length;

  return {
    fasts,
    activeFast,
    loading,
    startFast,
    endFast,
    cancelFast,
    refresh: loadData,
    stats: {
      currentStreak,
      longestStreak,
      totalHours,
      totalFasts,
    },
  };
}
