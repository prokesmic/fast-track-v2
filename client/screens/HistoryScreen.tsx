import React, { useState, useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { FastDetailCard } from "@/components/FastDetailCard";
import { AnalyticsCard } from "@/components/AnalyticsCard";
import { WeeklyChart } from "@/components/WeeklyChart";
import { InsightCard } from "@/components/InsightCard";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

type FilterType = "week" | "month" | "all";
type ViewType = "overview" | "fasts" | "insights";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
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
    fasts.filter((f) => f.completed && f.endTime).sort((a, b) => (b.endTime || 0) - (a.endTime || 0)),
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
        color: Colors.light.primary,
      });
    }

    if (stats.currentStreak >= 3) {
      result.push({
        title: "Building Momentum",
        description: `${stats.currentStreak} day streak! Consistency is key to metabolic flexibility.`,
        icon: "trending-up" as const,
        color: Colors.light.success,
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
        color: Colors.light.secondary,
      });
    }

    if (result.length === 0) {
      result.push({
        title: "Getting Started",
        description: "Complete more fasts to unlock personalized insights about your fasting patterns!",
        icon: "compass" as const,
        color: Colors.light.primary,
      });
    }

    return result;
  }, [completedFasts, stats]);

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
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.viewTabs, { backgroundColor: theme.backgroundDefault }]}>
        {(["overview", "fasts", "insights"] as ViewType[]).map((v) => (
          <Pressable
            key={v}
            onPress={() => handleViewChange(v)}
            style={[
              styles.viewTab,
              viewType === v && { backgroundColor: theme.primary },
            ]}
          >
            <Feather
              name={v === "overview" ? "bar-chart-2" : v === "fasts" ? "list" : "zap"}
              size={16}
              color={viewType === v ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              type="small"
              style={{
                color: viewType === v ? "#FFFFFF" : theme.textSecondary,
                fontWeight: viewType === v ? "600" : "400",
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </ThemedText>
          </Pressable>
        ))}
      </View>

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
                color={Colors.light.primary}
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
                color={Colors.light.success}
                showChart={false}
              />
            </View>
          </View>

          <WeeklyChart data={weeklyData} maxHours={24} />

          <View
            style={[styles.calendarCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={styles.calendarHeader}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                Fasting Calendar
              </ThemedText>
              <View style={styles.monthNav}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    const prev = new Date(selectedMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setSelectedMonth(prev);
                  }}
                  hitSlop={8}
                >
                  <Feather name="chevron-left" size={20} color={theme.textSecondary} />
                </Pressable>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {selectedMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </ThemedText>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    const next = new Date(selectedMonth);
                    next.setMonth(next.getMonth() + 1);
                    setSelectedMonth(next);
                  }}
                  hitSlop={8}
                >
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
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
          </View>
        </>
      ) : null}

      {viewType === "fasts" ? (
        <>
          <View style={styles.filterContainer}>
            <View style={[styles.filterTabs, { backgroundColor: theme.backgroundDefault }]}>
              {(["week", "month", "all"] as FilterType[]).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => handleFilterChange(f)}
                  style={[
                    styles.filterTab,
                    filter === f && { backgroundColor: theme.primary },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: filter === f ? "#FFFFFF" : theme.textSecondary,
                      fontWeight: filter === f ? "600" : "400",
                    }}
                  >
                    {f === "week" ? "Week" : f === "month" ? "Month" : "All Time"}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText type="h3" style={{ color: theme.primary }}>
                {filteredFasts.length}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Fasts
              </ThemedText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText type="h3" style={{ color: Colors.light.success }}>
                {formatTotalHours(
                  filteredFasts.reduce((sum, f) => sum + (f.endTime! - f.startTime) / (1000 * 60 * 60), 0)
                )}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Total Hours
              </ThemedText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText type="h3" style={{ color: Colors.light.secondary }}>
                {filteredFasts.length > 0
                  ? Math.round(
                      filteredFasts.reduce((sum, f) => sum + (f.endTime! - f.startTime) / (1000 * 60 * 60), 0) /
                        filteredFasts.length
                    )
                  : 0}h
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Average
              </ThemedText>
            </View>
          </View>

          <View style={styles.fastsList}>
            {filteredFasts.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="calendar" size={40} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  No fasts yet
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Start your first fast to see your history here
                </ThemedText>
              </View>
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
            <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.md }}>
              Lifetime Statistics
            </ThemedText>
            <View style={styles.statGrid}>
              <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="clock" size={24} color={Colors.light.primary} />
                <ThemedText type="h3">{formatTotalHours(stats.totalHours)}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Total Fasted
                </ThemedText>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="check-circle" size={24} color={Colors.light.success} />
                <ThemedText type="h3">{stats.totalFasts}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Completed
                </ThemedText>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="zap" size={24} color={Colors.light.secondary} />
                <ThemedText type="h3">{stats.currentStreak}d</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Current Streak
                </ThemedText>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="award" size={24} color="#F59E0B" />
                <ThemedText type="h3">{stats.longestStreak}d</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Best Streak
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.insightsList}>
            <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.md }}>
              Personalized Insights
            </ThemedText>
            {insights.map((insight, index) => (
              <InsightCard key={index} {...insight} />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  viewTabs: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  viewTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  analyticsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  analyticsHalf: {
    flex: 1,
  },
  calendarCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  filterContainer: {
    alignItems: "center",
  },
  filterTabs: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
  },
  filterTab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  fastsList: {
    gap: Spacing.md,
  },
  emptyState: {
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.md,
  },
  insightsSection: {
    gap: Spacing.xl,
  },
  lifetimeStats: {
    gap: Spacing.sm,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statBox: {
    width: "48%",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  insightsList: {
    gap: Spacing.sm,
  },
});
