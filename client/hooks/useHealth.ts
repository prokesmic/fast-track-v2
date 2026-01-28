/**
 * React hook for health data integration
 */
import { useState, useEffect, useCallback } from "react";
import {
  isHealthAvailable,
  requestHealthPermissions,
  getDailySummary,
  getWeightHistory,
  getSleepData,
  getHeartRateData,
  saveWeight as saveHealthWeight,
  getHealthDataForFast,
  HealthSummary,
  HealthDataPoint,
  HealthPermissions,
  FastingHealthCorrelation,
} from "@/lib/health";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HEALTH_ENABLED_KEY = "@health_enabled";
const HEALTH_PERMISSIONS_KEY = "@health_permissions";

interface UseHealthReturn {
  isAvailable: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  permissions: HealthPermissions | null;
  summary: HealthSummary | null;
  weightHistory: HealthDataPoint[];
  sleepHistory: HealthDataPoint[];
  heartRateHistory: HealthDataPoint[];
  enableHealth: () => Promise<boolean>;
  disableHealth: () => Promise<void>;
  refreshData: () => Promise<void>;
  syncWeight: (weightKg: number) => Promise<boolean>;
  getCorrelationData: (startTime: number, endTime: number) => Promise<Partial<FastingHealthCorrelation>>;
}

export function useHealth(): UseHealthReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<HealthPermissions | null>(null);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [weightHistory, setWeightHistory] = useState<HealthDataPoint[]>([]);
  const [sleepHistory, setSleepHistory] = useState<HealthDataPoint[]>([]);
  const [heartRateHistory, setHeartRateHistory] = useState<HealthDataPoint[]>([]);

  // Check availability and load saved state
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const available = await isHealthAvailable();
        setIsAvailable(available);

        if (available) {
          const enabled = await AsyncStorage.getItem(HEALTH_ENABLED_KEY);
          const savedPermissions = await AsyncStorage.getItem(HEALTH_PERMISSIONS_KEY);

          if (enabled === "true" && savedPermissions) {
            setIsEnabled(true);
            setPermissions(JSON.parse(savedPermissions));
          }
        }
      } catch (error) {
        console.error("Error initializing health:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Load data when enabled
  useEffect(() => {
    if (isEnabled && permissions) {
      refreshData();
    }
  }, [isEnabled, permissions]);

  const refreshData = useCallback(async () => {
    if (!isEnabled) return;

    try {
      const [summaryData, weights, sleep, heartRate] = await Promise.all([
        getDailySummary(),
        getWeightHistory(30),
        getSleepData(14),
        getHeartRateData(7),
      ]);

      setSummary(summaryData);
      setWeightHistory(weights);
      setSleepHistory(sleep);
      setHeartRateHistory(heartRate);
    } catch (error) {
      console.error("Error refreshing health data:", error);
    }
  }, [isEnabled]);

  const enableHealth = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return false;

    try {
      const perms = await requestHealthPermissions();
      const hasAnyPermission = Object.values(perms).some((v) => v);

      if (hasAnyPermission) {
        await AsyncStorage.setItem(HEALTH_ENABLED_KEY, "true");
        await AsyncStorage.setItem(HEALTH_PERMISSIONS_KEY, JSON.stringify(perms));
        setPermissions(perms);
        setIsEnabled(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error enabling health:", error);
      return false;
    }
  }, [isAvailable]);

  const disableHealth = useCallback(async () => {
    await AsyncStorage.removeItem(HEALTH_ENABLED_KEY);
    await AsyncStorage.removeItem(HEALTH_PERMISSIONS_KEY);
    setIsEnabled(false);
    setPermissions(null);
    setSummary(null);
    setWeightHistory([]);
    setSleepHistory([]);
    setHeartRateHistory([]);
  }, []);

  const syncWeight = useCallback(async (weightKg: number): Promise<boolean> => {
    if (!isEnabled || !permissions?.weight) return false;
    return saveHealthWeight(weightKg);
  }, [isEnabled, permissions]);

  const getCorrelationData = useCallback(
    async (startTime: number, endTime: number) => {
      if (!isEnabled) return {};
      return getHealthDataForFast(startTime, endTime);
    },
    [isEnabled]
  );

  return {
    isAvailable,
    isEnabled,
    isLoading,
    permissions,
    summary,
    weightHistory,
    sleepHistory,
    heartRateHistory,
    enableHealth,
    disableHealth,
    refreshData,
    syncWeight,
    getCorrelationData,
  };
}
