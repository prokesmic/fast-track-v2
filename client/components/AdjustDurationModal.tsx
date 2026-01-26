import React, { useState } from "react";
import {
    View,
    Modal,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, BorderRadius, Spacing, Shadows } from "@/constants/theme";
import { safeHaptics } from "@/lib/platform";

interface AdjustDurationModalProps {
    isVisible: boolean;
    currentDuration: number;
    elapsedHours: number;
    onConfirm: (newDuration: number) => void;
    onCancel: () => void;
}

const PRESET_DURATIONS = [
    { hours: 12, label: "12:12", description: "Circadian Reset" },
    { hours: 14, label: "14:10", description: "Gentle Start" },
    { hours: 16, label: "16:8", description: "Most Popular" },
    { hours: 18, label: "18:6", description: "Fat Burning" },
    { hours: 20, label: "20:4", description: "Warrior Mode" },
    { hours: 23, label: "OMAD", description: "One Meal A Day" },
    { hours: 24, label: "24h", description: "Full Day Fast" },
    { hours: 36, label: "36h", description: "Extended Fast" },
    { hours: 48, label: "48h", description: "Deep Autophagy" },
];

export function AdjustDurationModal({
    isVisible,
    currentDuration,
    elapsedHours,
    onConfirm,
    onCancel,
}: AdjustDurationModalProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const [selectedDuration, setSelectedDuration] = useState(currentDuration);
    const [customHours, setCustomHours] = useState("");
    const [showCustom, setShowCustom] = useState(false);

    const handlePresetSelect = (hours: number) => {
        safeHaptics.selectionAsync();
        setSelectedDuration(hours);
        setShowCustom(false);
        setCustomHours("");
    };

    const handleCustomToggle = () => {
        safeHaptics.selectionAsync();
        setShowCustom(true);
        setCustomHours(selectedDuration.toString());
    };

    const handleCustomChange = (text: string) => {
        // Only allow numbers
        const numericText = text.replace(/[^0-9]/g, "");
        setCustomHours(numericText);
        const hours = parseInt(numericText, 10);
        if (!isNaN(hours) && hours > 0) {
            setSelectedDuration(hours);
        }
    };

    const handleConfirm = () => {
        safeHaptics.impactAsync();
        onConfirm(selectedDuration);
    };

    const isValidSelection = selectedDuration > 0;

    return (
        <Modal visible={isVisible} transparent animationType="none">
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={styles.backdrop}
                >
                    <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
                </Animated.View>

                <Animated.View
                    entering={SlideInDown.springify().damping(20)}
                    exiting={SlideOutDown.duration(200)}
                    style={[
                        styles.modalContainer,
                        { backgroundColor: theme.backgroundSecondary },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerHandle} />
                        <Pressable
                            onPress={onCancel}
                            style={[styles.closeButton, { backgroundColor: theme.backgroundTertiary }]}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Feather name="x" size={24} color={theme.text} />
                        </Pressable>
                    </View>

                    <View style={styles.titleSection}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
                            <Feather name="target" size={28} color={colors.primary} />
                        </View>
                        <ThemedText type="h3">Adjust Fasting Goal</ThemedText>
                        <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                            Current: {currentDuration}h | Elapsed: {elapsedHours.toFixed(1)}h
                        </ThemedText>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.content}
                    >
                        {/* Preset durations */}
                        <View style={styles.presetsGrid}>
                            {PRESET_DURATIONS.map((preset) => {
                                const isSelected = selectedDuration === preset.hours && !showCustom;
                                const isPassed = elapsedHours >= preset.hours;

                                return (
                                    <Pressable
                                        key={preset.hours}
                                        onPress={() => handlePresetSelect(preset.hours)}
                                        style={[
                                            styles.presetButton,
                                            {
                                                backgroundColor: isSelected
                                                    ? colors.primary
                                                    : theme.backgroundTertiary,
                                                borderColor: isSelected
                                                    ? colors.primary
                                                    : theme.cardBorder,
                                            },
                                        ]}
                                    >
                                        {isPassed && (
                                            <View style={[styles.passedBadge, { backgroundColor: colors.success }]}>
                                                <Feather name="check" size={10} color="#FFFFFF" />
                                            </View>
                                        )}
                                        <ThemedText
                                            type="h4"
                                            style={{ color: isSelected ? "#FFFFFF" : theme.text }}
                                        >
                                            {preset.label}
                                        </ThemedText>
                                        <ThemedText
                                            type="caption"
                                            style={{
                                                color: isSelected ? "#FFFFFF99" : theme.textSecondary,
                                                textAlign: "center",
                                            }}
                                        >
                                            {preset.description}
                                        </ThemedText>
                                    </Pressable>
                                );
                            })}

                            {/* Custom option */}
                            <Pressable
                                onPress={handleCustomToggle}
                                style={[
                                    styles.presetButton,
                                    {
                                        backgroundColor: showCustom
                                            ? colors.secondary
                                            : theme.backgroundTertiary,
                                        borderColor: showCustom
                                            ? colors.secondary
                                            : theme.cardBorder,
                                    },
                                ]}
                            >
                                <Feather
                                    name="edit-2"
                                    size={20}
                                    color={showCustom ? "#FFFFFF" : theme.textSecondary}
                                />
                                <ThemedText
                                    type="caption"
                                    style={{
                                        color: showCustom ? "#FFFFFF" : theme.textSecondary,
                                        textAlign: "center",
                                    }}
                                >
                                    Custom
                                </ThemedText>
                            </Pressable>
                        </View>

                        {/* Custom input */}
                        {showCustom && (
                            <View style={styles.customInputSection}>
                                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                                    CUSTOM DURATION (HOURS)
                                </ThemedText>
                                <View style={[styles.customInputContainer, { backgroundColor: theme.backgroundTertiary, borderColor: colors.secondary }]}>
                                    <TextInput
                                        style={[styles.customInput, { color: theme.text }]}
                                        value={customHours}
                                        onChangeText={handleCustomChange}
                                        keyboardType="number-pad"
                                        placeholder="Enter hours"
                                        placeholderTextColor={theme.textTertiary}
                                        autoFocus
                                    />
                                    <ThemedText type="body" style={{ color: theme.textSecondary }}>
                                        hours
                                    </ThemedText>
                                </View>
                            </View>
                        )}

                        {/* Selected duration preview */}
                        <View style={[styles.previewCard, { backgroundColor: theme.backgroundTertiary }]}>
                            <View style={styles.previewRow}>
                                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                                    New Goal
                                </ThemedText>
                                <ThemedText type="h3" style={{ color: colors.primary }}>
                                    {selectedDuration}h
                                </ThemedText>
                            </View>
                            <View style={[styles.previewDivider, { backgroundColor: theme.cardBorder }]} />
                            <View style={styles.previewRow}>
                                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                                    Time Remaining
                                </ThemedText>
                                <ThemedText
                                    type="h4"
                                    style={{
                                        color: selectedDuration > elapsedHours ? theme.text : colors.success,
                                    }}
                                >
                                    {selectedDuration > elapsedHours
                                        ? `${(selectedDuration - elapsedHours).toFixed(1)}h`
                                        : "Completed!"}
                                </ThemedText>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Pressable
                            onPress={onCancel}
                            style={[styles.cancelButton, { backgroundColor: theme.backgroundTertiary }]}
                        >
                            <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>
                                Cancel
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={handleConfirm}
                            disabled={!isValidSelection}
                            style={[
                                styles.confirmButton,
                                { backgroundColor: colors.primary, opacity: isValidSelection ? 1 : 0.5 },
                                Shadows.coloredLg(colors.primary),
                            ]}
                        >
                            <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>
                                Update Goal
                            </ThemedText>
                        </Pressable>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContainer: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        maxHeight: "85%",
    },
    header: {
        alignItems: "center",
        paddingTop: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    headerHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(128, 128, 128, 0.3)",
    },
    closeButton: {
        position: "absolute",
        right: Spacing.lg,
        top: Spacing.md,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    titleSection: {
        alignItems: "center",
        gap: Spacing.sm,
        paddingTop: Spacing.xl,
        paddingHorizontal: Spacing.xl,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        padding: Spacing.xl,
        gap: Spacing.xl,
    },
    presetsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    presetButton: {
        width: "31%",
        aspectRatio: 1,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
        position: "relative",
    },
    passedBadge: {
        position: "absolute",
        top: Spacing.xs,
        right: Spacing.xs,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    customInputSection: {
        gap: Spacing.sm,
    },
    customInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        gap: Spacing.sm,
    },
    customInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: "600",
    },
    previewCard: {
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    previewRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    previewDivider: {
        height: 1,
    },
    footer: {
        flexDirection: "row",
        padding: Spacing.xl,
        paddingTop: 0,
        gap: Spacing.md,
    },
    cancelButton: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: "center",
    },
    confirmButton: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: "center",
    },
});
