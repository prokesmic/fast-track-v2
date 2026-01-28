/**
 * Unified Health Service
 * Abstracts Apple HealthKit (iOS) and Google Health Connect (Android)
 */
import { Platform } from "react-native";

// Types for health data
export interface HealthDataPoint {
  value: number;
  date: string;
  source?: string;
}

export interface HealthSummary {
  steps: number;
  weight?: number;
  sleepHours?: number;
  heartRate?: number;
  activeCalories?: number;
  waterIntake?: number;
}

export interface HealthPermissions {
  steps: boolean;
  weight: boolean;
  sleep: boolean;
  heartRate: boolean;
  activeCalories: boolean;
  water: boolean;
}

// Platform-specific imports (lazy loaded)
let AppleHealthKit: any = null;
let HealthConnect: any = null;

const loadHealthKit = async () => {
  if (Platform.OS === "ios" && !AppleHealthKit) {
    try {
      AppleHealthKit = require("react-native-health").default;
    } catch (e) {
      console.log("HealthKit not available");
    }
  }
  return AppleHealthKit;
};

const loadHealthConnect = async () => {
  if (Platform.OS === "android" && !HealthConnect) {
    try {
      HealthConnect = require("react-native-health-connect");
    } catch (e) {
      console.log("Health Connect not available");
    }
  }
  return HealthConnect;
};

// Check if health features are available
export const isHealthAvailable = async (): Promise<boolean> => {
  if (Platform.OS === "ios") {
    const kit = await loadHealthKit();
    if (!kit) return false;
    return new Promise((resolve) => {
      kit.isAvailable((err: any, available: boolean) => {
        resolve(!err && available);
      });
    });
  } else if (Platform.OS === "android") {
    const hc = await loadHealthConnect();
    if (!hc) return false;
    try {
      const status = await hc.getSdkStatus();
      return status === hc.SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch {
      return false;
    }
  }
  return false;
};

// Request permissions
export const requestHealthPermissions = async (): Promise<HealthPermissions> => {
  const permissions: HealthPermissions = {
    steps: false,
    weight: false,
    sleep: false,
    heartRate: false,
    activeCalories: false,
    water: false,
  };

  if (Platform.OS === "ios") {
    const kit = await loadHealthKit();
    if (!kit) return permissions;

    const iosPermissions = {
      permissions: {
        read: [
          kit.Constants.Permissions.Steps,
          kit.Constants.Permissions.Weight,
          kit.Constants.Permissions.SleepAnalysis,
          kit.Constants.Permissions.HeartRate,
          kit.Constants.Permissions.ActiveEnergyBurned,
          kit.Constants.Permissions.Water,
        ],
        write: [
          kit.Constants.Permissions.Weight,
          kit.Constants.Permissions.Water,
        ],
      },
    };

    return new Promise((resolve) => {
      kit.initHealthKit(iosPermissions, (err: any) => {
        if (err) {
          console.log("HealthKit permission error:", err);
          resolve(permissions);
        } else {
          // All permissions granted (iOS doesn't tell us which specifically)
          resolve({
            steps: true,
            weight: true,
            sleep: true,
            heartRate: true,
            activeCalories: true,
            water: true,
          });
        }
      });
    });
  } else if (Platform.OS === "android") {
    const hc = await loadHealthConnect();
    if (!hc) return permissions;

    try {
      const granted = await hc.requestPermission([
        { accessType: "read", recordType: "Steps" },
        { accessType: "read", recordType: "Weight" },
        { accessType: "write", recordType: "Weight" },
        { accessType: "read", recordType: "SleepSession" },
        { accessType: "read", recordType: "HeartRate" },
        { accessType: "read", recordType: "ActiveCaloriesBurned" },
        { accessType: "read", recordType: "Hydration" },
        { accessType: "write", recordType: "Hydration" },
      ]);

      // Parse granted permissions
      granted.forEach((p: any) => {
        if (p.recordType === "Steps") permissions.steps = true;
        if (p.recordType === "Weight") permissions.weight = true;
        if (p.recordType === "SleepSession") permissions.sleep = true;
        if (p.recordType === "HeartRate") permissions.heartRate = true;
        if (p.recordType === "ActiveCaloriesBurned") permissions.activeCalories = true;
        if (p.recordType === "Hydration") permissions.water = true;
      });

      return permissions;
    } catch (e) {
      console.log("Health Connect permission error:", e);
      return permissions;
    }
  }

  return permissions;
};

// Get today's steps
export const getTodaySteps = async (): Promise<number> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Platform.OS === "ios") {
    const kit = await loadHealthKit();
    if (!kit) return 0;

    return new Promise((resolve) => {
      kit.getStepCount(
        { date: today.toISOString() },
        (err: any, results: { value: number }) => {
          resolve(err ? 0 : results?.value || 0);
        }
      );
    });
  } else if (Platform.OS === "android") {
    const hc = await loadHealthConnect();
    if (!hc) return 0;

    try {
      const result = await hc.readRecords("Steps", {
        timeRangeFilter: {
          operator: "between",
          startTime: today.toISOString(),
          endTime: new Date().toISOString(),
        },
      });
      return result.records.reduce((sum: number, r: any) => sum + r.count, 0);
    } catch {
      return 0;
    }
  }

  return 0;
};

// Get weight history
export const getWeightHistory = async (days: number = 30): Promise<HealthDataPoint[]> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  if (Platform.OS === "ios") {
    const kit = await loadHealthKit();
    if (!kit) return [];

    return new Promise((resolve) => {
      kit.getWeightSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ascending: false,
          limit: 100,
        },
        (err: any, results: any[]) => {
          if (err || !results) {
            resolve([]);
          } else {
            resolve(
              results.map((r) => ({
                value: r.value,
                date: r.startDate,
                source: r.sourceName,
              }))
            );
          }
        }
      );
    });
  } else if (Platform.OS === "android") {
    const hc = await loadHealthConnect();
    if (!hc) return [];

    try {
      const result = await hc.readRecords("Weight", {
        timeRangeFilter: {
          operator: "between",
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      return result.records.map((r: any) => ({
        value: r.weight.inKilograms,
        date: r.time,
        source: r.metadata?.dataOrigin,
      }));
    } catch {
      return [];
    }
  }

  return [];
};

// Get sleep data
export const getSleepData = async (days: number = 7): Promise<HealthDataPoint[]> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  if (Platform.OS === "ios") {
    const kit = await loadHealthKit();
    if (!kit) return [];

    return new Promise((resolve) => {
      kit.getSleepSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ascending: false,
        },
        (err: any, results: any[]) => {
          if (err || !results) {
            resolve([]);
          } else {
            // Calculate hours per day
            const sleepByDay: Record<string, number> = {};
            results.forEach((r) => {
              if (r.value === "ASLEEP" || r.value === "INBED") {
                const day = r.startDate.split("T")[0];
                const hours =
                  (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) /
                  (1000 * 60 * 60);
                sleepByDay[day] = (sleepByDay[day] || 0) + hours;
              }
            });
            resolve(
              Object.entries(sleepByDay).map(([date, value]) => ({
                date,
                value,
              }))
            );
          }
        }
      );
    });
  } else if (Platform.OS === "android") {
    const hc = await loadHealthConnect();
    if (!hc) return [];

    try {
      const result = await hc.readRecords("SleepSession", {
        timeRangeFilter: {
          operator: "between",
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      return result.records.map((r: any) => {
        const hours =
          (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) /
          (1000 * 60 * 60);
        return {
          value: hours,
          date: r.startTime.split("T")[0],
        };
      });
    } catch {
      return [];
    }
  }

  return [];
};

// Get heart rate data
export const getHeartRateData = async (days: number = 7): Promise<HealthDataPoint[]> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  if (Platform.OS === "ios") {
    const kit = await loadHealthKit();
    if (!kit) return [];

    return new Promise((resolve) => {
      kit.getHeartRateSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ascending: false,
          limit: 500,
        },
        (err: any, results: any[]) => {
          if (err || !results) {
            resolve([]);
          } else {
            resolve(
              results.map((r) => ({
                value: r.value,
                date: r.startDate,
                source: r.sourceName,
              }))
            );
          }
        }
      );
    });
  } else if (Platform.OS === "android") {
    const hc = await loadHealthConnect();
    if (!hc) return [];

    try {
      const result = await hc.readRecords("HeartRate", {
        timeRangeFilter: {
          operator: "between",
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });
      const points: HealthDataPoint[] = [];
      result.records.forEach((r: any) => {
        r.samples.forEach((s: any) => {
          points.push({
            value: s.beatsPerMinute,
            date: s.time,
          });
        });
      });
      return points;
    } catch {
      return [];
    }
  }

  return [];
};

// Save weight
export const saveWeight = async (weightKg: number): Promise<boolean> => {
  const now = new Date().toISOString();

  if (Platform.OS === "ios") {
    const kit = await loadHealthKit();
    if (!kit) return false;

    return new Promise((resolve) => {
      kit.saveWeight(
        { value: weightKg, date: now },
        (err: any) => {
          resolve(!err);
        }
      );
    });
  } else if (Platform.OS === "android") {
    const hc = await loadHealthConnect();
    if (!hc) return false;

    try {
      await hc.insertRecords([
        {
          recordType: "Weight",
          time: now,
          weight: { unit: "kilogram", value: weightKg },
        },
      ]);
      return true;
    } catch {
      return false;
    }
  }

  return false;
};

// Get daily summary
export const getDailySummary = async (): Promise<HealthSummary> => {
  const [steps, weightHistory, sleepData, heartRateData] = await Promise.all([
    getTodaySteps(),
    getWeightHistory(1),
    getSleepData(1),
    getHeartRateData(1),
  ]);

  const latestWeight = weightHistory[0]?.value;
  const lastNightSleep = sleepData[0]?.value;
  const avgHeartRate =
    heartRateData.length > 0
      ? heartRateData.reduce((sum, d) => sum + d.value, 0) / heartRateData.length
      : undefined;

  return {
    steps,
    weight: latestWeight,
    sleepHours: lastNightSleep,
    heartRate: avgHeartRate ? Math.round(avgHeartRate) : undefined,
  };
};

// Correlate health data with fasting
export interface FastingHealthCorrelation {
  fastId: string;
  startWeight?: number;
  endWeight?: number;
  avgHeartRate?: number;
  totalSteps?: number;
  sleepHours?: number;
}

export const getHealthDataForFast = async (
  startTime: number,
  endTime: number
): Promise<Partial<FastingHealthCorrelation>> => {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const daysDiff = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));

  const [weightHistory, heartRateData, sleepData] = await Promise.all([
    getWeightHistory(daysDiff + 1),
    getHeartRateData(daysDiff + 1),
    getSleepData(daysDiff + 1),
  ]);

  // Find weights closest to start and end
  const startWeight = weightHistory.find(
    (w) => new Date(w.date) <= startDate
  )?.value;
  const endWeight = weightHistory.find(
    (w) => new Date(w.date) >= endDate
  )?.value;

  // Filter heart rate data during fast
  const fastingHeartRates = heartRateData.filter((hr) => {
    const hrDate = new Date(hr.date);
    return hrDate >= startDate && hrDate <= endDate;
  });
  const avgHeartRate =
    fastingHeartRates.length > 0
      ? Math.round(
          fastingHeartRates.reduce((sum, hr) => sum + hr.value, 0) /
            fastingHeartRates.length
        )
      : undefined;

  // Sum sleep during fast
  const fastingSleep = sleepData.filter((s) => {
    const sDate = new Date(s.date);
    return sDate >= startDate && sDate <= endDate;
  });
  const sleepHours =
    fastingSleep.length > 0
      ? fastingSleep.reduce((sum, s) => sum + s.value, 0)
      : undefined;

  return {
    startWeight,
    endWeight,
    avgHeartRate,
    sleepHours,
  };
};
