import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DataPoint {
  value: number;
  label: string;
}

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  data?: DataPoint[];
  icon?: keyof typeof Feather.glyphMap;
  color?: string;
  showChart?: boolean;
}

function MiniLineChart({ data, color }: { data: DataPoint[]; color: string }) {
  if (data.length < 2) return null;

  const width = SCREEN_WIDTH - 80;
  const height = 60;
  const padding = 8;

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - ((d.value - minValue) / range) * (height - padding * 2),
  }));

  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cpX1 = prev.x + (point.x - prev.x) / 3;
    const cpX2 = prev.x + (2 * (point.x - prev.x)) / 3;
    return `${acc} C ${cpX1} ${prev.y}, ${cpX2} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </LinearGradient>
        <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.6} />
          <Stop offset="100%" stopColor={color} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Path d={areaD} fill="url(#areaGradient)" />
      <Path d={pathD} stroke="url(#lineGradient)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {points.length > 0 && (
        <Circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={4}
          fill={color}
        />
      )}
    </Svg>
  );
}

export function AnalyticsCard({
  title,
  value,
  subtitle,
  trend,
  data,
  icon,
  color = Colors.light.primary,
  showChart = true,
}: AnalyticsCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon ? (
            <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
              <Feather name={icon} size={16} color={color} />
            </View>
          ) : null}
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {title}
          </ThemedText>
        </View>
        {trend !== undefined ? (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend >= 0 ? Colors.light.success + "20" : Colors.light.destructive + "20" },
            ]}
          >
            <Feather
              name={trend >= 0 ? "trending-up" : "trending-down"}
              size={12}
              color={trend >= 0 ? Colors.light.success : Colors.light.destructive}
            />
            <ThemedText
              type="small"
              style={{
                color: trend >= 0 ? Colors.light.success : Colors.light.destructive,
                fontWeight: "600",
              }}
            >
              {Math.abs(trend)}%
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.valueSection}>
        <ThemedText type="h2" style={{ color: theme.text }}>
          {value}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {showChart && data && data.length >= 2 ? (
        <View style={styles.chartContainer}>
          <MiniLineChart data={data} color={color} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  valueSection: {
    gap: Spacing.xs,
  },
  chartContainer: {
    marginTop: Spacing.sm,
  },
});
