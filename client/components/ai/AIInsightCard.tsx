import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { GlassCard } from "../GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useAIInsight, InsightType } from "@/hooks/useAIInsights";
import { Spacing, BorderRadius } from "@/constants/theme";

interface AIInsightCardProps {
  type: InsightType;
  title?: string;
  showRefresh?: boolean;
}

const INSIGHT_CONFIG: Record<InsightType, { icon: keyof typeof Feather.glyphMap; color: string; defaultTitle: string }> = {
  recommendation: {
    icon: "compass",
    color: "#8B5CF6",
    defaultTitle: "Personalized Recommendation",
  },
  motivation: {
    icon: "heart",
    color: "#EF4444",
    defaultTitle: "Daily Motivation",
  },
  pattern: {
    icon: "bar-chart-2",
    color: "#3B82F6",
    defaultTitle: "Your Fasting Patterns",
  },
  optimization: {
    icon: "zap",
    color: "#F59E0B",
    defaultTitle: "Optimization Tips",
  },
};

export function AIInsightCard({ type, title, showRefresh = true }: AIInsightCardProps) {
  const { theme, isDark } = useTheme();
  const { insight, isLoading, error, refresh } = useAIInsight(type);
  const config = INSIGHT_CONFIG[type];

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconContainer, { backgroundColor: config.color + "20" }]}>
            <Feather name={config.icon} size={18} color={config.color} />
          </View>
          <View style={styles.titleContainer}>
            <ThemedText style={styles.title}>
              {title || config.defaultTitle}
            </ThemedText>
            <View style={styles.aiBadge}>
              <Feather name="cpu" size={10} color={theme.primary} />
              <ThemedText style={[styles.aiLabel, { color: theme.primary }]}>
                AI Powered
              </ThemedText>
            </View>
          </View>
        </View>

        {showRefresh && !isLoading && (
          <TouchableOpacity
            onPress={refresh}
            style={[styles.refreshButton, { backgroundColor: isDark ? "#334155" : "#F1F5F9" }]}
          >
            <Feather name="refresh-cw" size={14} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={config.color} />
            <ThemedText style={styles.loadingText}>
              Generating insight...
            </ThemedText>
          </View>
        ) : insight ? (
          <ThemedText style={styles.insightText}>{insight.content}</ThemedText>
        ) : error ? (
          <ThemedText style={[styles.insightText, { opacity: 0.6 }]}>
            Unable to load insight. Tap refresh to try again.
          </ThemedText>
        ) : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    minHeight: 40,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    opacity: 0.6,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
