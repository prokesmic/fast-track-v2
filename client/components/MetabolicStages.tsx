import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { FastingStage, getStageForDuration } from "@/constants/fastingStages";

const { width } = Dimensions.get("window");

interface MetabolicStagesProps {
    elapsedHours: number;
}

export function MetabolicStages({ elapsedHours }: MetabolicStagesProps) {
    const { theme, colorScheme } = useTheme();
    const currentStage = getStageForDuration(elapsedHours);

    // Calculate progress within current stage
    const stageDuration = currentStage.endHour
        ? currentStage.endHour - currentStage.startHour
        : 24; // Default to 24h cap for visualization for the open-ended stage

    const hoursInStage = elapsedHours - currentStage.startHour;
    const progress = Math.min(Math.max(hoursInStage / stageDuration, 0), 1);

    React.useEffect(() => {
        if (hoursInStage < 0.1) {
            import("expo-haptics").then(Haptics => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            });
        }
    }, [currentStage.id]);

    return (
        <Animated.View entering={FadeInDown.delay(300).springify()}>
            <GlassCard style={styles.container}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: currentStage.color + "20" }]}>
                        <Feather name={currentStage.icon} size={20} color={currentStage.color} />
                    </View>
                    <View style={styles.titleContainer}>
                        <ThemedText type="h4">{currentStage.name}</ThemedText>
                        <ThemedText type="caption" style={{ color: currentStage.color, fontWeight: "600" }}>
                            {currentStage.endHour
                                ? `${Math.round(hoursInStage * 10) / 10}h / ${stageDuration}h`
                                : `${Math.round(hoursInStage * 10) / 10}h elapsed`
                            }
                        </ThemedText>
                    </View>
                </View>

                <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                    {currentStage.longDescription}
                </ThemedText>

                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressBar,
                            {
                                width: `${progress * 100}%`,
                                backgroundColor: currentStage.color
                            }
                        ]}
                    />
                </View>
            </GlassCard>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width - Spacing.xl * 2,
        alignSelf: "center",
        marginTop: Spacing.lg,
        padding: Spacing.lg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Spacing.xs,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        alignItems: "center",
        justifyContent: "center",
        marginRight: Spacing.md,
    },
    titleContainer: {
        flex: 1,
    },
    progressTrack: {
        height: 6,
        backgroundColor: "rgba(0,0,0,0.05)",
        borderRadius: BorderRadius.full,
        marginTop: Spacing.lg,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        borderRadius: BorderRadius.full,
    },
});
