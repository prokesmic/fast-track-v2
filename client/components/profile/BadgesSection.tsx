import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { BADGES } from "@/constants/badges";
import { showAlert } from "@/lib/platform";

interface BadgesSectionProps {
    unlockedBadges: string[];
}

export function BadgesSection({ unlockedBadges }: BadgesSectionProps) {
    const { theme, colorScheme } = useTheme();

    const unlockedSet = React.useMemo(() => new Set(unlockedBadges), [unlockedBadges]);

    const handleBadgePress = (badge: typeof BADGES[0]) => {
        const isUnlocked = unlockedSet.has(badge.id);
        showAlert(
            isUnlocked ? "Badge Unlocked!" : "Badge Locked",
            `${badge.description}\n\n${isUnlocked ? "You have earned this badge." : "Keep fasting to unlock this badge."}`
        );
    };

    const [expanded, setExpanded] = React.useState(false);

    // Sort badges: Unlocked first, then by ID
    const sortedBadges = React.useMemo(() => {
        return [...BADGES].sort((a, b) => {
            const aUnlocked = unlockedSet.has(a.id);
            const bUnlocked = unlockedSet.has(b.id);
            if (aUnlocked && !bUnlocked) return -1;
            if (!aUnlocked && bUnlocked) return 1;
            return 0;
        });
    }, [unlockedBadges]);

    const displayedBadges = expanded ? sortedBadges : sortedBadges.slice(0, 6);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="h3">Achievements</ThemedText>
                <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                    <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                        {expanded ? "Show Less" : "See All"}
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <View style={styles.gridContainer}>
                {displayedBadges.map((badge) => {
                    const isUnlocked = unlockedSet.has(badge.id);
                    const iconColor = isUnlocked ? badge.color : theme.textSecondary;
                    const bgColor = isUnlocked ? badge.color + "20" : theme.cardBorder;

                    return (
                        <TouchableOpacity
                            key={badge.id}
                            onPress={() => handleBadgePress(badge)}
                            activeOpacity={0.7}
                            style={styles.gridItem}
                        >
                            <GlassCard style={[styles.badgeCard, !isUnlocked && styles.lockedCard]} noPadding>
                                <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                                    <Feather name={badge.icon as any} size={24} color={iconColor} />
                                </View>
                                <View style={styles.textContainer}>
                                    <ThemedText type="bodyMedium" style={[styles.badgeName, !isUnlocked && { color: theme.textSecondary }]}>
                                        {badge.name}
                                    </ThemedText>
                                </View>
                                {!isUnlocked && (
                                    <View style={styles.lockIcon}>
                                        <Feather name="lock" size={10} color={theme.textSecondary} />
                                    </View>
                                )}
                            </GlassCard>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.xl,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
    },
    gridItem: {
        width: '31%', // Fits 3 items with gap
        marginBottom: Spacing.xs
    },
    badgeCard: {
        width: '100%',
        height: 110,
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.sm,
        gap: Spacing.sm,
    },
    lockedCard: {
        opacity: 0.6,
        backgroundColor: 'rgba(0,0,0,0.2)', // Make locked cards slightly darker/subtler
    },
    iconContainer: {
        width: 40,
        height: 40, // Slightly smaller
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    textContainer: {
        alignItems: "center",
        justifyContent: "center",
        height: 32,
    },
    badgeName: {
        fontSize: 11, // Sligthly smaller for grid
        fontWeight: "600",
        textAlign: "center",
    },
    lockIcon: {
        position: "absolute",
        top: 6,
        right: 6,
    }
});
