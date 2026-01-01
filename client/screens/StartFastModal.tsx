import React, { useState, useLayoutEffect } from "react";
import { View, StyleSheet, Pressable, TextInput, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { FASTING_PLANS, FastingPlan } from "@/lib/plans";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "StartFast">;
type StartFastRouteProp = RouteProp<RootStackParamList, "StartFast">;

export default function StartFastModal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StartFastRouteProp>();
  const { theme } = useTheme();
  const { startFast, activeFast } = useFasting();

  const initialPlan = route.params?.plan || FASTING_PLANS[0];
  const [selectedPlan, setSelectedPlan] = useState<FastingPlan>(initialPlan);
  const [customHours, setCustomHours] = useState("16");
  const [note, setNote] = useState("");
  const [startNow, setStartNow] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <HeaderButton onPress={() => navigation.goBack()}>
          <ThemedText type="body" style={{ color: theme.primary }}>
            Cancel
          </ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton onPress={handleStart}>
          <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
            Start
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, theme, selectedPlan, customHours, note, startNow]);

  const handleStart = async () => {
    if (activeFast) {
      Alert.alert(
        "Active Fast",
        "You already have an active fast. Please end it before starting a new one.",
        [{ text: "OK" }]
      );
      return;
    }

    const duration =
      selectedPlan.id === "custom"
        ? parseFloat(customHours) || 16
        : selectedPlan.fastingHours;

    await startFast(
      selectedPlan.id,
      selectedPlan.id === "custom" ? `Custom ${customHours}h` : selectedPlan.name,
      duration,
      startNow ? Date.now() : undefined,
      note || undefined
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const handlePlanSelect = (plan: FastingPlan) => {
    Haptics.selectionAsync();
    setSelectedPlan(plan);
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.xl,
      }}
    >
      <View style={styles.section}>
        <ThemedText type="h4">Select Fasting Plan</ThemedText>
        <View style={styles.planGrid}>
          {FASTING_PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => handlePlanSelect(plan)}
              style={[
                styles.planOption,
                {
                  backgroundColor:
                    selectedPlan.id === plan.id
                      ? theme.primary + "20"
                      : theme.backgroundDefault,
                  borderWidth: selectedPlan.id === plan.id ? 2 : 0,
                  borderColor: theme.primary,
                },
              ]}
            >
              <ThemedText
                type="h4"
                style={{
                  color: selectedPlan.id === plan.id ? theme.primary : theme.text,
                }}
              >
                {plan.name}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary }}
              >
                {plan.fastingHours}h fast
              </ThemedText>
            </Pressable>
          ))}

          <Pressable
            onPress={() =>
              handlePlanSelect({
                id: "custom",
                name: "Custom",
                fastingHours: parseFloat(customHours) || 16,
                eatingHours: 24 - (parseFloat(customHours) || 16),
                description: "Create your own fasting schedule",
                difficulty: "Medium",
                benefits: [],
              })
            }
            style={[
              styles.planOption,
              {
                backgroundColor:
                  selectedPlan.id === "custom"
                    ? theme.primary + "20"
                    : theme.backgroundDefault,
                borderWidth: selectedPlan.id === "custom" ? 2 : 0,
                borderColor: theme.primary,
              },
            ]}
          >
            <Feather
              name="sliders"
              size={24}
              color={selectedPlan.id === "custom" ? theme.primary : theme.textSecondary}
            />
            <ThemedText
              type="body"
              style={{
                color: selectedPlan.id === "custom" ? theme.primary : theme.text,
              }}
            >
              Custom
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {selectedPlan.id === "custom" ? (
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4">Custom Duration</ThemedText>
          <View style={styles.customInputRow}>
            <TextInput
              value={customHours}
              onChangeText={setCustomHours}
              keyboardType="decimal-pad"
              placeholder="16"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.customInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundSecondary,
                },
              ]}
            />
            <ThemedText type="body">hours</ThemedText>
          </View>
        </View>
      ) : (
        <View style={[styles.planInfo, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4">{selectedPlan.name}</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {selectedPlan.description}
          </ThemedText>
          <View style={styles.durationRow}>
            <View style={styles.durationItem}>
              <Feather name="moon" size={20} color={theme.primary} />
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {selectedPlan.fastingHours}h
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Fasting
              </ThemedText>
            </View>
            <View style={styles.durationItem}>
              <Feather name="sun" size={20} color={Colors.light.success} />
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {selectedPlan.eatingHours}h
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Eating
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText type="h4">Start Time</ThemedText>
        <View style={[styles.startTimeRow, { backgroundColor: theme.backgroundDefault }]}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setStartNow(true);
            }}
            style={[
              styles.startTimeOption,
              {
                backgroundColor: startNow ? theme.primary : "transparent",
              },
            ]}
          >
            <Feather
              name="zap"
              size={20}
              color={startNow ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              type="body"
              style={{ color: startNow ? "#FFFFFF" : theme.text }}
            >
              Start Now
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4">Note (Optional)</ThemedText>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a note about this fast..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={3}
          style={[
            styles.noteInput,
            {
              color: theme.text,
              backgroundColor: theme.backgroundDefault,
            },
          ]}
        />
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  planOption: {
    width: "31%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  planInfo: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing.sm,
  },
  durationItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  customInput: {
    width: 80,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  startTimeRow: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
  },
  startTimeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    gap: Spacing.sm,
  },
  noteInput: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 100,
  },
});
