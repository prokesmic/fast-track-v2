import { getToken } from "./auth";
import {
  getFasts,
  getProfile,
  getWeights,
  Fast,
  UserProfile,
  WeightEntry,
  saveFast,
  saveProfile,
  saveWeight,
} from "./storage";
import { syncData, SyncResponse, FastData, WeightData, ProfileData } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_SYNC_KEY = "last_sync_timestamp";
const SYNC_STATUS_KEY = "sync_status";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncState {
  status: SyncStatus;
  lastSyncTime: number | null;
  error: string | null;
}

// Get last sync timestamp
export async function getLastSyncTime(): Promise<number | null> {
  const data = await AsyncStorage.getItem(LAST_SYNC_KEY);
  return data ? parseInt(data, 10) : null;
}

// Set last sync timestamp
export async function setLastSyncTime(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

// Convert local Fast to API format
function fastToApi(fast: Fast): FastData {
  return {
    id: fast.id,
    startTime: fast.startTime,
    endTime: fast.endTime ?? null,
    targetDuration: fast.targetDuration,
    planId: fast.planId,
    planName: fast.planName,
    completed: fast.completed,
    note: fast.note ?? null,
  };
}

// Convert API Fast to local format
function apiToFast(data: FastData): Fast {
  return {
    id: data.id,
    startTime: data.startTime,
    endTime: data.endTime ?? undefined,
    targetDuration: data.targetDuration,
    planId: data.planId,
    planName: data.planName,
    completed: data.completed ?? false,
    note: data.note ?? undefined,
  };
}

// Convert local Profile to API format
function profileToApi(profile: UserProfile): ProfileData {
  return {
    displayName: profile.displayName,
    avatarId: profile.avatarId,
    customAvatarUri: profile.customAvatarUri ?? null,
    weightUnit: profile.weightUnit,
    notificationsEnabled: profile.notificationsEnabled,
    unlockedBadges: profile.unlockedBadges,
  };
}

// Convert API Profile to local format
function apiToProfile(data: ProfileData): UserProfile {
  return {
    displayName: data.displayName ?? "",
    avatarId: data.avatarId ?? 0,
    customAvatarUri: data.customAvatarUri ?? undefined,
    weightUnit: (data.weightUnit as "lbs" | "kg") ?? "lbs",
    notificationsEnabled: data.notificationsEnabled ?? false,
    unlockedBadges: data.unlockedBadges ?? [],
  };
}

// Convert local Weight to API format
function weightToApi(weight: WeightEntry): WeightData {
  return {
    id: weight.id,
    date: weight.date,
    weight: weight.weight,
  };
}

// Convert API Weight to local format
function apiToWeight(data: WeightData): WeightEntry {
  return {
    id: data.id,
    date: data.date,
    weight: data.weight,
  };
}

// Merge local and cloud data using most recent wins strategy
function mergeFasts(local: Fast[], cloud: FastData[]): Fast[] {
  const mergedMap = new Map<string, Fast>();

  // Add all local fasts
  for (const fast of local) {
    mergedMap.set(fast.id, fast);
  }

  // Merge cloud fasts (cloud wins for same ID since it's considered authoritative after sync)
  for (const cloudFast of cloud) {
    const localFast = mergedMap.get(cloudFast.id);
    if (!localFast) {
      // New fast from cloud
      mergedMap.set(cloudFast.id, apiToFast(cloudFast));
    } else {
      // Compare by endTime or startTime to determine which is newer
      const localTime = localFast.endTime ?? localFast.startTime;
      const cloudTime = cloudFast.endTime ?? cloudFast.startTime;
      if (cloudTime >= localTime) {
        mergedMap.set(cloudFast.id, apiToFast(cloudFast));
      }
    }
  }

  return Array.from(mergedMap.values()).sort((a, b) => b.startTime - a.startTime);
}

// Merge weights
function mergeWeights(local: WeightEntry[], cloud: WeightData[]): WeightEntry[] {
  const mergedMap = new Map<string, WeightEntry>();

  for (const weight of local) {
    mergedMap.set(weight.id, weight);
  }

  for (const cloudWeight of cloud) {
    // Cloud data is authoritative
    mergedMap.set(cloudWeight.id, apiToWeight(cloudWeight));
  }

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Merge profiles (cloud wins)
function mergeProfiles(local: UserProfile, cloud: ProfileData | null): UserProfile {
  if (!cloud) return local;

  // For badges, merge both sets
  const localBadges = new Set(local.unlockedBadges || []);
  const cloudBadges = new Set(cloud.unlockedBadges || []);
  const mergedBadges = Array.from(new Set([...localBadges, ...cloudBadges]));

  return {
    ...apiToProfile(cloud),
    unlockedBadges: mergedBadges,
    // Keep local customAvatarUri if cloud doesn't have one (local file reference)
    customAvatarUri: cloud.customAvatarUri ?? local.customAvatarUri,
  };
}

// Full sync - uploads local data and merges with cloud
export async function performFullSync(): Promise<{
  success: boolean;
  error?: string;
  data?: SyncResponse["data"];
}> {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get all local data
    const [localFasts, localProfile, localWeights] = await Promise.all([
      getFasts(),
      getProfile(),
      getWeights(),
    ]);

    // Get water data from storage
    const waterData = await AsyncStorage.getItem("water");
    const localWater: Array<{ date: string; cups: number }> = waterData
      ? JSON.parse(waterData)
      : [];

    // Sync to cloud
    const response = await syncData({
      fasts: localFasts.map(fastToApi),
      profile: profileToApi(localProfile),
      weights: localWeights.map(weightToApi),
      water: localWater,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    if (!response.data) {
      return { success: false, error: "No data returned from sync" };
    }

    const cloudData = response.data.data;

    // Merge and save data locally
    const mergedFasts = mergeFasts(localFasts, cloudData.fasts);
    const mergedWeights = mergeWeights(localWeights, cloudData.weights);
    const mergedProfile = mergeProfiles(localProfile, cloudData.profile);

    // Save merged data back to local storage
    await AsyncStorage.setItem("fasts", JSON.stringify(mergedFasts));
    await saveProfile(mergedProfile);

    // Save weights individually won't work well, let's save the array directly
    await AsyncStorage.setItem("weights", JSON.stringify(mergedWeights));

    // Update last sync time
    await setLastSyncTime(Date.now());

    return {
      success: true,
      data: {
        fasts: cloudData.fasts,
        weights: cloudData.weights,
        profile: cloudData.profile,
        water: cloudData.water,
      },
    };
  } catch (error) {
    console.error("Sync error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
}

// Sync a single fast to cloud
export async function syncFastToCloud(fast: Fast): Promise<boolean> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { saveFastToCloud } = await import("./api");
    const response = await saveFastToCloud(fastToApi(fast));
    return !response.error;
  } catch {
    return false;
  }
}

// Delete a fast from cloud
export async function deleteFastFromCloud(id: string): Promise<boolean> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { deleteFastFromCloud: deleteApi } = await import("./api");
    const response = await deleteApi(id);
    return !response.error;
  } catch {
    return false;
  }
}

// Sync profile to cloud
export async function syncProfileToCloud(profile: UserProfile): Promise<boolean> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { updateProfile } = await import("./api");
    const response = await updateProfile(profileToApi(profile));
    return !response.error;
  } catch {
    return false;
  }
}

// Sync weight to cloud
export async function syncWeightToCloud(weight: WeightEntry): Promise<boolean> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { saveWeightToCloud } = await import("./api");
    const response = await saveWeightToCloud(weightToApi(weight));
    return !response.error;
  } catch {
    return false;
  }
}
