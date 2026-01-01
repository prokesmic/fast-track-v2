import React, { useState, useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { FastDetailCard } from "@/components/FastDetailCard";
import { AnalyticsCard } from "@/components/AnalyticsCard";
import { WeeklyChart } from "@/components/WeeklyChart";
import { InsightCard } from "@/components/InsightCard";
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";

type FilterType = "week" | "month" | "all";
type ViewType = "overview" | "fasts" | "insights";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabButtonProps {
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
  colors: typeof Colors.light;
}

function TabButton({ label, icon, isActive, onPress, colors }: TabButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[
        styles.viewTab,
        isActive && { backgroundColor: colors.primary },
        animatedStyle,
      ]}
    >
      <Feather
        name={icon as any}
        size={16}
        color={isActive ? "#FFFFFF" : theme.textSecondary}
      />
      <ThemedText
        type="caption"
        style={{
          color: isActive ? "#FFFFFF" : theme.textSecondary,
          fontWeight: isActive ? "700" : "500",
        }}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { fasts, stats, refresh } = useFasting();
  const [filter, setFilter] = useState<FilterType>("month");
  const [viewType, setViewType] = useState<ViewType>("overview");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const completedFasts = useMemo(() => 
    fasts.filter((f) => f.endTime).sort((a, b) => (b.endTime || 0) - (a.endTime || 0)),
    [fasts]
  );

  const getFilteredFasts = useCallback(() => {
    const now = new Date();
    switch (filter) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return completedFasts.filter((f) => new Date(f.endTime!) >= weekAgo);
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return completedFasts.filter((f) => new Date(f.endTime!) >= monthAgo);
      case "all":
      default:
        return completedFasts;
    }
  }, [completedFasts, filter]);

  const filteredFasts = getFilteredFasts();

  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayFasts = completedFasts.filter((f) => {
        const fastDate = new Date(f.endTime!).toISOString().split("T")[0];
        return fastDate === dateStr;
      });

      const totalHours = dayFasts.reduce((sum, f) => {
        return sum + (f.endTime! - f.startTime) / (1000 * 60 * 60);
      }, 0);

      const avgTarget = dayFasts.length > 0
        ? dayFasts.reduce((sum, f) => sum + f.targetDuration, 0) / dayFasts.length
        : 16;

      data.push({
        day: days[date.getDay()],
        hours: Math.round(totalHours * 10) / 10,
        target: avgTarget,
        completed: dayFasts.some((f) => {
          const duration = (f.endTime! - f.startTime) / (1000 * 60 * 60);
          return duration >= f.targetDuration;
        }),
      });
    }
    return data;
  }, [completedFasts]);

  const analyticsData = useMemo(() => {
    const last7Days = completedFasts.filter((f) => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(f.endTime!) >= weekAgo;
    });

    const prev7Days = completedFasts.filter((f) => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(f.endTime!) >= twoWeeksAgo && new Date(f.endTime!) < weekAgo;
    });

    const currentHours = last7Days.reduce((sum, f) => sum + (f.endTime! - f.startTime) / (1000 * 60 * 60), 0);
    const prevHours = prev7Days.reduce((sum, f) => sum + (f.endTime! - f.startTime) / (1000 * 60 * 60), 0);
    const hoursTrend = prevHours > 0 ? Math.round(((currentHours - prevHours) / prevHours) * 100) : 0;

    const currentCompletion = last7Days.length > 0
      ? Math.round((last7Days.filter((f) => (f.endTime! - f.startTime) / (1000 * 60 * 60) >= f.targetDuration).length / last7Days.length) * 100)
      : 0;
    const prevCompletion = prev7Days.length > 0
      ? Math.round((prev7Days.filter((f) => (f.endTime! - f.startTime) / (1000 * 60 * 60) >= f.targetDuration).length / prev7Days.length) * 100)
      : 0;
    const completionTrend = currentCompletion - prevCompletion;

    const hoursChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayHours = completedFasts
        .filter((f) => new Date(f.endTime!).toISOString().split("T")[0] === dateStr)
        .reduce((sum, f) => sum + (f.endTime! - f.startTime) / (1000 * 60 * 60), 0);
      hoursChartData.push({ value: dayHours, label: dateStr });
    }

    return {
      totalHours: Math.round(currentHours),
      hoursTrend,
      completionRate: currentCompletion,
      completionTrend,
      hoursChartData,
    };
  }, [completedFasts]);

  const insights = useMemo(() => {
    const result = [];

    const avgDuration = completedFasts.length > 0
      ? completedFasts.reduce((sum, f) => sum + (f.endTime! - f.startTime) / (1000 * 60 * 60), 0) / completedFasts.length
      : 0;

    if (avgDuration >= 16) {
      result.push({
        title: "Strong Fasting Discipline",
        description: `Your average fast duration is ${Math.round(avgDuration)}h - you're reaching deep fat burning consistently!`,
        icon: "award" as const,
        color: colors.primary,
      });
    }

    if (stats.currentStreak >= 3) {
      result.push({
        title: "Building Momentum",
        description: `${stats.currentStreak} day streak! Consistency is key to metabolic flexibility.`,
        icon: "trending-up" as const,
        color: colors.success,
      });
    }

    const morningFasts = completedFasts.filter((f) => {
      const hour = new Date(f.startTime).getHours();
      return hour >= 18 || hour < 6;
    });
    if (morningFasts.length > completedFasts.length * 0.6) {
      result.push({
        title: "Overnight Fasting Pro",
        description: "You typically start fasts in the evening - aligning with your circadian rhythm!",
        icon: "moon" as const,
        color: colors.secondary,
      });
    }

    if (result.length === 0) {
      result.push({
        title: "Getting Started",
        description: "Complete more fasts to unlock personalized insights about your fasting patterns!",
        icon: "compass" as const,
        color: colors.primary,
      });
    }

    return result;
  }, [completedFasts, stats, colors]);

  const calendarFastDays = useMemo(() => 
    completedFasts.map((f) => ({
      date: new Date(f.endTime!).toISOString().split("T")[0],
      completed: true,
      duration: (f.endTime! - f.startTime) / (1000 * 60 * 60),
    })),
    [completedFasts]
  );

  const handleFilterChange = (newFilter: FilterType) => {
    Haptics.selectionAsync();
    setFilter(newFilter);
  };

  const handleViewChange = (newView: ViewType) => {
    Haptics.selectionAsync();
    setViewType(newView);
  };

  const formatTotalHours = (hours: number) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
    return `${Math.round(hours)}h`;
  };

  return (
    <View style={styles.container}>
      <GradientBackground variant="history" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="h1">History</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Track your fasting journey
          </ThemedText>
        </View>

        <GlassCard noPadding>
          <View style={styles.viewTabs}>
            <TabButton
              label="Overview"
              icon="bar-chart-2"
              isActive={viewType === "overview"}
              onPress={() => handleViewChange("overview")}
              colors={colors}
            />
            <TabButton
              label="Fasts"
              icon="list"
              isActive={viewType === "fasts"}
              onPress={() => handleViewChange("fasts")}
              colors={colors}
            />
            <TabButton
              label="Insights"
              icon="zap"
              isActive={viewType === "insights"}
              onPress={() => handleViewChange("insights")}
              colors={colors}
            />
          </View>
        </GlassCard>

        {viewType === "overview" ? (
          <>
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsHalf}>
                <AnalyticsCard
                  title="Hours Fasted"
                  value={formatTotalHours(analyticsData.totalHours)}
                  subtitle="This week"
                  trend={analyticsData.hoursTrend}
                  icon="clock"
                  color={colors.primary}
                  data={analyticsData.hoursChartData}
                />
              </View>
              <View style={styles.analyticsHalf}>
                <AnalyticsCard
                  title="Completion"
                  value={`${analyticsData.completionRate}%`}
                  subtitle="Success rate"
                  trend={analyticsData.completionTrend}
                  icon="target"
                  color={colors.success}
                  showChart={false}
                />
              </View>
            </View>

            <WeeklyChart data={weeklyData} maxHours={24} />

            <GlassCard>
              <View style={styles.calendarHeader}>
                <View>
                  <ThemedText type="h4">Fasting Calendar</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Your monthly activity
                  </ThemedText>
                </View>
                <View style={styles.monthNav}>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      const prev = new Date(selectedMonth);
                      prev.setMonth(prev.getMonth() - 1);
                      setSelectedMonth(prev);
                    }}
                    style={[styles.monthNavButton, { backgroundColor: colors.primary + "15" }]}
                    hitSlop={8}
                  >
                    <Feather name="chevron-left" size={18} color={colors.primary} />
                  </Pressable>
                  <ThemedText type="bodyMedium" style={{ color: theme.text }}>
                    {selectedMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </ThemedText>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      const next = new Date(selectedMonth);
                      next.setMonth(next.getMonth() + 1);
                      setSelectedMonth(next);
                    }}
                    style={[styles.monthNavButton, { backgroundColor: colors.primary + "15" }]}
                    hitSlop={8}
                  >
                    <Feather name="chevron-right" size={18} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
              <CalendarHeatmap
                month={selectedMonth}
                fastDays={calendarFastDays}
                onDayPress={(date) => {
                  Haptics.selectionAsync();
                }}
              />
            </GlassCard>
          </>
        ) : null}

        {viewType === "fasts" ? (
          <>
            <GlassCard noPadding>
              <View style={styles.filterTabs}>
                {(["week", "month", "all"] as FilterType[]).map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => handleFilterChange(f)}
                    style={[
                      styles.filterTab,
                      filter === f && { backgroundColor: colors.primary },
                    ]}
                  >
                    <ThemedText
                      type="caption"
                      style={{
                        color: filter === f ? "#FFFFFF" : theme.textSecondary,
                        fontWeight: filter === f ? "700" : "500",
                      }}
                    >
                      {f === "week" ? "Week" : f === "month" ? "Month" : "All Time"}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </GlassCard>

            <View style={styles.summaryRow}>
              <GlassCard style={styles.summaryCard} intensity="light">
                <ThemedText type="h2" style={{ color: colors.primary }}>
                  {filteredFasts.length}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Fasts
                </ThemedText>
              </GlassCard>
              <GlassCard style={styles.summaryCard} intensity="light">
                <ThemedText type="h2" style={{ color: colors.success }}>
                  {formatTotalHours(
                    filteredFasts.reduce((sum, f) => sum + (f.endTime! - f.startTime) / (1000 * 60 * 60), 0)
                  )}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Total
                </ThemedText>
              </GlassCard>
              <GlassCard style={styles.summaryCard} intensity="light">
                <ThemedText type="h2" style={{ color: colors.secondary }}>
                  {filteredFasts.length > 0
                    ? Math.round(
                        filteredFasts.reduce((sum, f) => sum + (f.endTime! - f.startTime) / (1000 * 60 * 60), 0) /
                          filteredFasts.length
                      )
                    : 0}h
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Average
                </ThemedText>
              </GlassCard>
            </View>

            <View style={styles.fastsList}>
              {filteredFasts.length === 0 ? (
                <GlassCard style={styles.emptyState}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
                    <Feather name="calendar" size={36} color={colors.primary} />
                  </View>
                  <ThemedText type="h4" style={{ color: theme.text }}>
                    No fasts yet
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                    Start your first fast to see your history here
                  </ThemedText>
                </GlassCard>
              ) : (
                filteredFasts.map((fast) => (
                  <FastDetailCard
                    key={fast.id}
                    date={new Date(fast.endTime!)}
                    duration={(fast.endTime! - fast.startTime) / (1000 * 60 * 60)}
                    targetDuration={fast.targetDuration}
                    planName={fast.planName}
                    note={fast.note}
                  />
                ))
              )}
            </View>
          </>
        ) : null}

        {viewType === "insights" ? (
          <View style={styles.insightsSection}>
            <View style={styles.lifetimeStats}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.secondary + "18" }]}>
                  <Feather name="activity" size={18} color={colors.secondary} />
                </View>
                <View>
                  <ThemedText type="h3">Lifetime Stats</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Your all-time achievements
                  </ThemedText>
                </View>
              </View>
              <View style={styles.statGrid}>
                <GlassCard style={styles.statBox} intensity="light">
                  <View style={[styles.statIconBg, { backgroundColor: colors.primary + "18" }]}>
                    <Feather name="clock" size={22} color={colors.primary} />
                  </View>
                  <ThemedText type="h2" style={{ color: colors.primary }}>
                    {formatTotalHours(stats.totalHours)}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Total Fasted
                  </ThemedText>
                </GlassCard>
                <GlassCard style={styles.statBox} intensity="light">
                  <View style={[styles.statIconBg, { backgroundColor: colors.success + "18" }]}>
                    <Feather name="check-circle" size={22} color={colors.success} />
                  </View>
                  <ThemedText type="h2" style={{ color: colors.success }}>
                    {stats.totalFasts}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Completed
                  </ThemedText>
                </GlassCard>
                <GlassCard style={styles.statBox} intensity="light">
                  <View style={[styles.statIconBg, { backgroundColor: colors.secondary + "18" }]}>
                    <Feather name="zap" size={22} color={colors.secondary} />
                  </View>
                  <ThemedText type="h2" style={{ color: colors.secondary }}>
                    {stats.currentStreak}d
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Current Streak
                  </ThemedText>
                </GlassCard>
                <GlassCard style={styles.statBox} intensity="light">
                  <View style={[styles.statIconBg, { backgroundColor: "#F59E0B18" }]}>
                    <Feather name="award" size={22} color="#F59E0B" />
                  </View>
                  <ThemedText type="h2" style={{ color: "#F59E0B" }}>
                    {stats.longestStreak}d
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Best Streak
                  </ThemedText>
                </GlassCard>
              </View>
            </View>

            <View style={styles.insightsList}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="compass" size={18} color={colors.primary} />
                </View>
                <View>
                  <ThemedText type="h3">Personalized Insights</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Based on your patterns
                  </ThemedText>
                </View>
              </View>
              {insights.map((insight, index) => (
                <InsightCard key={index} {...insight} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
  },
  viewTabs: {
    flexDirection: "row",
    padding: Spacing.xs,
  },
  viewTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  analyticsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  analyticsHalf: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTabs: {
    flexDirection: "row",
    padding: Spacing.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  fastsList: {
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing["3xl"],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  insightsSection: {
    gap: Spacing.xl,
  },
  lifetimeStats: {
    gap: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statBox: {
    width: "48%",
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
  insightsList: {
    gap: Spacing.md,
  },
});
