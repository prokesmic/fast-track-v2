/**
 * PhotoComparison Component
 * Side-by-side before/after photo comparison
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { PhotoComparisonPair, ProgressPhoto } from "@/lib/progressPhotos";

interface PhotoComparisonProps {
  pairs: PhotoComparisonPair[];
  category: ProgressPhoto["category"];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_WIDTH = (SCREEN_WIDTH - 48) / 2;

const categoryLabels: Record<ProgressPhoto["category"], string> = {
  front: "Front View",
  side: "Side View",
  back: "Back View",
  other: "Other",
};

export default function PhotoComparison({
  pairs,
  category,
}: PhotoComparisonProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (pairs.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.cardBackground }]}>
        <Feather name="image" size={48} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          Not Enough Photos
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Take at least 2 {categoryLabels[category].toLowerCase()} photos to see
          your progress
        </Text>
      </View>
    );
  }

  const currentPair = pairs[currentIndex];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < pairs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {categoryLabels[category]} Progress
        </Text>
        <View style={[styles.badge, { backgroundColor: theme.primary + "20" }]}>
          <Text style={[styles.badgeText, { color: theme.primary }]}>
            {currentPair.daysBetween} days
          </Text>
        </View>
      </View>

      {/* Comparison */}
      <View style={styles.comparison}>
        {/* Before */}
        <View style={styles.photoColumn}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Before
          </Text>
          <View
            style={[
              styles.photoFrame,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Image
              source={{ uri: currentPair.before.uri }}
              style={styles.photo}
            />
          </View>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(currentPair.before.takenAt)}
          </Text>
          {currentPair.before.weight && (
            <Text style={[styles.weight, { color: theme.text }]}>
              {currentPair.before.weight} kg
            </Text>
          )}
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Feather name="arrow-right" size={24} color={theme.primary} />
        </View>

        {/* After */}
        <View style={styles.photoColumn}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            After
          </Text>
          <View
            style={[
              styles.photoFrame,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Image
              source={{ uri: currentPair.after.uri }}
              style={styles.photo}
            />
          </View>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(currentPair.after.takenAt)}
          </Text>
          {currentPair.after.weight && (
            <Text style={[styles.weight, { color: theme.text }]}>
              {currentPair.after.weight} kg
            </Text>
          )}
        </View>
      </View>

      {/* Weight Change */}
      {currentPair.before.weight && currentPair.after.weight && (
        <View
          style={[
            styles.changeCard,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Feather
            name={
              currentPair.after.weight < currentPair.before.weight
                ? "trending-down"
                : currentPair.after.weight > currentPair.before.weight
                ? "trending-up"
                : "minus"
            }
            size={20}
            color={
              currentPair.after.weight < currentPair.before.weight
                ? theme.success
                : currentPair.after.weight > currentPair.before.weight
                ? theme.destructive
                : theme.textSecondary
            }
          />
          <Text style={[styles.changeText, { color: theme.text }]}>
            {Math.abs(currentPair.after.weight - currentPair.before.weight).toFixed(1)}{" "}
            kg{" "}
            {currentPair.after.weight < currentPair.before.weight
              ? "lost"
              : currentPair.after.weight > currentPair.before.weight
              ? "gained"
              : "change"}
          </Text>
        </View>
      )}

      {/* Navigation */}
      {pairs.length > 1 && (
        <View style={styles.navigation}>
          <TouchableOpacity
            onPress={goToPrevious}
            disabled={currentIndex === 0}
            style={[
              styles.navButton,
              { opacity: currentIndex === 0 ? 0.3 : 1 },
            ]}
          >
            <Feather name="chevron-left" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.pagination, { color: theme.textSecondary }]}>
            {currentIndex + 1} / {pairs.length}
          </Text>

          <TouchableOpacity
            onPress={goToNext}
            disabled={currentIndex === pairs.length - 1}
            style={[
              styles.navButton,
              { opacity: currentIndex === pairs.length - 1 ? 0.3 : 1 },
            ]}
          >
            <Feather name="chevron-right" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  comparison: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  photoColumn: {
    alignItems: "center",
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  photoFrame: {
    width: PHOTO_WIDTH - 8,
    height: (PHOTO_WIDTH - 8) * 1.33,
    borderRadius: 12,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  date: {
    fontSize: 11,
    marginTop: 8,
  },
  weight: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  arrowContainer: {
    paddingTop: 80,
    paddingHorizontal: 4,
  },
  changeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 20,
  },
  navButton: {
    padding: 8,
  },
  pagination: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
