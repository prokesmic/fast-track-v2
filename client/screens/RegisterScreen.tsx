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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { register, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const buttonScale = useSharedValue(1);

  // Navigate to main if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace("Main");
    }
  }, [isAuthenticated, navigation]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // Validation
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");
    safeHaptics.impactAsync();

    const result = await register(email.trim(), password);

    setIsLoading(false);

    if (result.success) {
      safeHaptics.notificationAsync();
      navigation.replace("Main");
    } else {
      safeHaptics.notificationAsync();
      setError(result.error || "Registration failed");
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Password strength indicator
  const getPasswordStrength = (): { label: string; color: string; progress: number } => {
    if (password.length === 0) return { label: "", color: theme.textTertiary, progress: 0 };
    if (password.length < 6) return { label: "Weak", color: colors.destructive, progress: 0.25 };
    if (password.length < 8) return { label: "Fair", color: colors.warning, progress: 0.5 };
    if (password.length < 12) return { label: "Good", color: colors.success, progress: 0.75 };
    return { label: "Strong", color: colors.success, progress: 1 };
  };

  const passwordStrength = getPasswordStrength();

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
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="user-plus" size={40} color={colors.primary} />
            </View>
            <ThemedText type="h2" style={[styles.title, { color: theme.text }]}>
              Create Account
            </ThemedText>
            <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
              Start your fasting journey today
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
                    placeholder="Create a password"
                    placeholderTextColor={theme.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={theme.textTertiary}
                    />
                  </Pressable>
                </View>
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={[styles.strengthBar, { backgroundColor: theme.backgroundTertiary }]}>
                      <View
                        style={[
                          styles.strengthProgress,
                          { width: `${passwordStrength.progress * 100}%`, backgroundColor: passwordStrength.color },
                        ]}
                      />
                    </View>
                    <ThemedText type="caption" style={{ color: passwordStrength.color, marginLeft: Spacing.sm }}>
                      {passwordStrength.label}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <ThemedText type="caption" style={[styles.label, { color: theme.textSecondary }]}>
                  CONFIRM PASSWORD
                </ThemedText>
                <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault }]}>
                  <Feather name="lock" size={20} color={theme.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Confirm your password"
                    placeholderTextColor={theme.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                  />
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                    <Feather
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color={theme.textTertiary}
                    />
                  </Pressable>
                </View>
                {/* Password Match Indicator */}
                {confirmPassword.length > 0 && (
                  <View style={styles.matchIndicator}>
                    <Feather
                      name={password === confirmPassword ? "check-circle" : "x-circle"}
                      size={14}
                      color={password === confirmPassword ? colors.success : colors.destructive}
                    />
                    <ThemedText
                      type="caption"
                      style={{
                        color: password === confirmPassword ? colors.success : colors.destructive,
                        marginLeft: Spacing.xs,
                      }}
                    >
                      {password === confirmPassword ? "Passwords match" : "Passwords don't match"}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Register Button */}
              <AnimatedPressable
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  Shadows.coloredLg(colors.primary),
                  buttonAnimatedStyle,
                ]}
                onPressIn={() => { buttonScale.value = withSpring(0.96); }}
                onPressOut={() => { buttonScale.value = withSpring(1); }}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <ThemedText type="bodyMedium" style={styles.buttonText}>
                      Create Account
                    </ThemedText>
                    <Feather name="arrow-right" size={20} color="#fff" />
                  </>
                )}
              </AnimatedPressable>
            </GlassCard>
          </Animated.View>

          {/* Login Link */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.footer}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Already have an account?{" "}
            </ThemedText>
            <Pressable onPress={() => navigation.navigate("Login")}>
              <ThemedText type="bodyMedium" style={{ color: colors.primary }}>
                Sign In
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
    marginBottom: Spacing["3xl"],
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: Spacing.sm,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
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
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthProgress: {
    height: "100%",
    borderRadius: 2,
  },
  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
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
});
