import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ProgressRing } from "@/components/ProgressRing";
import { StatsCard } from "@/components/StatsCard";
import { FastingStageIndicator } from "@/components/FastingStage";
import { FAB } from "@/components/FAB";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { Spacing, Colors, Fonts, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatTime(ms: number): { hours: string; minutes: string; seconds: string } {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: hours.toString().padStart(2, "0"),
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
  };
}

function formatTargetTime(startTime: number, targetDuration: number): string {
  const endTime = new Date(startTime + targetDuration * 60 * 60 * 1000);
  return endTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { activeFast, endFast, stats, refresh } = useFasting();
  const [elapsed, setElapsed] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (!activeFast) {
      setElapsed(0);
      return;
    }

    const updateElapsed = () => {
      setElapsed(Date.now() - activeFast.startTime);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  const handleStartFast = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("StartFast", {});
  };

  const handleEndFast = () => {
    const elapsedHours = elapsed / (1000 * 60 * 60);
    const completed = elapsedHours >= (activeFast?.targetDuration || 0);

    Alert.alert(
      completed ? "Complete Fast" : "End Fast Early",
      completed
        ? "Congratulations! You've completed your fasting goal. End fast now?"
        : "You haven't reached your fasting goal yet. End fast early?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: completed ? "Complete" : "End Early",
          style: completed ? "default" : "destructive",
          onPress: async () => {
            Haptics.notificationAsync(
              completed
                ? Haptics.NotificationFeedbackType.Success
                : Haptics.NotificationFeedbackType.Warning
            );
            await endFast(completed);
          },
        },
      ]
    );
  };

  const targetMs = (activeFast?.targetDuration || 0) * 60 * 60 * 1000;
  const progress = targetMs > 0 ? Math.min(elapsed / targetMs, 1) : 0;
  const remaining = Math.max(targetMs - elapsed, 0);
  const time = formatTime(activeFast ? elapsed : 0);
  const elapsedHours = elapsed / (1000 * 60 * 60);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing["4xl"],
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText type="h2">FastTrack</ThemedText>
        {activeFast ? (
          <FastingStageIndicator hoursElapsed={elapsedHours} compact />
        ) : null}
      </View>

      <View style={styles.timerSection}>
        <ProgressRing progress={progress} size={280}>
          <View style={styles.timerContent}>
            {activeFast ? (
              <>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {activeFast.planName}
                </ThemedText>
                <View style={styles.timerDisplay}>
                  <ThemedText
                    style={[
                      styles.timerText,
                      { color: theme.text, fontFamily: Fonts?.mono },
                    ]}
                  >
                    {time.hours}:{time.minutes}
                  </ThemedText>
                  <ThemedText
                    style={[styles.timerSeconds, { color: theme.textSecondary }]}
                  >
                    :{time.seconds}
                  </ThemedText>
                </View>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Goal: {formatTargetTime(activeFast.startTime, activeFast.targetDuration)}
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText type="h4" style={{ color: theme.textSecondary }}>
                  No active fast
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Tap the button below to start
                </ThemedText>
              </>
            )}
          </View>
        </ProgressRing>

        {activeFast ? (
          <View style={styles.stageSection}>
            <FastingStageIndicator hoursElapsed={elapsedHours} />
          </View>
        ) : null}
      </View>

      <View style={styles.statsSection}>
        <StatsCard
          icon="zap"
          label="Current Streak"
          value={`${stats.currentStreak} days`}
          iconColor={Colors.light.primary}
        />
        <StatsCard
          icon="award"
          label="Longest Streak"
          value={`${stats.longestStreak} days`}
          iconColor={Colors.light.secondary}
        />
        <StatsCard
          icon="check-circle"
          label="Total Fasts"
          value={stats.totalFasts}
          iconColor={Colors.light.success}
        />
      </View>

      {activeFast ? (
        <View style={styles.endButtonContainer}>
          <Button
            onPress={handleEndFast}
            style={{ backgroundColor: Colors.light.destructive }}
          >
            End Fast
          </Button>
        </View>
      ) : (
        <FAB
          onPress={handleStartFast}
          icon="play"
        />
      )}

      {!activeFast ? (
        <View
          style={[
            styles.fabContainer,
            { bottom: tabBarHeight + Spacing.xl },
          ]}
        >
          <FAB onPress={handleStartFast} icon="play" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  timerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
  },
  timerContent: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "700",
  },
  timerSeconds: {
    fontSize: 24,
    fontWeight: "600",
  },
  stageSection: {
    width: "100%",
  },
  statsSection: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  endButtonContainer: {
    marginTop: Spacing.xl,
  },
  fabContainer: {
    position: "absolute",
    right: Spacing.lg,
    alignSelf: "center",
  },
});
