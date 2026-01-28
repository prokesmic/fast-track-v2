import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ENV, currentEnvConfig } from "@/lib/environment";

/**
 * Shows a floating badge indicating the current environment.
 * Only visible in non-production environments (staging, development).
 */
export function EnvironmentBadge() {
  const insets = useSafeAreaInsets();

  // Don't show in production
  if (!currentEnvConfig.showBadge) {
    return null;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          top: insets.top + 4,
          backgroundColor: currentEnvConfig.color,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text}>{currentEnvConfig.shortName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 9999,
    elevation: 9999,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
