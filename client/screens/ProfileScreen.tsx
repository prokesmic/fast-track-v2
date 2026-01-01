import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, TextInput, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { getProfile, saveProfile, getWeights, saveWeight, generateId, UserProfile, WeightEntry } from "@/lib/storage";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

const AVATARS = [
  { id: 0, icon: "sun" as const, color: "#F59E0B", label: "Sunrise" },
  { id: 1, icon: "moon" as const, color: "#8B5CF6", label: "Moon" },
  { id: 2, icon: "droplet" as const, color: Colors.light.primary, label: "Water" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { stats, refresh } = useFasting();
  
  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    avatarId: 0,
    weightUnit: "lbs",
    notificationsEnabled: false,
  });
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const loadData = useCallback(async () => {
    const [profileData, weightsData] = await Promise.all([
      getProfile(),
      getWeights(),
    ]);
    setProfile(profileData);
    setWeights(weightsData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      refresh();
    }, [loadData, refresh])
  );

  const handleSaveProfile = async () => {
    await saveProfile(profile);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditing(false);
  };

  const handleAvatarSelect = (avatarId: number) => {
    Haptics.selectionAsync();
    setProfile((prev) => ({ ...prev, avatarId }));
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight.");
      return;
    }

    const entry: WeightEntry = {
      id: generateId(),
      date: new Date().toISOString().split("T")[0],
      weight,
    };

    await saveWeight(entry);
    setWeights((prev) => [entry, ...prev]);
    setNewWeight("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const selectedAvatar = AVATARS.find((a) => a.id === profile.avatarId) || AVATARS[0];

  const formatTotalHours = (hours: number) => {
    if (hours >= 24) {
      return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
    }
    return `${Math.round(hours)}h`;
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.xl,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.profileSection}>
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: selectedAvatar.color + "30" },
          ]}
        >
          <Feather name={selectedAvatar.icon} size={48} color={selectedAvatar.color} />
        </View>
        
        {isEditing ? (
          <View style={styles.avatarPicker}>
            {AVATARS.map((avatar) => (
              <Pressable
                key={avatar.id}
                onPress={() => handleAvatarSelect(avatar.id)}
                style={[
                  styles.avatarOption,
                  {
                    backgroundColor: avatar.color + "20",
                    borderWidth: profile.avatarId === avatar.id ? 2 : 0,
                    borderColor: avatar.color,
                  },
                ]}
              >
                <Feather name={avatar.icon} size={24} color={avatar.color} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {isEditing ? (
          <TextInput
            value={profile.displayName}
            onChangeText={(text) =>
              setProfile((prev) => ({ ...prev, displayName: text }))
            }
            placeholder="Your Name"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.nameInput,
              {
                color: theme.text,
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.backgroundTertiary,
              },
            ]}
          />
        ) : (
          <ThemedText type="h3">
            {profile.displayName || "Set Your Name"}
          </ThemedText>
        )}

        <Pressable
          onPress={() => {
            if (isEditing) {
              handleSaveProfile();
            } else {
              setIsEditing(true);
            }
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <ThemedText type="body" style={{ color: theme.primary }}>
            {isEditing ? "Save" : "Edit Profile"}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <StatsCard
          icon="clock"
          label="Total Hours"
          value={formatTotalHours(stats.totalHours)}
          iconColor={Colors.light.primary}
        />
        <StatsCard
          icon="check-circle"
          label="Total Fasts"
          value={stats.totalFasts}
          iconColor={Colors.light.success}
        />
        <StatsCard
          icon="award"
          label="Best Streak"
          value={`${stats.longestStreak}d`}
          iconColor={Colors.light.secondary}
        />
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Weight Tracking
        </ThemedText>
        <View style={styles.weightInputRow}>
          <TextInput
            value={newWeight}
            onChangeText={setNewWeight}
            placeholder={`Enter weight (${profile.weightUnit})`}
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            style={[
              styles.weightInput,
              {
                color: theme.text,
                backgroundColor: theme.backgroundSecondary,
              },
            ]}
          />
          <Pressable
            onPress={handleAddWeight}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        {weights.length > 0 ? (
          <View style={styles.weightHistory}>
            {weights.slice(0, 5).map((entry) => (
              <View key={entry.id} style={styles.weightEntry}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {entry.weight} {profile.weightUnit}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            No weight entries yet
          </ThemedText>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Settings
        </ThemedText>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Feather name="bell" size={20} color={theme.textSecondary} />
            <ThemedText type="body">Notifications</ThemedText>
          </View>
          <Switch
            value={profile.notificationsEnabled}
            onValueChange={(value) => {
              Haptics.selectionAsync();
              setProfile((prev) => ({ ...prev, notificationsEnabled: value }));
              saveProfile({ ...profile, notificationsEnabled: value });
            }}
            trackColor={{ false: theme.backgroundTertiary, true: Colors.light.primary + "80" }}
            thumbColor={profile.notificationsEnabled ? Colors.light.primary : theme.backgroundSecondary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Feather name="activity" size={20} color={theme.textSecondary} />
            <ThemedText type="body">Weight Unit</ThemedText>
          </View>
          <View style={[styles.unitToggle, { backgroundColor: theme.backgroundSecondary }]}>
            {(["lbs", "kg"] as const).map((unit) => (
              <Pressable
                key={unit}
                onPress={() => {
                  Haptics.selectionAsync();
                  const updated = { ...profile, weightUnit: unit };
                  setProfile(updated);
                  saveProfile(updated);
                }}
                style={[
                  styles.unitOption,
                  profile.weightUnit === unit && {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: profile.weightUnit === unit ? "#FFFFFF" : theme.textSecondary,
                    fontWeight: profile.weightUnit === unit ? "600" : "400",
                  }}
                >
                  {unit}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
          FastTrack v1.0.0
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPicker: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  nameInput: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minWidth: 200,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  weightInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  weightInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  weightHistory: {
    gap: Spacing.sm,
  },
  weightEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  settingLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: BorderRadius.xs,
    padding: Spacing.xs,
  },
  unitOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
  },
  footer: {
    marginTop: Spacing.xl,
  },
});
