import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop, LinearGradient } from "react-native-svg";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface GradientBackgroundProps {
  variant?: "home" | "plans" | "history" | "profile" | "modal";
}

export function GradientBackground({ variant = "home" }: GradientBackgroundProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const getGradientConfig = () => {
    switch (variant) {
      case "home":
        return {
          orbs: [
            { cx: "20%", cy: "15%", r: "45%", color: colors.gradientStart, opacity: 0.25 },
            { cx: "80%", cy: "35%", r: "50%", color: colors.gradientMiddle, opacity: 0.2 },
            { cx: "30%", cy: "85%", r: "55%", color: colors.gradientEnd, opacity: 0.15 },
          ],
        };
      case "plans":
        return {
          orbs: [
            { cx: "70%", cy: "10%", r: "40%", color: colors.gradientStart, opacity: 0.2 },
            { cx: "10%", cy: "50%", r: "45%", color: colors.gradientMiddle, opacity: 0.18 },
            { cx: "85%", cy: "90%", r: "35%", color: colors.gradientEnd, opacity: 0.12 },
          ],
        };
      case "history":
        return {
          orbs: [
            { cx: "50%", cy: "5%", r: "40%", color: colors.gradientMiddle, opacity: 0.2 },
            { cx: "15%", cy: "60%", r: "50%", color: colors.gradientStart, opacity: 0.15 },
            { cx: "90%", cy: "75%", r: "30%", color: colors.gradientEnd, opacity: 0.12 },
          ],
        };
      case "profile":
        return {
          orbs: [
            { cx: "80%", cy: "20%", r: "45%", color: colors.gradientEnd, opacity: 0.2 },
            { cx: "20%", cy: "40%", r: "50%", color: colors.gradientMiddle, opacity: 0.18 },
            { cx: "60%", cy: "95%", r: "35%", color: colors.gradientStart, opacity: 0.12 },
          ],
        };
      case "modal":
        return {
          orbs: [
            { cx: "30%", cy: "20%", r: "50%", color: colors.gradientStart, opacity: 0.3 },
            { cx: "70%", cy: "50%", r: "55%", color: colors.gradientMiddle, opacity: 0.25 },
            { cx: "40%", cy: "85%", r: "45%", color: colors.gradientEnd, opacity: 0.2 },
          ],
        };
      default:
        return { orbs: [] };
    }
  };

  const config = getGradientConfig();
  const baseColor = colorScheme === "dark" ? "#0F172A" : "#F8FAFC";

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          {config.orbs.map((orb, index) => (
            <RadialGradient
              key={`grad-${index}`}
              id={`gradient-${index}`}
              cx={orb.cx}
              cy={orb.cy}
              rx={orb.r}
              ry={orb.r}
            >
              <Stop offset="0%" stopColor={orb.color} stopOpacity={orb.opacity} />
              <Stop offset="100%" stopColor={orb.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={baseColor} />
        {config.orbs.map((_, index) => (
          <Rect
            key={`rect-${index}`}
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#gradient-${index})`}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
