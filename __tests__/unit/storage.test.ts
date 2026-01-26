import AsyncStorageMock from "../mocks/asyncStorage";

// Ensure the mock is properly reset before importing storage
beforeAll(() => {
  AsyncStorageMock.__resetStore();
});
import {
  getFasts,
  saveFast,
  deleteFast,
  updateFastInStorage,
  getActiveFast,
  setActiveFast,
  getProfile,
  saveProfile,
  getWeights,
  saveWeight,
  getWaterForDate,
  saveWaterForDate,
  calculateStreak,
  calculateLongestStreak,
  calculateTotalHours,
  clearAllData,
  generateId,
  Fast,
  UserProfile,
  WeightEntry,
} from "../../client/lib/storage";

describe("Storage utilities", () => {
  beforeEach(() => {
    AsyncStorageMock.__resetStore();
  });

  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("should generate string IDs", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe("Fasts storage", () => {
    const mockFast: Fast = {
      id: "test-fast-1",
      startTime: Date.now() - 1000 * 60 * 60 * 16,
      endTime: Date.now(),
      targetDuration: 16,
      planId: "16-8",
      planName: "16:8 Intermittent",
      completed: true,
    };

    it("should return empty array when no fasts exist", async () => {
      const fasts = await getFasts();
      expect(fasts).toEqual([]);
    });

    it("should save and retrieve a fast", async () => {
      await saveFast(mockFast);
      const fasts = await getFasts();
      expect(fasts).toHaveLength(1);
      expect(fasts[0]).toEqual(mockFast);
    });

    it("should update existing fast instead of duplicating", async () => {
      await saveFast(mockFast);
      const updatedFast = { ...mockFast, note: "Updated note" };
      await saveFast(updatedFast);

      const fasts = await getFasts();
      expect(fasts).toHaveLength(1);
      expect(fasts[0].note).toBe("Updated note");
    });

    it("should prepend new fasts to the beginning", async () => {
      await saveFast(mockFast);
      const secondFast = { ...mockFast, id: "test-fast-2" };
      await saveFast(secondFast);

      const fasts = await getFasts();
      expect(fasts).toHaveLength(2);
      expect(fasts[0].id).toBe("test-fast-2");
    });

    it("should delete a fast", async () => {
      await saveFast(mockFast);
      await deleteFast(mockFast.id);

      const fasts = await getFasts();
      expect(fasts).toHaveLength(0);
    });

    it("should update fast in storage", async () => {
      await saveFast(mockFast);
      const updated = await updateFastInStorage(mockFast.id, {
        note: "Test note",
      });

      expect(updated?.note).toBe("Test note");

      const fasts = await getFasts();
      expect(fasts[0].note).toBe("Test note");
    });

    it("should return null when updating non-existent fast", async () => {
      const result = await updateFastInStorage("non-existent", {
        note: "Test",
      });
      expect(result).toBeNull();
    });
  });

  describe("Active fast", () => {
    const mockFast: Fast = {
      id: "active-fast",
      startTime: Date.now(),
      targetDuration: 16,
      planId: "16-8",
      planName: "16:8 Intermittent",
      completed: false,
    };

    it("should return null when no active fast", async () => {
      const active = await getActiveFast();
      expect(active).toBeNull();
    });

    it("should set and get active fast", async () => {
      await setActiveFast(mockFast);
      const active = await getActiveFast();
      expect(active).toEqual(mockFast);
    });

    it("should clear active fast when set to null", async () => {
      await setActiveFast(mockFast);
      await setActiveFast(null);
      const active = await getActiveFast();
      expect(active).toBeNull();
    });
  });

  describe("Profile storage", () => {
    const defaultProfile: UserProfile = {
      displayName: "",
      avatarId: 0,
      weightUnit: "lbs",
      notificationsEnabled: false,
      unlockedBadges: [],
    };

    it("should return default profile when none exists", async () => {
      const profile = await getProfile();
      expect(profile).toEqual(defaultProfile);
    });

    it("should save and retrieve profile", async () => {
      const customProfile: UserProfile = {
        displayName: "John",
        avatarId: 5,
        weightUnit: "kg",
        notificationsEnabled: true,
        unlockedBadges: ["streak_3", "fasts_1"],
      };

      await saveProfile(customProfile);
      const profile = await getProfile();
      expect(profile).toEqual(customProfile);
    });
  });

  describe("Weight storage", () => {
    it("should return empty array when no weights exist", async () => {
      const weights = await getWeights();
      expect(weights).toEqual([]);
    });

    it("should save and retrieve weights", async () => {
      const entry: WeightEntry = {
        id: "weight-1",
        date: "2024-01-15",
        weight: 175.5,
      };

      await saveWeight(entry);
      const weights = await getWeights();
      expect(weights).toHaveLength(1);
      expect(weights[0]).toEqual(entry);
    });

    it("should prepend new weights", async () => {
      const entry1: WeightEntry = { id: "w1", date: "2024-01-15", weight: 175 };
      const entry2: WeightEntry = { id: "w2", date: "2024-01-16", weight: 174 };

      await saveWeight(entry1);
      await saveWeight(entry2);

      const weights = await getWeights();
      expect(weights[0].id).toBe("w2");
    });
  });

  describe("Water storage", () => {
    it("should return 0 when no water entry exists", async () => {
      const cups = await getWaterForDate("2024-01-15");
      expect(cups).toBe(0);
    });

    it("should save and retrieve water intake", async () => {
      await saveWaterForDate("2024-01-15", 8);
      const cups = await getWaterForDate("2024-01-15");
      expect(cups).toBe(8);
    });

    it("should update existing water entry", async () => {
      await saveWaterForDate("2024-01-15", 4);
      await saveWaterForDate("2024-01-15", 8);

      const cups = await getWaterForDate("2024-01-15");
      expect(cups).toBe(8);
    });
  });

  describe("clearAllData", () => {
    it("should clear all storage data", async () => {
      await saveFast({
        id: "test",
        startTime: Date.now(),
        targetDuration: 16,
        planId: "16-8",
        planName: "Test",
        completed: false,
      });
      await saveProfile({
        displayName: "Test",
        avatarId: 1,
        weightUnit: "kg",
        notificationsEnabled: true,
        unlockedBadges: [],
      });

      await clearAllData();

      const fasts = await getFasts();
      const profile = await getProfile();
      expect(fasts).toEqual([]);
      expect(profile.displayName).toBe("");
    });
  });
});

describe("Streak calculations", () => {
  const createFast = (daysAgo: number, completed = true): Fast => {
    // Use a fixed time of day to ensure consistency
    const endTime = new Date();
    endTime.setDate(endTime.getDate() - daysAgo);
    // Set to 23:59 to ensure the fast is counted for that day
    endTime.setHours(23, 59, 0, 0);

    return {
      id: `fast-${daysAgo}`,
      startTime: endTime.getTime() - 1000 * 60 * 60 * 16,
      endTime: endTime.getTime(),
      targetDuration: 16,
      planId: "16-8",
      planName: "Test",
      completed,
    };
  };

  describe("calculateStreak", () => {
    it("should return 0 for empty fasts", () => {
      expect(calculateStreak([])).toBe(0);
    });

    it("should return 0 for incomplete fasts only", () => {
      const fasts = [createFast(0, false), createFast(1, false)];
      expect(calculateStreak(fasts)).toBe(0);
    });

    it("should calculate streak for consecutive days", () => {
      // Create fasts for yesterday and day before (skip today since it may not have ended)
      const fasts = [createFast(1), createFast(2), createFast(3)];
      // Streak starts from yesterday (day 1) and goes back
      expect(calculateStreak(fasts)).toBeGreaterThanOrEqual(2);
    });

    it("should break streak on missing day", () => {
      // Days 1, 2 have fasts, but day 0 (today) doesn't - streak should be 2
      const fasts = [createFast(1), createFast(2), createFast(4)];
      // Streak should be 2 (days 1 and 2), broken by gap before day 4
      expect(calculateStreak(fasts)).toBe(2);
    });
  });

  describe("calculateLongestStreak", () => {
    it("should return 0 for empty fasts", () => {
      expect(calculateLongestStreak([])).toBe(0);
    });

    it("should find longest streak in history", () => {
      const fasts = [
        createFast(0),
        createFast(1),
        // gap
        createFast(5),
        createFast(6),
        createFast(7),
        createFast(8),
      ];
      expect(calculateLongestStreak(fasts)).toBe(4);
    });
  });

  describe("calculateTotalHours", () => {
    it("should return 0 for empty fasts", () => {
      expect(calculateTotalHours([])).toBe(0);
    });

    it("should sum hours of completed fasts", () => {
      const fasts = [
        {
          id: "1",
          startTime: 0,
          endTime: 1000 * 60 * 60 * 16, // 16 hours
          targetDuration: 16,
          planId: "16-8",
          planName: "Test",
          completed: true,
        },
        {
          id: "2",
          startTime: 0,
          endTime: 1000 * 60 * 60 * 8, // 8 hours
          targetDuration: 8,
          planId: "8-16",
          planName: "Test",
          completed: true,
        },
      ];
      expect(calculateTotalHours(fasts)).toBe(24);
    });

    it("should ignore incomplete fasts", () => {
      const fasts = [
        {
          id: "1",
          startTime: 0,
          endTime: 1000 * 60 * 60 * 16,
          targetDuration: 16,
          planId: "16-8",
          planName: "Test",
          completed: false,
        },
      ];
      expect(calculateTotalHours(fasts)).toBe(0);
    });
  });
});
