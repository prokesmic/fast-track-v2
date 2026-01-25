import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { BADGES, Badge } from "@/constants/badges";
import { useFasting } from "@/hooks/useFasting";
import { UserProfile, getProfile } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";
import { showAlert } from "@/lib/platform";

export default function BadgesScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const [unlockedBadges, setUnlockedBadges] = React.useState<Set<string>>(new Set());

    useFocusEffect(
        React.useCallback(() => {
            getProfile().then(p => {
                setUnlockedBadges(new Set(p.unlockedBadges || []));
            });
        }, [])
    );

    const handleBadgePress = (badge: Badge) => {
        const isUnlocked = unlockedBadges.has(badge.id);
        showAlert(
            isUnlocked ? "Badge Unlocked!" : "Badge Locked",
            `${badge.description}\n\n${isUnlocked ? "You have earned this badge." : "Keep fasting to unlock this badge."}`
        );
    };

    const categories: { key: Badge['category'], label: string }[] = [
        { key: 'streak', label: "Streaks" },
        { key: 'milestone', label: "Milestones" },
        { key: 'hours', label: "Endurance" },
        { key: 'lifestyle', label: "Lifestyle" },
    ];

    return (
        <View style={styles.container}>
            <GradientBackground variant="profile" />

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
                showsVerticalScrollIndicator={false}
            >
                {categories.map((cat) => {
                    const categoryBadges = BADGES.filter(b => b.category === cat.key);
                    if (categoryBadges.length === 0) return null;

                    return (
                        <View key={cat.key} style={styles.section}>
                            <ThemedText type="h3" style={styles.sectionTitle}>{cat.label}</ThemedText>

                            <View style={styles.grid}>
                                {categoryBadges.map((badge) => {
                                    const isUnlocked = unlockedBadges.has(badge.id);
                                    const iconColor = isUnlocked ? badge.color : theme.textSecondary;
                                    const bgColor = isUnlocked ? badge.color + "20" : theme.cardBorder;

                                    return (
                                        <TouchableOpacity
                                            key={badge.id}
                                            onPress={() => handleBadgePress(badge)}
                                            activeOpacity={0.7}
                                            style={styles.badgeWrapper}
                                        >
                                            <GlassCard style={[styles.badgeCard, !isUnlocked && styles.lockedCard]} noPadding>
                                                <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                                                    <Feather name={badge.icon as any} size={24} color={iconColor} />
                                                </View>
                                                <ThemedText type="bodyMedium" numberOfLines={2} style={[styles.badgeName, !isUnlocked && { color: theme.textSecondary }]}>
                                                    {badge.name}
                                                </ThemedText>
                                                {!isUnlocked && (
                                                    <View style={styles.lockIcon}>
                                                        <Feather name="lock" size={12} color={theme.textSecondary} />
                                                    </View>
                                                )}
                                            </GlassCard>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
        gap: Spacing.xl,
    },
    section: {
        gap: Spacing.md,
    },
    sectionTitle: {
        marginBottom: Spacing.xs,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    badgeWrapper: {
        width: '30%', // Roughly 3 per row
        flexGrow: 1,
    },
    badgeCard: {
        height: 110,
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.sm,
        gap: Spacing.sm,
    },
    lockedCard: {
        opacity: 0.6,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeName: {
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
    },
    lockIcon: {
        position: "absolute",
        top: 8,
        right: 8,
    }
});
