import React, { useEffect } from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { ParticleExplosion } from "@/components/ParticleExplosion";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

export interface CelebrationOverlayProps {
    visible: boolean;
    hoursReached: number;
    nextMilestone?: number;
    onEndFast: () => void;
    onContinue: () => void;
}

export function CelebrationOverlay({
    visible,
    hoursReached,
    nextMilestone,
    onEndFast,
    onContinue
}: CelebrationOverlayProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    const scale = useSharedValue(0);
    const rotate = useSharedValue(0);
    const opacity = useSharedValue(1);

    // Particle state
    const [showExplosion, setShowExplosion] = React.useState(false);

    useEffect(() => {
        if (visible) {
            setShowExplosion(false);
            opacity.value = 1;

            // 1. Zoom in
            scale.value = withSpring(1, { damping: 12 });

            // 2. Shake after a small delay
            rotate.value = withDelay(600, withSequence(
                withTiming(15, { duration: 50 }),
                withTiming(-15, { duration: 50 }),
                withTiming(15, { duration: 50 }),
                withTiming(-15, { duration: 50 }),
                withTiming(0, { duration: 50 })
            ));

            // 3. Explode (hide cup, show particles)
            setTimeout(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowExplosion(true);
                // "Pop" the cup out or just hide it? Let's make it fade/scale out as if it exploded
                scale.value = withTiming(1.5, { duration: 150 });
                opacity.value = withTiming(0, { duration: 100 });
            }, 1000);

        } else {
            scale.value = 0;
            rotate.value = 0;
            opacity.value = 1;
            setShowExplosion(false);
        }
    }, [visible]);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}deg` }
        ],
        opacity: opacity.value
    }));

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.backdrop, { backgroundColor: "#00000090" }]} />

                <View style={styles.container}>
                    <GlassCard
                        style={styles.card}
                        intensity="strong"
                    >
                        <View style={styles.animationArea}>
                            <ParticleExplosion active={showExplosion} />

                            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                                <View style={[styles.iconCircle, { backgroundColor: colors.success + "20" }]}>
                                    <FontAwesome5 name="trophy" size={50} color={colors.success} />
                                </View>
                            </Animated.View>
                        </View>

                        <ThemedText type="h2" style={{ textAlign: "center", marginBottom: Spacing.sm }}>
                            Fast Completed!
                        </ThemedText>

                        <ThemedText type="body" style={{ textAlign: "center", color: theme.textSecondary, marginBottom: Spacing.xl }}>
                            You've crushed your goal of <ThemedText type="bodyMedium" style={{ color: colors.success, fontWeight: "700" }}>{hoursReached} hours</ThemedText>.
                        </ThemedText>

                        <View style={styles.buttonContainer}>
                            {nextMilestone ? (
                                <Pressable
                                    onPress={onContinue}
                                    style={({ pressed }) => [
                                        styles.button,
                                        { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1, marginBottom: Spacing.md }
                                    ]}
                                >
                                    <View style={styles.buttonContent}>
                                        <Feather name="arrow-up-circle" size={24} color="#FFF" />
                                        <ThemedText type="body" style={{ color: "#FFF", fontWeight: "bold", fontSize: 18 }}>
                                            Continue to {nextMilestone} Hours
                                        </ThemedText>
                                    </View>
                                </Pressable>
                            ) : null}

                            <Pressable
                                onPress={onEndFast}
                                style={({ pressed }) => [
                                    styles.button,
                                    {
                                        backgroundColor: theme.backgroundSecondary,
                                        borderWidth: 1,
                                        borderColor: colors.destructive,
                                        opacity: pressed ? 0.9 : 1
                                    }
                                ]}
                            >
                                <View style={styles.buttonContent}>
                                    <Feather name="check" size={24} color={colors.destructive} />
                                    <ThemedText type="body" style={{ color: colors.destructive, fontWeight: "bold", fontSize: 18 }}>
                                        End Fast Now
                                    </ThemedText>
                                </View>
                            </Pressable>
                        </View>
                    </GlassCard>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing.lg,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: "100%",
        maxWidth: 400, // increased max width
    },
    card: {
        padding: Spacing.xl,
        alignItems: "center",
        justifyContent: "center",
    },
    animationArea: {
        height: 140,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.md,
    },
    iconContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: "rgba(255,255,255,0.1)"
    },
    buttonContainer: {
        width: "100%",
    },
    button: {
        width: "100%",
        paddingVertical: 16, // Taller buttons
        borderRadius: BorderRadius.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    }
});
