/**
 * PhotoGrid Component
 * Display a grid of progress photos with delete and detail options
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ProgressPhoto } from "@/lib/progressPhotos";

interface PhotoGridProps {
  photos: ProgressPhoto[];
  onDelete?: (id: string) => void;
  onPress?: (photo: ProgressPhoto) => void;
  emptyMessage?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_SIZE = (SCREEN_WIDTH - 48 - 16) / 3; // 3 columns with padding

export default function PhotoGrid({
  photos,
  onDelete,
  onPress,
  emptyMessage = "No photos yet",
}: PhotoGridProps) {
  const { theme } = useTheme();

  const handleDelete = (photo: ProgressPhoto) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete?.(photo.id),
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (photos.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.cardBackground }]}>
        <Feather name="image" size={48} color={theme.textSecondary} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <TouchableOpacity
          key={photo.id}
          style={[
            styles.photoContainer,
            { backgroundColor: theme.cardBackground },
          ]}
          onPress={() => onPress?.(photo)}
          onLongPress={() => handleDelete(photo)}
        >
          <Image source={{ uri: photo.uri }} style={styles.photo} />
          <View style={[styles.dateOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <Text style={styles.dateText}>{formatDate(photo.takenAt)}</Text>
          </View>
          {photo.weight && (
            <View
              style={[
                styles.weightBadge,
                { backgroundColor: theme.primary },
              ]}
            >
              <Text style={styles.weightText}>{photo.weight} kg</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.33,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dateOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  dateText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  weightBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  weightText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
});
