import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, TextInput, Switch, Alert, Image, NativeModules, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import * as Updates from "expo-updates";

import { safeHaptics, showAlert, showConfirm } from "@/lib/platform";
import { useAuth } from "@/context/AuthContext";
import { performFullSync, getLastSyncTime } from "@/lib/sync";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
import { BadgesSection } from "@/components/profile/BadgesSection";
import { useTheme } from "@/hooks/useTheme";
import { useFasting } from "@/hooks/useFasting";
import { getProfile, saveProfile, getWeights, saveWeight, generateId, clearAllData, UserProfile, WeightEntry } from "@/lib/storage";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { WeightSection } from "@/components/profile/WeightSection";
import { HistoryItem } from "@/components/HistoryItem";
import { FastEditModal } from "@/components/FastEditModal";
import { Fast } from "@/lib/storage";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AVATARS = [
  { id: 0, icon: "sun" as const, color: "#F59E0B", label: "Sunrise" },
  { id: 1, icon: "moon" as const, color: "#8B5CF6", label: "Moon" },
  { id: 2, icon: "droplet" as const, color: Colors.light.primary, label: "Water" },
  { id: 3, icon: "zap" as const, color: "#EAB308", label: "Energy" },
  { id: 4, icon: "heart" as const, color: "#EF4444", label: "Health" },
  { id: 5, icon: "wind" as const, color: "#0EA5E9", label: "Spirit" },
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
      <GlassCard style={styles.statBox} intensity="medium">
        {/* Background Icon Watermark */}
        <View style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.1 }}>
          <Feather name={icon as any} size={80} color={color} />
        </View>

        <View style={styles.statContent}>
          <View style={[styles.statHeader]}>
            <View style={[styles.statIconSmall, { backgroundColor: color + "20" }]}>
              <Feather name={icon as any} size={16} color={color} />
            </View>
            <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: "600", letterSpacing: 0.5 }}>
              {label.toUpperCase()}
            </ThemedText>
          </View>

          <View style={styles.statValueContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              {value.split(' ').map((part, index) => {
                const match = part.match(/(\d+)([a-zA-Z]*)/);
                if (match) {
                  const [_, num, unit] = match;
                  return (
                    <ThemedText key={index} type="h2" style={{ color: theme.text, fontSize: 32, lineHeight: 38 }}>
                      {num}
                      {unit ? (
                        <ThemedText type="bodyMedium" style={{ color: color, fontWeight: "700" }}>
                          {unit}
                        </ThemedText>
                      ) : null}
                      {index < value.split(' ').length - 1 ? " " : ""}
                    </ThemedText>
                  );
                }
                return (
                  <ThemedText key={index} type="h2" style={{ color: theme.text, fontSize: 32, lineHeight: 38 }}>
                    {part}
                    {index < value.split(' ').length - 1 ? " " : ""}
                  </ThemedText>
                );
              })}
            </View>
          </View>
        </View>
      </GlassCard>
    </AnimatedPressable>
  );
}

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, colorScheme, themeType, setThemeType } = useTheme();
  const colors = Colors[colorScheme];
  const { stats, refresh, fasts, activeFast, cancelFast, deleteFast, updateFast } = useFasting();
  const { user, isAuthenticated, logout } = useAuth();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    avatarId: 0,
    weightUnit: "lbs",
    notificationsEnabled: false,
    unlockedBadges: [],
  });
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Edit Fast State
  const [editingFast, setEditingFast] = useState<Fast | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Get completed fasts sorted by date (newest first)
  const completedFasts = fasts.filter(f => f.completed && f.endTime).sort((a, b) => b.endTime! - a.endTime!);
  const recentFasts = completedFasts.slice(0, 5); // Show top 5

  const loadData = useCallback(async () => {
    const [profileData, weightsData, syncTime] = await Promise.all([
      getProfile(),
      getWeights(),
      getLastSyncTime(),
    ]);
    setProfile(profileData);
    setWeights(weightsData);
    setLastSyncTime(syncTime);
  }, []);

  const handleSync = async () => {
    if (!isAuthenticated) return;
    setIsSyncing(true);
    safeHaptics.impactAsync();

    const result = await performFullSync();

    setIsSyncing(false);
    if (result.success) {
      safeHaptics.notificationAsync();
      await loadData();
      refresh();
      showAlert("Sync Complete", "Your data has been synced successfully.");
    } else {
      showAlert("Sync Failed", result.error || "Could not sync data. Please try again.");
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      "Sign Out",
      "Are you sure you want to sign out? Your local data will be preserved.",
      "Sign Out",
      "Cancel"
    );
    if (confirmed) {
      safeHaptics.notificationAsync();
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  };

  const formatSyncTime = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      refresh();
      // Force badge refresh check if needed, but loadData() handles profile state
    }, [loadData, refresh])
  );

  const handleSaveProfile = async () => {
    await saveProfile(profile);
    safeHaptics.notificationAsync();
    setIsEditing(false);
  };

  const handleAvatarSelect = (avatarId: number) => {
    safeHaptics.selectionAsync();
    setProfile((prev) => ({ ...prev, avatarId }));
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      showAlert("Invalid Weight", "Please enter a valid weight.");
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
    safeHaptics.notificationAsync();
  };

  const handleEditFast = (fast: Fast) => {
    setEditingFast(fast);
    setIsEditModalVisible(true);
  };

  const handleDeleteFast = async (id: string) => {
    await deleteFast(id);
    safeHaptics.notificationAsync();
  };

  const handleUpdateFast = async (id: string, updates: Partial<Fast>) => {
    await updateFast(id, updates);
    safeHaptics.notificationAsync();
  };

  const handleCancelFast = async () => {
    const confirmed = await showConfirm(
      "Cancel Current Fast",
      "Are you sure you want to cancel your active fast? This session will not be saved.",
      "Cancel Fast",
      "Keep Fasting",
      true
    );
    if (confirmed) {
      safeHaptics.notificationAsync();
      await cancelFast();
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      safeHaptics.selectionAsync();
      // Reset standard avatar ID to -1 or keep it as fallback? 
      // Let's keep avatarId but prefer customAvatarUri if present.
      // Or set avatarId to a specific "custom" value like -1.
      setProfile(prev => ({ ...prev, customAvatarUri: result.assets[0].uri }));
    }
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
        {isEditing ? (
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              <View
                style={[
                  styles.avatarGlow,
                  { backgroundColor: profile.customAvatarUri ? colors.primary : selectedAvatar.color },
                  profile.customAvatarUri ? undefined : Shadows.glow(selectedAvatar.color),
                ]}
              />
              {profile.customAvatarUri ? (
                <View style={[styles.avatarContainer, { overflow: 'hidden' }]}>
                  <Image
                    source={{ uri: profile.customAvatarUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.avatarContainer,
                    { backgroundColor: selectedAvatar.color + "25" },
                  ]}
                >
                  <Feather name={selectedAvatar.icon} size={56} color={selectedAvatar.color} />
                </View>
              )}
            </View>

            <GlassCard style={styles.avatarPicker}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                Choose Avatar
              </ThemedText>
              <View style={styles.avatarOptions}>
                {AVATARS.map((avatar) => (
                  <Pressable
                    key={avatar.id}
                    onPress={() => {
                      handleAvatarSelect(avatar.id);
                      // Clear custom avatar when picking a preset
                      setProfile(prev => ({ ...prev, customAvatarUri: undefined }));
                    }}
                    style={[
                      styles.avatarOption,
                      { backgroundColor: avatar.color + "15" },
                      profile.avatarId === avatar.id && !profile.customAvatarUri && {
                        borderWidth: 2,
                        borderColor: avatar.color,
                      },
                    ]}
                  >
                    <Feather name={avatar.icon} size={28} color={avatar.color} />
                  </Pressable>
                ))}

                <Pressable
                  onPress={handlePickImage}
                  style={[
                    styles.avatarOption,
                    { backgroundColor: theme.backgroundTertiary, overflow: 'hidden' },
                    profile.customAvatarUri ? {
                      borderWidth: 2,
                      borderColor: colors.primary,
                    } : undefined
                  ]}
                >
                  {profile.customAvatarUri ? (
                    <Image
                      source={{ uri: profile.customAvatarUri }}
                      style={{ width: "100%", height: "100%", borderRadius: 30 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Feather name="camera" size={24} color={theme.textSecondary} />
                  )}
                </Pressable>
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
                  safeHaptics.impactAsync();
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
          </View>
        ) : (
          <ProfileHero
            profile={profile}
            totalHours={stats.totalHours}
            onEdit={() => {
              safeHaptics.impactAsync();
              setIsEditing(true);
            }}
            AVATARS={AVATARS}
          />
        )}

        <BadgesSection unlockedBadges={profile.unlockedBadges || []} />

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

        <View>
          <View style={[styles.sectionHeaderInline, { paddingHorizontal: Spacing.xs }]}>
            <View style={[styles.sectionIconSmall, { backgroundColor: colors.success + "18" }]}>
              <Feather name="trending-up" size={16} color={colors.success} />
            </View>
            <ThemedText type="h4">Weight Tracking</ThemedText>
          </View>

          <WeightSection weights={weights} unit={profile.weightUnit} />

          <GlassCard style={{ marginTop: Spacing.md }}>
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
                placeholder={`Log new weight (${profile.weightUnit})`}
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
          </GlassCard>
        </View>

        <View style={styles.sectionHeaderInline}>
          <View style={[styles.sectionIconSmall, { backgroundColor: colors.primary + "18" }]}>
            <Feather name="clock" size={16} color={colors.primary} />
          </View>
          <ThemedText type="h4">Recent History</ThemedText>
        </View>

        {recentFasts.length > 0 ? (
          <View style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
            {recentFasts.map(fast => (
              <HistoryItem
                key={fast.id}
                fast={fast}
                onEdit={handleEditFast}
                onDelete={handleDeleteFast}
              />
            ))}
          </View>
        ) : (
          <GlassCard style={{ marginBottom: Spacing.xl, alignItems: 'center', padding: Spacing.xl }}>
            <Feather name="wind" size={32} color={theme.textTertiary} />
            <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              No completed fasts yet
            </ThemedText>
          </GlassCard>
        )}

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
                <View style={[styles.settingIcon, { backgroundColor: colors.accent + "15" }]}>
                  <Feather name="sun" size={18} color={colors.accent} />
                </View>
                <View>
                  <ThemedText type="bodyMedium">Appearance</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Current: {(themeType || "system").charAt(0).toUpperCase() + (themeType || "system").slice(1)}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.themeSelector}>
              {(["light", "dark", "system"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => {
                    safeHaptics.selectionAsync();
                    if (setThemeType) setThemeType(t);
                  }}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: themeType === t ? colors.primary + "15" : theme.backgroundTertiary,
                      borderColor: themeType === t ? colors.primary : "transparent",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Feather
                    name={t === "light" ? "sun" : t === "dark" ? "moon" : "smartphone"}
                    size={16}
                    color={themeType === t ? colors.primary : theme.textSecondary}
                  />
                  <ThemedText
                    type="caption"
                    style={{
                      color: themeType === t ? colors.primary : theme.textSecondary,
                      fontWeight: themeType === t ? "700" : "500",
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <View style={[styles.settingDivider, { backgroundColor: theme.cardBorder }]} />

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
                  safeHaptics.selectionAsync();
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
                safeHaptics.selectionAsync();
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

            <View style={[styles.settingDivider, { backgroundColor: theme.cardBorder }]} />

            <Pressable
              onPress={async () => {
                safeHaptics.notificationAsync();
                const confirmed = await showConfirm(
                  "Delete All Data",
                  "Are you sure you want to delete all your history and settings? This action cannot be undone.",
                  "Delete",
                  "Cancel",
                  true
                );
                if (confirmed) {
                  await clearAllData();
                  safeHaptics.notificationAsync();
                  showAlert("Data Cleared", "The app will now restart.");
                  try {
                    await Updates.reloadAsync();
                  } catch (e) {
                    // Fallback for dev/web environment
                    if (Platform.OS === "web") {
                      window.location.reload();
                    } else if (NativeModules.DevSettings) {
                      NativeModules.DevSettings.reload();
                    } else {
                      loadData();
                      refresh();
                    }
                  }
                }
              }}
              style={styles.settingRow}
            >
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: colors.destructive + "15" }]}>
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </View>
                <View>
                  <ThemedText type="bodyMedium" style={{ color: colors.destructive }}>Delete Data</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Reset everything
                  </ThemedText>
                </View>
              </View>
            </Pressable>

            <View style={[styles.settingDivider, { backgroundColor: theme.cardBorder }]} />

            <Pressable
              onPress={async () => {
                const confirmed = await showConfirm(
                  "Restart App",
                  "This will reload the app.",
                  "Restart",
                  "Cancel"
                );
                if (confirmed) {
                  try {
                    await Updates.reloadAsync();
                  } catch (e) {
                    if (Platform.OS === "web") {
                      window.location.reload();
                    } else if (NativeModules.DevSettings) {
                      NativeModules.DevSettings.reload();
                    } else {
                      showAlert("Error", "Could not reload. Please restart manually.");
                    }
                  }
                }
              }}
              style={styles.settingRow}
            >
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="refresh-cw" size={18} color={colors.primary} />
                </View>
                <View>
                  <ThemedText type="bodyMedium">Restart App</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Reloads the application
                  </ThemedText>
                </View>
              </View>
            </Pressable>



            {/* Cancel Active Fast Option */}
            {activeFast ? (
              <>
                <View style={[styles.settingDivider, { backgroundColor: theme.cardBorder }]} />
                <Pressable
                  onPress={handleCancelFast}
                  style={styles.settingRow}
                >
                  <View style={styles.settingInfo}>
                    <View style={[styles.settingIcon, { backgroundColor: colors.destructive + "15" }]}>
                      <Feather name="x-circle" size={18} color={colors.destructive} />
                    </View>
                    <View>
                      <ThemedText type="bodyMedium" style={{ color: colors.destructive }}>Cancel Active Fast</ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        Discard current session
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              </>
            ) : null}

          </GlassCard>
        </View>

        {/* Account Section */}
        <View style={styles.settingsSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="user" size={18} color={colors.primary} />
            </View>
            <View>
              <ThemedText type="h3">Account</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {isAuthenticated ? user?.email : "Not signed in"}
              </ThemedText>
            </View>
          </View>

          <GlassCard>
            {isAuthenticated ? (
              <>
                {/* Sync Button */}
                <Pressable
                  onPress={handleSync}
                  disabled={isSyncing}
                  style={styles.settingRow}
                >
                  <View style={styles.settingInfo}>
                    <View style={[styles.settingIcon, { backgroundColor: colors.success + "15" }]}>
                      {isSyncing ? (
                        <ActivityIndicator size="small" color={colors.success} />
                      ) : (
                        <Feather name="refresh-cw" size={18} color={colors.success} />
                      )}
                    </View>
                    <View>
                      <ThemedText type="bodyMedium">Sync Data</ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        Last synced: {formatSyncTime(lastSyncTime)}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>

                <View style={[styles.settingDivider, { backgroundColor: theme.cardBorder }]} />

                {/* Logout Button */}
                <Pressable
                  onPress={handleLogout}
                  style={styles.settingRow}
                >
                  <View style={styles.settingInfo}>
                    <View style={[styles.settingIcon, { backgroundColor: colors.destructive + "15" }]}>
                      <Feather name="log-out" size={18} color={colors.destructive} />
                    </View>
                    <View>
                      <ThemedText type="bodyMedium" style={{ color: colors.destructive }}>Sign Out</ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        {user?.email}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => navigation.navigate("Login")}
                style={styles.settingRow}
              >
                <View style={styles.settingInfo}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
                    <Feather name="log-in" size={18} color={colors.primary} />
                  </View>
                  <View>
                    <ThemedText type="bodyMedium">Sign In</ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      Sync your data across devices
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            )}
          </GlassCard>
        </View>

        <View style={styles.footer}>
          <ThemedText type="caption" style={{ color: theme.textTertiary }}>
            FastTrack v1.1
          </ThemedText>
        </View>
      </KeyboardAwareScrollViewCompat >

      <FastEditModal
        isVisible={isEditModalVisible}
        fast={editingFast}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleUpdateFast}
        onDelete={deleteFast}
      />
    </View >
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
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  statContent: {
    gap: Spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueContainer: {
    alignItems: 'flex-start',
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
  themeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
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
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  achievementBadge: {
    alignItems: 'center',
    width: '24%',
    gap: 4
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  }
});
