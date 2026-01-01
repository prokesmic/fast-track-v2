import React, { useState, useLayoutEffect } from "react";
import { View, StyleSheet, Pressable, TextInput, Alert, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { FASTING_PLANS, FastingPlan } from "@/lib/plans";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "StartFast">;
type StartFastRouteProp = RouteProp<RootStackParamList, "StartFast">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PlanButtonProps {
  plan: FastingPlan;
  selected: boolean;
  onPress: () => void;
}

function PlanButton({ plan, selected, onPress }: PlanButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[
        styles.planButton,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundDefault,
          borderWidth: selected ? 0 : 1,
          borderColor: theme.backgroundTertiary,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        type="h4"
        style={{ color: selected ? "#FFFFFF" : theme.text }}
      >
        {plan.name}
      </ThemedText>
      <ThemedText
        type="small"
        style={{ color: selected ? "rgba(255,255,255,0.8)" : theme.textSecondary }}
      >
        {plan.fastingHours}h fast
      </ThemedText>
    </AnimatedPressable>
  );
}

function DurationSlider({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const { theme } = useTheme();
  const percentage = ((value - min) / (max - min)) * 100;

  const handlePress = (e: { nativeEvent: { locationX: number } }) => {
    const sliderWidth = SCREEN_WIDTH - Spacing.lg * 4 - Spacing.lg * 2;
    const newPercentage = Math.max(0, Math.min(100, (e.nativeEvent.locationX / sliderWidth) * 100));
    const newValue = Math.round(min + (newPercentage / 100) * (max - min));
    Haptics.selectionAsync();
    onChange(newValue);
  };

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderLabels}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {min}h
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {max}h
        </ThemedText>
      </View>
      <Pressable onPress={handlePress}>
        <View style={[styles.sliderTrack, { backgroundColor: theme.backgroundSecondary }]}>
          <View
            style={[
              styles.sliderFill,
              {
                width: `${percentage}%`,
                backgroundColor: Colors.light.primary,
              },
            ]}
          />
          <View
            style={[
              styles.sliderThumb,
              {
                left: `${percentage}%`,
                backgroundColor: Colors.light.primary,
              },
            ]}
          />
        </View>
      </Pressable>
      <View style={styles.sliderValue}>
        <ThemedText type="h2" style={{ color: theme.primary }}>
          {value}
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          hours
        </ThemedText>
      </View>
    </View>
  );
}

export default function StartFastModal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StartFastRouteProp>();
  const { theme } = useTheme();
  const { startFast, activeFast } = useFasting();

  const initialPlan = route.params?.plan || FASTING_PLANS[0];
  const [selectedPlan, setSelectedPlan] = useState<FastingPlan | null>(
    route.params?.plan ? initialPlan : null
  );
  const [customHours, setCustomHours] = useState(16);
  const [isCustom, setIsCustom] = useState(false);
  const [note, setNote] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Start a Fast",
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
  }, [navigation, theme, selectedPlan, customHours, note, isCustom]);

  const handleStart = async () => {
    if (activeFast) {
      Alert.alert(
        "Active Fast",
        "You already have an active fast. Please end it before starting a new one.",
        [{ text: "OK" }]
      );
      return;
    }

    const duration = isCustom ? customHours : (selectedPlan?.fastingHours || 16);
    const planName = isCustom ? `Custom ${customHours}h` : (selectedPlan?.name || "16:8");
    const planId = isCustom ? "custom" : (selectedPlan?.id || "16-8");

    await startFast(planId, planName, duration, Date.now(), note || undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const handlePlanSelect = (plan: FastingPlan) => {
    Haptics.selectionAsync();
    setSelectedPlan(plan);
    setIsCustom(false);
  };

  const handleCustomSelect = () => {
    Haptics.selectionAsync();
    setSelectedPlan(null);
    setIsCustom(true);
  };

  const getDuration = () => isCustom ? customHours : (selectedPlan?.fastingHours || 16);
  const endTime = new Date(Date.now() + getDuration() * 60 * 60 * 1000);

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
        <ThemedText type="h4">Choose Your Plan</ThemedText>
        <View style={styles.planGrid}>
          {FASTING_PLANS.slice(0, 4).map((plan) => (
            <PlanButton
              key={plan.id}
              plan={plan}
              selected={!isCustom && selectedPlan?.id === plan.id}
              onPress={() => handlePlanSelect(plan)}
            />
          ))}
        </View>

        <Pressable
          onPress={handleCustomSelect}
          style={[
            styles.customButton,
            {
              backgroundColor: isCustom ? theme.primary + "15" : theme.backgroundDefault,
              borderWidth: isCustom ? 2 : 1,
              borderColor: isCustom ? theme.primary : theme.backgroundTertiary,
            },
          ]}
        >
          <Feather
            name="sliders"
            size={20}
            color={isCustom ? theme.primary : theme.textSecondary}
          />
          <View style={styles.customButtonText}>
            <ThemedText
              type="body"
              style={{
                color: isCustom ? theme.primary : theme.text,
                fontWeight: "600",
              }}
            >
              Custom Duration
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Set your own fasting hours
            </ThemedText>
          </View>
          <Feather
            name={isCustom ? "check-circle" : "circle"}
            size={20}
            color={isCustom ? theme.primary : theme.textSecondary}
          />
        </Pressable>
      </View>

      {isCustom ? (
        <View style={[styles.customSection, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4">Set Duration</ThemedText>
          <DurationSlider
            value={customHours}
            onChange={setCustomHours}
            min={8}
            max={96}
          />
        </View>
      ) : selectedPlan ? (
        <View style={[styles.planPreview, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.planPreviewHeader}>
            <View>
              <ThemedText type="h3" style={{ color: theme.primary }}>
                {selectedPlan.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {selectedPlan.difficulty}
              </ThemedText>
            </View>
            <View style={styles.durationBadges}>
              <View style={[styles.badge, { backgroundColor: theme.primary + "15" }]}>
                <Feather name="moon" size={14} color={theme.primary} />
                <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                  {selectedPlan.fastingHours}h
                </ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: Colors.light.success + "15" }]}>
                <Feather name="sun" size={14} color={Colors.light.success} />
                <ThemedText type="small" style={{ color: Colors.light.success, fontWeight: "600" }}>
                  {selectedPlan.eatingHours}h
                </ThemedText>
              </View>
            </View>
          </View>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {selectedPlan.description}
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.scheduleCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h4">Your Schedule</ThemedText>
        <View style={styles.scheduleRow}>
          <View style={styles.scheduleItem}>
            <View style={[styles.scheduleIcon, { backgroundColor: Colors.light.success + "15" }]}>
              <Feather name="play" size={16} color={Colors.light.success} />
            </View>
            <View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Start Now
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {new Date().toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.scheduleArrow, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="arrow-right" size={16} color={theme.textSecondary} />
          </View>
          <View style={styles.scheduleItem}>
            <View style={[styles.scheduleIcon, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="flag" size={16} color={theme.primary} />
            </View>
            <View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Goal
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {endTime.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.totalDuration}>
          <ThemedText type="h2" style={{ color: theme.primary }}>
            {getDuration()}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            hours total
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4">Add a Note (Optional)</ThemedText>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="How are you feeling? Any goals for this fast?"
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

      <Pressable
        onPress={handleStart}
        style={({ pressed }) => [
          styles.startButton,
          { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="play" size={20} color="#FFFFFF" />
        <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
          Start Fast Now
        </ThemedText>
      </Pressable>
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
  planButton: {
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  customButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  customButtonText: {
    flex: 1,
    gap: 2,
  },
  customSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.lg,
  },
  sliderContainer: {
    gap: Spacing.md,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    position: "relative",
  },
  sliderFill: {
    height: "100%",
    borderRadius: 4,
  },
  sliderThumb: {
    position: "absolute",
    top: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderValue: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  planPreview: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  planPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  durationBadges: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  scheduleCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.lg,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleArrow: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  totalDuration: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  noteInput: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 100,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
});
