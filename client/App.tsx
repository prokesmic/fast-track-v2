import React from "react";
import { StyleSheet, LogBox } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";

import { useFonts } from "expo-font";
import { Feather } from "@expo/vector-icons";

import { WebFontFix } from "@/components/WebFontFix";

// Prevent auto-hiding the splash screen until we're ready
SplashScreen.preventAutoHideAsync().catch(() => { });

export default function App() {
  const [fontsLoaded, error] = useFonts({
    ...Feather.font,
  });

  React.useEffect(() => {
    if (error) {
      console.error("Font loading error:", error);
    }
  }, [error]);

  // SAFETY FALLBACK: Hide splash screen after 3 seconds max, even if fonts fail
  React.useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => { });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Removed blocking check: if (!fontsLoaded && !error) return null;
  // This allows the app to render immediately. The WebFontFix will handle icons.

  return (
    <ErrorBoundary>
      <WebFontFix />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <SafeAreaProvider>
              <GestureHandlerRootView style={styles.root}>
                <KeyboardProvider>
                  <NavigationContainer>
                    <RootStackNavigator />
                  </NavigationContainer>
                  <StatusBar style="auto" />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
