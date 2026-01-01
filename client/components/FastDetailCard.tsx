import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface FastDetailCardProps {
  date: Date;
  duration: number;
  targetDuration: number;
  planName: string;
  note?: string;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FastDetailCard({
  date,
  duration,
  targetDuration,
  planName,
  note,
  onPress,
}: FastDetailCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const completed = duration >= targetDuration;
  const percentage = Math.min((duration / targetDuration) * 100, 100);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatDate = (d: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getStageReached = (hours: number) => {
    if (hours >= 24) return { name: "Deep Autophagy", color: "#7C3AED", icon: "star" as const };
    if (hours >= 18) return { name: "Autophagy", color: "#8B5CF6", icon: "refresh-cw" as const };
    if (hours >= 12) return { name: "Ketosis", color: Colors.light.primary, icon: "zap" as const };
    if (hours >= 8) return { name: "Fat Burning", color: "#F59E0B", icon: "activity" as const };
    return { name: "Early Fast", color: "#64748B", icon: "clock" as const };
  };

  const stage = getStageReached(duration);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.dateRow}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {formatDate(date)}
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: completed
                  ? Colors.light.success + "15"
                  : Colors.light.secondary + "15",
              },
            ]}
          >
            <Feather
              name={completed ? "check-circle" : "clock"}
              size={12}
              color={completed ? Colors.light.success : Colors.light.secondary}
            />
            <ThemedText
              type="small"
              style={{
                color: completed ? Colors.light.success : Colors.light.secondary,
                fontWeight: "600",
              }}
            >
              {completed ? "Completed" : `${Math.round(percentage)}%`}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {planName}
        </ThemedText>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Duration
          </ThemedText>
          <ThemedText type="h4" style={{ color: theme.text }}>
            {formatDuration(duration)}
          </ThemedText>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.backgroundTertiary }]} />
        <View style={styles.stat}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Target
          </ThemedText>
          <ThemedText type="h4" style={{ color: theme.text }}>
            {formatDuration(targetDuration)}
          </ThemedText>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.backgroundTertiary }]} />
        <View style={styles.stat}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Stage
          </ThemedText>
          <View style={styles.stageRow}>
            <View style={[styles.stageIcon, { backgroundColor: stage.color + "20" }]}>
              <Feather name={stage.icon} size={12} color={stage.color} />
            </View>
            <ThemedText type="small" style={{ color: stage.color, fontWeight: "600" }}>
              {stage.name}
            </ThemedText>
          </View>
        </View>
      </View>

      {note ? (
        <View style={[styles.noteContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="file-text" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }} numberOfLines={1}>
            {note}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: completed ? Colors.light.success : Colors.light.primary,
            },
          ]}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.xs,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  divider: {
    width: 1,
    height: 32,
    borderRadius: 0.5,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  stageIcon: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});
