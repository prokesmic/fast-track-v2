import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop, G } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  withTiming,
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Shadows, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface Milestone {
  hours: number;
  icon: string;
  color: string;
  name: string;
  description: string;
}

export const RING_MILESTONES: Milestone[] = [
  { hours: 2, icon: "trending-down", color: "#F97316", name: "Blood Sugar Drop", description: "Blood sugar levels decline, triggering glycogen release" },
  { hours: 5, icon: "battery", color: "#EAB308", name: "Glycogen Depletion", description: "Liver glycogen stores begin to empty" },
  { hours: 8, icon: "moon", color: "#8B5CF6", name: "Fasting State", description: "Body enters true fasting mode" },
  { hours: 12, icon: "zap", color: "#F59E0B", name: "Fat Burning", description: "Fat becomes primary energy source" },
  { hours: 18, icon: "thermometer", color: "#EF4444", name: "Ketosis", description: "Ketone production increases significantly" },
  { hours: 24, icon: "refresh-cw", color: "#8B5CF6", name: "Autophagy", description: "Cellular cleanup and repair begins" },
  { hours: 48, icon: "arrow-up-circle", color: "#06B6D4", name: "Growth Hormone", description: "Growth hormone levels surge" },
  { hours: 72, icon: "shield", color: Colors.light.success, name: "Immune Reset", description: "Immune system regeneration begins" },
];

interface MilestoneIconProps {
  milestone: Milestone;
  isPassed: boolean;
  x: number;
  y: number;
  onPress: () => void;
}

function MilestoneIcon({ milestone, isPassed, x, y, onPress }: MilestoneIconProps) {
  const { theme, colorScheme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.85); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[
        styles.milestone,
        {
          left: x - 16,
          top: y - 16,
          backgroundColor: isPassed ? milestone.color + "20" : theme.backgroundSecondary,
          borderColor: isPassed ? milestone.color : theme.backgroundTertiary,
        },
        animatedStyle,
      ]}
      hitSlop={8}
    >
      <Feather
        name={milestone.icon as any}
        size={16}
        color={isPassed ? milestone.color : theme.textTertiary}
      />
    </AnimatedPressable>
  );
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  targetHours?: number;
  elapsedHours?: number;
  showMilestones?: boolean;
  onMilestonePress?: (milestone: Milestone) => void;
}

export function ProgressRing({
  progress,
  size = 280,
  strokeWidth = 18,
  children,
  targetHours = 16,
  elapsedHours = 0,
  showMilestones = false,
  onMilestonePress,
}: ProgressRingProps) {
  const { theme, isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const milestoneRadius = radius + strokeWidth / 2 + 28;

  const animatedProps = useAnimatedProps(() => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    return {
      strokeDashoffset: withTiming(
        circumference - clampedProgress * circumference,
        { duration: 800, easing: Easing.out(Easing.cubic) }
      ),
    };
  }, [progress, circumference]);

  const getMilestonePosition = (hours: number) => {
    const maxHours = Math.max(targetHours, 72);
    const progressFraction = Math.min(hours / maxHours, 1);
    const angle = progressFraction * 360 - 90;
    const radian = (angle * Math.PI) / 180;
    const centerX = size / 2 + 32;
    const centerY = size / 2 + 32;
    return {
      x: centerX + milestoneRadius * Math.cos(radian),
      y: centerY + milestoneRadius * Math.sin(radian),
    };
  };

  const visibleMilestones = showMilestones
    ? RING_MILESTONES.filter((m) => m.hours <= Math.max(targetHours, 72))
    : [];

  const handleMilestonePress = (milestone: Milestone) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMilestonePress?.(milestone);
  };

  return (
    <View style={[styles.container, { width: size + 64, height: size + 64 }]}>
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        <View
          style={[
            styles.innerGlow,
            {
              width: size - strokeWidth * 2 - 20,
              height: size - strokeWidth * 2 - 20,
              borderRadius: (size - strokeWidth * 2 - 20) / 2,
              backgroundColor: isDark ? colors.primary + "08" : colors.primary + "05",
            },
          ]}
        />
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.gradientStart} />
              <Stop offset="50%" stopColor={colors.gradientMiddle} />
              <Stop offset="100%" stopColor={colors.gradientEnd} />
            </LinearGradient>
            <LinearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={isDark ? colors.backgroundSecondary : "#E5E7EB"} />
              <Stop offset="100%" stopColor={isDark ? colors.backgroundTertiary : "#D1D5DB"} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#trackGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.5}
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.content}>{children}</View>
      </View>

      {visibleMilestones.map((milestone) => {
        const pos = getMilestonePosition(milestone.hours);
        const isPassed = elapsedHours >= milestone.hours;

        return (
          <MilestoneIcon
            key={milestone.hours}
            milestone={milestone}
            isPassed={isPassed}
            x={pos.x}
            y={pos.y}
            onPress={() => handleMilestonePress(milestone)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ringContainer: {
    position: "absolute",
    top: 32,
    left: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  innerGlow: {
    position: "absolute",
  },
  svg: {
    position: "absolute",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  milestone: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
});
