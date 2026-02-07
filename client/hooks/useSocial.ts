/**
 * React hooks for social features
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/auth";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

interface Friend {
  id: string;
  friendId: string;
  status: string;
  isRequester: boolean;
  displayName: string;
  avatarId: number;
  customAvatarUri?: string;
  username?: string;
  createdAt: string;
}

interface FriendsData {
  friends: Friend[];
  pendingReceived: Friend[];
  pendingSent: Friend[];
}

interface Challenge {
  id: string;
  creatorId: string;
  name: string;
  description?: string;
  type: string;
  targetValue: number;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  inviteCode?: string;
  participantCount: number;
  isJoined: boolean;
  userProgress: number;
  userRank?: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  username?: string;
  avatarId: number;
  value: number;
  isCurrentUser: boolean;
}

interface FeedPost {
  id: string;
  userId: string;
  type: string;
  content?: string;
  metadata?: Record<string, any>;
  visibility: string;
  likesCount: number;
  createdAt: string;
  displayName: string;
  avatarId: number;
  customAvatarUri?: string;
  username?: string;
  isLiked: boolean;
  isOwn: boolean;
}

interface SocialProfile {
  userId: string;
  username?: string;
  bio?: string;
  isPublic: boolean;
  showOnLeaderboard: boolean;
}

// Friends hook
export function useFriends() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<FriendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/social?route=friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch friends");

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendRequest = useCallback(
    async (username: string) => {
      const token = await getToken();
      if (!token) return { success: false, error: "Not authenticated" };

      try {
        const response = await fetch(`${API_BASE}/api/social?route=friends`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { success: false, error: result.error };
        }

        await fetchFriends();
        return { success: true };
      } catch (e) {
        return { success: false, error: "Failed to send request" };
      }
    },
    [fetchFriends]
  );

  const respondToRequest = useCallback(
    async (friendshipId: string, action: "accept" | "reject") => {
      const token = await getToken();
      if (!token) return { success: false };

      try {
        const response = await fetch(`${API_BASE}/api/social?route=friends`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendshipId, action }),
        });

        if (!response.ok) return { success: false };

        await fetchFriends();
        return { success: true };
      } catch {
        return { success: false };
      }
    },
    [fetchFriends]
  );

  const removeFriend = useCallback(
    async (friendshipId: string) => {
      const token = await getToken();
      if (!token) return { success: false };

      try {
        const response = await fetch(`${API_BASE}/api/social?route=friends`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ friendshipId }),
        });

        if (!response.ok) return { success: false };

        await fetchFriends();
        return { success: true };
      } catch {
        return { success: false };
      }
    },
    [fetchFriends]
  );

  return {
    friends: data?.friends || [],
    pendingReceived: data?.pendingReceived || [],
    pendingSent: data?.pendingSent || [],
    isLoading,
    error,
    refresh: fetchFriends,
    sendRequest,
    respondToRequest,
    removeFriend,
  };
}

// Challenges hook
export function useChallenges(type: "mine" | "public" | "active" = "active") {
  const { isAuthenticated } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/social?route=challenges?type=${type}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch challenges");

      const result = await response.json();
      setChallenges(result.challenges);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, type]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const createChallenge = useCallback(
    async (challengeData: {
      name: string;
      description?: string;
      type: string;
      targetValue: number;
      startDate: string;
      endDate: string;
      isPublic?: boolean;
    }) => {
      const token = await getToken();
      if (!token) return { success: false, error: "Not authenticated" };

      try {
        const response = await fetch(`${API_BASE}/api/social?route=challenges`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "create", ...challengeData }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { success: false, error: result.error };
        }

        await fetchChallenges();
        return { success: true, challenge: result };
      } catch (e) {
        return { success: false, error: "Failed to create challenge" };
      }
    },
    [fetchChallenges]
  );

  const joinChallenge = useCallback(
    async (challengeId?: string, inviteCode?: string) => {
      const token = await getToken();
      if (!token) return { success: false };

      try {
        const response = await fetch(`${API_BASE}/api/social?route=challenges`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "join", challengeId, inviteCode }),
        });

        if (!response.ok) {
          const result = await response.json();
          return { success: false, error: result.error };
        }

        await fetchChallenges();
        return { success: true };
      } catch {
        return { success: false, error: "Failed to join challenge" };
      }
    },
    [fetchChallenges]
  );

  const leaveChallenge = useCallback(
    async (challengeId: string) => {
      const token = await getToken();
      if (!token) return { success: false };

      try {
        const response = await fetch(`${API_BASE}/api/social?route=challenges`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ challengeId }),
        });

        if (!response.ok) return { success: false };

        await fetchChallenges();
        return { success: true };
      } catch {
        return { success: false };
      }
    },
    [fetchChallenges]
  );

  return {
    challenges,
    isLoading,
    error,
    refresh: fetchChallenges,
    createChallenge,
    joinChallenge,
    leaveChallenge,
  };
}

// Leaderboard hook
export function useLeaderboard(
  type: "streak" | "hours" | "fasts" = "streak",
  period: "week" | "month" | "all" = "all",
  challengeId?: string
) {
  const { isAuthenticated } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ type, period });
      if (challengeId) params.append("challengeId", challengeId);

      const response = await fetch(
        `${API_BASE}/api/social?route=leaderboard?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch leaderboard");

      const result = await response.json();
      setLeaderboard(result.leaderboard);
      setUserRank(result.userRank || null);
    } catch (e) {
      console.error("Leaderboard error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, type, period, challengeId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    userRank,
    isLoading,
    refresh: fetchLeaderboard,
  };
}

// Feed hook
export function useFeed(type: "all" | "public" | "mine" = "all") {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/social?route=feed?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch feed");

      const result = await response.json();
      setPosts(result.posts);
    } catch (e) {
      console.error("Feed error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, type]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const createPost = useCallback(
    async (postData: {
      type: string;
      content?: string;
      metadata?: Record<string, any>;
      visibility?: string;
    }) => {
      const token = await getToken();
      if (!token) return { success: false };

      try {
        const response = await fetch(`${API_BASE}/api/social?route=feed`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "create", ...postData }),
        });

        if (!response.ok) return { success: false };

        await fetchFeed();
        return { success: true };
      } catch {
        return { success: false };
      }
    },
    [fetchFeed]
  );

  const likePost = useCallback(
    async (postId: string) => {
      const token = await getToken();
      if (!token) return;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: true, likesCount: p.likesCount + 1 }
            : p
        )
      );

      try {
        await fetch(`${API_BASE}/api/social?route=feed`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "like", postId }),
        });
      } catch {
        // Revert on error
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLiked: false, likesCount: p.likesCount - 1 }
              : p
          )
        );
      }
    },
    []
  );

  const unlikePost = useCallback(
    async (postId: string) => {
      const token = await getToken();
      if (!token) return;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: false, likesCount: Math.max(0, p.likesCount - 1) }
            : p
        )
      );

      try {
        await fetch(`${API_BASE}/api/social?route=feed`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "unlike", postId }),
        });
      } catch {
        // Revert on error
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLiked: true, likesCount: p.likesCount + 1 }
              : p
          )
        );
      }
    },
    []
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const token = await getToken();
      if (!token) return { success: false };

      try {
        const response = await fetch(`${API_BASE}/api/social?route=feed`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId }),
        });

        if (!response.ok) return { success: false };

        setPosts((prev) => prev.filter((p) => p.id !== postId));
        return { success: true };
      } catch {
        return { success: false };
      }
    },
    []
  );

  return {
    posts,
    isLoading,
    refresh: fetchFeed,
    createPost,
    likePost,
    unlikePost,
    deletePost,
  };
}

// Social profile hook
export function useSocialProfile() {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/social?route=profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch profile");

      const result = await response.json();
      setProfile(result);
    } catch (e) {
      console.error("Profile error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<SocialProfile>) => {
      const token = await getToken();
      if (!token) return { success: false, error: "Not authenticated" };

      try {
        const response = await fetch(`${API_BASE}/api/social?route=profile`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        const result = await response.json();

        if (!response.ok) {
          return { success: false, error: result.error };
        }

        setProfile(result);
        return { success: true };
      } catch (e) {
        return { success: false, error: "Failed to update profile" };
      }
    },
    []
  );

  const searchUsers = useCallback(
    async (query: string) => {
      const token = await getToken();
      if (!token || query.length < 2) return [];

      try {
        const response = await fetch(
          `${API_BASE}/api/social?route=profile?search=${encodeURIComponent(query)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) return [];

        const result = await response.json();
        return result.users;
      } catch {
        return [];
      }
    },
    []
  );

  return {
    profile,
    isLoading,
    refresh: fetchProfile,
    updateProfile,
    searchUsers,
  };
}
