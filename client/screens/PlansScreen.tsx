import React from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { PlanCard } from "@/components/PlanCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { FASTING_PLANS } from "@/lib/plans";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const handlePlanPress = (plan: (typeof FASTING_PLANS)[0]) => {
    Haptics.selectionAsync();
    navigation.navigate("PlanDetail", { plan });
  };

  const handleStartPress = (plan: (typeof FASTING_PLANS)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("StartFast", { plan });
  };

  const handleCustomPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("StartFast", {});
  };

  const popularPlans = FASTING_PLANS.filter((p) =>
    ["16-8", "18-6", "20-4", "omad"].includes(p.id)
  );

  const beginnerPlans = FASTING_PLANS.filter((p) =>
    ["12-12", "14-10"].includes(p.id)
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Spacing.xl,
          paddingBottom: tabBarHeight + Spacing["2xl"],
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <ThemedText type="h2">Fasting Plans</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Choose a plan that fits your lifestyle
        </ThemedText>
      </View>

      <Pressable
        onPress={handleCustomPress}
        style={({ pressed }) => [
          styles.customCard,
          { 
            backgroundColor: colors.secondary + "10",
            borderColor: colors.secondary + "30",
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={[styles.customIcon, { backgroundColor: colors.secondary + "20" }]}>
          <Feather name="sliders" size={24} color={colors.secondary} />
        </View>
        <View style={styles.customContent}>
          <ThemedText type="h4">Custom Duration</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Create your own fasting schedule from 8 to 96 hours
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={22} color={colors.secondary} />
      </Pressable>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="star" size={16} color={colors.primary} />
          </View>
          <View>
            <ThemedText type="h4">Popular Plans</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Most effective fasting schedules
            </ThemedText>
          </View>
        </View>
        <View style={styles.plansList}>
          {popularPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              name={plan.name}
              fastingHours={plan.fastingHours}
              eatingHours={plan.eatingHours}
              description={plan.description}
              difficulty={plan.difficulty}
              onPress={() => handlePlanPress(plan)}
              onStartPress={() => handleStartPress(plan)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: colors.success + "15" }]}>
            <Feather name="heart" size={16} color={colors.success} />
          </View>
          <View>
            <ThemedText type="h4">Beginner Friendly</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Perfect for getting started
            </ThemedText>
          </View>
        </View>
        <View style={styles.plansList}>
          {beginnerPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              name={plan.name}
              fastingHours={plan.fastingHours}
              eatingHours={plan.eatingHours}
              description={plan.description}
              difficulty={plan.difficulty}
              onPress={() => handlePlanPress(plan)}
              onStartPress={() => handleStartPress(plan)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing["2xl"],
  },
  header: {
    gap: Spacing.xs,
  },
  customCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.md,
  },
  customIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  customContent: {
    flex: 1,
    gap: 2,
  },
  section: {
    gap: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  plansList: {
    gap: Spacing.md,
  },
});
