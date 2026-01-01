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
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";

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
  const { theme } = useTheme();
  const currentStage = getCurrentStage(hoursElapsed);
  const stageInfo = FASTING_STAGES[currentStage];
  
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.3);

  React.useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: stageInfo.color + "18" }]}>
        <Feather name={stageInfo.icon} size={14} color={stageInfo.color} />
        <ThemedText type="caption" style={{ color: stageInfo.color, fontWeight: "700" }}>
          {stageInfo.name}
        </ThemedText>
      </View>
    );
  }

  return (
    <GlassCard accentColor={stageInfo.color}>
      <View style={styles.content}>
        <View style={styles.iconSection}>
          <Animated.View 
            pointerEvents="none"
            style={[
              styles.iconGlow, 
              { backgroundColor: stageInfo.color },
              glowStyle,
            ]} 
          />
          <Animated.View 
            style={[
              styles.iconContainer, 
              { backgroundColor: stageInfo.color },
              Shadows.coloredLg(stageInfo.color),
              pulseStyle,
            ]}
          >
            <Feather name={stageInfo.icon} size={26} color="#FFFFFF" />
          </Animated.View>
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="caption" style={{ color: theme.textSecondary, textTransform: "uppercase" }}>
            Current Stage
          </ThemedText>
          <ThemedText type="h4" style={{ color: stageInfo.color }}>
            {stageInfo.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {stageInfo.description}
          </ThemedText>
        </View>
        <View style={[styles.chevronContainer, { backgroundColor: stageInfo.color + "15" }]}>
          <Feather name="chevron-right" size={20} color={stageInfo.color} />
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconSection: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlow: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
