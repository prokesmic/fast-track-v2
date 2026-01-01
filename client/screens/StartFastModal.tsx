import React, { useState, useLayoutEffect } from "react";
import { View, StyleSheet, Pressable, TextInput, Alert, Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolateColor,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { FASTING_PLANS, FastingPlan } from "@/lib/plans";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDER_WIDTH = SCREEN_WIDTH - Spacing.lg * 4;
const THUMB_SIZE = 28;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "StartFast">;
type StartFastRouteProp = RouteProp<RootStackParamList, "StartFast">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PlanButtonProps {
  plan: FastingPlan;
  selected: boolean;
  onPress: () => void;
  index: number;
}

function PlanButton({ plan, selected, onPress, index }: PlanButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getGradientColors = () => {
    const gradients = [
      [Colors.light.primary, Colors.light.primaryLight],
      [Colors.light.secondary, Colors.light.secondaryLight],
      ["#F59E0B", "#FBBF24"],
      ["#EC4899", "#F472B6"],
    ];
    return gradients[index % gradients.length];
  };

  const [startColor, endColor] = getGradientColors();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[
        styles.planButton,
        {
          backgroundColor: selected ? theme.backgroundDefault : theme.backgroundSecondary,
          borderWidth: selected ? 2 : 0,
          borderColor: selected ? startColor : "transparent",
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.planIconContainer, { backgroundColor: startColor + "20" }]}>
        <View style={[styles.planIconDot, { backgroundColor: startColor }]} />
      </View>
      <ThemedText
        type="h4"
        style={{ color: theme.text }}
      >
        {plan.name}
      </ThemedText>
      <ThemedText
        type="small"
        style={{ color: theme.textSecondary }}
      >
        {plan.fastingHours}h fast : {plan.eatingHours}h eat
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
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const gestureStartX = useSharedValue(0);
  const thumbScale = useSharedValue(1);
  const lastTriggeredValue = useSharedValue(value);

  const valueToX = (v: number) => ((v - min) / (max - min)) * SLIDER_WIDTH;
  const xToValue = (x: number) => Math.round(min + (Math.max(0, Math.min(SLIDER_WIDTH, x)) / SLIDER_WIDTH) * (max - min));

  const currentX = useSharedValue(valueToX(value));

  React.useEffect(() => {
    currentX.value = valueToX(value);
    lastTriggeredValue.value = value;
  }, [value, min, max]);

  const triggerHaptic = () => {
    Haptics.selectionAsync();
  };

  const updateValue = (newValue: number) => {
    onChange(newValue);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      gestureStartX.value = currentX.value;
      thumbScale.value = withSpring(1.15);
    })
    .onUpdate((e) => {
      const newX = Math.max(0, Math.min(SLIDER_WIDTH, gestureStartX.value + e.translationX));
      currentX.value = newX;
      const newValue = xToValue(newX);
      if (newValue !== lastTriggeredValue.value) {
        lastTriggeredValue.value = newValue;
        runOnJS(triggerHaptic)();
        runOnJS(updateValue)(newValue);
      }
    })
    .onEnd(() => {
      thumbScale.value = withSpring(1);
    });

  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      const newX = Math.max(0, Math.min(SLIDER_WIDTH, e.x));
      currentX.value = withSpring(newX);
      const newValue = xToValue(newX);
      if (newValue !== lastTriggeredValue.value) {
        lastTriggeredValue.value = newValue;
        runOnJS(triggerHaptic)();
        runOnJS(updateValue)(newValue);
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: currentX.value - THUMB_SIZE / 2 },
      { scale: thumbScale.value },
    ],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: currentX.value,
  }));

  const markers = [12, 24, 48, 72];

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderValueContainer}>
        <ThemedText type="timerLarge" style={{ color: colors.primary }}>
          {value}
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          hours
        </ThemedText>
      </View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.sliderWrapper}>
          <View style={[styles.sliderTrack, { backgroundColor: theme.backgroundTertiary }]}>
            <Animated.View
              style={[
                styles.sliderFill,
                { backgroundColor: colors.primary },
                fillStyle,
              ]}
            />
          </View>
          <Animated.View
            style={[
              styles.sliderThumb,
              {
                backgroundColor: colors.primary,
                borderColor: "#FFFFFF",
              },
              Shadows.md,
              thumbStyle,
            ]}
          />
        </Animated.View>
      </GestureDetector>

      <View style={styles.sliderMarkers}>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {min}h
        </ThemedText>
        {markers.filter(m => m > min && m < max).map((marker) => (
          <ThemedText
            key={marker}
            type="caption"
            style={{
              color: value >= marker ? colors.primary : theme.textSecondary,
              fontWeight: value >= marker ? "600" : "400",
            }}
          >
            {marker}h
          </ThemedText>
        ))}
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {max}h
        </ThemedText>
      </View>
    </View>
  );
}

export default function StartFastModal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StartFastRouteProp>();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
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
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Cancel
          </ThemedText>
        </HeaderButton>
      ),
      headerRight: () => (
        <HeaderButton onPress={handleStart}>
          <View style={[styles.headerStartButton, { backgroundColor: colors.primary }]}>
            <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Start
            </ThemedText>
          </View>
        </HeaderButton>
      ),
    });
  }, [navigation, theme, selectedPlan, customHours, note, isCustom]);

  const handleStart = async () => {
    if (activeFast) {
      if (Platform.OS === "web") {
        window.alert("You already have an active fast. Please end it before starting a new one.");
      } else {
        Alert.alert(
          "Active Fast",
          "You already have an active fast. Please end it before starting a new one.",
          [{ text: "OK" }]
        );
      }
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

  const formatDuration = (hours: number) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
    }
    return `${hours} hours`;
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing["3xl"],
        paddingHorizontal: Spacing.lg,
        gap: Spacing["2xl"],
      }}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">Choose Your Plan</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Select a fasting schedule
          </ThemedText>
        </View>
        <View style={styles.planGrid}>
          {FASTING_PLANS.slice(0, 4).map((plan, index) => (
            <PlanButton
              key={plan.id}
              plan={plan}
              index={index}
              selected={!isCustom && selectedPlan?.id === plan.id}
              onPress={() => handlePlanSelect(plan)}
            />
          ))}
        </View>

        <Pressable
          onPress={handleCustomSelect}
          style={({ pressed }) => [
            styles.customButton,
            {
              backgroundColor: isCustom ? colors.primary + "15" : theme.backgroundSecondary,
              borderWidth: isCustom ? 2 : 0,
              borderColor: isCustom ? colors.primary : "transparent",
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={[styles.customIconContainer, { backgroundColor: colors.secondary + "20" }]}>
            <Feather
              name="sliders"
              size={20}
              color={colors.secondary}
            />
          </View>
          <View style={styles.customButtonText}>
            <ThemedText
              type="h4"
              style={{
                color: isCustom ? colors.primary : theme.text,
              }}
            >
              Custom Duration
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Set anywhere from 8 to 96 hours
            </ThemedText>
          </View>
          <View style={[
            styles.radioOuter,
            {
              borderColor: isCustom ? colors.primary : theme.textTertiary,
              backgroundColor: isCustom ? colors.primary : "transparent",
            },
          ]}>
            {isCustom ? (
              <View style={styles.radioInner} />
            ) : null}
          </View>
        </Pressable>
      </View>

      {isCustom ? (
        <View style={[styles.customSection, { backgroundColor: theme.backgroundDefault }]}>
          <DurationSlider
            value={customHours}
            onChange={setCustomHours}
            min={8}
            max={96}
          />
        </View>
      ) : selectedPlan ? (
        <View style={[styles.planPreview, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.planPreviewTop}>
            <View style={[styles.planPreviewBadge, { backgroundColor: colors.primary + "15" }]}>
              <ThemedText type="caption" style={{ color: colors.primary, textTransform: "uppercase" }}>
                {selectedPlan.difficulty}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="h2" style={{ color: theme.text }}>
            {selectedPlan.name}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, lineHeight: 24 }}>
            {selectedPlan.description}
          </ThemedText>
          <View style={styles.planStats}>
            <View style={[styles.planStat, { backgroundColor: colors.primary + "10" }]}>
              <Feather name="moon" size={18} color={colors.primary} />
              <View>
                <ThemedText type="h4" style={{ color: colors.primary }}>
                  {selectedPlan.fastingHours}h
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Fasting
                </ThemedText>
              </View>
            </View>
            <View style={[styles.planStat, { backgroundColor: colors.success + "10" }]}>
              <Feather name="sun" size={18} color={colors.success} />
              <View>
                <ThemedText type="h4" style={{ color: colors.success }}>
                  {selectedPlan.eatingHours}h
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Eating
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      <View style={[styles.scheduleCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Your Schedule</ThemedText>
        <View style={styles.scheduleTimeline}>
          <View style={styles.scheduleTimeItem}>
            <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
            <View style={styles.timelineContent}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, textTransform: "uppercase" }}>
                Start Now
              </ThemedText>
              <ThemedText type="h3">
                {new Date().toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </ThemedText>
            </View>
          </View>
          
          <View style={[styles.timelineLine, { backgroundColor: theme.backgroundTertiary }]}>
            <View style={[styles.durationPill, { backgroundColor: colors.primary + "15" }]}>
              <ThemedText type="small" style={{ color: colors.primary, fontWeight: "600" }}>
                {formatDuration(getDuration())}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.scheduleTimeItem}>
            <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
            <View style={styles.timelineContent}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, textTransform: "uppercase" }}>
                Goal
              </ThemedText>
              <ThemedText type="h3">
                {endTime.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {endTime.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4">Add a Note</ThemedText>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="How are you feeling? Any goals for this fast?"
          placeholderTextColor={theme.textTertiary}
          multiline
          numberOfLines={3}
          style={[
            styles.noteInput,
            {
              color: theme.text,
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.backgroundTertiary,
            },
          ]}
        />
      </View>

      <Pressable
        onPress={handleStart}
        style={({ pressed }) => [
          styles.startButton,
          { 
            backgroundColor: colors.primary, 
            opacity: pressed ? 0.9 : 1,
          },
          Shadows.lg,
        ]}
      >
        <Feather name="play" size={20} color="#FFFFFF" />
        <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
          Begin Fast
        </ThemedText>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    gap: Spacing.xs,
  },
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  planButton: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    alignItems: "flex-start",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  planIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  planIconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  customButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  customIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  customButtonText: {
    flex: 1,
    gap: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  customSection: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    gap: Spacing.lg,
  },
  sliderContainer: {
    gap: Spacing.xl,
  },
  sliderValueContainer: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  sliderWrapper: {
    height: 40,
    justifyContent: "center",
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    position: "relative",
  },
  sliderFill: {
    height: "100%",
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    top: (40 - THUMB_SIZE) / 2,
  },
  sliderMarkers: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xs,
  },
  planPreview: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  planPreviewTop: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  planPreviewBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  planStats: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  planStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  scheduleCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  scheduleTimeline: {
    gap: 0,
  },
  scheduleTimeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineLine: {
    width: 2,
    height: 40,
    marginLeft: 5,
    marginVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  durationPill: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.xl,
  },
  headerStartButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  noteInput: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 100,
    borderWidth: 1,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
});
