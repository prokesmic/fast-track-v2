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
  updateFastInStorage,
  deleteFast as deleteFastFromStorage,
} from "@/lib/storage";
import { BADGES } from "@/constants/badges";
import { getProfile, saveProfile } from "@/lib/storage";
import { Alert } from "react-native";
import {
  syncFastToCloud,
  deleteFastFromCloud,
  isAuthenticated,
} from "@/lib/sync";

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



  // ... imports

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

      // Sync to cloud if authenticated
      syncFastToCloud(endedFast).catch(() => {
        // Silently fail - will sync on next full sync
      });

      const newFasts = [endedFast, ...fasts];
      setFasts(newFasts);

      // Check for badges
      const profile = await getProfile();
      const unlocked = new Set(profile.unlockedBadges || []);
      const newBadges: string[] = [];

      const currentStreak = calculateStreak(newFasts);
      const totalHours = calculateTotalHours(newFasts);
      const totalCount = newFasts.filter(f => f.completed).length;
      const fastDuration = (endedFast.endTime! - endedFast.startTime) / (1000 * 60 * 60);

      BADGES.forEach(badge => {
        if (unlocked.has(badge.id)) return;

        let earned = false;

        // --- Streak Checks ---
        if (badge.category === "streak" && currentStreak >= badge.requirement) earned = true;

        // --- Volume Checks (Total Fasts) ---
        if (badge.category === "milestone" && badge.id.startsWith("fasts_")) {
          if (totalCount >= badge.requirement) earned = true;
        }

        // --- Hours Checks (Single Fast Duration) ---
        if (badge.category === "hours") {
          // Check if THIS specific fast met the requirement
          if (fastDuration >= badge.requirement) earned = true;
          // Also check if they have ANY past fast that met it (for consistency)
          // But strict "unlock on completion" implies we check the just-finished one primarily.
          // Let's also check historical for robustness if they just claimed the badge system.
          const hasHistorical = newFasts.some(f => {
            if (!f.endTime) return false;
            const duration = (f.endTime - f.startTime) / (1000 * 60 * 60);
            return duration >= badge.requirement;
          });
          if (hasHistorical) earned = true;
        }

        // --- Lifestyle Checks ---
        if (badge.category === "lifestyle") {
          const startDate = new Date(endedFast.startTime);
          const hour = startDate.getHours();
          const day = startDate.getDay(); // 0 = Sunday, 6 = Saturday

          if (badge.id === "lifestyle_early_bird") {
            // Start before 8 PM (20:00) and after 4 AM (04:00) to distinguish from late night
            if (hour < 20 && hour > 4) earned = true;
          }
          if (badge.id === "lifestyle_night_owl") {
            // Start after 10 PM (22:00) or before 4 AM
            if (hour >= 22 || hour < 4) earned = true;
          }
          if (badge.id === "lifestyle_weekend") {
            // Check if user has completed fasts on BOTH Saturday and Sunday in history
            const hasSaturday = newFasts.some(f => {
              if (!f.endTime) return false;
              return new Date(f.endTime).getDay() === 6;
            });
            const hasSunday = newFasts.some(f => {
              if (!f.endTime) return false;
              return new Date(f.endTime).getDay() === 0;
            });
            if (hasSaturday && hasSunday) earned = true;
          }
          if (badge.id === "lifestyle_perfect_week") {
            // Check if user has fasted 7 days in a row (streak >= 7 is basically this, but let's be strict about "every day")
            // Reuse streak logic or check last 7 days.
            // If streak is >= 7, they definitely fasted every day for a week.
            if (currentStreak >= 7) earned = true;
          }
        }

        if (earned) {
          newBadges.push(badge.id);
          unlocked.add(badge.id);
        }
      });

      if (newBadges.length > 0) {
        await saveProfile({ ...profile, unlockedBadges: Array.from(unlocked) });
        // Show alert for now
        const badgeNames = newBadges.map(id => BADGES.find(b => b.id === id)?.name).join(", ");
        Alert.alert("🎉 New Badge Unlocked!", `You earned: ${badgeNames}`);
      }

      return endedFast;
    },
    [activeFast, fasts]
  );

  const cancelFast = useCallback(async () => {
    await setActiveFast(null);
    setActiveFastState(null);
  }, []);

  const currentStreak = calculateStreak(fasts);
  const longestStreak = calculateLongestStreak(fasts);
  const totalHours = calculateTotalHours(fasts);
  const totalFasts = fasts.filter((f) => f.completed).length;


  const updateFast = useCallback(async (id: string, updates: Partial<Fast>) => {
    try {
      if (activeFast && activeFast.id === id) {
        const updated = { ...activeFast, ...updates };
        await setActiveFast(updated);
        setActiveFastState(updated);
        // Sync to cloud
        syncFastToCloud(updated).catch(() => {});
      } else {
        const updatedFast = await updateFastInStorage(id, updates);
        // Refresh list to show updates in history immediately
        const fastsData = await getFasts();
        setFasts(fastsData);
        // Sync to cloud if we have the full fast
        if (updatedFast) {
          syncFastToCloud(updatedFast).catch(() => {});
        }
      }
    } catch (error) {
      console.error("Error updating fast:", error);
    }
  }, [activeFast]);

  const deleteFast = useCallback(async (id: string) => {
    try {
      await deleteFastFromStorage(id);
      setFasts((prev) => prev.filter((f) => f.id !== id));

      // If active fast is deleted (shouldn't happen via UI but good safety), clear it
      if (activeFast && activeFast.id === id) {
        setActiveFastState(null);
      }

      // Sync deletion to cloud if authenticated
      deleteFastFromCloud(id).catch(() => {
        // Silently fail - will sync on next full sync
      });
    } catch (error) {
      console.error("Error deleting fast:", error);
    }
  }, [activeFast]);

  return {
    fasts,
    activeFast,
    loading,
    startFast,
    endFast,
    cancelFast,
    updateFast,
    deleteFast,
    refresh: loadData,
    stats: {
      currentStreak,
      longestStreak,
      totalHours,
      totalFasts,
    },
  };
}

