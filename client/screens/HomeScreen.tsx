import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert, Pressable, Platform, ScrollView } from "react-native";
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
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ProgressRing } from "@/components/ProgressRing";
import { FastingStageIndicator } from "@/components/FastingStage";
import { FAB } from "@/components/FAB";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
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
          withTiming(1.015, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
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
          paddingTop: insets.top + Spacing.md,
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {getGreeting()}
          </ThemedText>
          <ThemedText type="h3">FastTrack</ThemedText>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="zap" size={14} color={Colors.light.primary} />
          <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>
            {formatHours(stats.currentStreak * 24)}
          </ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timerSection}>
          <Animated.View style={[styles.timerWrapper, pulseStyle]}>
            <ProgressRing progress={progress} size={240} strokeWidth={14}>
              <View style={styles.timerContent}>
                {activeFast ? (
                  <>
                    <View style={[styles.planBadge, { backgroundColor: theme.primary + "15" }]}>
                      <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
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
                  <>
                    <Feather name="clock" size={32} color={theme.textSecondary} />
                    <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                      Ready to fast?
                    </ThemedText>
                  </>
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
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <View style={[styles.infoIcon, { backgroundColor: Colors.light.success + "15" }]}>
                    <Feather name="play" size={14} color={Colors.light.success} />
                  </View>
                  <View>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Started
                    </ThemedText>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      {new Date(activeFast.startTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.primary + "15" }]}>
                    <Feather name="flag" size={14} color={theme.primary} />
                  </View>
                  <View>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Goal
                    </ThemedText>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      {formatTargetTime(activeFast.startTime, activeFast.targetDuration)}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <View style={[styles.infoIcon, { backgroundColor: Colors.light.secondary + "15" }]}>
                    <Feather name="percent" size={14} color={Colors.light.secondary} />
                  </View>
                  <View>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Progress
                    </ThemedText>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      {Math.round(progress * 100)}%
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
                  backgroundColor: Colors.light.destructive,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Feather name="stop-circle" size={18} color="#FFFFFF" />
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                End Fast
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
                <View style={[styles.statIcon, { backgroundColor: Colors.light.primary + "15" }]}>
                  <Feather name="zap" size={20} color={Colors.light.primary} />
                </View>
                <ThemedText type="h3">{formatHours(stats.currentStreak * 24)}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Current Streak
                </ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
                <View style={[styles.statIcon, { backgroundColor: Colors.light.secondary + "15" }]}>
                  <Feather name="award" size={20} color={Colors.light.secondary} />
                </View>
                <ThemedText type="h3">{formatHours(stats.longestStreak * 24)}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Best Streak
                </ThemedText>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
                <View style={[styles.statIcon, { backgroundColor: Colors.light.success + "15" }]}>
                  <Feather name="check-circle" size={20} color={Colors.light.success} />
                </View>
                <ThemedText type="h3">{stats.totalFasts}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Fasts Completed
                </ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault }]}>
                <View style={[styles.statIcon, { backgroundColor: "#F59E0B15" }]}>
                  <Feather name="clock" size={20} color="#F59E0B" />
                </View>
                <ThemedText type="h3">{formatHours(stats.totalHours)}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Time Fasted
                </ThemedText>
              </View>
            </View>

            <Pressable
              onPress={() => navigation.navigate("FastingStages", { hoursElapsed: 0 })}
              style={({ pressed }) => [
                styles.learnButton,
                {
                  backgroundColor: theme.backgroundDefault,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.learnIcon, { backgroundColor: Colors.light.secondary + "15" }]}>
                <Feather name="book-open" size={20} color={Colors.light.secondary} />
              </View>
              <View style={styles.learnContent}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  Learn About Fasting Stages
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Understand what happens to your body during fasting
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </>
        )}
      </ScrollView>

      {!activeFast ? (
        <View style={[styles.fabContainer, { bottom: tabBarHeight + Spacing.xl }]}>
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
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
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
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  timerSection: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  timerWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerContent: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  planBadge: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  timerText: {
    fontSize: 44,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timerSeconds: {
    fontSize: 24,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  endButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
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
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  learnIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  learnContent: {
    flex: 1,
    gap: 2,
  },
});
