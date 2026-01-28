/**
 * Environment configuration
 *
 * Vercel sets VERCEL_ENV automatically:
 * - "production" for production deployments (main branch)
 * - "preview" for preview deployments (other branches)
 * - "development" for local dev (vercel dev)
 *
 * We also use NEXT_PUBLIC_APP_ENV for more granular control:
 * - "production" - main branch, production database
 * - "staging" - staging branch, staging database
 * - "development" - develop branch or local, dev database
 */

export type Environment = "production" | "staging" | "development";

// Expo/React Native environment detection
const getEnvironment = (): Environment => {
  // Check for explicit app environment variable first
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV;
  if (appEnv === "production" || appEnv === "staging" || appEnv === "development") {
    return appEnv;
  }

  // Fallback to Vercel environment
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production") {
    return "production";
  }

  // Check if we're in development mode
  if (__DEV__) {
    return "development";
  }

  // Default to production for safety
  return "production";
};

export const ENV = getEnvironment();

export const isProduction = ENV === "production";
export const isStaging = ENV === "staging";
export const isDevelopment = ENV === "development";

export const environmentConfig = {
  production: {
    name: "Production",
    shortName: "PROD",
    color: "#10B981", // green
    showBadge: false,
  },
  staging: {
    name: "Staging",
    shortName: "QA",
    color: "#F59E0B", // amber
    showBadge: true,
  },
  development: {
    name: "Development",
    shortName: "DEV",
    color: "#EF4444", // red
    showBadge: true,
  },
} as const;

export const currentEnvConfig = environmentConfig[ENV];
