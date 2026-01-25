import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { safeHaptics, showConfirm } from "@/lib/platform";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { Fast } from "@/lib/storage";

interface HistoryItemProps {
    fast: Fast;
    onEdit: (fast: Fast) => void;
    onDelete: (id: string) => void;
}

export function HistoryItem({ fast, onEdit, onDelete }: HistoryItemProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const durationHours = ((fast.endTime || Date.now()) - fast.startTime) / (1000 * 60 * 60);
    const isTargetMet = durationHours >= fast.targetDuration;

    const startTime = new Date(fast.startTime);
    const endTime = fast.endTime ? new Date(fast.endTime) : null;

    const handleDelete = async () => {
        safeHaptics.notificationAsync();
        const confirmed = await showConfirm(
            "Delete Fast",
            "Are you sure you want to delete this fast? This cannot be undone.",
            "Delete",
            "Cancel",
            true
        );
        if (confirmed) {
            onDelete(fast.id);
        }
    };

    return (
        <GlassCard style={styles.container}>
            <View style={styles.header}>
                <View style={styles.dateInfo}>
                    <View style={[styles.iconBg, { backgroundColor: isTargetMet ? colors.success + "15" : colors.primary + "15" }]}>
                        <Feather
                            name={isTargetMet ? "check-circle" : "clock"}
                            size={18}
                            color={isTargetMet ? colors.success : colors.primary}
                        />
                    </View>
                    <View>
                        <ThemedText type="bodyMedium" style={{ fontWeight: "600" }}>
                            {startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                            {Math.round(durationHours * 10) / 10}h • Goal: {fast.targetDuration}h
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.actions}>
                    <Pressable
                        onPress={() => onEdit(fast)}
                        style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.7 : 1, backgroundColor: theme.backgroundTertiary }]}
                    >
                        <Feather name="edit-2" size={16} color={theme.text} />
                    </Pressable>
                    <Pressable
                        onPress={handleDelete}
                        style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.7 : 1, backgroundColor: colors.destructive + "15" }]}
                    >
                        <Feather name="trash-2" size={16} color={colors.destructive} />
                    </Pressable>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

            <View style={styles.details}>
                <View style={styles.detailItem}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>Started</ThemedText>
                    <ThemedText type="small">
                        {startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </ThemedText>
                </View>
                <View style={styles.arrow}>
                    <Feather name="arrow-right" size={14} color={theme.textTertiary} />
                </View>
                <View style={styles.detailItem}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>Ended</ThemedText>
                    <ThemedText type="small">
                        {endTime ? endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : "Ongoing"}
                    </ThemedText>
                </View>
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dateInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },
    iconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    actions: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    divider: {
        height: 1,
        marginVertical: Spacing.md,
    },
    details: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.sm,
    },
    detailItem: {
        gap: 2,
    },
    arrow: {
        opacity: 0.5,
    }
});
