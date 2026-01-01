import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, TextInput, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { getProfile, saveProfile, getWeights, saveWeight, generateId, UserProfile, WeightEntry } from "@/lib/storage";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AVATARS = [
  { id: 0, icon: "sun" as const, color: "#F59E0B", label: "Sunrise" },
  { id: 1, icon: "moon" as const, color: "#8B5CF6", label: "Moon" },
  { id: 2, icon: "droplet" as const, color: Colors.light.primary, label: "Water" },
];

interface StatBoxProps {
  icon: string;
  value: string;
  label: string;
  color: string;
}

function StatBox({ icon, value, label, color }: StatBoxProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[styles.statBoxWrapper, animatedStyle]}
    >
      <GlassCard style={styles.statBox} intensity="light">
        <View style={[styles.statIconBg, { backgroundColor: color + "18" }]}>
          <Feather name={icon as any} size={24} color={color} />
        </View>
        <ThemedText type="h2" style={{ color }}>
          {value}
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {label}
        </ThemedText>
      </GlassCard>
    </AnimatedPressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
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
    <View style={styles.container}>
      <GradientBackground variant="profile" />
      
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.xl,
          gap: Spacing.xl,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View
              style={[
                styles.avatarGlow,
                { backgroundColor: selectedAvatar.color },
                Shadows.glow(selectedAvatar.color),
              ]}
            />
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: selectedAvatar.color + "25" },
              ]}
            >
              <Feather name={selectedAvatar.icon} size={56} color={selectedAvatar.color} />
            </View>
          </View>
          
          {isEditing ? (
            <>
              <GlassCard style={styles.avatarPicker}>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                  Choose Avatar
                </ThemedText>
                <View style={styles.avatarOptions}>
                  {AVATARS.map((avatar) => (
                    <Pressable
                      key={avatar.id}
                      onPress={() => handleAvatarSelect(avatar.id)}
                      style={[
                        styles.avatarOption,
                        { backgroundColor: avatar.color + "15" },
                        profile.avatarId === avatar.id && {
                          borderWidth: 2,
                          borderColor: avatar.color,
                        },
                      ]}
                    >
                      <Feather name={avatar.icon} size={28} color={avatar.color} />
                    </Pressable>
                  ))}
                </View>
              </GlassCard>

              <GlassCard>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                  Display Name
                </ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  value={profile.displayName}
                  onChangeText={(text) => setProfile((prev) => ({ ...prev, displayName: text }))}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textTertiary}
                />
              </GlassCard>

              <View style={styles.editButtons}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsEditing(false);
                    loadData();
                  }}
                  style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleSaveProfile}
                  style={[styles.saveButton, { backgroundColor: colors.primary }, Shadows.coloredLg(colors.primary)]}
                >
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>
                    Save
                  </ThemedText>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.profileInfo}>
                <ThemedText type="h2">
                  {profile.displayName || "Your Name"}
                </ThemedText>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Fasting enthusiast
                </ThemedText>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsEditing(true);
                }}
                style={[styles.editProfileButton, { backgroundColor: colors.primary + "15" }]}
              >
                <Feather name="edit-2" size={16} color={colors.primary} />
                <ThemedText type="bodyMedium" style={{ color: colors.primary }}>
                  Edit Profile
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="activity" size={18} color={colors.primary} />
            </View>
            <View>
              <ThemedText type="h3">Your Stats</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Lifetime achievements
              </ThemedText>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <StatBox
              icon="clock"
              value={formatTotalHours(stats.totalHours)}
              label="Total Fasted"
              color={colors.primary}
            />
            <StatBox
              icon="check-circle"
              value={`${stats.totalFasts}`}
              label="Fasts Done"
              color={colors.success}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatBox
              icon="zap"
              value={`${stats.currentStreak}d`}
              label="Current Streak"
              color={colors.secondary}
            />
            <StatBox
              icon="award"
              value={`${stats.longestStreak}d`}
              label="Best Streak"
              color="#F59E0B"
            />
          </View>
        </View>

        <GlassCard accentColor={colors.success}>
          <View style={styles.sectionHeaderInline}>
            <View style={[styles.sectionIconSmall, { backgroundColor: colors.success + "18" }]}>
              <Feather name="trending-up" size={16} color={colors.success} />
            </View>
            <ThemedText type="h4">Weight Tracking</ThemedText>
          </View>
          <View style={styles.weightInputRow}>
            <TextInput
              style={[
                styles.weightInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.cardBorder,
                },
              ]}
              value={newWeight}
              onChangeText={setNewWeight}
              placeholder={`Weight (${profile.weightUnit})`}
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
            />
            <Pressable
              onPress={handleAddWeight}
              style={[
                styles.addWeightButton,
                { backgroundColor: colors.success },
                Shadows.coloredLg(colors.success),
              ]}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          {weights.length > 0 ? (
            <View style={styles.weightHistory}>
              {weights.slice(0, 5).map((entry) => (
                <View key={entry.id} style={[styles.weightEntry, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText type="bodyMedium">
                    {entry.weight} {profile.weightUnit}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {new Date(entry.date).toLocaleDateString()}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No weight entries yet. Add your first one above.
            </ThemedText>
          )}
        </GlassCard>

        <View style={styles.settingsSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.secondary + "18" }]}>
              <Feather name="settings" size={18} color={colors.secondary} />
            </View>
            <View>
              <ThemedText type="h3">Settings</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Customize your experience
              </ThemedText>
            </View>
          </View>

          <GlassCard>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="bell" size={18} color={colors.primary} />
                </View>
                <View>
                  <ThemedText type="bodyMedium">Notifications</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Fast reminders
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={profile.notificationsEnabled}
                onValueChange={(value) => {
                  Haptics.selectionAsync();
                  setProfile((prev) => ({ ...prev, notificationsEnabled: value }));
                  saveProfile({ ...profile, notificationsEnabled: value });
                }}
                trackColor={{ false: theme.backgroundTertiary, true: colors.primary + "50" }}
                thumbColor={profile.notificationsEnabled ? colors.primary : theme.textTertiary}
              />
            </View>

            <View style={[styles.settingDivider, { backgroundColor: theme.cardBorder }]} />

            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                const newUnit = profile.weightUnit === "lbs" ? "kg" : "lbs";
                setProfile((prev) => ({ ...prev, weightUnit: newUnit }));
                saveProfile({ ...profile, weightUnit: newUnit });
              }}
              style={styles.settingRow}
            >
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: colors.success + "15" }]}>
                  <Feather name="activity" size={18} color={colors.success} />
                </View>
                <View>
                  <ThemedText type="bodyMedium">Weight Units</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Currently using {profile.weightUnit}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.unitBadge, { backgroundColor: colors.success + "15" }]}>
                <ThemedText type="caption" style={{ color: colors.success, fontWeight: "700" }}>
                  {profile.weightUnit.toUpperCase()}
                </ThemedText>
              </View>
            </Pressable>
          </GlassCard>
        </View>

        <View style={styles.footer}>
          <ThemedText type="caption" style={{ color: theme.textTertiary }}>
            FastTrack v1.0
          </ThemedText>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  avatarWrapper: {
    position: "relative",
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPicker: {
    width: "100%",
  },
  avatarOptions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  textInput: {
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  editButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  statsSection: {
    gap: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sectionHeaderInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIconSmall: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statBoxWrapper: {
    flex: 1,
  },
  statBox: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  statIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  weightInputRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },
  weightInput: {
    flex: 1,
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  addWeightButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  weightHistory: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  weightEntry: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  settingsSection: {
    gap: Spacing.lg,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  settingDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  unitBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
});
