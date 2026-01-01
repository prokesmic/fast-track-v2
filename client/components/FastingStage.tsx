import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useSharedValue,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

export type FastingStageType = 
  | "feeding"
  | "early_fasting"
  | "fat_burning"
  | "ketosis"
  | "deep_ketosis"
  | "autophagy";

interface FastingStageInfo {
  name: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  minHours: number;
  color: string;
}

export const FASTING_STAGES: Record<FastingStageType, FastingStageInfo> = {
  feeding: {
    name: "Fed State",
    description: "Body is digesting food and storing energy",
    icon: "coffee",
    minHours: 0,
    color: "#64748B",
  },
  early_fasting: {
    name: "Early Fasting",
    description: "Blood sugar normalizing, glycogen being used",
    icon: "trending-down",
    minHours: 4,
    color: "#F59E0B",
  },
  fat_burning: {
    name: "Fat Burning",
    description: "Body starts burning fat for energy",
    icon: "zap",
    minHours: 12,
    color: "#14B8A6",
  },
  ketosis: {
    name: "Ketosis",
    description: "Significant ketone production begins",
    icon: "activity",
    minHours: 16,
    color: "#8B5CF6",
  },
  deep_ketosis: {
    name: "Deep Ketosis",
    description: "Maximum fat oxidation and mental clarity",
    icon: "target",
    minHours: 24,
    color: "#6366F1",
  },
  autophagy: {
    name: "Autophagy",
    description: "Cellular cleanup and regeneration",
    icon: "refresh-cw",
    minHours: 48,
    color: "#10B981",
  },
};

export function getCurrentStage(hoursElapsed: number): FastingStageType {
  if (hoursElapsed >= 48) return "autophagy";
  if (hoursElapsed >= 24) return "deep_ketosis";
  if (hoursElapsed >= 16) return "ketosis";
  if (hoursElapsed >= 12) return "fat_burning";
  if (hoursElapsed >= 4) return "early_fasting";
  return "feeding";
}

interface FastingStageIndicatorProps {
  hoursElapsed: number;
  compact?: boolean;
}

export function FastingStageIndicator({
  hoursElapsed,
  compact = false,
}: FastingStageIndicatorProps) {
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const currentStage = getCurrentStage(hoursElapsed);
  const stageInfo = FASTING_STAGES[currentStage];
  
  const pulseAnim = useSharedValue(1);

  React.useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: stageInfo.color + "15" }]}>
        <Feather name={stageInfo.icon} size={14} color={stageInfo.color} />
        <ThemedText type="small" style={{ color: stageInfo.color, fontWeight: "600" }}>
          {stageInfo.name}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.leftSection}>
        <Animated.View 
          style={[
            styles.iconContainer, 
            { backgroundColor: stageInfo.color + "15" },
            pulseStyle,
          ]}
        >
          <Feather name={stageInfo.icon} size={24} color={stageInfo.color} />
        </Animated.View>
        <View style={styles.textContainer}>
          <View style={styles.stageLabel}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              CURRENT STAGE
            </ThemedText>
          </View>
          <ThemedText type="h4" style={{ color: stageInfo.color }}>
            {stageInfo.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {stageInfo.description}
          </ThemedText>
        </View>
      </View>
      <View style={[styles.chevronContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  stageLabel: {
    marginBottom: 2,
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
