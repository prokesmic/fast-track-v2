import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { WeightEntry } from "@/lib/storage";
import { GlassCard } from "@/components/GlassCard";

interface WeightChartProps {
    weights: WeightEntry[];
    unit: string;
}

export function WeightChart({ weights, unit }: WeightChartProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const width = Dimensions.get("window").width - Spacing.xl * 2 - Spacing.lg * 2; // Card padding adjustment
    const height = 180;

    const data = useMemo(() => {
        // Sort by date ascending
        const sorted = [...weights].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Take last 10 entries for cleaner chart
        return sorted.slice(-10);
    }, [weights]);

    if (data.length < 2) {
        return (
            <GlassCard>
                <View style={styles.emptyState}>
                    <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>
                        Add at least 2 weight entries to see your trend!
                    </ThemedText>
                </View>
            </GlassCard>
        );
    }

    const chartData = useMemo(() => {
        const minWeight = Math.min(...data.map(d => d.weight)) - 2;
        const maxWeight = Math.max(...data.map(d => d.weight)) + 2;
        const range = maxWeight - minWeight;

        const points = data.map((d, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((d.weight - minWeight) / range) * height; // Invert Y
            return { x, y, weight: d.weight, date: d.date };
        });

        const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;

        // Gradient fill area
        const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

        return { points, pathD, fillD, minWeight, maxWeight };
    }, [data, width, height]);

    return (
        <GlassCard>
            <View style={styles.header}>
                <ThemedText type="h4">Weight Trend</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Last {data.length} entries ({unit})
                </ThemedText>
            </View>

            <View style={{ height: height + 20, marginTop: Spacing.md }}>
                <Svg width={width} height={height + 20}>
                    <Defs>
                        <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={colors.success} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={colors.success} stopOpacity="0" />
                        </LinearGradient>
                    </Defs>

                    {/* Fill Area */}
                    <Path d={chartData.fillD} fill="url(#gradient)" />

                    {/* Line */}
                    <Path
                        d={chartData.pathD}
                        stroke={colors.success}
                        strokeWidth={3}
                        strokeLinecap="round"
                        fill="none"
                    />

                    {/* Points */}
                    {chartData.points.map((p, index) => (
                        <Circle
                            key={index}
                            cx={p.x}
                            cy={p.y}
                            r={4}
                            fill={theme.backgroundDefault}
                            stroke={colors.success}
                            strokeWidth={2}
                        />
                    ))}
                </Svg>

                <View style={styles.labels}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {new Date(data[0].date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {new Date(data[data.length - 1].date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                    </ThemedText>
                </View>
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    emptyState: {
        padding: Spacing.xl,
        alignItems: "center",
    },
    labels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -10, // Pull up closer to graph
    }
});
