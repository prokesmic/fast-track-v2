/**
 * App Information
 * Version and build metadata
 */

import Constants from "expo-constants";

// App version from app.json
export const APP_VERSION = Constants.expoConfig?.version || "1.0.0";

// Build number (if available)
export const BUILD_NUMBER =
  Constants.expoConfig?.ios?.buildNumber ||
  Constants.expoConfig?.android?.versionCode?.toString() ||
  "1";

// Deployment date - this is set at build time
// For development, use current date; for production, this should be set via CI/CD
export const DEPLOYMENT_DATE =
  process.env.EXPO_PUBLIC_DEPLOYMENT_DATE || new Date().toISOString();

// Format deployment date for display
export function formatDeploymentDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Get short version string (e.g., "v1.0.0")
export function getVersionString(): string {
  return `v${APP_VERSION}`;
}

// Get full version string (e.g., "v1.0.0 (build 1)")
export function getFullVersionString(): string {
  return `v${APP_VERSION} (${BUILD_NUMBER})`;
}

// Get deployment info as string
export function getDeploymentInfo(): string {
  return formatDeploymentDate(DEPLOYMENT_DATE);
}
