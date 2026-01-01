import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0F172A",
    textSecondary: "#64748B",
    textTertiary: "#94A3B8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#14B8A6",
    link: "#14B8A6",
    primary: "#14B8A6",
    primaryLight: "#5EEAD4",
    primaryDark: "#0D9488",
    secondary: "#8B5CF6",
    secondaryLight: "#A78BFA",
    accent: "#F59E0B",
    success: "#10B981",
    successLight: "#34D399",
    destructive: "#EF4444",
    destructiveLight: "#F87171",
    warning: "#F59E0B",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F8FAFC",
    backgroundSecondary: "#F1F5F9",
    backgroundTertiary: "#E2E8F0",
    cardBackground: "rgba(255, 255, 255, 0.85)",
    cardBorder: "rgba(0, 0, 0, 0.04)",
    glassBg: "rgba(255, 255, 255, 0.7)",
    glassBlur: 20,
    gradientStart: "#14B8A6",
    gradientMiddle: "#8B5CF6",
    gradientEnd: "#EC4899",
  },
  dark: {
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    textTertiary: "#64748B",
    buttonText: "#FFFFFF",
    tabIconDefault: "#64748B",
    tabIconSelected: "#2DD4BF",
    link: "#2DD4BF",
    primary: "#2DD4BF",
    primaryLight: "#5EEAD4",
    primaryDark: "#14B8A6",
    secondary: "#A78BFA",
    secondaryLight: "#C4B5FD",
    accent: "#FBBF24",
    success: "#34D399",
    successLight: "#6EE7B7",
    destructive: "#F87171",
    destructiveLight: "#FCA5A5",
    warning: "#FBBF24",
    backgroundRoot: "#0F172A",
    backgroundDefault: "#1E293B",
    backgroundSecondary: "#334155",
    backgroundTertiary: "#475569",
    cardBackground: "rgba(30, 41, 59, 0.85)",
    cardBorder: "rgba(255, 255, 255, 0.08)",
    glassBg: "rgba(15, 23, 42, 0.8)",
    glassBlur: 20,
    gradientStart: "#2DD4BF",
    gradientMiddle: "#A78BFA",
    gradientEnd: "#F472B6",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 48,
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 36,
    fontWeight: "800" as const,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 22,
    fontWeight: "600" as const,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
  },
  timer: {
    fontSize: 56,
    fontWeight: "700" as const,
    letterSpacing: -2,
  },
  timerLarge: {
    fontSize: 72,
    fontWeight: "800" as const,
    letterSpacing: -3,
  },
  link: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  }),
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
