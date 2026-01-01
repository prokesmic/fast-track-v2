import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface PlanCardProps {
  name: string;
  fastingHours: number;
  eatingHours: number;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  onPress: () => void;
  onStartPress: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 12,
  mass: 0.3,
  stiffness: 180,
};

const difficultyColors = {
  Easy: Colors.light.success,
  Medium: "#F59E0B",
  Hard: "#F97316",
  Expert: Colors.light.destructive,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PlanCard({
  name,
  fastingHours,
  eatingHours,
  description,
  difficulty,
  onPress,
  onStartPress,
}: PlanCardProps) {
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <ThemedText type="h3">{name}</ThemedText>
            </View>
            <View style={styles.timeBadges}>
              <View style={[styles.timeBadge, { backgroundColor: colors.primary + "12" }]}>
                <Feather name="moon" size={14} color={colors.primary} />
                <ThemedText type="small" style={{ color: colors.primary, fontWeight: "600" }}>
                  {fastingHours}h fast
                </ThemedText>
              </View>
              <View style={[styles.timeBadge, { backgroundColor: colors.success + "12" }]}>
                <Feather name="sun" size={14} color={colors.success} />
                <ThemedText type="small" style={{ color: colors.success, fontWeight: "600" }}>
                  {eatingHours}h eat
                </ThemedText>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: difficultyColors[difficulty] + "15" },
            ]}
          >
            <ThemedText
              type="caption"
              style={{ color: difficultyColors[difficulty], fontWeight: "600" }}
            >
              {difficulty}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          type="body"
          style={{ color: theme.textSecondary, lineHeight: 22 }}
          numberOfLines={2}
        >
          {description}
        </ThemedText>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onStartPress();
          }}
          style={({ pressed }) => [
            styles.startButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Feather name="play" size={18} color="#FFFFFF" />
          <ThemedText type="bodyMedium" style={styles.startButtonText}>
            Start This Plan
          </ThemedText>
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleSection: {
    flex: 1,
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timeBadges: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  startButtonText: {
    color: "#FFFFFF",
  },
});
