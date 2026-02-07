import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Button } from "../Button";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";

export type FastingGoal = "weight_loss" | "health" | "longevity" | "energy";

interface GoalStepProps {
  selectedGoal: FastingGoal | null;
  onSelectGoal: (goal: FastingGoal) => void;
  onContinue: () => void;
  onBack: () => void;
}

interface GoalOption {
  id: FastingGoal;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

const GOALS: GoalOption[] = [
  {
    id: "weight_loss",
    icon: "trending-down",
    title: "Lose Weight",
    description: "Burn fat and reach your ideal weight",
  },
  {
    id: "health",
    icon: "heart",
    title: "Improve Health",
    description: "Boost metabolism and reduce inflammation",
  },
  {
    id: "longevity",
    icon: "sun",
    title: "Longevity",
    description: "Promote cellular repair and autophagy",
  },
  {
    id: "energy",
    icon: "zap",
    title: "More Energy",
    description: "Increase mental clarity and focus",
  },
];

export function GoalStep({
  selectedGoal,
  onSelectGoal,
  onContinue,
  onBack,
}: GoalStepProps) {
  const { theme, isDark } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.stepIndicator}>Step 1 of 3</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.title}>What's your main goal?</ThemedText>
        <ThemedText style={styles.subtitle}>
          This helps us personalize your fasting experience
        </ThemedText>

        <View style={styles.options}>
          {GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.option,
                {
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  borderColor:
                    selectedGoal === goal.id ? theme.primary : "transparent",
                  borderWidth: 2,
                },
              ]}
              onPress={() => onSelectGoal(goal.id)}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor:
                      selectedGoal === goal.id
                        ? theme.primary + "20"
                        : isDark
                          ? "#334155"
                          : "#E2E8F0",
                  },
                ]}
              >
                <Feather
                  name={goal.icon}
                  size={24}
                  color={selectedGoal === goal.id ? theme.primary : theme.text}
                />
              </View>
              <View style={styles.optionText}>
                <ThemedText style={styles.optionTitle}>{goal.title}</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  {goal.description}
                </ThemedText>
              </View>
              {selectedGoal === goal.id && (
                <Feather name="check-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button onPress={onContinue} disabled={!selectedGoal}>
          Continue
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
  content: {
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
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.6,
  },
  footer: {
    paddingBottom: 40,
  },
});
