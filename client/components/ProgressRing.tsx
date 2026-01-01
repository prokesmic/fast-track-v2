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
import { Feather } from "@expo/vector-icons";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Milestone {
  hours: number;
  icon: string;
  color: string;
}

const FASTING_MILESTONES: Milestone[] = [
  { hours: 12, icon: "droplet", color: "#3B82F6" },
  { hours: 14, icon: "zap", color: "#F59E0B" },
  { hours: 16, icon: "activity", color: Colors.light.primary },
  { hours: 18, icon: "thermometer", color: "#EF4444" },
  { hours: 20, icon: "settings", color: "#6B7280" },
  { hours: 22, icon: "edit-3", color: "#8B5CF6" },
  { hours: 24, icon: "refresh-cw", color: "#8B5CF6" },
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
  strokeWidth = 20,
  children,
  targetHours = 16,
  elapsedHours = 0,
  showMilestones = false,
}: ProgressRingProps) {
  const { theme, isDark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const milestoneRadius = radius + strokeWidth / 2 + 24;

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
    const centerX = size / 2 + 30;
    const centerY = size / 2 + 30;
    return {
      x: centerX + milestoneRadius * Math.cos(radian),
      y: centerY + milestoneRadius * Math.sin(radian),
    };
  };

  const visibleMilestones = showMilestones
    ? FASTING_MILESTONES.filter((m) => m.hours <= targetHours && m.hours > 0)
    : [];

  return (
    <View style={[styles.container, { width: size + 60, height: size + 60 }]}>
      <View style={[styles.ringContainer, { width: size, height: size }]}>
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
            stroke={isDark ? Colors.dark.backgroundSecondary : "#E5E7EB"}
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
      </View>

      {visibleMilestones.map((milestone) => {
        const pos = getMilestonePosition(milestone.hours);
        const isPassed = elapsedHours >= milestone.hours;
        const isActive = elapsedHours >= milestone.hours - 2 && elapsedHours < milestone.hours + 2;

        return (
          <View
            key={milestone.hours}
            style={[
              styles.milestone,
              {
                left: pos.x - 14,
                top: pos.y - 14,
              },
            ]}
          >
            <Feather
              name={milestone.icon as any}
              size={20}
              color={isPassed || isActive ? milestone.color : "#9CA3AF"}
            />
          </View>
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
    top: 30,
    left: 30,
    alignItems: "center",
    justifyContent: "center",
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
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
