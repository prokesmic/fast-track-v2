import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ProgressRing } from "@/components/ProgressRing";
import { StatsCard } from "@/components/StatsCard";
import { FastingStageIndicator } from "@/components/FastingStage";
import { FAB } from "@/components/FAB";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { Spacing, Colors, Fonts, BorderRadius } from "@/constants/theme";
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
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { activeFast, endFast, stats, refresh } = useFasting();
  const [elapsed, setElapsed] = useState(0);

  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (activeFast) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = 1;
      glowAnim.value = 0;
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

  const handleEndFast = () => {
    const elapsedHours = elapsed / (1000 * 60 * 60);
    const completed = elapsedHours >= (activeFast?.targetDuration || 0);

    Alert.alert(
      completed ? "Complete Fast" : "End Fast Early",
      completed
        ? "Congratulations! You've completed your fasting goal. End fast now?"
        : "You haven't reached your fasting goal yet. End fast early?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: completed ? "Complete" : "End Early",
          style: completed ? "default" : "destructive",
          onPress: async () => {
            Haptics.notificationAsync(
              completed
                ? Haptics.NotificationFeedbackType.Success
                : Haptics.NotificationFeedbackType.Warning
            );
            await endFast(completed);
          },
        },
      ]
    );
  };

  const targetMs = (activeFast?.targetDuration || 0) * 60 * 60 * 1000;
  const progress = targetMs > 0 ? Math.min(elapsed / targetMs, 1) : 0;
  const remaining = Math.max(targetMs - elapsed, 0);
  const time = formatTime(activeFast ? elapsed : 0);
  const elapsedHours = elapsed / (1000 * 60 * 60);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
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
        {activeFast ? (
          <FastingStageIndicator hoursElapsed={elapsedHours} compact />
        ) : (
          <View style={[styles.quickStatBadge, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="zap" size={14} color={Colors.light.primary} />
            <ThemedText type="small" style={{ color: theme.text, fontWeight: "600" }}>
              {stats.currentStreak}d streak
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.timerSection}>
        <Animated.View style={[styles.timerWrapper, pulseStyle]}>
          {activeFast ? (
            <Animated.View style={[styles.timerGlow, glowStyle, { borderColor: Colors.light.primary }]} />
          ) : null}
          <ProgressRing progress={progress} size={300}>
            <View style={styles.timerContent}>
              {activeFast ? (
                <>
                  <View style={[styles.planBadge, { backgroundColor: theme.primary + "15" }]}>
                    <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                      {activeFast.planName}
                    </ThemedText>
                  </View>
                  <View style={styles.timerDisplay}>
                    <ThemedText
                      style={[styles.timerText, { color: theme.text }]}
                    >
                      {time.hours}:{time.minutes}
                    </ThemedText>
                    <ThemedText
                      style={[styles.timerSeconds, { color: theme.textSecondary }]}
                    >
                      :{time.seconds}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {remaining > 0 ? formatRemainingTime(remaining) : "Goal reached!"}
                  </ThemedText>
                </>
              ) : (
                <>
                  <Feather name="clock" size={40} color={theme.textSecondary} />
                  <ThemedText type="h4" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                    Ready to fast?
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Tap the button below
                  </ThemedText>
                </>
              )}
            </View>
          </ProgressRing>
        </Animated.View>

        {activeFast ? (
          <View style={styles.stageSection}>
            <FastingStageIndicator hoursElapsed={elapsedHours} />
          </View>
        ) : null}
      </View>

      {activeFast ? (
        <View style={[styles.activeInfoCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Feather name="play-circle" size={16} color={Colors.light.success} />
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
            <View style={[styles.infoDivider, { backgroundColor: theme.backgroundTertiary }]} />
            <View style={styles.infoItem}>
              <Feather name="flag" size={16} color={theme.primary} />
              <View>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Goal
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {formatTargetTime(activeFast.startTime, activeFast.targetDuration)}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: theme.backgroundTertiary }]} />
            <View style={styles.infoItem}>
              <Feather name="percent" size={16} color={Colors.light.secondary} />
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
      ) : (
        <View style={styles.statsSection}>
          <StatsCard
            icon="zap"
            label="Current Streak"
            value={`${stats.currentStreak}d`}
            iconColor={Colors.light.primary}
          />
          <StatsCard
            icon="award"
            label="Longest"
            value={`${stats.longestStreak}d`}
            iconColor={Colors.light.secondary}
          />
          <StatsCard
            icon="check-circle"
            label="Fasts"
            value={stats.totalFasts}
            iconColor={Colors.light.success}
          />
        </View>
      )}

      {activeFast ? (
        <View style={styles.endButtonContainer}>
          <Pressable
            onPress={handleEndFast}
            style={({ pressed }) => [
              styles.endButton,
              {
                backgroundColor: Colors.light.destructive + (pressed ? "E0" : ""),
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Feather name="stop-circle" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              End Fast
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

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
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  quickStatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  timerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
  },
  timerWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  timerGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 2,
  },
  timerContent: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  planBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  timerText: {
    fontSize: 56,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timerSeconds: {
    fontSize: 28,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  stageSection: {
    width: "100%",
  },
  activeInfoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoDivider: {
    width: 1,
    height: 32,
    marginHorizontal: Spacing.sm,
  },
  statsSection: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  endButtonContainer: {
    marginTop: Spacing.lg,
  },
  endButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.destructive,
  },
  fabContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
