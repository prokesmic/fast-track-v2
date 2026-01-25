import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { safeHaptics } from "@/lib/platform";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Shadows } from "@/constants/theme";

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
}

const springConfig: WithSpringConfig = {
  damping: 12,
  mass: 0.5,
  stiffness: 180,
};

const FAB_SIZE = 72;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FAB({ onPress, icon = "plus" }: FABProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    safeHaptics.impactAsync();
    onPress();
  };

  return (
    <View style={styles.container}>
      <Animated.View pointerEvents="none" style={[styles.pulse, pulseStyle]}>
        <Svg width={FAB_SIZE} height={FAB_SIZE}>
          <Defs>
            <LinearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.gradientStart} stopOpacity={1} />
              <Stop offset="100%" stopColor={colors.gradientMiddle} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={FAB_SIZE / 2}
            cy={FAB_SIZE / 2}
            r={FAB_SIZE / 2}
            fill="url(#pulseGrad)"
          />
        </Svg>
      </Animated.View>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.fab,
          Shadows.xl,
          animatedStyle,
        ]}
      >
        <Svg width={FAB_SIZE} height={FAB_SIZE} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="fabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.gradientStart} stopOpacity={1} />
              <Stop offset="50%" stopColor={colors.gradientMiddle} stopOpacity={1} />
              <Stop offset="100%" stopColor={colors.gradientEnd} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={FAB_SIZE / 2}
            cy={FAB_SIZE / 2}
            r={FAB_SIZE / 2}
            fill="url(#fabGrad)"
          />
        </Svg>
        <View style={styles.iconContainer}>
          <Feather name={icon} size={30} color="#FFFFFF" />
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
