import React, { useState, useEffect } from "react";
import { View, StyleSheet, Modal, Pressable, Platform, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Fast } from "@/lib/storage";
import { CustomDateTimePicker } from "@/components/DateTimePicker";

interface FastEditModalProps {
    isVisible: boolean;
    fast: Fast | null;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Fast>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export function FastEditModal({ isVisible, fast, onClose, onSave, onDelete }: FastEditModalProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        if (fast) {
            setStartTime(new Date(fast.startTime));
            setEndTime(fast.endTime ? new Date(fast.endTime) : new Date());
        }
    }, [fast]);

    const handleSave = async () => {
        if (!fast) return;

        // Validation: End time must be after start time (if ended)
        if (fast.endTime && endTime.getTime() <= startTime.getTime()) {
            Alert.alert("Invalid Time", "End time must be after start time");
            return;
        }

        // Even if ongoing (no end time), logic usually implies we are editing start time relative to now
        if (startTime.getTime() > Date.now()) {
            Alert.alert("Invalid Time", "Start time cannot be in the future");
            return;
        }

        const updates: Partial<Fast> = {
            startTime: startTime.getTime(),
        };

        if (fast.endTime) {
            updates.endTime = endTime.getTime();
        }

        await onSave(fast.id, updates);
        onClose();
    };

    const handleDelete = () => {
        if (!fast) return;
        Alert.alert(
            "Delete Fast",
            "Are you sure you want to delete this fast? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await onDelete(fast.id);
                        onClose();
                    },
                },
            ]
        );
    };

    if (!fast) return null;

    return (
        <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={[styles.overlay, { backgroundColor: "#00000080" }]}>
                <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                        <ThemedText type="h3">Edit Fast Details</ThemedText>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color={theme.textSecondary} />
                        </Pressable>
                    </View>

                    <View style={styles.content}>
                        {/* Start Time Field */}
                        <View style={styles.field}>
                            <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                                Start Date & Time
                            </ThemedText>
                            <Pressable
                                onPress={() => setShowStartPicker(true)}
                                style={[styles.dateButton, { backgroundColor: theme.backgroundTertiary, borderColor: theme.cardBorder }]}
                            >
                                <Feather name="calendar" size={18} color={theme.textSecondary} />
                                <ThemedText type="body">
                                    {startTime.toLocaleString([], {
                                        weekday: 'short', month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </ThemedText>
                            </Pressable>
                        </View>

                        {/* End Time Field - Only show if fast is completed */}
                        {fast.endTime ? (
                            <View style={styles.field}>
                                <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                                    End Date & Time
                                </ThemedText>
                                <Pressable
                                    onPress={() => setShowEndPicker(true)}
                                    style={[styles.dateButton, { backgroundColor: theme.backgroundTertiary, borderColor: theme.cardBorder }]}
                                >
                                    <Feather name="flag" size={18} color={theme.textSecondary} />
                                    <ThemedText type="body">
                                        {endTime.toLocaleString([], {
                                            weekday: 'short', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </ThemedText>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={[styles.field, { opacity: 0.6 }]}>
                                <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                                    End Date & Time
                                </ThemedText>
                                <View style={[styles.dateButton, { backgroundColor: theme.backgroundTertiary, borderColor: theme.cardBorder }]}>
                                    <Feather name="activity" size={18} color={colors.success} />
                                    <ThemedText type="body" style={{ color: colors.success, fontWeight: "600" }}>
                                        Active / Ongoing
                                    </ThemedText>
                                </View>
                            </View>
                        )}

                        <Pressable
                            onPress={handleSave}
                            style={({ pressed }) => [
                                styles.saveButton,
                                { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
                                Shadows.coloredLg(colors.primary)
                            ]}
                        >
                            <ThemedText type="bodyMedium" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                                Save Changes
                            </ThemedText>
                        </Pressable>

                        <Pressable
                            onPress={handleDelete}
                            style={({ pressed }) => [
                                styles.deleteButton,
                                { opacity: pressed ? 0.7 : 1 }
                            ]}
                        >
                            <ThemedText type="bodyMedium" style={{ color: colors.destructive }}>
                                Delete Fast
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>
            </View>

            <CustomDateTimePicker
                isVisible={showStartPicker}
                date={startTime}
                onConfirm={(date) => {
                    setStartTime(date);
                    setShowStartPicker(false);
                }}
                onCancel={() => setShowStartPicker(false)}
                title="Edit Start Time"
                mode="datetime"
            />

            <CustomDateTimePicker
                isVisible={showEndPicker}
                date={endTime}
                onConfirm={(date) => {
                    setEndTime(date);
                    setShowEndPicker(false);
                }}
                onCancel={() => setShowEndPicker(false)}
                title="Edit End Time"
                mode="datetime"
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    container: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        paddingBottom: Spacing["3xl"],
        // Ensure modal accounts for keyboard/safe area if needed, though simple date picker usually fine
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: Spacing.xl,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: Spacing.xs,
    },
    content: {
        padding: Spacing.xl,
        gap: Spacing.xl,
    },
    field: {
        gap: Spacing.sm,
    },
    dateButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    saveButton: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        alignItems: "center",
        justifyContent: "center",
        marginTop: Spacing.md,
    },
    deleteButton: {
        padding: Spacing.md,
        alignItems: "center",
        justifyContent: "center",
        marginTop: Spacing.xs,
    },
});
