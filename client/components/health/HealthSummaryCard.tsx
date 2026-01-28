import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { GlassCard } from "../GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useHealth } from "@/hooks/useHealth";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface HealthSummaryCardProps {
  onPress?: () => void;
}

export function HealthSummaryCard({ onPress }: HealthSummaryCardProps) {
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { isAvailable, isEnabled, isLoading, summary, enableHealth } = useHealth();

  // Don't show on web
  if (Platform.OS === "web") {
    return null;
  }

  // Show connect prompt if available but not enabled
  if (isAvailable && !isEnabled && !isLoading) {
    return (
      <Pressable onPress={enableHealth}>
        <GlassCard style={styles.container}>
          <View style={styles.connectPrompt}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + "20" }]}>
              <Feather name="heart" size={24} color={colors.success} />
            </View>
            <View style={styles.connectText}>
              <ThemedText type="bodyMedium" style={{ fontWeight: "600" }}>
                Connect Health Data
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Sync with {Platform.OS === "ios" ? "Apple Health" : "Health Connect"}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </View>
        </GlassCard>
      </Pressable>
    );
  }

  // Don't show if not available or loading
  if (!isEnabled || isLoading || !summary) {
    return null;
  }

  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Feather name="activity" size={18} color={colors.success} />
            <ThemedText type="bodyMedium" style={{ fontWeight: "600" }}>
              Today's Health
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textSecondary} />
        </View>

        <View style={styles.statsGrid}>
          {/* Steps */}
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="navigation" size={16} color={colors.primary} />
            </View>
            <ThemedText type="h4" style={{ color: colors.primary }}>
              {summary.steps?.toLocaleString() || "—"}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              steps
            </ThemedText>
          </View>

          {/* Sleep */}
          {summary.sleepHours !== undefined && (
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.secondary + "15" }]}>
                <Feather name="moon" size={16} color={colors.secondary} />
              </View>
              <ThemedText type="h4" style={{ color: colors.secondary }}>
                {summary.sleepHours.toFixed(1)}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                hrs sleep
              </ThemedText>
            </View>
          )}

          {/* Heart Rate */}
          {summary.heartRate !== undefined && (
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.destructive + "15" }]}>
                <Feather name="heart" size={16} color={colors.destructive} />
              </View>
              <ThemedText type="h4" style={{ color: colors.destructive }}>
                {summary.heartRate}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                avg bpm
              </ThemedText>
            </View>
          )}

          {/* Weight */}
          {summary.weight !== undefined && (
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.accent + "15" }]}>
                <Feather name="trending-down" size={16} color={colors.accent} />
              </View>
              <ThemedText type="h4" style={{ color: colors.accent }}>
                {summary.weight.toFixed(1)}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                kg
              </ThemedText>
            </View>
          )}
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  connectPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  connectText: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
});
