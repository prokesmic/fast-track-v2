import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    withTiming,
    withSequence,
    Easing,
    cancelAnimation
} from "react-native-reanimated";
import { Colors } from "@/constants/theme";

const NUM_PARTICLES = 20;
const EXPLOSION_RADIUS = 150;

interface ParticleProps {
    index: number;
    active: boolean;
}

const Particle = ({ index, active }: ParticleProps) => {
    // Shared Values for Physics
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotate = useSharedValue(0);
    const opacity = useSharedValue(0);
    const radius = useSharedValue(0); // Keeping for compatibility if needed, though using raw X/Y now
    // Physics for explosion
    const angle = (index / NUM_PARTICLES) * 2 * Math.PI;
    // Randomize slight variations
    const velocity = 150 + Math.random() * 100; // Speed available
    const delay = Math.random() * 100;
    const duration = 1200 + Math.random() * 400;
    const particleSize = 6 + Math.random() * 6; // slightly smaller pieces

    // Colorful palette (Confetti style)
    const colors = [
        "#FFD700", // Gold
        "#FF6347", // Tomato
        "#4169E1", // RoyalBlue
        "#32CD32", // LimeGreen
        "#FF69B4", // HotPink
        "#00FFFF", // Cyan
    ];
    const color = colors[index % colors.length];

    useEffect(() => {
        if (active) {
            // EXPLOSION LOGIC
            const randomAngleOffset = (Math.random() - 0.5) * 0.5; // Jitter
            const finalX = Math.cos(angle + randomAngleOffset) * velocity * 1.5;
            const finalY = Math.sin(angle + randomAngleOffset) * velocity * 1.5;

            radius.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));

            // X moves linearly out
            translateX.value = withDelay(delay, withTiming(finalX, { duration: duration }));

            // Y moves out but adds gravity (Arc)
            translateY.value = withDelay(delay, withTiming(finalY + 200, { duration: duration, easing: Easing.bezier(0.25, 1, 0.5, 1) }));

            opacity.value = withDelay(delay, withSequence(
                withTiming(1, { duration: 50 }),
                withTiming(0, { duration: duration - 50 })
            ));

            // Rotation for confetti effect
            rotate.value = withDelay(delay, withTiming(Math.random() * 720, { duration }));

        } else {
            translateX.value = 0;
            translateY.value = 0;
            opacity.value = 0;
            rotate.value = 0;
        }
    }, [active]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate.value}deg` }
            ],
            opacity: opacity.value,
            backgroundColor: color,
        };
    });

    return <Animated.View style={[styles.particle, { width: particleSize, height: particleSize * (Math.random() > 0.5 ? 2 : 1), borderRadius: Math.random() > 0.5 ? 2 : particleSize / 2 }, animatedStyle]} />;
};

export function ParticleExplosion({ active }: { active: boolean }) {
    // Increased particle count for better effect
    const particles = Array.from({ length: 40 });
    return (
        <View style={styles.container} pointerEvents="none">
            {particles.map((_, i) => (
                <Particle key={i} index={i} active={active} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        width: 1,
        height: 1,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 0, // In front or behind?
    },
    particle: {
        position: "absolute",
    },
});
