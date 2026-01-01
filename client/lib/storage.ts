import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Fast {
  id: string;
  startTime: number;
  endTime?: number;
  targetDuration: number;
  planId: string;
  planName: string;
  completed: boolean;
  note?: string;
}

export interface UserProfile {
  displayName: string;
  avatarId: number;
  weightUnit: "lbs" | "kg";
  notificationsEnabled: boolean;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

export interface WaterEntry {
  date: string;
  cups: number;
}

const KEYS = {
  FASTS: "fasts",
  ACTIVE_FAST: "activeFast",
  PROFILE: "profile",
  WEIGHTS: "weights",
  WATER: "water",
};

export async function getFasts(): Promise<Fast[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FASTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveFast(fast: Fast): Promise<void> {
  const fasts = await getFasts();
  const existingIndex = fasts.findIndex((f) => f.id === fast.id);
  if (existingIndex >= 0) {
    fasts[existingIndex] = fast;
  } else {
    fasts.unshift(fast);
  }
  await AsyncStorage.setItem(KEYS.FASTS, JSON.stringify(fasts));
}

export async function deleteFast(id: string): Promise<void> {
  const fasts = await getFasts();
  const filtered = fasts.filter((f) => f.id !== id);
  await AsyncStorage.setItem(KEYS.FASTS, JSON.stringify(filtered));
}

export async function getActiveFast(): Promise<Fast | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.ACTIVE_FAST);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setActiveFast(fast: Fast | null): Promise<void> {
  if (fast) {
    await AsyncStorage.setItem(KEYS.ACTIVE_FAST, JSON.stringify(fast));
  } else {
    await AsyncStorage.removeItem(KEYS.ACTIVE_FAST);
  }
}

export async function getProfile(): Promise<UserProfile> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PROFILE);
    return data
      ? JSON.parse(data)
      : {
          displayName: "",
          avatarId: 0,
          weightUnit: "lbs",
          notificationsEnabled: false,
        };
  } catch {
    return {
      displayName: "",
      avatarId: 0,
      weightUnit: "lbs",
      notificationsEnabled: false,
    };
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export async function getWeights(): Promise<WeightEntry[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.WEIGHTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveWeight(entry: WeightEntry): Promise<void> {
  const weights = await getWeights();
  weights.unshift(entry);
  await AsyncStorage.setItem(KEYS.WEIGHTS, JSON.stringify(weights));
}

export async function getWaterForDate(date: string): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(KEYS.WATER);
    const entries: WaterEntry[] = data ? JSON.parse(data) : [];
    const entry = entries.find((e) => e.date === date);
    return entry?.cups || 0;
  } catch {
    return 0;
  }
}

export async function saveWaterForDate(date: string, cups: number): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.WATER);
  const entries: WaterEntry[] = data ? JSON.parse(data) : [];
  const existingIndex = entries.findIndex((e) => e.date === date);
  if (existingIndex >= 0) {
    entries[existingIndex].cups = cups;
  } else {
    entries.push({ date, cups });
  }
  await AsyncStorage.setItem(KEYS.WATER, JSON.stringify(entries));
}

export function calculateStreak(fasts: Fast[]): number {
  const completedFasts = fasts
    .filter((f) => f.completed && f.endTime)
    .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

  if (completedFasts.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    const hasFastOnDay = completedFasts.some((f) => {
      const fastDate = new Date(f.endTime || 0).toISOString().split("T")[0];
      return fastDate === dateStr;
    });

    if (hasFastOnDay) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

export function calculateLongestStreak(fasts: Fast[]): number {
  const completedFasts = fasts
    .filter((f) => f.completed && f.endTime)
    .sort((a, b) => (a.endTime || 0) - (b.endTime || 0));

  if (completedFasts.length === 0) return 0;

  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate: string | null = null;

  for (const fast of completedFasts) {
    const fastDate = new Date(fast.endTime || 0).toISOString().split("T")[0];

    if (lastDate === null) {
      currentStreak = 1;
    } else {
      const lastDateObj = new Date(lastDate);
      const currentDateObj = new Date(fastDate);
      const diffDays = Math.floor(
        (currentDateObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        // Same day, don't count again
      } else if (diffDays === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak);
    lastDate = fastDate;
  }

  return longestStreak;
}

export function calculateTotalHours(fasts: Fast[]): number {
  return fasts
    .filter((f) => f.completed && f.endTime)
    .reduce((total, fast) => {
      const duration = ((fast.endTime || 0) - fast.startTime) / (1000 * 60 * 60);
      return total + duration;
    }, 0);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
