import React, { useMemo } from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    withSpring
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { UserProfile } from "@/lib/storage";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface ProfileHeroProps {
    profile: UserProfile;
    totalHours: number;
    onEdit: () => void;
    AVATARS: any[];
}

// Level Logic
const LEVELS = [
    { name: "Novice", min: 0, color: "#A3A3A3" },
    { name: "Apprentice", min: 50, color: "#60A5FA" }, // Blue
    { name: "Savant", min: 200, color: "#34D399" }, // Green
    { name: "Master", min: 500, color: "#FBBF24" }, // Gold
    { name: "Grandmaster", min: 1000, color: "#8B5CF6" }, // Purple
];

export function ProfileHero({ profile, totalHours, onEdit, AVATARS }: ProfileHeroProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const selectedAvatar = AVATARS.find((a) => a.id === profile.avatarId) || AVATARS[0];

    const currentLevel = useMemo(() => {
        return [...LEVELS].reverse().find(l => totalHours >= l.min) || LEVELS[0];
    }, [totalHours]);

    const nextLevel = useMemo(() => {
        const idx = LEVELS.indexOf(currentLevel);
        return LEVELS[idx + 1] || null;
    }, [currentLevel]);

    const progressToNext = useMemo(() => {
        if (!nextLevel) return 100;
        const range = nextLevel.min - currentLevel.min;
        const progress = totalHours - currentLevel.min;
        return Math.min(100, (progress / range) * 100);
    }, [totalHours, currentLevel, nextLevel]);

    const pulse = useSharedValue(1);

    React.useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1500 }),
                withTiming(1, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    const animatedAvatarStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }));

    return (
        <View style={styles.container}>
            {/* Avatar Section */}
            <Pressable onPress={onEdit}>
                <View style={styles.avatarWrapper}>
                    <Animated.View
                        style={[
                            styles.avatarGlow,
                            { backgroundColor: profile.customAvatarUri ? '#FFF' : selectedAvatar.color },
                            profile.customAvatarUri ? undefined : Shadows.glow(selectedAvatar.color),
                            animatedAvatarStyle
                        ]}
                    />

                    {profile.customAvatarUri ? (
                        <View style={[styles.avatarContainer, { overflow: 'hidden', borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)' }]}>
                            <Image
                                source={{ uri: profile.customAvatarUri }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        </View>
                    ) : (
                        <View
                            style={[
                                styles.avatarContainer,
                                { backgroundColor: selectedAvatar.color + "25" },
                            ]}
                        >
                            <Feather name={selectedAvatar.icon} size={64} color={selectedAvatar.color} />
                        </View>
                    )}

                    <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                        <Feather name="edit-2" size={12} color="#FFFFFF" />
                    </View>
                </View>
            </Pressable>

            {/* Info Section */}
            <View style={styles.infoContainer}>
                <ThemedText type="h2" style={{ textAlign: 'center', fontSize: 24 }}>
                    {profile.displayName || "Faster"}
                </ThemedText>

                <View style={styles.rankContainer}>
                    <View style={[styles.rankIconRing, { borderColor: currentLevel.color }]}>
                        <View style={[styles.rankIconBg, { backgroundColor: currentLevel.color + '20' }]}>
                            <Feather name="award" size={20} color={currentLevel.color} />
                        </View>
                    </View>
                    <View>
                        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Current Rank
                        </ThemedText>
                        <ThemedText type="h3" style={{ color: currentLevel.color, textAlign: 'center' }}>
                            {currentLevel.name}
                        </ThemedText>
                    </View>
                </View>

                {/* Level Progress */}
                {nextLevel && (
                    <View style={styles.progressSection}>
                        <View style={styles.progressLabels}>
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                {Math.round(totalHours)}h
                            </ThemedText>
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                {nextLevel.min}h
                            </ThemedText>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.backgroundTertiary }]}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: `${progressToNext}%`,
                                        backgroundColor: currentLevel.color
                                    }
                                ]}
                            />
                        </View>
                        <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>
                            {Math.round(nextLevel.min - totalHours)}h to {nextLevel.name}
                        </ThemedText>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        gap: Spacing.lg,
        paddingVertical: Spacing.lg,
    },
    avatarWrapper: {
        position: "relative",
        width: 130,
        height: 130,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarGlow: {
        position: "absolute",
        width: 130,
        height: 130,
        borderRadius: 65,
        opacity: 0.3,
    },
    avatarContainer: {
        width: 130,
        height: 130,
        borderRadius: 65,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    infoContainer: {
        alignItems: 'center',
        gap: Spacing.sm,
        width: '100%',
    },
    rankContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginTop: Spacing.xs,
    },
    rankIconRing: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
    },
    rankIconBg: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressSection: {
        width: '80%', // Wider bar
        marginTop: Spacing.sm,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    progressBarBg: {
        width: '100%',
        height: 8, // Thicker bar
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    }
});
