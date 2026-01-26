import "@testing-library/jest-dom";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("./mocks/asyncStorage").default
);

// Mock Expo modules
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      apiUrl: "http://localhost:3000",
    },
  },
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "test-token" }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
}));

jest.mock("expo-device", () => ({
  isDevice: true,
  modelName: "Test Device",
  osName: "iOS",
}));

// Global test utilities
global.console = {
  ...console,
  // Uncomment to suppress console output in tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
