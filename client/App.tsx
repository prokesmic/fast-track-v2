import React, { useEffect, useState } from "react";
import { StyleSheet, LogBox, ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { I18nextProvider } from "react-i18next";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { SyncProvider } from "@/components/SyncManager";
import { AnalyticsProvider } from "@/context/AnalyticsContext";

import { useFonts } from "expo-font";
import { Feather } from "@expo/vector-icons";

import { WebFontFix } from "@/components/WebFontFix";
import { EnvironmentBadge } from "@/components/EnvironmentBadge";
import i18n, { initI18n } from "@/i18n";

// Prevent auto-hiding the splash screen until we're ready
SplashScreen.preventAutoHideAsync().catch(() => { });

export default function App() {
  const [fontsLoaded, error] = useFonts({
    ...Feather.font,
  });
  const [i18nReady, setI18nReady] = useState(false);

  // Initialize i18n
  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    if (error) {
      console.error("Font loading error:", error);
    }
  }, [error]);

  // SAFETY FALLBACK: Hide splash screen after 3 seconds max, even if fonts fail
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => { });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Wait for i18n to be ready
  if (!i18nReady) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Removed blocking check: if (!fontsLoaded && !error) return null;
  // This allows the app to render immediately. The WebFontFix will handle icons.

  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <WebFontFix />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AnalyticsProvider>
              <SyncProvider>
                <ThemeProvider>
                  <SafeAreaProvider>
                    <GestureHandlerRootView style={styles.root}>
                      <KeyboardProvider>
                        <NavigationContainer>
                          <RootStackNavigator />
                        </NavigationContainer>
                        <StatusBar style="auto" />
                        <EnvironmentBadge />
                      </KeyboardProvider>
                    </GestureHandlerRootView>
                  </SafeAreaProvider>
                </ThemeProvider>
              </SyncProvider>
            </AnalyticsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
