import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useCircles } from "@/hooks/useCircles";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { safeHaptics, showAlert } from "@/lib/platform";

interface Props {
  visible: boolean;
  onClose: () => void;
  onJoined?: (circleId: string) => void;
}

interface CirclePreview {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  maxMembers: number;
}

export function JoinCircleModal({ visible, onClose, onJoined }: Props) {
  const { t } = useTranslation();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { joinCircle, lookupCircle } = useCircles();

  const [inviteCode, setInviteCode] = useState("");
  const [preview, setPreview] = useState<CirclePreview | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleLookup = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6) {
      showAlert(t("common.error"), "Invalid invite code format");
      return;
    }

    setIsLookingUp(true);
    safeHaptics.impactAsync();

    const result = await lookupCircle(code);

    setIsLookingUp(false);

    if (result.success && result.circle) {
      setPreview(result.circle);
    } else {
      showAlert(t("common.error"), result.error || "Circle not found");
      setPreview(null);
    }
  };

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6) return;

    setIsJoining(true);
    safeHaptics.impactAsync();

    const result = await joinCircle(code);

    setIsJoining(false);

    if (result.success && result.circleId) {
      safeHaptics.notificationAsync();
      setInviteCode("");
      setPreview(null);
      onClose();
      onJoined?.(result.circleId);
    } else {
      showAlert(t("common.error"), result.error || "Failed to join circle");
    }
  };

  const handleClose = () => {
    setInviteCode("");
    setPreview(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.content, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.header}>
            <ThemedText type="h3">{t("circles.join")}</ThemedText>
            <Pressable onPress={handleClose}>
              <Feather name="x" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {t("circles.inviteCode")}
              </ThemedText>
              <View style={styles.codeInputRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.codeInput,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  value={inviteCode}
                  onChangeText={(text) => {
                    setInviteCode(text.toUpperCase());
                    setPreview(null);
                  }}
                  placeholder="ABC123"
                  placeholderTextColor={theme.textTertiary}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={handleLookup}
                  disabled={isLookingUp || inviteCode.length !== 6}
                  style={[
                    styles.lookupButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: isLookingUp || inviteCode.length !== 6 ? 0.5 : 1,
                    },
                  ]}
                >
                  {isLookingUp ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Feather name="search" size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
              <ThemedText type="caption" style={{ color: theme.textTertiary, marginTop: Spacing.xs }}>
                {t("circles.joinHint")}
              </ThemedText>
            </View>

            {preview && (
              <GlassCard style={styles.preview}>
                <View style={styles.previewHeader}>
                  <View style={[styles.previewIcon, { backgroundColor: colors.secondary + "20" }]}>
                    <Feather name="users" size={24} color={colors.secondary} />
                  </View>
                  <View style={styles.previewInfo}>
                    <ThemedText type="bodyMedium" style={{ fontWeight: "600" }}>
                      {preview.name}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {t("circles.members", { count: preview.memberCount })} / {preview.maxMembers} max
                    </ThemedText>
                  </View>
                </View>
                {preview.description && (
                  <ThemedText
                    type="caption"
                    style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
                  >
                    {preview.description}
                  </ThemedText>
                )}
              </GlassCard>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handleClose}
              style={[styles.button, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>
                {t("common.cancel")}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleJoin}
              disabled={isJoining || !preview}
              style={[
                styles.button,
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isJoining || !preview ? 0.5 : 1,
                },
              ]}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="log-in" size={18} color="#FFFFFF" />
                  <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>
                    {t("circles.join")}
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.xs,
  },
  codeInputRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  input: {
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  codeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 4,
    textAlign: "center",
  },
  lookupButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    padding: Spacing.md,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  previewInfo: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
});
