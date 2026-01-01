import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface FastDay {
  date: string;
  completed: boolean;
  duration?: number;
}

interface CalendarHeatmapProps {
  month: Date;
  fastDays: FastDay[];
  onDayPress?: (date: string) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const days: Date[] = [];
  
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(new Date(year, month, -firstDay.getDay() + i + 1));
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }
  
  return days;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function CalendarHeatmap({
  month,
  fastDays,
  onDayPress,
}: CalendarHeatmapProps) {
  const { theme, isDark } = useTheme();
  const days = getDaysInMonth(month);
  const currentMonth = month.getMonth();

  const getFastInfo = (date: Date): FastDay | undefined => {
    const dateStr = formatDate(date);
    return fastDays.find((fd) => fd.date === dateStr);
  };

  const getIntensity = (fastDay?: FastDay): number => {
    if (!fastDay || !fastDay.completed) return 0;
    if (!fastDay.duration) return 0.5;
    if (fastDay.duration >= 24) return 1;
    if (fastDay.duration >= 18) return 0.8;
    if (fastDay.duration >= 14) return 0.6;
    return 0.4;
  };

  const monthName = month.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <View style={styles.container}>
      <ThemedText type="h4" style={styles.monthTitle}>
        {monthName}
      </ThemedText>

      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {day}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentMonth;
          const fastInfo = getFastInfo(date);
          const intensity = getIntensity(fastInfo);
          const isToday = formatDate(date) === formatDate(new Date());

          return (
            <Pressable
              key={index}
              onPress={() => isCurrentMonth && onDayPress?.(formatDate(date))}
              style={({ pressed }) => [
                styles.dayCell,
                {
                  backgroundColor:
                    intensity > 0
                      ? Colors.light.primary + Math.round(intensity * 255).toString(16).padStart(2, "0")
                      : theme.backgroundSecondary,
                  opacity: isCurrentMonth ? (pressed ? 0.7 : 1) : 0.3,
                  borderWidth: isToday ? 2 : 0,
                  borderColor: theme.primary,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: intensity > 0.5 ? "#FFFFFF" : theme.text,
                  fontWeight: isToday ? "700" : "400",
                }}
              >
                {date.getDate()}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  monthTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.xs,
  },
});
