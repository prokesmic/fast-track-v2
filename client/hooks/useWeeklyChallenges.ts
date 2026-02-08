/**
 * React hook for weekly challenges
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/auth";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

export interface WeeklyChallenge {
  id: string;
  weekNumber: number;
  year: number;
  name: string;
  description: string | null;
  type: "complete_fasts" | "total_hours" | "longest_fast" | "streak";
  targetValue: number;
  startDate: string;
  endDate: string;
  rewardBadgeId: string | null;
  participantCount: number;
  isJoined: boolean;
  userProgress: number;
  completed: boolean;
  daysLeft: number;
  hoursLeft: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  username: string | null;
  avatarId: number;
  progress: number;
  completed: boolean;
}

export function useWeeklyChallenges() {
  const { isAuthenticated } = useAuth();
  const [currentChallenge, setCurrentChallenge] = useState<WeeklyChallenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentChallenge = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/weekly-challenges?action=current`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch challenge");

      const result = await response.json();
      setCurrentChallenge(result.challenge);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchLeaderboard = useCallback(async (challengeId: string) => {
    const token = await getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/weekly-challenges?action=leaderboard&challengeId=${challengeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch leaderboard");

      const result = await response.json();
      setLeaderboard(result.leaderboard);
    } catch (e) {
      console.error("Leaderboard error:", e);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentChallenge();
    }
  }, [fetchCurrentChallenge, isAuthenticated]);

  useEffect(() => {
    if (currentChallenge?.id) {
      fetchLeaderboard(currentChallenge.id);
    }
  }, [currentChallenge?.id, fetchLeaderboard]);

  const joinChallenge = useCallback(async () => {
    if (!currentChallenge) return { success: false, error: "No challenge" };

    const token = await getToken();
    if (!token) return { success: false, error: "Not authenticated" };

    setIsJoining(true);
    try {
      const response = await fetch(`${API_BASE}/api/weekly-challenges`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "join",
          challengeId: currentChallenge.id,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        return { success: false, error: result.error };
      }

      await fetchCurrentChallenge();
      return { success: true };
    } catch (e) {
      return { success: false, error: "Failed to join challenge" };
    } finally {
      setIsJoining(false);
    }
  }, [currentChallenge, fetchCurrentChallenge]);

  const leaveChallenge = useCallback(async () => {
    if (!currentChallenge) return { success: false, error: "No challenge" };

    const token = await getToken();
    if (!token) return { success: false, error: "Not authenticated" };

    try {
      const response = await fetch(`${API_BASE}/api/weekly-challenges`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challengeId: currentChallenge.id,
        }),
      });

      if (!response.ok) return { success: false };

      await fetchCurrentChallenge();
      return { success: true };
    } catch (e) {
      return { success: false, error: "Failed to leave challenge" };
    }
  }, [currentChallenge, fetchCurrentChallenge]);

  return {
    currentChallenge,
    leaderboard,
    isLoading,
    isJoining,
    error,
    refresh: fetchCurrentChallenge,
    joinChallenge,
    leaveChallenge,
    fetchLeaderboard,
  };
}
