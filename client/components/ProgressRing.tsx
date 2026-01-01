import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Feather } from "@expo/vector-icons";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Milestone {
  hours: number;
  icon: string;
  color: string;
}

const FASTING_MILESTONES: Milestone[] = [
  { hours: 12, icon: "zap", color: "#F59E0B" },
  { hours: 16, icon: "activity", color: Colors.light.primary },
  { hours: 18, icon: "thermometer", color: "#EF4444" },
  { hours: 24, icon: "refresh-cw", color: "#8B5CF6" },
  { hours: 48, icon: "arrow-up-circle", color: "#06B6D4" },
  { hours: 72, icon: "shield", color: Colors.light.success },
];

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  targetHours?: number;
  elapsedHours?: number;
  showMilestones?: boolean;
}

export function ProgressRing({
  progress,
  size = 280,
  strokeWidth = 16,
  children,
  targetHours = 16,
  elapsedHours = 0,
  showMilestones = false,
}: ProgressRingProps) {
  const { theme, isDark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const milestoneIconSize = 28;

  const animatedProps = useAnimatedProps(() => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    return {
      strokeDashoffset: withTiming(
        circumference - clampedProgress * circumference,
        { duration: 500, easing: Easing.out(Easing.quad) }
      ),
    };
  }, [progress, circumference]);

  const getMilestonePosition = (hours: number) => {
    const progressFraction = hours / targetHours;
    const angle = progressFraction * 360 - 90;
    const radian = (angle * Math.PI) / 180;
    return {
      x: size / 2 + radius * Math.cos(radian),
      y: size / 2 + radius * Math.sin(radian),
    };
  };

  const visibleMilestones = showMilestones
    ? FASTING_MILESTONES.filter((m) => m.hours <= targetHours && m.hours > 0)
    : [];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.light.primary} />
            <Stop offset="100%" stopColor={Colors.light.secondary} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundSecondary}
          strokeWidth={strokeWidth}
          fill="none"
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

      {visibleMilestones.map((milestone) => {
        const pos = getMilestonePosition(milestone.hours);
        const isPassed = elapsedHours >= milestone.hours;

        return (
          <View
            key={milestone.hours}
            style={[
              styles.milestone,
              {
                width: milestoneIconSize,
                height: milestoneIconSize,
                borderRadius: milestoneIconSize / 2,
                left: pos.x - milestoneIconSize / 2,
                top: pos.y - milestoneIconSize / 2,
                backgroundColor: isPassed
                  ? milestone.color
                  : theme.backgroundDefault,
                borderWidth: 2,
                borderColor: isPassed ? milestone.color : theme.backgroundSecondary,
              },
            ]}
          >
            <Feather
              name={milestone.icon as any}
              size={12}
              color={isPassed ? "#FFFFFF" : theme.textSecondary}
            />
          </View>
        );
      })}

      {visibleMilestones.map((milestone) => {
        const pos = getMilestonePosition(milestone.hours);
        const isPassed = elapsedHours >= milestone.hours;
        const labelOffset = 22;
        const progressFraction = milestone.hours / targetHours;
        const angle = progressFraction * 360 - 90;
        const radian = (angle * Math.PI) / 180;
        const labelX = size / 2 + (radius + labelOffset) * Math.cos(radian);
        const labelY = size / 2 + (radius + labelOffset) * Math.sin(radian);

        return (
          <ThemedText
            key={`label-${milestone.hours}`}
            style={[
              styles.milestoneLabel,
              {
                left: labelX - 14,
                top: labelY - 8,
                color: isPassed ? milestone.color : theme.textSecondary,
              },
            ]}
          >
            {milestone.hours}h
          </ThemedText>
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
  svg: {
    position: "absolute",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  milestone: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  milestoneLabel: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    width: 28,
  },
});
