/**
 * CalendarView Component
 * Monthly calendar view showing fasting history
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { CalendarDay } from "@/lib/calendar";

interface CalendarViewProps {
  year: number;
  month: number;
  calendarData: Map<string, CalendarDay>;
  streakDays: Set<string>;
  onDayPress?: (day: CalendarDay) => void;
  monthTitle: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  isCurrentMonth: boolean;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DAY_SIZE = (SCREEN_WIDTH - 48) / 7;

export default function CalendarView({
  year,
  month,
  calendarData,
  streakDays,
  onDayPress,
  monthTitle,
  onPrevMonth,
  onNextMonth,
  onToday,
  isCurrentMonth,
}: CalendarViewProps) {
  const { theme } = useTheme();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Today's date
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Generate calendar grid
  const calendarDays: (CalendarDay | null)[] = [];

  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayData = calendarData.get(dateStr);
    calendarDays.push(
      dayData || {
        date: dateStr,
        fasts: [],
        totalHours: 0,
        completed: 0,
      }
    );
  }

  const handleDayPress = (day: CalendarDay) => {
    setSelectedDay(day.date);
    onDayPress?.(day);
  };

  const getDayIntensity = (hours: number): string => {
    if (hours === 0) return "transparent";
    if (hours < 12) return theme.primary + "30";
    if (hours < 18) return theme.primary + "50";
    if (hours < 24) return theme.primary + "70";
    return theme.primary + "90";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navButton}>
          <Feather name="chevron-left" size={24} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onToday}>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {monthTitle}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNextMonth} style={styles.navButton}>
          <Feather name="chevron-right" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Today button (if not current month) */}
      {!isCurrentMonth && (
        <TouchableOpacity
          onPress={onToday}
          style={[styles.todayButton, { backgroundColor: theme.primary + "20" }]}
        >
          <Text style={[styles.todayButtonText, { color: theme.primary }]}>
            Jump to Today
          </Text>
        </TouchableOpacity>
      )}

      {/* Weekday headers */}
      <View style={styles.weekdayHeader}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: theme.textSecondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const dayNumber = parseInt(day.date.split("-")[2], 10);
          const isToday = day.date === todayStr;
          const isSelected = day.date === selectedDay;
          const hasStreak = streakDays.has(day.date);
          const intensity = getDayIntensity(day.totalHours);

          return (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dayCell,
                { backgroundColor: intensity },
                isToday && styles.todayCell,
                isToday && { borderColor: theme.primary },
                isSelected && styles.selectedCell,
                isSelected && { borderColor: theme.text },
              ]}
              onPress={() => handleDayPress(day)}
            >
              <Text
                style={[
                  styles.dayNumber,
                  { color: day.totalHours > 12 ? "#fff" : theme.text },
                  isToday && { color: theme.primary, fontWeight: "700" },
                ]}
              >
                {dayNumber}
              </Text>

              {day.completed > 0 && (
                <View style={styles.indicators}>
                  {Array.from({ length: Math.min(day.completed, 3) }).map(
                    (_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              day.totalHours > 12 ? "#fff" : theme.primary,
                          },
                        ]}
                      />
                    )
                  )}
                </View>
              )}

              {hasStreak && day.completed > 0 && (
                <View
                  style={[
                    styles.streakIndicator,
                    { backgroundColor: theme.success },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: theme.primary + "30" }]}
          />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            {"<12h"}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: theme.primary + "60" }]}
          />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            12-18h
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: theme.primary + "90" }]}
          />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            {">18h"}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendStreak, { backgroundColor: theme.success }]}
          />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Streak
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  todayButton: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  weekdayHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayCell: {
    width: DAY_SIZE,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  todayCell: {
    borderWidth: 2,
  },
  selectedCell: {
    borderWidth: 1,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
  },
  indicators: {
    flexDirection: "row",
    position: "absolute",
    bottom: 4,
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  streakIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendStreak: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
});
