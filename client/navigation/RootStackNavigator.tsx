import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import StartFastModal from "@/screens/StartFastModal";
import PlanDetailModal from "@/screens/PlanDetailModal";
import FastingStagesScreen from "@/screens/FastingStagesScreen";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import BadgesScreen from "@/screens/BadgesScreen";

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
  Main: undefined;
  StartFast: { plan?: FastingPlan; isCustom?: boolean };
  PlanDetail: { plan: FastingPlan };
  FastingStages: { hoursElapsed?: number };
  Badges: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName="Main">
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
    </Stack.Navigator>
  );
}
