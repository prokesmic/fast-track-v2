import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: "light" | "medium" | "strong" | "none";
  noPadding?: boolean;
  accentColor?: string;
}

export function GlassCard({ 
  children, 
  style, 
  intensity = "medium",
  noPadding = false,
  accentColor,
}: GlassCardProps) {
  const { theme, colorScheme } = useTheme();
  
  const useBlur = intensity !== "none";
  const blurIntensity = {
    light: 30,
    medium: 50,
    strong: 70,
    none: 0,
  }[intensity];

  return (
    <View style={[styles.container, Shadows.md, style]}>
      {useBlur ? (
        <BlurView
          intensity={blurIntensity}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View 
        style={[
          styles.overlay, 
          { backgroundColor: useBlur ? theme.glassBg : theme.cardBackground },
        ]} 
      />
      <View 
        style={[
          styles.border, 
          { borderColor: theme.cardBorder },
        ]} 
      />
      {accentColor ? (
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={[styles.content, noPadding && styles.noPadding]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
  },
  content: {
    padding: Spacing.xl,
    position: "relative",
  },
  noPadding: {
    padding: 0,
  },
});
