import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { safeHaptics } from "@/lib/platform";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors } from "@/constants/theme";
import { getRandomQuote, getQuoteForProgress } from "@/constants/quotes";

interface MotivationCardProps {
    progress?: number;
    isOvertime?: boolean;
}

export function MotivationCard({ progress, isOvertime = false }: MotivationCardProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    // Initial quote based on props
    const [quote, setQuote] = useState(() => {
        if (progress !== undefined) {
            return getQuoteForProgress(progress, isOvertime);
        }
        return getRandomQuote("general");
    });

    // Update quote when progress changes significantly (e.g. crossing thresholds)
    // or just rely on manual refresh for variety, but allow initial to be smart.
    useEffect(() => {
        if (progress !== undefined) {
            setQuote(getQuoteForProgress(progress, isOvertime));
        }
    }, [isOvertime, Math.floor((progress || 0) * 10)]); // Update roughly every 10%

    const handleRefresh = () => {
        safeHaptics.selectionAsync();
        if (progress !== undefined) {
            setQuote(getQuoteForProgress(progress, isOvertime));
        } else {
            setQuote(getRandomQuote("general"));
        }
    };

    return (
        <AnimatedPressable entering={FadeInDown.delay(300).springify()} onPress={handleRefresh}>
            <GlassCard
                style={styles.card}
                accentColor={colors.secondary}
            >
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.secondary + "15" }]}>
                        <Feather name="zap" size={20} color={colors.secondary} />
                    </View>
                    <ThemedText type="h4" style={{ flex: 1 }}>
                        Daily Motivation
                    </ThemedText>
                    <Feather name="refresh-cw" size={14} color={theme.textTertiary} />
                </View>

                <View style={styles.content}>
                    <ThemedText type="bodyMedium" style={{ fontStyle: "italic", lineHeight: 24 }}>
                        "{quote.text}"
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                        — {quote.author}
                    </ThemedText>
                </View>
            </GlassCard>
        </AnimatedPressable>
    );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
    card: {
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Spacing.md,
        gap: Spacing.md,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        paddingLeft: Spacing.lg + Spacing.sm,
    },
});
