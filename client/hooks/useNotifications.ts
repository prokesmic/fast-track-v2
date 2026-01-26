import { useState, useEffect, useCallback } from "react";
import {
  canUseNotifications,
  requestNotificationPermissions,
  getExpoPushToken,
  registerDeviceToken,
  unregisterDeviceToken,
  getNotificationSettings,
  updateNotificationSettings,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  NotificationSettings,
} from "../lib/notifications";
import { useAuth } from "@/context/AuthContext";

interface UseNotificationsResult {
  isSupported: boolean;
  isEnabled: boolean;
  settings: NotificationSettings | null;
  permissionStatus: "granted" | "denied" | "undetermined";
  isLoading: boolean;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const { isAuthenticated } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "undetermined"
  >("undetermined");
  const [isLoading, setIsLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const isSupported = canUseNotifications();

  // Fetch notification settings
  const refreshSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      const fetchedSettings = await getNotificationSettings();
      setSettings(fetchedSettings);
    } catch (error) {
      console.error("Failed to fetch notification settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      // Check if notifications are supported
      if (!isSupported) {
        setPermissionStatus("denied");
        setIsLoading(false);
        return;
      }

      // Get current permission status
      const hasPermission = await requestNotificationPermissions();
      setPermissionStatus(hasPermission ? "granted" : "denied");

      if (hasPermission) {
        const token = await getExpoPushToken();
        setPushToken(token);
        setIsEnabled(!!token);
      }

      // Fetch settings from backend
      await refreshSettings();
    };

    initialize();
  }, [isSupported, refreshSettings]);

  // Set up notification listeners
  useEffect(() => {
    if (!isSupported) return;

    const receivedSub = addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    const responseSub = addNotificationResponseListener((response) => {
      console.log("Notification response:", response);
      // Handle notification tap - could navigate to specific screen
      const data = response.notification.request.content.data;
      if (data?.type === "fast_reminder") {
        // Navigate to home screen
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isSupported]);

  // Enable notifications
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    const hasPermission = await requestNotificationPermissions();
    setPermissionStatus(hasPermission ? "granted" : "denied");

    if (!hasPermission) return false;

    const token = await getExpoPushToken();
    if (!token) return false;

    setPushToken(token);

    // Register with backend if authenticated
    if (isAuthenticated) {
      const registered = await registerDeviceToken(token);
      if (!registered) {
        console.error("Failed to register device token");
        return false;
      }
    }

    setIsEnabled(true);
    return true;
  }, [isSupported, isAuthenticated]);

  // Disable notifications
  const disableNotifications = useCallback(async (): Promise<void> => {
    if (pushToken && isAuthenticated) {
      await unregisterDeviceToken(pushToken);
    }
    setIsEnabled(false);
  }, [pushToken, isAuthenticated]);

  // Update notification settings
  const updateSettingsHandler = useCallback(
    async (newSettings: Partial<NotificationSettings>): Promise<void> => {
      if (!isAuthenticated) return;

      const updated = await updateNotificationSettings(newSettings);
      if (updated) {
        setSettings(updated);
      }
    },
    [isAuthenticated]
  );

  return {
    isSupported,
    isEnabled,
    settings,
    permissionStatus,
    isLoading,
    enableNotifications,
    disableNotifications,
    updateSettings: updateSettingsHandler,
    refreshSettings,
  };
}
