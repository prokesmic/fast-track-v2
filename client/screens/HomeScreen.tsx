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
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
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
  colors: typeof Colors.light;
}

function StatCard({ icon, iconColor, value, label, colors }: StatCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[styles.statCardWrapper, animatedStyle]}
    >
      <GlassCard style={styles.statCardGlass}>
        <View style={[styles.statIconBg, { backgroundColor: iconColor + "20" }]}>
          <Feather name={icon as any} size={22} color={iconColor} />
        </View>
        <ThemedText type="h2" style={styles.statValue}>
          {value}
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {label}
        </ThemedText>
      </GlassCard>
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
  const glowAnim = useSharedValue(0.5);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (activeFast) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = 1;
      glowAnim.value = 0.5;
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

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  return (
    <View style={styles.container}>
      <GradientBackground variant="home" />
      
      <View style={[styles.safeArea, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.header}>
          <View>
            <ThemedText type="caption" style={{ color: theme.textSecondary, textTransform: "uppercase" }}>
              {getGreeting()}
            </ThemedText>
            <ThemedText type="h1" style={styles.appTitle}>
              FastTrack
            </ThemedText>
          </View>
          {stats.currentStreak > 0 ? (
            <View style={[styles.streakBadge, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="zap" size={18} color={colors.primary} />
              <ThemedText type="bodyMedium" style={{ color: colors.primary }}>
                {stats.currentStreak}
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
            <Animated.View style={[styles.glowContainer, glowStyle, activeFast ? Shadows.glow(colors.primary) : {}]} />
            <Animated.View style={[styles.timerWrapper, pulseStyle]}>
              <ProgressRing
                progress={progress}
                size={280}
                strokeWidth={18}
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
                      <View style={[styles.planBadge, { backgroundColor: colors.primary + "20" }]}>
                        <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "700" }}>
                          {activeFast.planName}
                        </ThemedText>
                      </View>
                      <View style={styles.timerDisplay}>
                        <ThemedText style={[styles.timerText, { color: theme.text }]}>
                          {time.hours}:{time.minutes}
                        </ThemedText>
                        <ThemedText style={[styles.timerSeconds, { color: colors.primary }]}>
                          :{time.seconds}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {remaining > 0 ? formatRemainingTime(remaining) : "Goal reached!"}
                      </ThemedText>
                    </>
                  ) : (
                    <View style={styles.emptyStateContent}>
                      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
                        <Feather name="clock" size={40} color={colors.primary} />
                      </View>
                      <ThemedText type="h4" style={{ color: theme.text, marginTop: Spacing.md }}>
                        Ready to fast?
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                        Tap below to begin
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
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              >
                <FastingStageIndicator hoursElapsed={elapsedHours} />
              </Pressable>

              <GlassCard accentColor={colors.primary}>
                <View style={styles.infoHeader}>
                  <ThemedText type="h4">Fast Details</ThemedText>
                  <View style={[styles.progressBadge, { backgroundColor: colors.success + "20" }]}>
                    <ThemedText type="caption" style={{ color: colors.success, fontWeight: "700" }}>
                      {Math.round(progress * 100)}%
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.infoDivider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <View style={[styles.infoIconBg, { backgroundColor: colors.success + "15" }]}>
                      <Feather name="play" size={16} color={colors.success} />
                    </View>
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
                    <View style={[styles.infoIconBg, { backgroundColor: colors.primary + "15" }]}>
                      <Feather name="flag" size={16} color={colors.primary} />
                    </View>
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
              </GlassCard>

              <Pressable
                onPress={handleEndFast}
                style={({ pressed }) => [
                  styles.endButton,
                  {
                    backgroundColor: colors.destructive + "18",
                    borderColor: colors.destructive + "30",
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Feather name="x-circle" size={20} color={colors.destructive} />
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
                  colors={colors}
                />
                <StatCard
                  icon="award"
                  iconColor={colors.secondary}
                  value={`${stats.longestStreak}`}
                  label="Best Streak"
                  colors={colors}
                />
              </View>

              <View style={styles.statsGrid}>
                <StatCard
                  icon="check-circle"
                  iconColor={colors.success}
                  value={`${stats.totalFasts}`}
                  label="Fasts Done"
                  colors={colors}
                />
                <StatCard
                  icon="clock"
                  iconColor="#F59E0B"
                  value={formatHours(stats.totalHours)}
                  label="Total Hours"
                  colors={colors}
                />
              </View>

              <GlassCard accentColor={colors.secondary}>
                <View style={styles.tipContent}>
                  <View style={[styles.tipIcon, { backgroundColor: colors.secondary + "15" }]}>
                    <Feather name="info" size={20} color={colors.secondary} />
                  </View>
                  <View style={styles.tipText}>
                    <ThemedText type="bodyMedium">Quick Tip</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
                      Start with a 16:8 fast to ease into intermittent fasting.
                    </ThemedText>
                  </View>
                </View>
              </GlassCard>
            </>
          )}
        </ScrollView>
      </View>

      {!activeFast ? (
        <View style={[styles.fabContainer, { bottom: tabBarHeight + Spacing["2xl"] }]}>
          <FAB onPress={handleStartFast} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  appTitle: {
    letterSpacing: -1,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
    paddingVertical: Spacing.xl,
    position: "relative",
  },
  glowContainer: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    top: "50%",
    left: "50%",
    transform: [{ translateX: -140 }, { translateY: -140 }],
  },
  timerWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  planBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  timerText: {
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -2,
  },
  timerSeconds: {
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: -1,
  },
  emptyStateContent: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCardGlass: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    letterSpacing: -1,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  infoDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  endButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  tipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    flex: 1,
  },
  fabContainer: {
    position: "absolute",
    right: Spacing.xl,
  },
});
