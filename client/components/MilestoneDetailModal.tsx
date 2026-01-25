import React from "react";
import {
    View,
    Modal,
    StyleSheet,
    Pressable,
    ScrollView,
    Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, BorderRadius, Spacing, Shadows } from "@/constants/theme";
import { Milestone } from "@/components/ProgressRing";
import { FASTING_STAGES, FastingStage } from "@/constants/fastingStages";

interface MilestoneDetailModalProps {
    isVisible: boolean;
    milestone: Milestone | null;
    isPassed: boolean;
    elapsedHours: number;
    onClose: () => void;
    onLearnMore: () => void;
}

// Map milestone to the corresponding fasting stage for full details
function getStageForMilestone(milestone: Milestone): FastingStage | null {
    // Map milestone hours to stage
    const stageMap: Record<number, string> = {
        4: "catabolic",      // Blood Sugar Fall
        8: "fat_burning",    // Fat Burning
        12: "ketosis",       // Ketosis
        18: "autophagy",     // Autophagy
        24: "deep_autophagy", // Deep Autophagy
        48: "growth_hormone", // Growth Hormone
    };

    const stageId = stageMap[milestone.hours];
    return FASTING_STAGES.find(s => s.id === stageId) || null;
}

export function MilestoneDetailModal({
    isVisible,
    milestone,
    isPassed,
    elapsedHours,
    onClose,
    onLearnMore,
}: MilestoneDetailModalProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];

    if (!milestone) return null;

    const stage = getStageForMilestone(milestone);
    const screenHeight = Dimensions.get("window").height;

    const hoursRemaining = Math.max(0, milestone.hours - elapsedHours);
    const progressToMilestone = Math.min(1, elapsedHours / milestone.hours);

    return (
        <Modal visible={isVisible} transparent animationType="none">
            <View style={styles.overlay}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={styles.backdrop}
                >
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                <Animated.View
                    entering={SlideInDown.springify().damping(20)}
                    exiting={SlideOutDown.duration(200)}
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: theme.backgroundSecondary,
                            maxHeight: screenHeight * 0.75,
                        },
                    ]}
                >
                    {/* Header with close button */}
                    <View style={styles.header}>
                        <View style={styles.headerHandle} />
                        <Pressable
                            onPress={onClose}
                            style={[styles.closeButton, { backgroundColor: theme.backgroundTertiary }]}
                        >
                            <Feather name="x" size={20} color={theme.textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.content}
                    >
                        {/* Milestone Icon & Status */}
                        <View style={styles.iconSection}>
                            <View
                                style={[
                                    styles.iconContainer,
                                    {
                                        backgroundColor: isPassed ? milestone.color : milestone.color + "20",
                                    },
                                    isPassed && Shadows.coloredLg(milestone.color),
                                ]}
                            >
                                <Feather
                                    name={milestone.icon as any}
                                    size={40}
                                    color={isPassed ? "#FFFFFF" : milestone.color}
                                />
                            </View>

                            <ThemedText type="h2" style={styles.title}>
                                {milestone.name}
                            </ThemedText>

                            <View style={[styles.statusBadge, { backgroundColor: isPassed ? colors.success + "20" : colors.warning + "20" }]}>
                                <Feather
                                    name={isPassed ? "check-circle" : "clock"}
                                    size={14}
                                    color={isPassed ? colors.success : colors.warning}
                                />
                                <ThemedText
                                    type="caption"
                                    style={{ color: isPassed ? colors.success : colors.warning, fontWeight: "600" }}
                                >
                                    {isPassed
                                        ? "Achieved"
                                        : `${hoursRemaining.toFixed(1)}h remaining`
                                    }
                                </ThemedText>
                            </View>
                        </View>

                        {/* Progress indicator */}
                        {!isPassed && (
                            <View style={styles.progressSection}>
                                <View style={styles.progressHeader}>
                                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                                        Progress to milestone
                                    </ThemedText>
                                    <ThemedText type="caption" style={{ color: milestone.color, fontWeight: "600" }}>
                                        {Math.round(progressToMilestone * 100)}%
                                    </ThemedText>
                                </View>
                                <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                backgroundColor: milestone.color,
                                                width: `${progressToMilestone * 100}%`,
                                            },
                                        ]}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Time info */}
                        <View style={[styles.timeCard, { backgroundColor: theme.backgroundTertiary }]}>
                            <View style={styles.timeItem}>
                                <Feather name="target" size={18} color={milestone.color} />
                                <View>
                                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                                        Reached at
                                    </ThemedText>
                                    <ThemedText type="h4">{milestone.hours} hours</ThemedText>
                                </View>
                            </View>
                        </View>

                        {/* Description */}
                        <View style={styles.section}>
                            <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, lineHeight: 24 }}>
                                {stage?.longDescription || milestone.description}
                            </ThemedText>
                        </View>

                        {/* Benefits */}
                        {stage && stage.benefits.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Feather name="star" size={16} color={colors.success} />
                                    <ThemedText type="bodyMedium" style={{ fontWeight: "600" }}>
                                        Benefits
                                    </ThemedText>
                                </View>
                                <View style={styles.bulletList}>
                                    {stage.benefits.map((benefit, index) => (
                                        <View key={index} style={styles.bulletItem}>
                                            <View style={[styles.bulletDot, { backgroundColor: milestone.color }]} />
                                            <View style={styles.bulletContent}>
                                                <ThemedText type="body" style={{ fontWeight: "600" }}>
                                                    {benefit.title}
                                                </ThemedText>
                                                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                                    {benefit.description}
                                                </ThemedText>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* What You May Feel */}
                        {stage && stage.feelings.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Feather name="heart" size={16} color={colors.secondary} />
                                    <ThemedText type="bodyMedium" style={{ fontWeight: "600" }}>
                                        What You May Feel
                                    </ThemedText>
                                </View>
                                <View style={styles.bulletList}>
                                    {stage.feelings.map((feeling, index) => (
                                        <View key={index} style={styles.bulletItem}>
                                            <View style={[styles.bulletDot, { backgroundColor: theme.textTertiary }]} />
                                            <View style={styles.bulletContent}>
                                                <ThemedText type="body" style={{ fontWeight: "600" }}>
                                                    {feeling.title}
                                                </ThemedText>
                                                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                                    {feeling.description}
                                                </ThemedText>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Learn More button */}
                        <Pressable
                            onPress={onLearnMore}
                            style={[styles.learnMoreButton, { backgroundColor: milestone.color }]}
                        >
                            <ThemedText type="bodyMedium" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                                View All Fasting Stages
                            </ThemedText>
                            <Feather name="arrow-right" size={18} color="#FFFFFF" />
                        </Pressable>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContainer: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        overflow: "hidden",
    },
    header: {
        alignItems: "center",
        paddingTop: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    headerHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(128, 128, 128, 0.3)",
    },
    closeButton: {
        position: "absolute",
        right: Spacing.lg,
        top: Spacing.md,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        padding: Spacing.xl,
        gap: Spacing.xl,
    },
    iconSection: {
        alignItems: "center",
        gap: Spacing.md,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        textAlign: "center",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    progressSection: {
        gap: Spacing.sm,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 4,
    },
    timeCard: {
        flexDirection: "row",
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
    },
    timeItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },
    section: {
        gap: Spacing.md,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    bulletList: {
        gap: Spacing.md,
    },
    bulletItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.md,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 8,
    },
    bulletContent: {
        flex: 1,
        gap: 2,
    },
    learnMoreButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
});
