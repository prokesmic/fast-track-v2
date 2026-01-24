import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { Fast } from "@/lib/storage";
import { FASTING_PLANS } from "@/lib/plans";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface RecommendationCardProps {
    fasts: Fast[];
    currentStreak: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RecommendationCard({ fasts, currentStreak }: RecommendationCardProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const getRecommendation = () => {
        // 1. New User or Empty History
        if (fasts.length === 0) {
            return {
                title: "Start Your Journey",
                description: "The 16:8 plan is the perfect starting point for beginners.",
                planId: "16-8",
                icon: "sun"
            };
        }

        const lastFast = fasts[0];
        const lastDuration = (lastFast.endTime! - lastFast.startTime) / (1000 * 60 * 60);

        // 2. Recovery (if last was long > 20h)
        if (lastDuration > 20) {
            return {
                title: "Recovery Mode",
                description: "Great effort recently! A lighter 14:10 fast might be good for today.",
                planId: "14-10",
                icon: "battery-charging"
            };
        }

        // 3. Streak Builder
        if (currentStreak >= 3) {
            return {
                title: "Keep the Streak Alive!",
                description: "You're on a roll. Maintain your momentum with a classic 16:8.",
                planId: "16-8",
                icon: "zap"
            };
        }

        // 4. Default / Consistency
        return {
            title: "Ready for Another?",
            description: "Consistency is key. Let's aim for a 16:8 today.",
            planId: "16-8",
            icon: "clock"
        };
    };

    const rec = getRecommendation();
    const plan = FASTING_PLANS.find(p => p.id === rec.planId);

    const handlePress = () => {
        if (plan) {
            // Navigate to StartFast with pre-selected plan (Direct mode logic)
            navigation.navigate("StartFast", { plan });
        } else {
            navigation.navigate("StartFast", {});
        }
    };

    return (
        <AnimatedPressable entering={FadeInDown.delay(200).springify()} onPress={handlePress}>
            <GlassCard style={styles.card} accentColor={colors.primary}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + "15" }]}>
                        <Feather name={rec.icon as any} size={20} color={colors.primary} />
                    </View>
                    <ThemedText type="h4" style={{ flex: 1, color: colors.primary }}>
                        {rec.title}
                    </ThemedText>
                    <Feather name="chevron-right" size={16} color={theme.textTertiary} />
                </View>

                <View style={styles.content}>
                    <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>
                        {rec.description}
                    </ThemedText>
                </View>
            </GlassCard>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Spacing.xs,
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
