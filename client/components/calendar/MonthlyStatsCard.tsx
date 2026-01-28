/**
 * MonthlyStatsCard Component
 * Display monthly fasting statistics
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { MonthlyStats } from "@/lib/calendar";

interface MonthlyStatsCardProps {
  stats: MonthlyStats;
  monthTitle: string;
}

export default function MonthlyStatsCard({
  stats,
  monthTitle,
}: MonthlyStatsCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.cardBackground }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        {monthTitle} Summary
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View
            style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}
          >
            <Feather name="check-circle" size={18} color={theme.primary} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats.totalFasts}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Fasts
          </Text>
        </View>

        <View style={styles.statItem}>
          <View
            style={[styles.iconContainer, { backgroundColor: theme.success + "20" }]}
          >
            <Feather name="clock" size={18} color={theme.success} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats.totalHours}h
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Total
          </Text>
        </View>

        <View style={styles.statItem}>
          <View
            style={[styles.iconContainer, { backgroundColor: theme.secondary + "20" }]}
          >
            <Feather name="bar-chart-2" size={18} color={theme.secondary} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats.averageDuration}h
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Average
          </Text>
        </View>

        <View style={styles.statItem}>
          <View
            style={[styles.iconContainer, { backgroundColor: "#F59E0B20" }]}
          >
            <Feather name="target" size={18} color="#F59E0B" />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats.completionRate}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Goal Rate
          </Text>
        </View>
      </View>

      {stats.bestDay && (
        <View
          style={[styles.bestDayContainer, { backgroundColor: theme.primary + "10" }]}
        >
          <Feather name="award" size={16} color={theme.primary} />
          <Text style={[styles.bestDayText, { color: theme.text }]}>
            Best day: {formatDate(stats.bestDay)} ({stats.bestDayHours}h)
          </Text>
        </View>
      )}
    </View>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  bestDayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  bestDayText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
