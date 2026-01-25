import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { safeHaptics } from "@/lib/platform";
import { getRememberedCredentials } from "@/lib/auth";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const buttonScale = useSharedValue(1);

  // Load remembered credentials on mount
  useEffect(() => {
    loadRememberedCredentials();
  }, []);

  // Navigate to main if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace("Main");
    }
  }, [isAuthenticated, navigation]);

  const loadRememberedCredentials = async () => {
    const credentials = await getRememberedCredentials();
    if (credentials) {
      setEmail(credentials.email);
      setRememberMe(true);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    setError("");
    safeHaptics.impactAsync();

    const result = await login(email.trim(), password, rememberMe);

    setIsLoading(false);

    if (result.success) {
      safeHaptics.notificationAsync();
      navigation.replace("Main");
    } else {
      safeHaptics.notificationAsync();
      setError(result.error || "Login failed");
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.container}>
      <GradientBackground variant="modal" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing["2xl"] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo/Header */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="clock" size={48} color={colors.primary} />
            </View>
            <ThemedText type="h1" style={[styles.title, { color: theme.text }]}>
              Fast-Track
            </ThemedText>
            <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign in to sync your fasting data
            </ThemedText>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <GlassCard style={styles.formCard} intensity="medium">
              {/* Error Message */}
              {error ? (
                <View style={[styles.errorContainer, { backgroundColor: colors.destructive + "15" }]}>
                  <Feather name="alert-circle" size={16} color={colors.destructive} />
                  <ThemedText type="small" style={{ color: colors.destructive, marginLeft: Spacing.sm }}>
                    {error}
                  </ThemedText>
                </View>
              ) : null}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <ThemedText type="caption" style={[styles.label, { color: theme.textSecondary }]}>
                  EMAIL
                </ThemedText>
                <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault }]}>
                  <Feather name="mail" size={20} color={theme.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <ThemedText type="caption" style={[styles.label, { color: theme.textSecondary }]}>
                  PASSWORD
                </ThemedText>
                <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault }]}>
                  <Feather name="lock" size={20} color={theme.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={theme.textTertiary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Remember Me */}
              <Pressable
                style={styles.rememberContainer}
                onPress={() => {
                  safeHaptics.selectionAsync();
                  setRememberMe(!rememberMe);
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: rememberMe ? colors.primary : theme.textTertiary },
                    rememberMe && { backgroundColor: colors.primary },
                  ]}
                >
                  {rememberMe && <Feather name="check" size={14} color="#fff" />}
                </View>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Remember me
                </ThemedText>
              </Pressable>

              {/* Login Button */}
              <AnimatedPressable
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  Shadows.coloredLg(colors.primary),
                  buttonAnimatedStyle,
                ]}
                onPressIn={() => { buttonScale.value = withSpring(0.96); }}
                onPressOut={() => { buttonScale.value = withSpring(1); }}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <ThemedText type="bodyMedium" style={styles.buttonText}>
                      Sign In
                    </ThemedText>
                    <Feather name="arrow-right" size={20} color="#fff" />
                  </>
                )}
              </AnimatedPressable>
            </GlassCard>
          </Animated.View>

          {/* Register Link */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.footer}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Don't have an account?{" "}
            </ThemedText>
            <Pressable onPress={() => navigation.navigate("Register")}>
              <ThemedText type="bodyMedium" style={{ color: colors.primary }}>
                Sign Up
              </ThemedText>
            </Pressable>
          </Animated.View>

          {/* Skip Login */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.skipContainer}>
            <Pressable
              onPress={() => navigation.replace("Main")}
              style={styles.skipButton}
            >
              <ThemedText type="small" style={{ color: theme.textTertiary }}>
                Continue without account
              </ThemedText>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  formCard: {
    padding: Spacing.xl,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: Spacing.buttonHeight,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  eyeButton: {
    padding: Spacing.sm,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  skipContainer: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  skipButton: {
    padding: Spacing.md,
  },
});
