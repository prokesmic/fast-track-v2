import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import StartFastModal from "@/screens/StartFastModal";
import PlanDetailModal from "@/screens/PlanDetailModal";
import FastingStagesScreen from "@/screens/FastingStagesScreen";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import BadgesScreen from "@/screens/BadgesScreen";
import ProgressPhotosScreen from "@/screens/ProgressPhotosScreen";
import CircleDetailScreen from "@/screens/CircleDetailScreen";
import AICoachScreen from "@/screens/AICoachScreen";
import { getFasts, getProfile } from "@/lib/storage";

export type FastingPlan = {
  id: string;
  name: string;
  fastingHours: number;
  eatingHours: number;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  benefits: string[];
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  Main: undefined;
  StartFast: { plan?: FastingPlan; isCustom?: boolean };
  PlanDetail: { plan: FastingPlan };
  FastingStages: { hoursElapsed?: number };
  Badges: undefined;
  ProgressPhotos: undefined;
  CircleDetail: { circleId: string };
  AICoach: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState<boolean | null>(null);

  // Check if user should see onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const [fasts, profile] = await Promise.all([getFasts(), getProfile()]);
        // Show onboarding if no fasts and onboarding not completed
        const showOnboarding = fasts.length === 0 && !profile.onboardingCompleted;
        setShouldShowOnboarding(showOnboarding);
      } catch {
        setShouldShowOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  // Don't render until we know whether to show onboarding
  if (shouldShowOnboarding === null) {
    return null;
  }

  const initialRouteName = shouldShowOnboarding ? "Onboarding" : "Main";

  return (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName={initialRouteName}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StartFast"
        component={StartFastModal}
        options={{
          presentation: "modal",
          headerTitle: "Start Fast",
        }}
      />
      <Stack.Screen
        name="PlanDetail"
        component={PlanDetailModal}
        options={{
          presentation: "modal",
          headerTitle: "Plan Details",
        }}
      />
      <Stack.Screen
        name="FastingStages"
        component={FastingStagesScreen}
        options={{
          headerTitle: "Fasting Stages",
        }}
      />
      <Stack.Screen
        name="Badges"
        component={BadgesScreen}
        options={{
          headerTitle: "All Badges",
          headerTransparent: true,
          headerBlurEffect: "regular",
        }}
      />
      <Stack.Screen
        name="ProgressPhotos"
        component={ProgressPhotosScreen}
        options={{
          headerTitle: "Progress Photos",
          headerTransparent: true,
          headerBlurEffect: "regular",
        }}
      />
      <Stack.Screen
        name="CircleDetail"
        component={CircleDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AICoach"
        component={AICoachScreen}
        options={{
          headerTitle: "AI Coach",
          headerTransparent: true,
          headerBlurEffect: "regular",
        }}
      />
    </Stack.Navigator>
  );
}
