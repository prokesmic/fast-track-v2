import React from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useWeeklyChallenges, WeeklyChallenge } from "@/hooks/useWeeklyChallenges";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { safeHaptics } from "@/lib/platform";

interface Props {
  onViewLeaderboard?: () => void;
}

const CHALLENGE_TYPE_ICONS: Record<string, string> = {
  complete_fasts: "check-circle",
  total_hours: "clock",
  longest_fast: "award",
  streak: "zap",
};

const CHALLENGE_TYPE_COLORS: Record<string, string> = {
  complete_fasts: "#10B981",
  total_hours: "#3B82F6",
  longest_fast: "#F59E0B",
  streak: "#8B5CF6",
};

export function WeeklyChallengeCard({ onViewLeaderboard }: Props) {
  const { t } = useTranslation();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const {
    currentChallenge,
    isLoading,
    isJoining,
    joinChallenge,
    leaveChallenge,
  } = useWeeklyChallenges();

  if (isLoading) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </GlassCard>
    );
  }

  if (!currentChallenge) {
    return null;
  }

  const typeColor = CHALLENGE_TYPE_COLORS[currentChallenge.type] || colors.primary;
  const typeIcon = CHALLENGE_TYPE_ICONS[currentChallenge.type] || "flag";
  const progress = Math.min(
    100,
    (currentChallenge.userProgress / currentChallenge.targetValue) * 100
  );

  const handleJoin = async () => {
    safeHaptics.impactAsync();
    await joinChallenge();
  };

  const getTimeRemaining = () => {
    if (currentChallenge.daysLeft > 0) {
      return t("challenges.daysLeft", { days: currentChallenge.daysLeft });
    }
    if (currentChallenge.hoursLeft > 0) {
      return t("challenges.hoursLeft", { hours: currentChallenge.hoursLeft });
    }
    return t("challenges.endsToday");
  };

  const getProgressLabel = () => {
    switch (currentChallenge.type) {
      case "complete_fasts":
        return `${currentChallenge.userProgress}/${currentChallenge.targetValue} ${t("social.challenges")}`;
      case "total_hours":
        return `${currentChallenge.userProgress}/${currentChallenge.targetValue} ${t("common.hours")}`;
      case "longest_fast":
        return `${currentChallenge.userProgress}/${currentChallenge.targetValue}h`;
      case "streak":
        return `${currentChallenge.userProgress}/${currentChallenge.targetValue} ${t("common.days")}`;
      default:
        return `${currentChallenge.userProgress}/${currentChallenge.targetValue}`;
    }
  };

  return (
    <GlassCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: typeColor + "20" }]}>
          <Feather name={typeIcon as any} size={24} color={typeColor} />
        </View>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <ThemedText type="caption" style={{ color: typeColor, fontWeight: "700" }}>
              {t("challenges.weekly").toUpperCase()}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textTertiary }}>
              {getTimeRemaining()}
            </ThemedText>
          </View>
          <ThemedText type="h4" style={{ marginTop: 2 }}>
            {currentChallenge.name}
          </ThemedText>
        </View>
      </View>

      {/* Description */}
      {currentChallenge.description && (
        <ThemedText
          type="caption"
          style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
        >
          {currentChallenge.description}
        </ThemedText>
      )}

      {/* Progress (only if joined) */}
      {currentChallenge.isJoined && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {t("challenges.yourProgress")}
            </ThemedText>
            <ThemedText type="caption" style={{ color: typeColor, fontWeight: "600" }}>
              {getProgressLabel()}
            </ThemedText>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: currentChallenge.completed ? colors.success : typeColor,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
          {currentChallenge.completed && (
            <View style={styles.completedBadge}>
              <Feather name="check-circle" size={14} color={colors.success} />
              <ThemedText type="caption" style={{ color: colors.success, fontWeight: "600" }}>
                {t("fasting.completed")}
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.participants}>
          <Feather name="users" size={14} color={theme.textTertiary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {currentChallenge.participantCount} {t("social.participants")}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          {onViewLeaderboard && currentChallenge.isJoined && (
            <Pressable
              onPress={() => {
                safeHaptics.selectionAsync();
                onViewLeaderboard();
              }}
              style={[styles.secondaryButton, { borderColor: theme.cardBorder }]}
            >
              <Feather name="bar-chart-2" size={14} color={theme.textSecondary} />
            </Pressable>
          )}

          {currentChallenge.isJoined ? (
            <Pressable
              onPress={async () => {
                safeHaptics.impactAsync();
                await leaveChallenge();
              }}
              style={[styles.leaveButton, { backgroundColor: colors.destructive + "15" }]}
            >
              <ThemedText type="caption" style={{ color: colors.destructive, fontWeight: "600" }}>
                {t("social.leave")}
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleJoin}
              disabled={isJoining}
              style={[styles.joinButton, { backgroundColor: typeColor }]}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "700" }}>
                  {t("social.join")}
                </ThemedText>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressSection: {
    marginTop: Spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  participants: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  joinButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: "center",
  },
  leaveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  secondaryButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
