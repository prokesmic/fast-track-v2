import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { apiRequest } from "./api";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  userId?: string;
  fastReminder: boolean;
  milestoneReached: boolean;
  streakAtRisk: boolean;
  dailyMotivation: boolean;
  reminderHour: number;
}

// Check if notifications are available on this device
export function canUseNotifications(): boolean {
  return Device.isDevice && Platform.OS !== "web";
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!canUseNotifications()) {
    console.log("Push notifications not available on this device");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

// Get the Expo push token
export async function getExpoPushToken(): Promise<string | null> {
  if (!canUseNotifications()) {
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: "your-project-id", // Replace with actual project ID from app.json
    });
    return token;
  } catch (error) {
    console.error("Failed to get push token:", error);
    return null;
  }
}

// Register device token with backend
export async function registerDeviceToken(token: string): Promise<boolean> {
  const response = await apiRequest("/api/notifications/register", {
    method: "POST",
    body: {
      token,
      platform: Platform.OS,
    },
  });

  return !response.error;
}

// Unregister device token
export async function unregisterDeviceToken(token: string): Promise<boolean> {
  const response = await apiRequest("/api/notifications/register", {
    method: "DELETE",
    body: { token },
  });

  return !response.error;
}

// Get notification settings from backend
export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  const response = await apiRequest<{ settings: NotificationSettings }>(
    "/api/notifications/settings",
    { method: "GET" }
  );

  return response.data?.settings || null;
}

// Update notification settings
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings | null> {
  const response = await apiRequest<{ settings: NotificationSettings }>(
    "/api/notifications/settings",
    {
      method: "PUT",
      body: settings,
    }
  );

  return response.data?.settings || null;
}

// Schedule a local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  data?: Record<string, unknown>
): Promise<string | null> {
  if (!canUseNotifications()) {
    return null;
  }

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger,
    });
    return identifier;
  } catch (error) {
    console.error("Failed to schedule notification:", error);
    return null;
  }
}

// Schedule fast reminder notification
export async function scheduleFastReminder(
  fastEndTime: Date,
  planName: string
): Promise<string | null> {
  // Notify 30 minutes before fast ends
  const reminderTime = new Date(fastEndTime.getTime() - 30 * 60 * 1000);

  if (reminderTime <= new Date()) {
    return null; // Don't schedule if already past
  }

  return scheduleLocalNotification(
    "Fast Ending Soon",
    `Your ${planName} fast will complete in 30 minutes!`,
    { date: reminderTime },
    { type: "fast_reminder" }
  );
}

// Schedule milestone notification
export async function scheduleMilestoneNotification(
  milestoneHours: number,
  triggerTime: Date
): Promise<string | null> {
  if (triggerTime <= new Date()) {
    return null;
  }

  return scheduleLocalNotification(
    "Milestone Reached!",
    `Congratulations! You've been fasting for ${milestoneHours} hours.`,
    { date: triggerTime },
    { type: "milestone" }
  );
}

// Cancel all scheduled notifications
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Cancel specific notification
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

// Add notification received listener
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Add notification response listener (when user taps notification)
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
