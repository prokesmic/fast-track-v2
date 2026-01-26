import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { Button } from "../Button";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

interface ExperienceStepProps {
  selectedLevel: ExperienceLevel | null;
  onSelectLevel: (level: ExperienceLevel) => void;
  onContinue: () => void;
  onBack: () => void;
}

interface LevelOption {
  id: ExperienceLevel;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  recommendedPlan: string;
}

const LEVELS: LevelOption[] = [
  {
    id: "beginner",
    icon: "feather",
    title: "Beginner",
    description: "New to fasting or just getting started",
    recommendedPlan: "12:12 or 14:10",
  },
  {
    id: "intermediate",
    icon: "activity",
    title: "Intermediate",
    description: "Some fasting experience, ready for more",
    recommendedPlan: "16:8 or 18:6",
  },
  {
    id: "advanced",
    icon: "shield",
    title: "Advanced",
    description: "Experienced faster, comfortable with longer fasts",
    recommendedPlan: "20:4 or OMAD",
  },
];

export function ExperienceStep({
  selectedLevel,
  onSelectLevel,
  onContinue,
  onBack,
}: ExperienceStepProps) {
  const { colors, isDark } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.stepIndicator}>Step 2 of 3</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.title}>What's your experience level?</ThemedText>
        <ThemedText style={styles.subtitle}>
          We'll recommend the best starting plan for you
        </ThemedText>

        <View style={styles.options}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.option,
                {
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  borderColor:
                    selectedLevel === level.id ? colors.tint : "transparent",
                  borderWidth: 2,
                },
              ]}
              onPress={() => onSelectLevel(level.id)}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor:
                      selectedLevel === level.id
                        ? colors.tint + "20"
                        : isDark
                          ? "#334155"
                          : "#E2E8F0",
                  },
                ]}
              >
                <Feather
                  name={level.icon}
                  size={24}
                  color={selectedLevel === level.id ? colors.tint : colors.text}
                />
              </View>
              <View style={styles.optionText}>
                <ThemedText style={styles.optionTitle}>{level.title}</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  {level.description}
                </ThemedText>
                <View style={styles.recommendedBadge}>
                  <ThemedText style={[styles.recommendedText, { color: colors.tint }]}>
                    Recommended: {level.recommendedPlan}
                  </ThemedText>
                </View>
              </View>
              {selectedLevel === level.id && (
                <Feather name="check-circle" size={24} color={colors.tint} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={onContinue}
          disabled={!selectedLevel}
        />
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
    marginBottom: 4,
  },
  recommendedBadge: {
    marginTop: 4,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: "500",
  },
  footer: {
    paddingBottom: 40,
  },
});
