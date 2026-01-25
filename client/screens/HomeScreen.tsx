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

import { safeHaptics, showAlert } from "@/lib/platform";

import { ThemedText } from "@/components/ThemedText";
import { ProgressRing, Milestone, RING_MILESTONES } from "@/components/ProgressRing";
import { MetabolicStages } from "@/components/MetabolicStages";
import { getStageForDuration } from "@/constants/fastingStages";
import { DailyInsight } from "@/components/DailyInsight";
import { MotivationCard } from "@/components/MotivationCard";
import { RecommendationCard } from "@/components/RecommendationCard";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { FAB } from "@/components/FAB";
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { Spacing, Colors, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { CustomDateTimePicker } from "@/components/DateTimePicker";
import { MilestoneDetailModal } from "@/components/MilestoneDetailModal";

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
      <GlassCard style={styles.statCardGlass} intensity="medium">
        {/* Background Icon Watermark */}
        <View style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.1 }}>
          <Feather name={icon as any} size={80} color={iconColor} />
        </View>

        <View style={styles.statContent}>
          <View style={[styles.statHeader]}>
            <View style={[styles.statIconSmall, { backgroundColor: iconColor + "20" }]}>
              <Feather name={icon as any} size={16} color={iconColor} />
            </View>
            <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: "600", letterSpacing: 0.5 }}>
              {label.toUpperCase()}
            </ThemedText>
          </View>

          <View style={styles.statValueContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              {value.split(' ').map((part, index) => {
                const match = part.match(/(\d+)([a-zA-Z]*)/);
                if (match) {
                  const [_, num, unit] = match;
                  return (
                    <ThemedText key={index} type="h2" style={{ color: theme.text, fontSize: 32, lineHeight: 38 }}>
                      {num}
                      {unit ? (
                        <ThemedText type="bodyMedium" style={{ color: iconColor, fontWeight: "700" }}>
                          {unit}
                        </ThemedText>
                      ) : null}
                      {index < value.split(' ').length - 1 ? " " : ""}
                    </ThemedText>
                  );
                }
                return (
                  <ThemedText key={index} type="h2" style={{ color: theme.text, fontSize: 32, lineHeight: 38 }}>
                    {part}
                    {index < value.split(' ').length - 1 ? " " : ""}
                  </ThemedText>
                );
              })}
            </View>
          </View>
        </View>
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
  const { activeFast, endFast, updateFast, stats, refresh, fasts } = useFasting();
  const [elapsed, setElapsed] = useState(0);

  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.5);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const handleUpdateStartTime = useCallback(async (date: Date) => {
    setDatePickerVisible(false);
    if (activeFast) {
      await updateFast(activeFast.id, { startTime: date.getTime() });
    }
  }, [activeFast, updateFast]);

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
    safeHaptics.impactAsync();
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
        safeHaptics.notificationAsync();
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

  const elapsedHours = elapsed / (1000 * 60 * 60);
  const targetHours = activeFast?.targetDuration || 16;
  const isOvertime = elapsedHours > targetHours;

  // Find next milestone for dynamic ring scaling
  const nextMilestone = RING_MILESTONES.find(m => m.hours > elapsedHours);
  const displayDuration = isOvertime
    ? (nextMilestone ? nextMilestone.hours : Math.ceil(elapsedHours + 4))
    : targetHours;

  const displayMs = displayDuration * 60 * 60 * 1000;
  const progress = displayMs > 0 ? Math.min(elapsed / displayMs, 1) : 0;

  const remaining = Math.max(displayMs - elapsed, 0);
  const time = formatTime(activeFast ? elapsed : 0);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const currentStage = getStageForDuration(elapsedHours);

  // --- Celebration Logic ---
  const [showCelebration, setShowCelebration] = useState(false);
  const hasShownCelebration = React.useRef(false);

  useEffect(() => {
    if (activeFast && isOvertime && !hasShownCelebration.current) {
      // Delay slightly to allow UI to settle/load
      const timer = setTimeout(() => {
        setShowCelebration(true);
        hasShownCelebration.current = true;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeFast, isOvertime]);

  // Reset flag when fast ends/changes
  useEffect(() => {
    if (!activeFast) {
      hasShownCelebration.current = false;
      setShowCelebration(false);
    }
  }, [activeFast]);

  const handleContinueFast = async () => {
    setShowCelebration(false);
    if (!activeFast) return;

    // Logic to find next milestone
    const currentTarget = activeFast.targetDuration;
    // Common milestones: 16, 18, 20, 24, 36, 48, 72
    const milestones = [16, 18, 20, 24, 36, 48, 72];
    const nextTarget = milestones.find(m => m > currentTarget) || currentTarget + 2;

    await updateFast(activeFast.id, { targetDuration: nextTarget });
    safeHaptics.notificationAsync();
    showAlert("Goal Updated", `Your fasting goal has been extended to ${nextTarget} hours.`);
  };

  const extensionMilestone = activeFast ? [16, 18, 20, 24, 36, 48, 72].find(m => m > activeFast.targetDuration) || activeFast.targetDuration + 2 : undefined;

  return (
    <View style={styles.container}>
      <CelebrationOverlay
        visible={showCelebration}
        hoursReached={activeFast?.targetDuration || 16}
        nextMilestone={extensionMilestone}
        onEndFast={() => {
          setShowCelebration(false);
          // Small delay to allow modal to close before showing generic end fast alert
          setTimeout(() => handleEndFast(), 300);
        }}
        onContinue={handleContinueFast}
      />
      <GradientBackground variant="home" stageColor={activeFast ? currentStage.color : undefined} />

      <View style={[styles.safeArea, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.header}>
          <View>
            <ThemedText type="body" style={{ opacity: 0.7 }}>
              {getGreeting()}
            </ThemedText>
            <ThemedText type="h2">FastTrack</ThemedText>
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
            { paddingBottom: tabBarHeight + 10 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.timerSection}>
            <Animated.View style={[styles.glowContainer, glowStyle, activeFast ? Shadows.glow(colors.primary) : {}]} />
            <Animated.View style={[styles.timerWrapper, pulseStyle]}>
              <ProgressRing
                progress={progress}
                size={300}
                strokeWidth={20}
                targetHours={displayDuration}
                elapsedHours={elapsedHours}
                showMilestones={!!activeFast}
                onMilestonePress={(milestone: Milestone) => {
                  setSelectedMilestone(milestone);
                }}
              >
                <View style={styles.timerContent}>
                  {activeFast ? (
                    <>
                      <View style={[styles.planBadge, { backgroundColor: isOvertime ? colors.success + "20" : colors.primary + "20" }]}>
                        <ThemedText type="caption" style={{ color: isOvertime ? colors.success : colors.primary, fontWeight: "700" }}>
                          {isOvertime ? `Overtime: Aiming for ${displayDuration}h` : activeFast.planName}
                        </ThemedText>
                      </View>
                      <View style={styles.timerDisplay}>
                        <ThemedText style={[styles.timerText, { color: theme.text }]}>
                          {time.hours}:{time.minutes}
                        </ThemedText>
                        <ThemedText style={[styles.timerSeconds, { color: isOvertime ? colors.success : colors.primary }]}>
                          :{time.seconds}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {isOvertime ? "Next milestone in " + formatRemainingTime(remaining) : formatRemainingTime(remaining) + " remaining"}
                      </ThemedText>
                    </>
                  ) : (
                    <View style={styles.emptyStateContent}>
                      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
                        <Feather name="clock" size={48} color={colors.primary} />
                      </View>
                      <ThemedText type="h2" style={{ color: theme.text }}>
                        Ready to fast?
                      </ThemedText>
                      <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, textAlign: "center" }}>
                        Tap the + button to begin your journey
                      </ThemedText>
                    </View>
                  )}
                </View>
              </ProgressRing>
            </Animated.View>
          </View>

          {
            activeFast ? (
              <>
                <Pressable
                  onPress={handleEndFast}
                  style={({ pressed }) => [
                    styles.endButton,
                    {
                      backgroundColor: colors.destructive + "12",
                      borderColor: colors.destructive + "25",
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Feather name="stop-circle" size={22} color={colors.destructive} />
                  <ThemedText type="h4" style={{ color: colors.destructive }}>
                    End Fast
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => navigation.navigate("FastingStages", { hoursElapsed: elapsedHours })}
                  style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, marginTop: Spacing.sm }]}
                >
                  <MetabolicStages elapsedHours={elapsedHours} />
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
                        <Feather name="play" size={20} color={colors.success} />
                      </View>
                      <View>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          Started
                        </ThemedText>
                        <Pressable onPress={() => setDatePickerVisible(true)}>
                          <View>
                            <ThemedText type="h4" style={{ textDecorationLine: "underline" }}>
                              {new Date(activeFast.startTime).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </ThemedText>
                            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                              {new Date(activeFast.startTime).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </ThemedText>
                          </View>
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.infoItem}>
                      <View style={[styles.infoIconBg, { backgroundColor: colors.primary + "15" }]}>
                        <Feather name="flag" size={20} color={colors.primary} />
                      </View>
                      <View>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          Goal
                        </ThemedText>
                        <ThemedText type="h4">
                          {formatTargetTime(activeFast.startTime, activeFast.targetDuration)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </GlassCard>

                <MotivationCard progress={progress} isOvertime={isOvertime} />

              </>
            ) : (
              <>
                <RecommendationCard fasts={fasts} currentStreak={stats.currentStreak} />

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

                <DailyInsight />
              </>
            )}
        </ScrollView>
      </View >

      {!activeFast ? (
        <View style={[styles.fabContainer, { bottom: tabBarHeight + Spacing["2xl"] }]}>
          <FAB onPress={handleStartFast} />
        </View>
      ) : null
      }
      <CustomDateTimePicker
        isVisible={isDatePickerVisible}
        date={activeFast ? new Date(activeFast.startTime) : new Date()}
        onConfirm={handleUpdateStartTime}
        onCancel={() => setDatePickerVisible(false)}
        title="Edit Start Date & Time"
        mode="datetime"
      />
      <MilestoneDetailModal
        isVisible={!!selectedMilestone}
        milestone={selectedMilestone}
        isPassed={selectedMilestone ? elapsedHours >= selectedMilestone.hours : false}
        elapsedHours={elapsedHours}
        onClose={() => setSelectedMilestone(null)}
        onLearnMore={() => {
          const hours = selectedMilestone?.hours || 0;
          setSelectedMilestone(null);
          navigation.navigate("FastingStages", { hoursElapsed: hours });
        }}
      />
    </View >
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
    gap: Spacing.xl,
  },
  timerSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    position: "relative",
  },
  glowContainer: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: "50%",
    left: "50%",
    transform: [{ translateX: -150 }, { translateY: -150 }],
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
    marginVertical: -8,
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
    paddingBottom: 6,
  },
  emptyStateContent: {
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    maxWidth: 240, // Ensure text stays well within the 300px ring
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  statContent: {
    gap: Spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueContainer: {
    alignItems: 'flex-start',
  },
  statIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  statValue: {
    letterSpacing: -1,
    fontSize: 28,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  infoDivider: {
    height: 1,
    marginVertical: Spacing.lg,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  endButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  tipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
