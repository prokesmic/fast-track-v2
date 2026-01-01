import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface FastHistoryItemProps {
  date: Date;
  duration: number;
  targetDuration: number;
  planName: string;
  onPress?: () => void;
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function FastHistoryItem({
  date,
  duration,
  targetDuration,
  planName,
  onPress,
}: FastHistoryItemProps) {
  const { theme } = useTheme();
  const completed = duration >= targetDuration;
  const percentage = Math.min((duration / targetDuration) * 100, 100);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.statusIcon,
            {
              backgroundColor: completed
                ? Colors.light.success + "20"
                : Colors.light.textSecondary + "20",
            },
          ]}
        >
          <Feather
            name={completed ? "check-circle" : "clock"}
            size={20}
            color={completed ? Colors.light.success : theme.textSecondary}
          />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {planName}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {formatDate(date)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.rightSection}>
        <ThemedText
          type="body"
          style={{
            color: completed ? Colors.light.success : theme.text,
            fontWeight: "600",
          }}
        >
          {formatDuration(duration)}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          / {formatDuration(targetDuration)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    gap: 2,
  },
  rightSection: {
    alignItems: "flex-end",
  },
});
