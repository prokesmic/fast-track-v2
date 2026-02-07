import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { GlassCard } from "../GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useAIInsight } from "@/hooks/useAIInsights";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface PersonalizedRecommendationProps {
  onStartFast?: (planId: string) => void;
}

export function PersonalizedRecommendation({ onStartFast }: PersonalizedRecommendationProps) {
  const { theme, isDark } = useTheme();
  const { insight, isLoading, refresh } = useAIInsight("recommendation");

  return (
    <GlassCard style={styles.container}>
      {/* Decorative gradient accent */}
      <View
        style={[
          styles.accentBar,
          {
            backgroundColor: theme.primary,
          },
        ]}
      />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="compass" size={20} color={theme.primary} />
          </View>
          <View>
            <ThemedText style={styles.title}>For You</ThemedText>
            <View style={styles.aiBadge}>
              <Feather name="cpu" size={10} color={theme.primary} />
              <ThemedText style={[styles.aiLabel, { color: theme.primary }]}>
                AI Recommendation
              </ThemedText>
            </View>
          </View>
        </View>

        {!isLoading && (
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
            <ActivityIndicator size="small" color={theme.primary} />
            <ThemedText style={styles.loadingText}>
              Analyzing your fasting patterns...
            </ThemedText>
          </View>
        ) : insight ? (
          <>
            <ThemedText style={styles.recommendationText}>
              {insight.content}
            </ThemedText>

            {onStartFast && (
              <TouchableOpacity
                style={[
                  styles.startButton,
                  { backgroundColor: theme.primary },
                  Shadows.coloredLg(theme.primary),
                ]}
                onPress={() => onStartFast("16-8")}
              >
                <Feather name="play" size={16} color="#FFFFFF" />
                <ThemedText style={styles.startButtonText}>
                  Start Recommended Fast
                </ThemedText>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <ThemedText style={[styles.recommendationText, { opacity: 0.6 }]}>
            Complete a few fasts to receive personalized recommendations.
          </ThemedText>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    gap: Spacing.md,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    fontSize: 13,
    opacity: 0.6,
  },
  recommendationText: {
    fontSize: 15,
    lineHeight: 24,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
