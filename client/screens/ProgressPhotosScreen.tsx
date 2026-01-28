/**
 * ProgressPhotosScreen
 * Manage and view progress photos
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useProgressPhotos, usePhotoComparison, usePhotoStats } from "@/hooks/useProgressPhotos";
import { ProgressPhoto } from "@/lib/progressPhotos";
import PhotoCaptureCard from "@/components/photos/PhotoCaptureCard";
import PhotoGrid from "@/components/photos/PhotoGrid";
import PhotoComparison from "@/components/photos/PhotoComparison";

type ViewMode = "capture" | "gallery" | "compare";
type Category = ProgressPhoto["category"];

const categories: Category[] = ["front", "side", "back", "other"];

export default function ProgressPhotosScreen() {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("capture");
  const [selectedCategory, setSelectedCategory] = useState<Category>("front");

  const {
    photos,
    loading,
    takePhoto,
    pickPhoto,
    removePhoto,
    refresh,
  } = useProgressPhotos();

  const { pairs } = usePhotoComparison(selectedCategory);
  const { stats } = usePhotoStats();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const latestByCategory = categories.reduce(
    (acc, cat) => {
      const catPhotos = photos.filter((p) => p.category === cat);
      acc[cat] = catPhotos.length > 0;
      return acc;
    },
    {} as Record<Category, boolean>
  );

  const filteredPhotos =
    selectedCategory === "other"
      ? photos
      : photos.filter((p) => p.category === selectedCategory);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Progress Photos
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {stats.total} photos over {stats.totalDaysTracking} days
        </Text>
      </View>

      {/* View Mode Tabs */}
      <View
        style={[
          styles.viewTabs,
          { backgroundColor: theme.cardBackground },
        ]}
      >
        {[
          { mode: "capture" as ViewMode, icon: "camera", label: "Capture" },
          { mode: "gallery" as ViewMode, icon: "grid", label: "Gallery" },
          { mode: "compare" as ViewMode, icon: "columns", label: "Compare" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.mode}
            style={[
              styles.viewTab,
              viewMode === tab.mode && {
                backgroundColor: theme.primary + "20",
              },
            ]}
            onPress={() => setViewMode(tab.mode)}
          >
            <Feather
              name={tab.icon as any}
              size={18}
              color={viewMode === tab.mode ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.viewTabText,
                {
                  color:
                    viewMode === tab.mode ? theme.primary : theme.textSecondary,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter (for gallery and compare) */}
      {viewMode !== "capture" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === cat
                      ? theme.primary
                      : theme.cardBackground,
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color:
                      selectedCategory === cat ? "#fff" : theme.textSecondary,
                  },
                ]}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {viewMode === "capture" && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Take a New Photo
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Capture photos from different angles to track your progress
            </Text>

            <View style={styles.captureGrid}>
              {categories.map((cat) => (
                <PhotoCaptureCard
                  key={cat}
                  category={cat}
                  onCapture={takePhoto}
                  onPick={pickPhoto}
                  hasExisting={latestByCategory[cat]}
                />
              ))}
            </View>

            {/* Tips */}
            <View
              style={[
                styles.tipsCard,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Feather name="info" size={20} color={theme.primary} />
              <View style={styles.tipsContent}>
                <Text style={[styles.tipsTitle, { color: theme.text }]}>
                  Tips for Better Photos
                </Text>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  {"\u2022"} Use consistent lighting and background
                </Text>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  {"\u2022"} Take photos at the same time of day
                </Text>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  {"\u2022"} Wear similar clothing for accurate comparison
                </Text>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  {"\u2022"} Stand at the same distance from the camera
                </Text>
              </View>
            </View>
          </View>
        )}

        {viewMode === "gallery" && (
          <View>
            <PhotoGrid
              photos={filteredPhotos}
              onDelete={removePhoto}
              emptyMessage={`No ${selectedCategory} photos yet`}
            />
          </View>
        )}

        {viewMode === "compare" && (
          <View>
            <PhotoComparison pairs={pairs} category={selectedCategory} />
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  viewTabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
  },
  viewTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewTabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryScroll: {
    marginTop: 12,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  captureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  tipsCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
