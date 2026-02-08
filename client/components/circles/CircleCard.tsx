import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { FastingCircle } from "@/hooks/useCircles";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface Props {
  circle: FastingCircle;
  onPress: () => void;
}

export function CircleCard({ circle, onPress }: Props) {
  const { t } = useTranslation();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t("time.justNow");
    if (minutes < 60) return t("time.minutesAgo", { count: minutes });
    if (hours < 24) return t("time.hoursAgo", { count: hours });
    return t("time.daysAgo", { count: days });
  };

  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary + "20" }]}>
            <Feather name="users" size={24} color={colors.secondary} />
          </View>
          <View style={styles.info}>
            <ThemedText type="bodyMedium" style={{ fontWeight: "600" }}>
              {circle.name}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {t("circles.members", { count: circle.memberCount })}
              {circle.userRole === "admin" && " • Admin"}
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textTertiary} />
        </View>

        {circle.description && (
          <ThemedText
            type="caption"
            style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
            numberOfLines={2}
          >
            {circle.description}
          </ThemedText>
        )}

        {circle.lastMessage && (
          <View style={[styles.lastMessage, { borderTopColor: theme.cardBorder }]}>
            <View style={styles.messagePreview}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
                <ThemedText type="caption" style={{ fontWeight: "600" }}>
                  {circle.lastMessage.type === "system" ? "" : ""}
                </ThemedText>
                {circle.lastMessage.content}
              </ThemedText>
            </View>
            <ThemedText type="caption" style={{ color: theme.textTertiary }}>
              {formatTime(circle.lastMessage.createdAt)}
            </ThemedText>
          </View>
        )}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  lastMessage: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  messagePreview: {
    flex: 1,
    marginRight: Spacing.md,
  },
});
