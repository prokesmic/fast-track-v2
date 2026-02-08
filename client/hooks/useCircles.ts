/**
 * React hook for fasting circles
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/auth";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

export interface CircleMember {
  id: string;
  userId: string;
  role: "admin" | "member";
  joinedAt: string;
  displayName: string;
  avatarId: number;
  customAvatarUri: string | null;
  username: string | null;
}

export interface CircleMessage {
  id: string;
  circleId: string;
  userId: string;
  type: "text" | "system" | "achievement" | "fast_completed";
  content: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface FastingCircle {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  inviteCode: string;
  maxMembers: number;
  isPrivate: boolean;
  createdAt: string;
  memberCount: number;
  userRole: "admin" | "member";
  lastMessage: CircleMessage | null;
}

export interface CircleDetail extends FastingCircle {
  members: CircleMember[];
}

export function useCircles() {
  const { isAuthenticated } = useAuth();
  const [circles, setCircles] = useState<FastingCircle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCircles = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/circles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch circles");

      const result = await response.json();
      setCircles(result.circles);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCircles();
    }
  }, [fetchCircles, isAuthenticated]);

  const createCircle = useCallback(
    async (data: {
      name: string;
      description?: string;
      maxMembers?: number;
      isPrivate?: boolean;
    }) => {
      const token = await getToken();
      if (!token) return { success: false, error: "Not authenticated" };

      try {
        const response = await fetch(`${API_BASE}/api/circles`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "create", ...data }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { success: false, error: result.error };
        }

        await fetchCircles();
        return { success: true, circle: result.circle };
      } catch (e) {
        return { success: false, error: "Failed to create circle" };
      }
    },
    [fetchCircles]
  );

  const joinCircle = useCallback(
    async (inviteCode: string) => {
      const token = await getToken();
      if (!token) return { success: false, error: "Not authenticated" };

      try {
        const response = await fetch(`${API_BASE}/api/circles`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "join", inviteCode }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { success: false, error: result.error };
        }

        await fetchCircles();
        return { success: true, circleId: result.circleId };
      } catch (e) {
        return { success: false, error: "Failed to join circle" };
      }
    },
    [fetchCircles]
  );

  const leaveCircle = useCallback(
    async (circleId: string) => {
      const token = await getToken();
      if (!token) return { success: false, error: "Not authenticated" };

      try {
        const response = await fetch(`${API_BASE}/api/circles`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "leave", circleId }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { success: false, error: result.error };
        }

        await fetchCircles();
        return { success: true };
      } catch (e) {
        return { success: false, error: "Failed to leave circle" };
      }
    },
    [fetchCircles]
  );

  const lookupCircle = useCallback(async (inviteCode: string) => {
    const token = await getToken();
    if (!token) return { success: false, error: "Not authenticated" };

    try {
      const response = await fetch(
        `${API_BASE}/api/circles?action=lookup&code=${inviteCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error };
      }

      return { success: true, circle: result.circle };
    } catch (e) {
      return { success: false, error: "Failed to lookup circle" };
    }
  }, []);

  return {
    circles,
    isLoading,
    error,
    refresh: fetchCircles,
    createCircle,
    joinCircle,
    leaveCircle,
    lookupCircle,
  };
}

export function useCircleDetail(circleId: string | undefined) {
  const { isAuthenticated } = useAuth();
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!circleId) {
      setIsLoading(false);
      return;
    }

    const token = await getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/circles?action=detail&circleId=${circleId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch circle");

      const result = await response.json();
      setCircle({ ...result.circle, members: result.members });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [circleId, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && circleId) {
      fetchDetail();
    }
  }, [fetchDetail, isAuthenticated, circleId]);

  return {
    circle,
    isLoading,
    error,
    refresh: fetchDetail,
  };
}
