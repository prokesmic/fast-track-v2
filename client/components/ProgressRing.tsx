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
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Shadows, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { safeHaptics } from "@/lib/platform";

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
  { hours: 4, icon: "trending-down", color: "#34D399", name: "Blood Sugar Fall", description: "Blood sugar normalizes as digestive system rests." },
  { hours: 8, icon: "sun", color: "#FBBF24", name: "Fat Burning", description: "Body begins to access fat stores for energy." },
  { hours: 12, icon: "zap", color: "#F87171", name: "Ketosis", description: "Deep fat burning state with ketone production." },
  { hours: 18, icon: "refresh-cw", color: "#A78BFA", name: "Autophagy", description: "Cellular cleaning and repair mechanisms activate." },
  { hours: 24, icon: "shield", color: "#818CF8", name: "Deep Autophagy", description: "Peak autophagy and immune regeneration." },
  { hours: 48, icon: "activity", color: "#F472B6", name: "Growth Hormone", description: "HGH levels peak for deep tissue repair." },
];

interface MilestoneIconProps {
  milestone: Milestone;
  isPassed: boolean;
  x: number;
  y: number;
  onPress: () => void;
}

function MilestoneIcon({ milestone, isPassed, x, y, onPress }: MilestoneIconProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isPassed) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isPassed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.milestoneContainer, { left: x - 18, top: y - 18 }]}>
      {isPassed ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.milestoneGlow,
            { backgroundColor: milestone.color },
            glowStyle,
          ]}
        />
      ) : null}
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.85); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[
          styles.milestone,
          {
            backgroundColor: isPassed ? milestone.color : theme.backgroundSecondary,
          },
          isPassed ? Shadows.coloredLg(milestone.color) : {},
          animatedStyle,
        ]}
        hitSlop={8}
      >
        <Feather
          name={milestone.icon as any}
          size={18}
          color={isPassed ? "#FFFFFF" : theme.textTertiary}
        />
      </AnimatedPressable>
    </View>
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
  const milestoneRadius = radius;

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
    // If targetHours is very small (unlikely), ensure we don't divide by zero
    const totalHours = Math.max(targetHours, 1);
    const progressFraction = Math.min(hours / totalHours, 1);
    const angle = progressFraction * 360 - 90;
    const radian = (angle * Math.PI) / 180;
    const centerX = size / 2 + 36;
    const centerY = size / 2 + 36;
    return {
      x: centerX + milestoneRadius * Math.cos(radian),
      y: centerY + milestoneRadius * Math.sin(radian),
    };
  };

  const visibleMilestones = showMilestones
    ? RING_MILESTONES.filter((m) => m.hours <= targetHours)
    : [];

  const handleMilestonePress = (milestone: Milestone) => {
    safeHaptics.impactAsync();
    onMilestonePress?.(milestone);
  };

  return (
    <View style={[styles.container, { width: size + 72, height: size + 72 }]}>
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        <View
          style={[
            styles.innerGlow,
            {
              width: size - strokeWidth * 2 - 24,
              height: size - strokeWidth * 2 - 24,
              borderRadius: (size - strokeWidth * 2 - 24) / 2,
              backgroundColor: isDark ? colors.primary + "08" : colors.primary + "06",
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
              <Stop offset="0%" stopColor={isDark ? "#334155" : "#E2E8F0"} stopOpacity={0.6} />
              <Stop offset="100%" stopColor={isDark ? "#475569" : "#CBD5E1"} stopOpacity={0.4} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#trackGradient)"
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
    top: 36,
    left: 36,
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
  milestoneContainer: {
    position: "absolute",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneGlow: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  milestone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
