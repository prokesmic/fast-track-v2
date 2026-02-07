import React from "react";
import { View, StyleSheet, Image, Dimensions } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Button } from "../Button";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";

interface WelcomeStepProps {
  onContinue: () => void;
}

const { width } = Dimensions.get("window");

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="clock" size={64} color={theme.primary} />
        </View>

        <ThemedText style={styles.title}>Welcome to FastTrack</ThemedText>

        <ThemedText style={styles.subtitle}>
          Your personal fasting companion for a healthier lifestyle
        </ThemedText>

        <View style={styles.features}>
          <FeatureItem
            icon="target"
            title="Track Your Fasts"
            description="Monitor your fasting progress in real-time"
            color={theme.primary}
          />
          <FeatureItem
            icon="award"
            title="Earn Badges"
            description="Unlock achievements as you reach milestones"
            color={theme.primary}
          />
          <FeatureItem
            icon="trending-up"
            title="Build Habits"
            description="Develop consistent fasting routines"
            color={theme.primary}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button onPress={onContinue}>Get Started</Button>
      </View>
    </ThemedView>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
}

function FeatureItem({ icon, title, description, color }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: color + "15" }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <View style={styles.featureText}>
        <ThemedText style={styles.featureTitle}>{title}</ThemedText>
        <ThemedText style={styles.featureDescription}>{description}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  features: {
    width: "100%",
    gap: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    opacity: 0.6,
  },
  footer: {
    paddingBottom: 40,
  },
});
