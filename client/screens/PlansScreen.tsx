import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { PlanCard } from "@/components/PlanCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { FASTING_PLANS } from "@/lib/plans";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const handlePlanPress = (plan: (typeof FASTING_PLANS)[0]) => {
    Haptics.selectionAsync();
    navigation.navigate("PlanDetail", { plan });
  };

  const handleStartPress = (plan: (typeof FASTING_PLANS)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("StartFast", { plan });
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
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Popular Plans
        </ThemedText>
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
        <ThemedText type="h4" style={styles.sectionTitle}>
          Beginner Friendly
        </ThemedText>
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
    paddingHorizontal: Spacing.lg,
    gap: Spacing["2xl"],
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginLeft: Spacing.xs,
  },
  plansList: {
    gap: Spacing.md,
  },
});
