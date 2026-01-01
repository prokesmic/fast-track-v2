import React, { useLayoutEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "PlanDetail">;
type PlanDetailRouteProp = RouteProp<RootStackParamList, "PlanDetail">;

const difficultyColors = {
  Easy: Colors.light.success,
  Medium: "#F59E0B",
  Hard: "#F97316",
  Expert: Colors.light.destructive,
};

export default function PlanDetailModal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PlanDetailRouteProp>();
  const { theme } = useTheme();

  const plan = route.params.plan;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: plan.name,
      headerRight: () => (
        <HeaderButton onPress={handleStartFast}>
          <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
            Start
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, theme, plan]);

  const handleStartFast = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace("StartFast", { plan });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.xl,
      }}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText type="h2">{plan.name}</ThemedText>
          <View
            style={[
              styles.badge,
              { backgroundColor: difficultyColors[plan.difficulty] + "20" },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: difficultyColors[plan.difficulty], fontWeight: "600" }}
            >
              {plan.difficulty}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {plan.description}
        </ThemedText>
      </View>

      <View style={[styles.scheduleCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h4">Schedule</ThemedText>
        <View style={styles.scheduleRow}>
          <View style={styles.scheduleItem}>
            <View
              style={[styles.scheduleIcon, { backgroundColor: theme.primary + "20" }]}
            >
              <Feather name="moon" size={24} color={theme.primary} />
            </View>
            <ThemedText type="h3" style={{ color: theme.primary }}>
              {plan.fastingHours}h
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Fasting Window
            </ThemedText>
          </View>
          <View style={styles.scheduleDivider} />
          <View style={styles.scheduleItem}>
            <View
              style={[styles.scheduleIcon, { backgroundColor: Colors.light.success + "20" }]}
            >
              <Feather name="sun" size={24} color={Colors.light.success} />
            </View>
            <ThemedText type="h3" style={{ color: Colors.light.success }}>
              {plan.eatingHours}h
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Eating Window
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4">Benefits</ThemedText>
        <View style={styles.benefitsList}>
          {plan.benefits.map((benefit, index) => (
            <View
              key={index}
              style={[styles.benefitItem, { backgroundColor: theme.backgroundDefault }]}
            >
              <Feather name="check-circle" size={20} color={Colors.light.success} />
              <ThemedText type="body" style={{ flex: 1 }}>
                {benefit}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4">Tips for Success</ThemedText>
        <View style={[styles.tipsCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.tipItem}>
            <Feather name="droplet" size={20} color={Colors.light.primary} />
            <ThemedText type="body" style={{ flex: 1 }}>
              Stay hydrated with water, tea, or black coffee during fasting
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <Feather name="moon" size={20} color={Colors.light.secondary} />
            <ThemedText type="body" style={{ flex: 1 }}>
              Start your fast after dinner for easier sleep through fasting hours
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <Feather name="heart" size={20} color={Colors.light.destructive} />
            <ThemedText type="body" style={{ flex: 1 }}>
              Break your fast with nutrient-dense foods, not processed snacks
            </ThemedText>
          </View>
        </View>
      </View>

      <Button onPress={handleStartFast}>Start This Fast</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  scheduleCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.lg,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },
  scheduleIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleDivider: {
    width: 1,
    height: 80,
    backgroundColor: "#E2E8F0",
    marginHorizontal: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  benefitsList: {
    gap: Spacing.sm,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  tipsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.lg,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
});
