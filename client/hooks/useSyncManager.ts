import { useEffect, useRef, useCallback, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { performFullSync, getLastSyncTime, SyncStatus } from "@/lib/sync";

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MIN_SYNC_INTERVAL_MS = 60 * 1000; // Minimum 1 minute between syncs

export function useSyncManager() {
  const { isAuthenticated } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncAttemptRef = useRef<number>(0);

  const syncNow = useCallback(async (force = false) => {
    if (!isAuthenticated) return;

    // Prevent too frequent syncs unless forced
    const now = Date.now();
    if (!force && now - lastSyncAttemptRef.current < MIN_SYNC_INTERVAL_MS) {
      return;
    }

    lastSyncAttemptRef.current = now;
    setSyncStatus("syncing");

    try {
      const result = await performFullSync();
      if (result.success) {
        setSyncStatus("success");
        const syncTime = await getLastSyncTime();
        setLastSyncTime(syncTime);
      } else {
        setSyncStatus("error");
        console.log("Sync failed:", result.error);
      }
    } catch (error) {
      setSyncStatus("error");
      console.error("Sync error:", error);
    }

    // Reset status after a delay
    setTimeout(() => {
      setSyncStatus("idle");
    }, 3000);
  }, [isAuthenticated]);

  // Handle app state changes (sync when app comes to foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && isAuthenticated) {
        // Sync when app becomes active
        syncNow();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, syncNow]);

  // Set up periodic sync interval
  useEffect(() => {
    if (isAuthenticated) {
      // Initial sync
      syncNow();

      // Set up interval
      syncIntervalRef.current = setInterval(() => {
        syncNow();
      }, SYNC_INTERVAL_MS);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, syncNow]);

  // Load last sync time on mount
  useEffect(() => {
    getLastSyncTime().then(setLastSyncTime);
  }, []);

  return {
    syncStatus,
    lastSyncTime,
    syncNow: () => syncNow(true),
  };
}
