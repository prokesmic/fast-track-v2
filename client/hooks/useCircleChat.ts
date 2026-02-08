/**
 * React hook for circle chat messages
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/auth";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

export interface ChatMessage {
  id: string;
  circleId: string;
  userId: string;
  type: "text" | "system" | "achievement" | "fast_completed";
  content: string | null;
  metadata: string | null;
  createdAt: string;
  displayName: string;
  avatarId: number;
  customAvatarUri: string | null;
  username: string | null;
  isOwn: boolean;
}

export function useCircleChat(circleId: string | undefined) {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Polling interval ref
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(
    async (before?: string) => {
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
        let url = `${API_BASE}/api/circle-messages?circleId=${circleId}`;
        if (before) {
          url += `&before=${encodeURIComponent(before)}`;
        }

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch messages");

        const result = await response.json();

        if (before) {
          // Loading older messages
          setMessages((prev) => [...result.messages, ...prev]);
        } else {
          // Initial load or refresh
          setMessages(result.messages);
        }

        setHasMore(result.hasMore);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    [circleId, isAuthenticated]
  );

  // Initial load
  useEffect(() => {
    if (isAuthenticated && circleId) {
      fetchMessages();
    }
  }, [fetchMessages, isAuthenticated, circleId]);

  // Polling for new messages
  useEffect(() => {
    if (!isAuthenticated || !circleId) return;

    // Poll every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchMessages, isAuthenticated, circleId]);

  const sendMessage = useCallback(
    async (content: string, type: string = "text", metadata?: object) => {
      if (!circleId || !content.trim()) {
        return { success: false, error: "Invalid message" };
      }

      const token = await getToken();
      if (!token) return { success: false, error: "Not authenticated" };

      setIsSending(true);
      try {
        const response = await fetch(`${API_BASE}/api/circle-messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            circleId,
            content: content.trim(),
            type,
            metadata,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { success: false, error: result.error };
        }

        // Add the new message to the list
        setMessages((prev) => [...prev, result.message]);
        return { success: true, message: result.message };
      } catch (e) {
        return { success: false, error: "Failed to send message" };
      } finally {
        setIsSending(false);
      }
    },
    [circleId]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!circleId) return { success: false };

      const token = await getToken();
      if (!token) return { success: false, error: "Not authenticated" };

      try {
        const response = await fetch(`${API_BASE}/api/circle-messages`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messageId, circleId }),
        });

        if (!response.ok) return { success: false };

        // Remove from local state
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        return { success: true };
      } catch (e) {
        return { success: false, error: "Failed to delete message" };
      }
    },
    [circleId]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || messages.length === 0) return;

    const oldestMessage = messages[0];
    if (oldestMessage?.createdAt) {
      fetchMessages(oldestMessage.createdAt);
    }
  }, [hasMore, messages, fetchMessages]);

  return {
    messages,
    isLoading,
    isSending,
    hasMore,
    error,
    refresh: () => fetchMessages(),
    sendMessage,
    deleteMessage,
    loadMore,
  };
}
