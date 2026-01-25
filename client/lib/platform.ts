import { Platform, Alert } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Safe haptics wrapper that handles web platform gracefully
 */
export const safeHaptics = {
  selectionAsync: () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  },
  impactAsync: (style?: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  },
  notificationAsync: (type?: Haptics.NotificationFeedbackType) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(type);
    }
  },
};

/**
 * Show a simple alert message (web compatible)
 */
export function showAlert(title: string, message: string): void {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Show a confirmation dialog (web compatible)
 * Returns a promise that resolves to true if confirmed, false if cancelled
 */
export function showConfirm(
  title: string,
  message: string,
  confirmText = "OK",
  cancelText = "Cancel",
  destructive = false
): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === "web") {
      const result = window.confirm(`${title}\n\n${message}`);
      resolve(result);
    } else {
      Alert.alert(title, message, [
        { text: cancelText, style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ]);
    }
  });
}
