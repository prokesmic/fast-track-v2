/**
 * PhotoCaptureCard Component
 * Card for capturing new progress photos
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ProgressPhoto } from "@/lib/progressPhotos";

interface PhotoCaptureCardProps {
  category: ProgressPhoto["category"];
  onCapture: (category: ProgressPhoto["category"]) => Promise<ProgressPhoto | null>;
  onPick: (category: ProgressPhoto["category"]) => Promise<ProgressPhoto | null>;
  hasExisting?: boolean;
}

const categoryLabels: Record<ProgressPhoto["category"], string> = {
  front: "Front View",
  side: "Side View",
  back: "Back View",
  other: "Other",
};

const categoryIcons: Record<ProgressPhoto["category"], string> = {
  front: "user",
  side: "user",
  back: "user",
  other: "image",
};

export default function PhotoCaptureCard({
  category,
  onCapture,
  onPick,
  hasExisting,
}: PhotoCaptureCardProps) {
  const { theme } = useTheme();
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async () => {
    setCapturing(true);
    try {
      await onCapture(category);
    } finally {
      setCapturing(false);
    }
  };

  const handlePick = async () => {
    setCapturing(true);
    try {
      await onPick(category);
    } finally {
      setCapturing(false);
    }
  };

  const showOptions = () => {
    Alert.alert(
      `Add ${categoryLabels[category]}`,
      "Choose how to add a photo",
      [
        { text: "Take Photo", onPress: handleCapture },
        { text: "Choose from Library", onPress: handlePick },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: hasExisting ? theme.primary : theme.cardBorder,
          borderWidth: hasExisting ? 2 : 1,
        },
      ]}
      onPress={showOptions}
      disabled={capturing}
    >
      {capturing ? (
        <ActivityIndicator color={theme.primary} size="large" />
      ) : (
        <>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: hasExisting ? theme.primary + "20" : theme.cardBorder },
            ]}
          >
            <Feather
              name={hasExisting ? "check" : (categoryIcons[category] as any)}
              size={24}
              color={hasExisting ? theme.primary : theme.textSecondary}
            />
          </View>
          <Text style={[styles.label, { color: theme.text }]}>
            {categoryLabels[category]}
          </Text>
          <Feather
            name="plus-circle"
            size={20}
            color={theme.textSecondary}
            style={styles.addIcon}
          />
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 0.75,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
    minWidth: 100,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  addIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
  },
});
