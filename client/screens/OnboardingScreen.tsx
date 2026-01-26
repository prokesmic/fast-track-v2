import React, { useState, useCallback } from "react";
import { StyleSheet, View, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme";
import { useAnalytics } from "@/hooks/useAnalytics";
import { saveProfile, getProfile } from "@/lib/storage";
import { syncProfileToCloud } from "@/lib/sync";

import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { GoalStep, FastingGoal } from "@/components/onboarding/GoalStep";
import { ExperienceStep, ExperienceLevel } from "@/components/onboarding/ExperienceStep";
import { PlanStep } from "@/components/onboarding/PlanStep";

type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

type OnboardingStep = "welcome" | "goal" | "experience" | "plan";

export default function OnboardingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const {
    trackOnboardingStarted,
    trackOnboardingStepCompleted,
    trackOnboardingCompleted,
    trackOnboardingSkipped,
  } = useAnalytics();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [selectedGoal, setSelectedGoal] = useState<FastingGoal | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Track onboarding started
  React.useEffect(() => {
    trackOnboardingStarted();
  }, []);

  const handleWelcomeContinue = useCallback(() => {
    trackOnboardingStepCompleted(0, "welcome");
    setCurrentStep("goal");
  }, [trackOnboardingStepCompleted]);

  const handleGoalContinue = useCallback(() => {
    trackOnboardingStepCompleted(1, "goal");
    setCurrentStep("experience");
  }, [trackOnboardingStepCompleted]);

  const handleExperienceContinue = useCallback(() => {
    trackOnboardingStepCompleted(2, "experience");

    // Auto-select recommended plan based on experience
    if (selectedLevel === "beginner") {
      setSelectedPlanId("14-10");
    } else if (selectedLevel === "intermediate") {
      setSelectedPlanId("16-8");
    } else if (selectedLevel === "advanced") {
      setSelectedPlanId("20-4");
    }

    setCurrentStep("plan");
  }, [selectedLevel, trackOnboardingStepCompleted]);

  const handleComplete = useCallback(async () => {
    try {
      // Save onboarding preferences to profile
      const currentProfile = await getProfile();
      const updatedProfile = {
        ...currentProfile,
        fastingGoal: selectedGoal,
        experienceLevel: selectedLevel,
        preferredPlanId: selectedPlanId,
        onboardingCompleted: true,
      };

      // Save locally
      await saveProfile(updatedProfile as any);

      // Sync to cloud if authenticated
      syncProfileToCloud(updatedProfile as any);

      // Track completion
      trackOnboardingCompleted({
        goal: selectedGoal || "unknown",
        experienceLevel: selectedLevel || "unknown",
        preferredPlan: selectedPlanId || "unknown",
      });

      // Navigate to main app
      navigation.replace("Main");
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      // Still navigate even if save fails
      navigation.replace("Main");
    }
  }, [
    selectedGoal,
    selectedLevel,
    selectedPlanId,
    navigation,
    trackOnboardingCompleted,
  ]);

  const handleBack = useCallback(() => {
    switch (currentStep) {
      case "goal":
        setCurrentStep("welcome");
        break;
      case "experience":
        setCurrentStep("goal");
        break;
      case "plan":
        setCurrentStep("experience");
        break;
    }
  }, [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onContinue={handleWelcomeContinue} />;
      case "goal":
        return (
          <GoalStep
            selectedGoal={selectedGoal}
            onSelectGoal={setSelectedGoal}
            onContinue={handleGoalContinue}
            onBack={handleBack}
          />
        );
      case "experience":
        return (
          <ExperienceStep
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            onContinue={handleExperienceContinue}
            onBack={handleBack}
          />
        );
      case "plan":
        return (
          <PlanStep
            experienceLevel={selectedLevel}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        );
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {renderStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
