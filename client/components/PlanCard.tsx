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
  damping: 15,
  mass: 0.3,
  stiffness: 150,
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
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
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
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText type="h4">{name}</ThemedText>
          <View
            style={[
              styles.badge,
              { backgroundColor: difficultyColors[difficulty] + "20" },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: difficultyColors[difficulty], fontWeight: "600" }}
            >
              {difficulty}
            </ThemedText>
          </View>
        </View>
        <ThemedText
          type="body"
          style={{ color: theme.primary, fontWeight: "600" }}
        >
          {fastingHours}:{eatingHours}
        </ThemedText>
      </View>

      <ThemedText
        type="small"
        style={{ color: theme.textSecondary }}
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
          { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Feather name="play" size={16} color="#FFFFFF" />
        <ThemedText type="body" style={styles.startButtonText}>
          Start
        </ThemedText>
      </Pressable>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
