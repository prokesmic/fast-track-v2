import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "../lib/api";
import { useAuth } from "@/context/AuthContext";

export type InsightType = "recommendation" | "motivation" | "pattern" | "optimization";

interface InsightResponse {
  insight: string;
  type: InsightType;
  cached: boolean;
  validUntil: string;
}

interface AIInsight {
  content: string;
  type: InsightType;
  validUntil: Date;
}

interface UseAIInsightsResult {
  insight: AIInsight | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CACHE_KEY_PREFIX = "ai_insight_";

// Get cache key for a specific insight type
function getCacheKey(type: InsightType): string {
  return `${CACHE_KEY_PREFIX}${type}`;
}

// Get cached insight from local storage
async function getCachedInsight(type: InsightType): Promise<AIInsight | null> {
  try {
    const cached = await AsyncStorage.getItem(getCacheKey(type));
    if (!cached) return null;

    const parsed = JSON.parse(cached) as AIInsight;
    const validUntil = new Date(parsed.validUntil);

    // Check if still valid
    if (validUntil > new Date()) {
      return {
        ...parsed,
        validUntil,
      };
    }

    // Cache expired, remove it
    await AsyncStorage.removeItem(getCacheKey(type));
    return null;
  } catch {
    return null;
  }
}

// Save insight to local cache
async function cacheInsight(insight: AIInsight): Promise<void> {
  try {
    await AsyncStorage.setItem(
      getCacheKey(insight.type),
      JSON.stringify(insight)
    );
  } catch (error) {
    console.error("Failed to cache insight:", error);
  }
}

export function useAIInsight(type: InsightType): UseAIInsightsResult {
  const { isAuthenticated } = useAuth();
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(async () => {
    // First check local cache
    const cached = await getCachedInsight(type);
    if (cached) {
      setInsight(cached);
      setIsLoading(false);
      return;
    }

    // If not authenticated, use a fallback
    if (!isAuthenticated) {
      setInsight({
        content: getFallbackInsight(type),
        type,
        validUntil: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });
      setIsLoading(false);
      return;
    }

    // Fetch from API
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<InsightResponse>(
        `/api/ai/insights?type=${type}`,
        { method: "GET" }
      );

      if (response.error) {
        setError(response.error);
        // Use fallback on error
        setInsight({
          content: getFallbackInsight(type),
          type,
          validUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 min fallback
        });
      } else if (response.data) {
        const newInsight: AIInsight = {
          content: response.data.insight,
          type: response.data.type,
          validUntil: new Date(response.data.validUntil),
        };
        setInsight(newInsight);
        // Cache locally
        await cacheInsight(newInsight);
      }
    } catch (err) {
      setError("Failed to fetch insight");
      setInsight({
        content: getFallbackInsight(type),
        type,
        validUntil: new Date(Date.now() + 30 * 60 * 1000),
      });
    } finally {
      setIsLoading(false);
    }
  }, [type, isAuthenticated]);

  // Fetch on mount and when type changes
  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  const refresh = useCallback(async () => {
    // Clear local cache and refetch
    await AsyncStorage.removeItem(getCacheKey(type));
    await fetchInsight();
  }, [type, fetchInsight]);

  return {
    insight,
    isLoading,
    error,
    refresh,
  };
}

// Hook to get multiple insights
export function useMultipleAIInsights(types: InsightType[]): {
  insights: Record<InsightType, AIInsight | null>;
  isLoading: boolean;
  refreshAll: () => Promise<void>;
} {
  const [insights, setInsights] = useState<Record<InsightType, AIInsight | null>>(
    {} as Record<InsightType, AIInsight | null>
  );
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const results: Record<InsightType, AIInsight | null> = {} as any;

    for (const type of types) {
      // Check cache first
      const cached = await getCachedInsight(type);
      if (cached) {
        results[type] = cached;
        continue;
      }

      if (!isAuthenticated) {
        results[type] = {
          content: getFallbackInsight(type),
          type,
          validUntil: new Date(Date.now() + 60 * 60 * 1000),
        };
        continue;
      }

      try {
        const response = await apiRequest<InsightResponse>(
          `/api/ai/insights?type=${type}`,
          { method: "GET" }
        );

        if (response.data) {
          const newInsight: AIInsight = {
            content: response.data.insight,
            type: response.data.type,
            validUntil: new Date(response.data.validUntil),
          };
          results[type] = newInsight;
          await cacheInsight(newInsight);
        } else {
          results[type] = {
            content: getFallbackInsight(type),
            type,
            validUntil: new Date(Date.now() + 30 * 60 * 1000),
          };
        }
      } catch {
        results[type] = {
          content: getFallbackInsight(type),
          type,
          validUntil: new Date(Date.now() + 30 * 60 * 1000),
        };
      }
    }

    setInsights(results);
    setIsLoading(false);
  }, [types, isAuthenticated]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refreshAll = useCallback(async () => {
    for (const type of types) {
      await AsyncStorage.removeItem(getCacheKey(type));
    }
    await fetchAll();
  }, [types, fetchAll]);

  return { insights, isLoading, refreshAll };
}

// Fallback insights when API is unavailable
function getFallbackInsight(type: InsightType): string {
  switch (type) {
    case "recommendation":
      return "Based on your fasting journey, the 16:8 method is a great foundation. It balances effectiveness with sustainability for lasting results.";
    case "motivation":
      return "Every fast you complete strengthens your metabolic flexibility. You're building habits that will serve you for life. Keep going!";
    case "pattern":
      return "Tracking your fasts helps identify your optimal fasting windows. Consistency is more important than perfection.";
    case "optimization":
      return "Stay hydrated, prioritize sleep, and break your fast with protein-rich foods. These habits maximize your fasting benefits.";
    default:
      return "Keep up your fasting journey! Consistency leads to lasting results.";
  }
}
