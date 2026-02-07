import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Button } from "../Button";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { FASTING_PLANS, FastingPlan } from "@/lib/plans";
import { ExperienceLevel } from "./ExperienceStep";

interface PlanStepProps {
  experienceLevel: ExperienceLevel | null;
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

// Get recommended plans based on experience level
function getRecommendedPlans(level: ExperienceLevel | null): FastingPlan[] {
  switch (level) {
    case "beginner":
      return FASTING_PLANS.filter((p) =>
        ["12-12", "14-10", "16-8"].includes(p.id)
      );
    case "intermediate":
      return FASTING_PLANS.filter((p) =>
        ["16-8", "18-6", "20-4"].includes(p.id)
      );
    case "advanced":
      return FASTING_PLANS.filter((p) =>
        ["18-6", "20-4", "omad"].includes(p.id)
      );
    default:
      return FASTING_PLANS.filter((p) =>
        ["14-10", "16-8", "18-6"].includes(p.id)
      );
  }
}

export function PlanStep({
  experienceLevel,
  selectedPlanId,
  onSelectPlan,
  onComplete,
  onBack,
}: PlanStepProps) {
  const { theme, isDark } = useTheme();
  const recommendedPlans = getRecommendedPlans(experienceLevel);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.stepIndicator}>Step 3 of 3</ThemedText>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Choose your starting plan</ThemedText>
        <ThemedText style={styles.subtitle}>
          Based on your experience, we recommend these plans
        </ThemedText>

        <View style={styles.options}>
          {recommendedPlans.map((plan, index) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.option,
                {
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  borderColor:
                    selectedPlanId === plan.id ? theme.primary : "transparent",
                  borderWidth: 2,
                },
              ]}
              onPress={() => onSelectPlan(plan.id)}
            >
              {index === 0 && (
                <View style={[styles.recommendedTag, { backgroundColor: theme.primary }]}>
                  <ThemedText style={styles.recommendedTagText}>
                    Best Match
                  </ThemedText>
                </View>
              )}

              <View style={styles.planHeader}>
                <View
                  style={[
                    styles.planIcon,
                    {
                      backgroundColor:
                        selectedPlanId === plan.id
                          ? theme.primary + "20"
                          : isDark
                            ? "#334155"
                            : "#E2E8F0",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.planHours,
                      {
                        color:
                          selectedPlanId === plan.id ? theme.primary : theme.text,
                      },
                    ]}
                  >
                    {plan.fastingHours}h
                  </ThemedText>
                </View>

                <View style={styles.planInfo}>
                  <ThemedText style={styles.planName}>{plan.name}</ThemedText>
                  <View style={styles.planMeta}>
                    <View
                      style={[
                        styles.difficultyBadge,
                        {
                          backgroundColor:
                            plan.difficulty === "Easy"
                              ? "#10B981"
                              : plan.difficulty === "Medium"
                                ? "#F59E0B"
                                : plan.difficulty === "Hard"
                                  ? "#EF4444"
                                  : "#8B5CF6",
                        },
                      ]}
                    >
                      <ThemedText style={styles.difficultyText}>
                        {plan.difficulty}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.planTagline}>
                      {plan.tagline}
                    </ThemedText>
                  </View>
                </View>

                {selectedPlanId === plan.id && (
                  <Feather name="check-circle" size={24} color={theme.primary} />
                )}
              </View>

              <ThemedText style={styles.planDescription}>
                {plan.description}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => {
            // Could navigate to Plans screen or expand
          }}
        >
          <ThemedText style={[styles.viewAllText, { color: theme.primary }]}>
            View all {FASTING_PLANS.length} plans
          </ThemedText>
          <Feather name="chevron-right" size={16} color={theme.primary} />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Button onPress={onComplete} disabled={!selectedPlanId}>
          Start Fasting
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  stepIndicator: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    opacity: 0.6,
    marginRight: 32,
  },
  scrollContent: {
    flex: 1,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 24,
  },
  options: {
    gap: 16,
  },
  option: {
    padding: 16,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
  },
  recommendedTag: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  recommendedTagText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  planIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  planHours: {
    fontSize: 18,
    fontWeight: "bold",
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  planMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  difficultyText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  planTagline: {
    fontSize: 12,
    opacity: 0.6,
  },
  planDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 16,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 16,
  },
});
