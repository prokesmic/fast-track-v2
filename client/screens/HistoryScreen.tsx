import React, { useState, useCallback } from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { FastHistoryItem } from "@/components/FastHistoryItem";
import { StatsCard } from "@/components/StatsCard";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

type FilterType = "week" | "month" | "all";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { fasts, stats, refresh } = useFasting();
  const [filter, setFilter] = useState<FilterType>("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const completedFasts = fasts.filter((f) => f.completed && f.endTime);

  const getFilteredFasts = () => {
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
  };

  const filteredFasts = getFilteredFasts();

  const calendarFastDays = completedFasts.map((f) => ({
    date: new Date(f.endTime!).toISOString().split("T")[0],
    completed: true,
    duration: (f.endTime! - f.startTime) / (1000 * 60 * 60),
  }));

  const handleFilterChange = (newFilter: FilterType) => {
    Haptics.selectionAsync();
    setFilter(newFilter);
  };

  const formatTotalHours = (hours: number) => {
    if (hours >= 24) {
      return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
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
      <View style={styles.statsRow}>
        <StatsCard
          icon="clock"
          label="Total Hours"
          value={formatTotalHours(stats.totalHours)}
          iconColor={Colors.light.primary}
        />
        <StatsCard
          icon="zap"
          label="Current Streak"
          value={`${stats.currentStreak}d`}
          iconColor={Colors.light.secondary}
        />
      </View>

      <View
        style={[styles.calendarCard, { backgroundColor: theme.backgroundDefault }]}
      >
        <CalendarHeatmap
          month={selectedMonth}
          fastDays={calendarFastDays}
          onDayPress={(date) => {
            Haptics.selectionAsync();
          }}
        />
      </View>

      <View style={styles.filterContainer}>
        <View style={[styles.filterTabs, { backgroundColor: theme.backgroundDefault }]}>
          {(["week", "month", "all"] as FilterType[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => handleFilterChange(f)}
              style={[
                styles.filterTab,
                filter === f && {
                  backgroundColor: theme.primary,
                },
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

      <View style={styles.historySection}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Past Fasts
        </ThemedText>
        {filteredFasts.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              No completed fasts yet
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Start a fast to see your history here
            </ThemedText>
          </View>
        ) : (
          <View style={styles.historyList}>
            {filteredFasts.map((fast) => (
              <FastHistoryItem
                key={fast.id}
                date={new Date(fast.endTime!)}
                duration={(fast.endTime! - fast.startTime) / (1000 * 60 * 60)}
                targetDuration={fast.targetDuration}
                planName={fast.planName}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  calendarCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
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
  historySection: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginLeft: Spacing.xs,
  },
  historyList: {
    gap: Spacing.sm,
  },
  emptyState: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
});
