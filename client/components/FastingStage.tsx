import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
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
    description: "Body is digesting food",
    icon: "coffee",
    minHours: 0,
    color: Colors.light.textSecondary,
  },
  early_fasting: {
    name: "Early Fasting",
    description: "Blood sugar normalizing",
    icon: "trending-down",
    minHours: 4,
    color: "#F59E0B",
  },
  fat_burning: {
    name: "Fat Burning",
    description: "Body starts burning fat",
    icon: "zap",
    minHours: 12,
    color: Colors.light.primary,
  },
  ketosis: {
    name: "Ketosis",
    description: "Significant fat burning",
    icon: "activity",
    minHours: 16,
    color: Colors.light.secondary,
  },
  deep_ketosis: {
    name: "Deep Ketosis",
    description: "Maximum fat oxidation",
    icon: "target",
    minHours: 24,
    color: "#8B5CF6",
  },
  autophagy: {
    name: "Autophagy",
    description: "Cellular regeneration",
    icon: "refresh-cw",
    minHours: 48,
    color: Colors.light.success,
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

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name={stageInfo.icon} size={16} color={stageInfo.color} />
        <ThemedText type="small" style={{ color: stageInfo.color }}>
          {stageInfo.name}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.iconContainer, { backgroundColor: stageInfo.color + "20" }]}>
        <Feather name={stageInfo.icon} size={24} color={stageInfo.color} />
      </View>
      <View style={styles.textContainer}>
        <ThemedText type="body" style={[styles.name, { color: stageInfo.color }]}>
          {stageInfo.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {stageInfo.description}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
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
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: "600",
  },
});
