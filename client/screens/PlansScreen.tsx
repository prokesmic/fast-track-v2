import React from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import { FASTING_PLANS } from "@/lib/plans";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const difficultyColors = {
  Easy: Colors.light.success,
  Medium: "#F59E0B",
  Hard: "#F97316",
  Expert: Colors.light.destructive,
};

interface PlanCardProps {
  plan: typeof FASTING_PLANS[0];
  onPress: () => void;
  onStartPress: () => void;
  accentColor: string;
}

function PlanCard({ plan, onPress, onStartPress, accentColor }: PlanCardProps) {
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={animatedStyle}
    >
      <GlassCard accentColor={accentColor}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleSection}>
            <ThemedText type="h3">{plan.name}</ThemedText>
            <View style={styles.timeBadges}>
              <View style={[styles.timeBadge, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="moon" size={12} color={colors.primary} />
                <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "600" }}>
                  {plan.fastingHours}h fast
                </ThemedText>
              </View>
              <View style={[styles.timeBadge, { backgroundColor: colors.success + "15" }]}>
                <Feather name="sun" size={12} color={colors.success} />
                <ThemedText type="caption" style={{ color: colors.success, fontWeight: "600" }}>
                  {plan.eatingHours}h eat
                </ThemedText>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: difficultyColors[plan.difficulty] + "18" },
            ]}
          >
            <ThemedText
              type="caption"
              style={{ color: difficultyColors[plan.difficulty], fontWeight: "700" }}
            >
              {plan.difficulty}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          type="body"
          style={{ color: theme.textSecondary, lineHeight: 22, marginTop: Spacing.sm }}
          numberOfLines={2}
        >
          {plan.description}
        </ThemedText>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onStartPress();
          }}
          style={({ pressed }) => [
            styles.startButton,
            { 
              backgroundColor: accentColor,
              opacity: pressed ? 0.9 : 1,
            },
            Shadows.coloredLg(accentColor),
          ]}
        >
          <Feather name="play" size={18} color="#FFFFFF" />
          <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>
            Start Plan
          </ThemedText>
        </Pressable>
      </GlassCard>
    </AnimatedPressable>
  );
}

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

  const planColors = [colors.primary, colors.secondary, "#F59E0B", "#EC4899"];

  return (
    <View style={styles.container}>
      <GradientBackground variant="plans" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: tabBarHeight + Spacing["2xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="h1">Fasting Plans</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Choose a plan that fits your lifestyle
          </ThemedText>
        </View>

        <Pressable
          onPress={handleCustomPress}
          style={({ pressed }) => [
            styles.customCard,
            { 
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <GlassCard intensity="strong" accentColor={colors.secondary}>
            <View style={styles.customContent}>
              <View style={[styles.customIcon, { backgroundColor: colors.secondary + "20" }]}>
                <Feather name="sliders" size={28} color={colors.secondary} />
              </View>
              <View style={styles.customText}>
                <ThemedText type="h4">Custom Duration</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Create your own fasting schedule from 8 to 96 hours
                </ThemedText>
              </View>
              <View style={[styles.customArrow, { backgroundColor: colors.secondary + "15" }]}>
                <Feather name="arrow-right" size={20} color={colors.secondary} />
              </View>
            </View>
          </GlassCard>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="star" size={18} color={colors.primary} />
            </View>
            <View>
              <ThemedText type="h3">Popular Plans</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Most effective fasting schedules
              </ThemedText>
            </View>
          </View>
          <View style={styles.plansList}>
            {popularPlans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                accentColor={planColors[index % planColors.length]}
                onPress={() => handlePlanPress(plan)}
                onStartPress={() => handleStartPress(plan)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.success + "18" }]}>
              <Feather name="heart" size={18} color={colors.success} />
            </View>
            <View>
              <ThemedText type="h3">Beginner Friendly</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Perfect for getting started
              </ThemedText>
            </View>
          </View>
          <View style={styles.plansList}>
            {beginnerPlans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                accentColor={colors.success}
                onPress={() => handlePlanPress(plan)}
                onStartPress={() => handleStartPress(plan)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing["2xl"],
  },
  header: {
    gap: Spacing.xs,
  },
  customCard: {
    marginTop: Spacing.sm,
  },
  customContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  customIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  customText: {
    flex: 1,
    gap: 2,
  },
  customArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    gap: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  plansList: {
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitleSection: {
    flex: 1,
    gap: Spacing.sm,
  },
  timeBadges: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
});
