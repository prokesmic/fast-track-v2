import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useCircles } from "@/hooks/useCircles";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { safeHaptics, showAlert } from "@/lib/platform";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated?: (circleId: string) => void;
}

export function CreateCircleModal({ visible, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { createCircle } = useCircles();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [maxMembers, setMaxMembers] = useState("10");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      showAlert(t("common.error"), "Circle name is required");
      return;
    }

    setIsCreating(true);
    safeHaptics.impactAsync();

    const result = await createCircle({
      name: name.trim(),
      description: description.trim() || undefined,
      isPrivate,
      maxMembers: parseInt(maxMembers) || 10,
    });

    setIsCreating(false);

    if (result.success && result.circle) {
      safeHaptics.notificationAsync();
      setName("");
      setDescription("");
      setIsPrivate(true);
      setMaxMembers("10");
      onClose();
      onCreated?.(result.circle.id);
    } else {
      showAlert(t("common.error"), result.error || "Failed to create circle");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.header}>
            <ThemedText type="h3">{t("circles.create")}</ThemedText>
            <Pressable onPress={onClose}>
              <Feather name="x" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {t("circles.circleName")} *
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.cardBorder,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="My Fasting Circle"
                placeholderTextColor={theme.textTertiary}
                maxLength={50}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {t("circles.description")}
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.cardBorder,
                  },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="What's this circle about?"
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <ThemedText type="bodyMedium">{t("circles.private")}</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Only joinable via invite code
                </ThemedText>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: theme.backgroundTertiary, true: colors.primary + "50" }}
                thumbColor={isPrivate ? colors.primary : theme.textTertiary}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {t("circles.maxMembers", { count: parseInt(maxMembers) || 10 })}
              </ThemedText>
              <View style={styles.memberSelector}>
                {[5, 10, 15, 20].map((num) => (
                  <Pressable
                    key={num}
                    onPress={() => setMaxMembers(num.toString())}
                    style={[
                      styles.memberOption,
                      {
                        backgroundColor:
                          maxMembers === num.toString()
                            ? colors.primary + "20"
                            : theme.backgroundSecondary,
                        borderColor:
                          maxMembers === num.toString()
                            ? colors.primary
                            : theme.cardBorder,
                      },
                    ]}
                  >
                    <ThemedText
                      type="bodyMedium"
                      style={{
                        color:
                          maxMembers === num.toString()
                            ? colors.primary
                            : theme.textSecondary,
                        fontWeight: maxMembers === num.toString() ? "600" : "400",
                      }}
                    >
                      {num}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.button, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>
                {t("common.cancel")}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              disabled={isCreating || !name.trim()}
              style={[
                styles.button,
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isCreating || !name.trim() ? 0.5 : 1,
                },
              ]}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="plus" size={18} color="#FFFFFF" />
                  <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>
                    {t("circles.create")}
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
    maxHeight: "80%",
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
  input: {
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowInfo: {
    flex: 1,
  },
  memberSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  memberOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
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
