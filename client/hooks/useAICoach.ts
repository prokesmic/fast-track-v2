/**
 * React hook for AI Coach conversations
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/auth";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

export interface AIMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useAICoach() {
  const { isAuthenticated } = useAuth();
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/ai/coach`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch conversation");

      const result = await response.json();
      setConversation(result.conversation);
      setMessages(result.messages || []);
      setQuickQuestions(result.quickQuestions || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversation();
    }
  }, [fetchConversation, isAuthenticated]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return { success: false, error: "Empty message" };

      const token = await getToken();
      if (!token) return { success: false, error: "Not authenticated" };

      // Optimistically add user message
      const tempUserMessage: AIMessage = {
        id: `temp_${Date.now()}`,
        conversationId: conversation?.id || "",
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      setIsSending(true);
      try {
        const response = await fetch(`${API_BASE}/api/ai/coach`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: content.trim(),
            conversationId: conversation?.id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          // Remove optimistic message
          setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
          return { success: false, error: result.error };
        }

        // Replace temp message with real one and add assistant response
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMessage.id),
          result.userMessage,
          result.assistantMessage,
        ]);

        // Update conversation ID if new
        if (result.conversationId && !conversation?.id) {
          setConversation((prev) =>
            prev ? { ...prev, id: result.conversationId } : null
          );
        }

        return { success: true };
      } catch (e) {
        // Remove optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        return { success: false, error: "Failed to send message" };
      } finally {
        setIsSending(false);
      }
    },
    [conversation?.id]
  );

  const startNewConversation = useCallback(async () => {
    // Clear current conversation and let the API create a new one
    setConversation(null);
    setMessages([]);
    await fetchConversation();
  }, [fetchConversation]);

  return {
    conversation,
    messages,
    quickQuestions,
    isLoading,
    isSending,
    error,
    refresh: fetchConversation,
    sendMessage,
    startNewConversation,
  };
}

export function useConversationHistory() {
  const { isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/ai/coach?action=conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch history");

      const result = await response.json();
      setConversations(result.conversations || []);
    } catch (e) {
      console.error("History error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [fetchHistory, isAuthenticated]);

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      const token = await getToken();
      if (!token) return { success: false };

      try {
        const response = await fetch(`${API_BASE}/api/ai/coach`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ conversationId }),
        });

        if (!response.ok) return { success: false };

        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        return { success: true };
      } catch (e) {
        return { success: false };
      }
    },
    []
  );

  return {
    conversations,
    isLoading,
    refresh: fetchHistory,
    deleteConversation,
  };
}
