import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#1E293B", // Slate-800 - softer than pure black
    textSecondary: "#64748B", // Slate-500
    textTertiary: "#94A3B8", // Slate-400
    buttonText: "#FFFFFF",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#0D9488", // Teal-600 - slightly darker/richer
    link: "#0D9488",
    primary: "#0D9488", // Teal-600 - more sophisticated than bright teal
    primaryLight: "#2DD4BF",
    primaryDark: "#0F766E",
    secondary: "#7C3AED", // Violet-600
    secondaryLight: "#A78BFA",
    accent: "#F59E0B", // Amber-500
    success: "#10B981", // Emerald-500
    successLight: "#34D399",
    destructive: "#EF4444", // Red-500
    destructiveLight: "#F87171",
    warning: "#F59E0B",
    backgroundRoot: "#F0F2F5", // Very subtle cool gray for root
    backgroundDefault: "#FFFFFF", // Pure white for main surfaces
    backgroundSecondary: "#F8FAFC", // Very light slate for secondary
    backgroundTertiary: "#E2E8F0", // Slate-200 for borders/dividers
    cardBackground: "rgba(255, 255, 255, 0.85)", // More glass-like
    cardBorder: "rgba(148, 163, 184, 0.1)", // Subtle border
    glassBg: "rgba(255, 255, 255, 0.65)", // Frosted glass
    glassBlur: 24,
    gradientStart: "#2DD4BF", // Teal-400
    gradientMiddle: "#A78BFA", // Violet-400
    gradientEnd: "#F472B6", // Pink-400
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
    cardBackground: "rgba(30, 41, 59, 0.9)",
    cardBorder: "rgba(255, 255, 255, 0.1)",
    glassBg: "rgba(15, 23, 42, 0.85)",
    glassBlur: 24,
    gradientStart: "#2DD4BF",
    gradientMiddle: "#A78BFA",
    gradientEnd: "#F472B6",
  },
};

export const Gradients = {
  primary: ["#14B8A6", "#8B5CF6", "#EC4899"],
  warm: ["#F97316", "#EC4899"],
  cool: ["#06B6D4", "#8B5CF6"],
  success: ["#10B981", "#2DD4BF"],
  purple: ["#8B5CF6", "#EC4899"],
  sunset: ["#F59E0B", "#EF4444", "#EC4899"],
  backgroundLight: ["#F8FAFC", "#EDE9FE", "#FECDD3"],
  backgroundDark: ["#0F172A", "#1E1B4B", "#1E293B"],
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  }),
  coloredLg: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
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
