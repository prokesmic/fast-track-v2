import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Share,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
import { CircleChat } from "@/components/circles/CircleChat";
import { useTheme } from "@/hooks/useTheme";
import { useCircleDetail, useCircles } from "@/hooks/useCircles";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { safeHaptics, showAlert, showConfirm } from "@/lib/platform";

type RouteParams = {
  CircleDetail: { circleId: string };
};

type TabType = "chat" | "members" | "activity";

export default function CircleDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, "CircleDetail">>();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const circleId = route.params?.circleId;
  const { circle, isLoading, refresh } = useCircleDetail(circleId);
  const { leaveCircle } = useCircles();

  const [activeTab, setActiveTab] = useState<TabType>("chat");

  const handleCopyInviteCode = async () => {
    if (circle?.inviteCode) {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(circle.inviteCode);
      } else {
        await Clipboard.setStringAsync(circle.inviteCode);
      }
      safeHaptics.notificationAsync();
      showAlert(t("common.success"), t("circles.inviteCodeCopied"));
    }
  };

  const handleShare = async () => {
    if (!circle) return;

    try {
      await Share.share({
        message: `Join my fasting circle "${circle.name}" on FastTrack! Use code: ${circle.inviteCode}`,
      });
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  const handleLeave = async () => {
    if (!circle) return;

    const confirmed = await showConfirm(
      t("circles.leaveCircle"),
      "Are you sure you want to leave this circle?",
      t("circles.leaveCircle"),
      t("common.cancel"),
      true
    );

    if (confirmed) {
      safeHaptics.impactAsync();
      const result = await leaveCircle(circle.id);
      if (result.success) {
        navigation.goBack();
      } else {
        showAlert(t("common.error"), result.error || "Failed to leave circle");
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <GradientBackground variant="profile" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!circle) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <GradientBackground variant="profile" />
        <View style={styles.loadingContainer}>
          <Feather name="alert-circle" size={48} color={theme.textTertiary} />
          <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            Circle not found
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <GradientBackground variant="profile" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerInfo}>
          <ThemedText type="h4" numberOfLines={1}>
            {circle.name}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {t("circles.members", { count: circle.memberCount })}
          </ThemedText>
        </View>
        <Pressable onPress={handleShare} style={styles.headerButton}>
          <Feather name="share-2" size={20} color={theme.textSecondary} />
        </Pressable>
        <Pressable
          onPress={handleCopyInviteCode}
          style={[styles.inviteCodeButton, { backgroundColor: colors.primary + "20" }]}
        >
          <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "700" }}>
            {circle.inviteCode}
          </ThemedText>
          <Feather name="copy" size={14} color={colors.primary} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(["chat", "members", "activity"] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => {
              safeHaptics.selectionAsync();
              setActiveTab(tab);
            }}
            style={[
              styles.tab,
              {
                borderBottomColor: activeTab === tab ? colors.primary : "transparent",
              },
            ]}
          >
            <Feather
              name={tab === "chat" ? "message-circle" : tab === "members" ? "users" : "activity"}
              size={16}
              color={activeTab === tab ? colors.primary : theme.textSecondary}
            />
            <ThemedText
              type="caption"
              style={{
                color: activeTab === tab ? colors.primary : theme.textSecondary,
                fontWeight: activeTab === tab ? "700" : "500",
              }}
            >
              {tab === "chat" ? t("circles.chat") : tab === "members" ? t("social.friends") : t("circles.activity")}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {activeTab === "chat" && (
        <CircleChat circleId={circleId} />
      )}

      {activeTab === "members" && (
        <View style={styles.membersList}>
          {circle.members.map((member) => (
            <GlassCard key={member.id} style={styles.memberCard}>
              <View style={[styles.memberAvatar, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="user" size={20} color={colors.primary} />
              </View>
              <View style={styles.memberInfo}>
                <ThemedText type="bodyMedium" style={{ fontWeight: "600" }}>
                  {member.displayName}
                </ThemedText>
                {member.username && (
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    @{member.username}
                  </ThemedText>
                )}
              </View>
              {member.role === "admin" && (
                <View style={[styles.adminBadge, { backgroundColor: colors.secondary + "20" }]}>
                  <ThemedText type="caption" style={{ color: colors.secondary, fontWeight: "600" }}>
                    Admin
                  </ThemedText>
                </View>
              )}
            </GlassCard>
          ))}

          <Pressable
            onPress={handleLeave}
            style={[styles.leaveButton, { backgroundColor: colors.destructive + "15" }]}
          >
            <Feather name="log-out" size={18} color={colors.destructive} />
            <ThemedText type="bodyMedium" style={{ color: colors.destructive }}>
              {t("circles.leaveCircle")}
            </ThemedText>
          </Pressable>
        </View>
      )}

      {activeTab === "activity" && (
        <View style={styles.activityContainer}>
          <View style={styles.emptyActivity}>
            <Feather name="activity" size={48} color={theme.textTertiary} />
            <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              Activity feed coming soon
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textTertiary }}>
              See when members complete fasts and earn badges
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerInfo: {
    flex: 1,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  inviteCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
  },
  membersList: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInfo: {
    flex: 1,
  },
  adminBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  activityContainer: {
    flex: 1,
  },
  emptyActivity: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
});
