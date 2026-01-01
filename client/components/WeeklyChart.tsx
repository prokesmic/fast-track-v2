import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface DayData {
  day: string;
  hours: number;
  target: number;
  completed: boolean;
}

interface WeeklyChartProps {
  data: DayData[];
  maxHours?: number;
}

function AnimatedBar({
  hours,
  target,
  maxHours,
  completed,
  index,
}: {
  hours: number;
  target: number;
  maxHours: number;
  completed: boolean;
  index: number;
}) {
  const { theme } = useTheme();
  const height = (hours / maxHours) * 100;
  const targetHeight = (target / maxHours) * 100;

  const animatedStyle = useAnimatedStyle(() => ({
    height: withDelay(
      index * 50,
      withSpring(`${height}%`, { damping: 15, stiffness: 150 })
    ),
  }));

  return (
    <View style={styles.barWrapper}>
      <View style={[styles.barContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <View
          style={[
            styles.targetLine,
            {
              bottom: `${targetHeight}%`,
              backgroundColor: theme.textSecondary,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: completed ? Colors.light.primary : Colors.light.primary + "50",
            },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

export function WeeklyChart({ data, maxHours = 24 }: WeeklyChartProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.header}>
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          This Week
        </ThemedText>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.light.primary }]} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Fasted
            </ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: theme.textSecondary }]} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Target
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.chartArea}>
        <View style={styles.yAxis}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {maxHours}h
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {maxHours / 2}h
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            0h
          </ThemedText>
        </View>

        <View style={styles.barsContainer}>
          {data.map((day, index) => (
            <View key={day.day} style={styles.dayColumn}>
              <AnimatedBar
                hours={day.hours}
                target={day.target}
                maxHours={maxHours}
                completed={day.completed}
                index={index}
              />
              <ThemedText
                type="small"
                style={{
                  color: day.completed ? theme.text : theme.textSecondary,
                  fontWeight: day.completed ? "600" : "400",
                  marginTop: Spacing.sm,
                }}
              >
                {day.day}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legend: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  chartArea: {
    flexDirection: "row",
    height: 140,
  },
  yAxis: {
    width: 30,
    justifyContent: "space-between",
    paddingBottom: Spacing.lg + Spacing.sm,
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
  },
  dayColumn: {
    alignItems: "center",
    flex: 1,
  },
  barWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    paddingHorizontal: 4,
  },
  barContainer: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: BorderRadius.sm,
  },
  targetLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
});
