import React, { useState } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedProps, withSpring, useSharedValue } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { GlassCard } from "@/components/GlassCard";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface DayData {
    day: string;
    hours: number;
    target: number;
    completed: boolean;
    fullDate: string;
}

interface HistoryChartProps {
    data: DayData[];
    maxHours?: number;
}

export function HistoryChart({ data, maxHours = 24 }: HistoryChartProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

    const chartHeight = 180;
    const chartWidth = Dimensions.get("window").width - Spacing.xl * 2 - Spacing.lg * 2; // Adjust for padding
    const barWidth = (chartWidth - Spacing.md * (data.length - 1)) / data.length;
    const spacing = Spacing.md;

    const handlePress = (day: DayData) => {
        Haptics.selectionAsync();
        setSelectedDay(day === selectedDay ? null : day);
    };

    return (
        <GlassCard>
            <View style={styles.header}>
                <View>
                    <ThemedText type="h4">Weekly Overview</ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        {selectedDay
                            ? `${selectedDay.fullDate}: ${selectedDay.hours}h fasted`
                            : "Tap a bar for details"}
                    </ThemedText>
                </View>
                <View style={styles.legend}>
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>Fasted</ThemedText>
                </View>
            </View>

            <View style={{ height: chartHeight + 30, marginTop: Spacing.lg }}>
                <Svg width={chartWidth} height={chartHeight + 30}>
                    {/* Grid Lines */}
                    {[0, 0.5, 1].map((ratio) => {
                        const y = chartHeight * (1 - ratio);
                        return (
                            <Line
                                key={ratio}
                                x1="0"
                                y1={y}
                                x2={chartWidth}
                                y2={y}
                                stroke={theme.cardBorder}
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                        );
                    })}

                    {data.map((item, index) => {
                        const x = index * (barWidth + ((chartWidth - (barWidth * data.length)) / (data.length - 1)));
                        const barHeight = (Math.min(item.hours, maxHours) / maxHours) * chartHeight;
                        const targetY = chartHeight - ((Math.min(item.target, maxHours) / maxHours) * chartHeight);
                        const isSelected = selectedDay === item;

                        return (
                            <React.Fragment key={index}>
                                {/* Target Line Marker */}
                                <Line
                                    x1={x}
                                    y1={targetY}
                                    x2={x + barWidth}
                                    y2={targetY}
                                    stroke={theme.textTertiary}
                                    strokeWidth="2"
                                    strokeOpacity={0.5}
                                />

                                {/* Bar */}
                                <Rect
                                    x={x}
                                    y={chartHeight - barHeight}
                                    width={barWidth}
                                    height={barHeight}
                                    fill={item.completed ? colors.primary : colors.primary + "50"}
                                    rx={4}
                                    onPressIn={() => handlePress(item)}
                                    opacity={isSelected || !selectedDay ? 1 : 0.4}
                                />

                                {/* Label */}
                                <SvgText
                                    x={x + barWidth / 2}
                                    y={chartHeight + 20}
                                    fontSize="12"
                                    fill={theme.textSecondary}
                                    textAnchor="middle"
                                >
                                    {item.day}
                                </SvgText>
                            </React.Fragment>
                        );
                    })}
                </Svg>
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    }
});
