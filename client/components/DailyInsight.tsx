import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getRandomTip, Tip } from "@/constants/tips";
import Animated, { FadeIn } from "react-native-reanimated";

export function DailyInsight() {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [tip, setTip] = useState<Tip | null>(null);

    useEffect(() => {
        setTip(getRandomTip());
    }, []);

    const handleRefresh = () => {
        setTip(getRandomTip());
    };

    if (!tip) return null;

    return (
        <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
            <GlassCard accentColor={colors.primary}>
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <View style={[styles.iconBg, { backgroundColor: colors.primary + "15" }]}>
                            <Feather name="zap" size={16} color={colors.primary} />
                        </View>
                        <ThemedText type="h4">Daily Insight</ThemedText>
                    </View>
                    <Pressable onPress={handleRefresh} hitSlop={8}>
                        <Feather name="refresh-ccw" size={14} color={theme.textSecondary} />
                    </Pressable>
                </View>

                <View style={styles.content}>
                    <ThemedText type="bodyMedium" style={{ fontStyle: "italic", lineHeight: 22 }}>
                        "{tip.text}"
                    </ThemedText>
                    <View style={[styles.categoryBadge, { backgroundColor: theme.cardBorder, marginTop: Spacing.md }]}>
                        <Feather name={tip.icon as any} size={12} color={theme.textSecondary} />
                        <ThemedText type="small" style={{ color: theme.textSecondary, textTransform: "capitalize" }}>{tip.category}</ThemedText>
                    </View>
                </View>
            </GlassCard>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    iconBg: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        marginTop: Spacing.xs,
    },
    categoryBadge: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    }
});
