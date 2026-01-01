import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert, Pressable, Platform, ScrollView, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  Easing,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ProgressRing, Milestone } from "@/components/ProgressRing";
import { FastingStageIndicator } from "@/components/FastingStage";
import { FAB } from "@/components/FAB";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { Spacing, Colors, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatTime(ms: number): { hours: string; minutes: string; seconds: string } {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: hours.toString().padStart(2, "0"),
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
  };
}

function formatTargetTime(startTime: number, targetDuration: number): string {
  const endTime = new Date(startTime + targetDuration * 60 * 60 * 1000);
  return endTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatRemainingTime(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / (1000 * 60)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatHours(hours: number): string {
  const roundedHours = Math.round(hours);
  if (roundedHours >= 24) {
    const days = Math.floor(roundedHours / 24);
    const remainingHours = roundedHours % 24;
    if (remainingHours === 0) {
      return `${days}d`;
    }
    return `${days}d ${remainingHours}h`;
  }
  return `${roundedHours}h`;
}

interface StatCardProps {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
  theme: any;
}

function StatCard({ icon, iconColor, value, label, theme }: StatCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[
        styles.statCard,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: iconColor + "15" }]}>
        <Feather name={icon as any} size={20} color={iconColor} />
      </View>
      <ThemedText type="h2" style={{ color: theme.text }}>
        {value}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { activeFast, endFast, stats, refresh } = useFasting();
  const [elapsed, setElapsed] = useState(0);

  const pulseAnim = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (activeFast) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = 1;
    }
  }, [activeFast]);

  useEffect(() => {
    if (!activeFast) {
      setElapsed(0);
      return;
    }

    const updateElapsed = () => {
      setElapsed(Date.now() - activeFast.startTime);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  const handleStartFast = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("StartFast", {});
  };

  const handleEndFast = async () => {
    const elapsedHours = elapsed / (1000 * 60 * 60);
    const completed = elapsedHours >= (activeFast?.targetDuration || 0);

    const title = completed ? "Complete Fast" : "End Fast Early";
    const message = completed
      ? "Congratulations! You've completed your fasting goal. End fast now?"
      : "You haven't reached your fasting goal yet. End fast early?";

    const doEndFast = async () => {
      try {
        Haptics.notificationAsync(
          completed
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
        await endFast(completed);
      } catch (error) {
        console.error("Error ending fast:", error);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        await doEndFast();
      }
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        {
          text: completed ? "Complete" : "End Early",
          style: completed ? "default" : "destructive",
          onPress: doEndFast,
        },
      ]);
    }
  };

  const targetMs = (activeFast?.targetDuration || 0) * 60 * 60 * 1000;
  const progress = targetMs > 0 ? Math.min(elapsed / targetMs, 1) : 0;
  const remaining = Math.max(targetMs - elapsed, 0);
  const time = formatTime(activeFast ? elapsed : 0);
  const elapsedHours = elapsed / (1000 * 60 * 60);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing.lg,
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {getGreeting()}
          </ThemedText>
          <ThemedText type="h2">FastTrack</ThemedText>
        </View>
        {stats.currentStreak > 0 ? (
          <View style={[styles.streakBadge, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="zap" size={16} color={colors.primary} />
            <ThemedText type="bodyMedium" style={{ color: colors.primary }}>
              {stats.currentStreak} day streak
            </ThemedText>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timerSection}>
          <Animated.View style={[styles.timerWrapper, pulseStyle]}>
            <ProgressRing
              progress={progress}
              size={260}
              strokeWidth={16}
              targetHours={activeFast?.targetDuration || 16}
              elapsedHours={elapsedHours}
              showMilestones={!!activeFast}
              onMilestonePress={(milestone: Milestone) => {
                if (Platform.OS === "web") {
                  window.alert(`${milestone.name} (${milestone.hours}h)\n\n${milestone.description}`);
                } else {
                  Alert.alert(
                    `${milestone.name}`,
                    `Reached at ${milestone.hours} hours\n\n${milestone.description}`,
                    [
                      { text: "Learn More", onPress: () => navigation.navigate("FastingStages", { hoursElapsed: milestone.hours }) },
                      { text: "OK", style: "cancel" }
                    ]
                  );
                }
              }}
            >
              <View style={styles.timerContent}>
                {activeFast ? (
                  <>
                    <View style={[styles.planBadge, { backgroundColor: colors.primary + "15" }]}>
                      <ThemedText type="small" style={{ color: colors.primary, fontWeight: "600" }}>
                        {activeFast.planName}
                      </ThemedText>
                    </View>
                    <View style={styles.timerDisplay}>
                      <ThemedText style={[styles.timerText, { color: theme.text }]}>
                        {time.hours}:{time.minutes}
                      </ThemedText>
                      <ThemedText style={[styles.timerSeconds, { color: theme.textSecondary }]}>
                        :{time.seconds}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {remaining > 0 ? formatRemainingTime(remaining) : "Goal reached!"}
                    </ThemedText>
                  </>
                ) : (
                  <View style={styles.emptyStateContent}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
                      <Feather name="clock" size={36} color={theme.textTertiary} />
                    </View>
                    <ThemedText type="h4" style={{ color: theme.textSecondary }}>
                      Ready to fast?
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textTertiary, textAlign: "center" }}>
                      Tap the button below to start
                    </ThemedText>
                  </View>
                )}
              </View>
            </ProgressRing>
          </Animated.View>
        </View>

        {activeFast ? (
          <>
            <Pressable
              onPress={() => navigation.navigate("FastingStages", { hoursElapsed: elapsedHours })}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <FastingStageIndicator hoursElapsed={elapsedHours} />
            </Pressable>

            <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.infoHeader}>
                <ThemedText type="h4">Fast Details</ThemedText>
                <ThemedText type="caption" style={{ color: colors.primary }}>
                  {Math.round(progress * 100)}% complete
                </ThemedText>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Feather name="play-circle" size={20} color={colors.success} />
                  <View>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      Started
                    </ThemedText>
                    <ThemedText type="bodyMedium">
                      {new Date(activeFast.startTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <Feather name="target" size={20} color={colors.primary} />
                  <View>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      Goal
                    </ThemedText>
                    <ThemedText type="bodyMedium">
                      {formatTargetTime(activeFast.startTime, activeFast.targetDuration)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleEndFast}
              style={({ pressed }) => [
                styles.endButton,
                {
                  backgroundColor: colors.destructive + "15",
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Feather name="stop-circle" size={20} color={colors.destructive} />
              <ThemedText type="bodyMedium" style={{ color: colors.destructive }}>
                End Fast
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                icon="zap"
                iconColor={colors.primary}
                value={`${stats.currentStreak}`}
                label="Day Streak"
                theme={theme}
              />
              <StatCard
                icon="award"
                iconColor={colors.secondary}
                value={`${stats.longestStreak}`}
                label="Best Streak"
                theme={theme}
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                icon="check-circle"
                iconColor={colors.success}
                value={`${stats.totalFasts}`}
                label="Fasts Done"
                theme={theme}
              />
              <StatCard
                icon="clock"
                iconColor="#F59E0B"
                value={formatHours(stats.totalHours)}
                label="Time Fasted"
                theme={theme}
              />
            </View>

            <Pressable
              onPress={() => navigation.navigate("FastingStages", { hoursElapsed: 0 })}
              style={({ pressed }) => [
                styles.learnButton,
                {
                  backgroundColor: theme.backgroundDefault,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={[styles.learnIconContainer, { backgroundColor: colors.secondary + "15" }]}>
                <Feather name="book-open" size={22} color={colors.secondary} />
              </View>
              <View style={styles.learnContent}>
                <ThemedText type="h4">Learn About Fasting</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Discover what happens to your body during each stage
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={22} color={theme.textTertiary} />
            </Pressable>
          </>
        )}
      </ScrollView>

      {!activeFast ? (
        <View style={[styles.fabContainer, { bottom: tabBarHeight + Spacing["2xl"] }]}>
          <FAB onPress={handleStartFast} icon="play" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  timerSection: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  timerWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerContent: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyStateContent: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  planBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  timerText: {
    fontSize: 52,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: -2,
  },
  timerSeconds: {
    fontSize: 28,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  infoCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: Spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  endButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  fabContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  learnButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  learnIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  learnContent: {
    flex: 1,
    gap: 4,
  },
});
