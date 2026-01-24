import React, { useMemo } from "react";
import { View, StyleSheet, SectionList } from "react-native";
import { Fast } from "@/lib/storage";
import { FastDetailCard } from "@/components/FastDetailCard";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { GlassCard } from "@/components/GlassCard";

interface FastListProps {
    fasts: Fast[];
    onEdit: (fast: Fast) => void;
    contentContainerStyle?: any;
}

export function FastList({ fasts, onEdit, contentContainerStyle }: FastListProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const sections = useMemo(() => {
        const grouped: Record<string, Fast[]> = {};

        fasts.forEach(fast => {
            if (!fast.endTime) return;
            const date = new Date(fast.endTime);
            const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(fast);
        });

        return Object.keys(grouped).map(key => ({
            title: key,
            data: grouped[key].sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
        }));

    }, [fasts]);

    if (fasts.length === 0) {
        return (
            <GlassCard style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
                    <Feather name="calendar" size={36} color={colors.primary} />
                </View>
                <ThemedText type="h4" style={{ color: theme.text }}>
                    No fasts recorded
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                    Complete a fast to start building your history.
                </ThemedText>
            </GlassCard>
        );
    }

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View style={{ marginBottom: Spacing.md }}>
                    <FastDetailCard
                        date={new Date(item.endTime!)}
                        duration={(item.endTime! - item.startTime) / (1000 * 60 * 60)}
                        targetDuration={item.targetDuration}
                        planName={item.planName}
                        note={item.note}
                        onPress={() => onEdit(item)}
                    />
                </View>
            )}
            renderSectionHeader={({ section: { title } }) => (
                <View style={styles.sectionHeader}>
                    <ThemedText type="h4" style={{ color: colors.primary }}>{title}</ThemedText>
                </View>
            )}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={contentContainerStyle}
        />
    );
}

const styles = StyleSheet.create({
    sectionHeader: {
        paddingVertical: Spacing.md,
        marginTop: Spacing.sm,
    },
    emptyState: {
        alignItems: "center",
        gap: Spacing.md,
        paddingVertical: Spacing["3xl"],
        marginTop: Spacing.xl,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
    },
});
