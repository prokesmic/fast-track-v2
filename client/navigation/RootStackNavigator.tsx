import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import StartFastModal from "@/screens/StartFastModal";
import PlanDetailModal from "@/screens/PlanDetailModal";
import FastingStagesScreen from "@/screens/FastingStagesScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

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
  Main: undefined;
  StartFast: { plan?: FastingPlan };
  PlanDetail: { plan: FastingPlan };
  FastingStages: { hoursElapsed?: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
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
    </Stack.Navigator>
  );
}
