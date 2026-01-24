import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { WeightChart } from "@/components/profile/WeightChart";
import { WeightEntry } from "@/lib/storage";
import { GlassCard } from "@/components/GlassCard";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";

interface WeightSectionProps {
    weights: WeightEntry[];
    unit: string;
}

export function WeightSection({ weights, unit }: WeightSectionProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [viewMode, setViewMode] = useState<"chart" | "list">("chart");

    const sortedWeights = [...weights].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.toggleContainer}>
                    <Pressable
                        onPress={() => setViewMode("chart")}
                        style={[
                            styles.toggleButton,
                            viewMode === "chart" && { backgroundColor: colors.primary + "15", borderColor: colors.primary }
                        ]}
                    >
                        <Feather
                            name="bar-chart-2"
                            size={16}
                            color={viewMode === "chart" ? colors.primary : theme.textSecondary}
                        />
                        <ThemedText
                            type="caption"
                            style={{
                                color: viewMode === "chart" ? colors.primary : theme.textSecondary,
                                fontWeight: viewMode === "chart" ? "700" : "500"
                            }}
                        >
                            Graph
                        </ThemedText>
                    </Pressable>
                    <Pressable
                        onPress={() => setViewMode("list")}
                        style={[
                            styles.toggleButton,
                            viewMode === "list" && { backgroundColor: colors.primary + "15", borderColor: colors.primary }
                        ]}
                    >
                        <Feather
                            name="list"
                            size={16}
                            color={viewMode === "list" ? colors.primary : theme.textSecondary}
                        />
                        <ThemedText
                            type="caption"
                            style={{
                                color: viewMode === "list" ? colors.primary : theme.textSecondary,
                                fontWeight: viewMode === "list" ? "700" : "500"
                            }}
                        >
                            List
                        </ThemedText>
                    </Pressable>
                </View>
            </View>

            {viewMode === "chart" ? (
                <WeightChart weights={weights} unit={unit} />
            ) : (
                <GlassCard>
                    <View style={styles.listHeader}>
                        <ThemedText type="h4">History</ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                            {weights.length} entries
                        </ThemedText>
                    </View>
                    <View style={styles.listContainer}>
                        {sortedWeights.length > 0 ? (
                            sortedWeights.map((entry) => (
                                <View key={entry.id} style={[styles.listItem, { borderBottomColor: theme.cardBorder }]}>
                                    <ThemedText type="body">{entry.weight} {unit}</ThemedText>
                                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                                        {new Date(entry.date).toLocaleDateString(undefined, {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </ThemedText>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>
                                    No weight entries yet.
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </GlassCard>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.sm,
    },
    header: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: Spacing.xs,
    },
    toggleContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(0,0,0,0.05)",
        padding: 2,
        borderRadius: BorderRadius.sm,
        gap: 2,
    },
    toggleButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.xs - 2,
        borderWidth: 1,
        borderColor: "transparent",
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    listContainer: {
        gap: 0,
    },
    listItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    emptyState: {
        padding: Spacing.xl,
        alignItems: "center",
    }
});
