import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Use expo-secure-store for native, AsyncStorage for web
let SecureStore: typeof import("expo-secure-store") | null = null;
if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const REMEMBER_KEY = "auth_remember";

export interface AuthUser {
  id: string;
  email: string;
}

export interface StoredCredentials {
  email: string;
  token: string;
}

// Secure storage helpers (uses SecureStore on native, AsyncStorage on web)
async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
  } else if (SecureStore) {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(key);
  } else if (SecureStore) {
    return SecureStore.getItemAsync(key);
  }
  return null;
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
  } else if (SecureStore) {
    await SecureStore.deleteItemAsync(key);
  }
}

// Token management
export async function getToken(): Promise<string | null> {
  return secureGet(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await secureSet(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await secureDelete(TOKEN_KEY);
}

// User management
export async function getStoredUser(): Promise<AuthUser | null> {
  const data = await secureGet(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export async function setStoredUser(user: AuthUser): Promise<void> {
  await secureSet(USER_KEY, JSON.stringify(user));
}

export async function clearStoredUser(): Promise<void> {
  await secureDelete(USER_KEY);
}

// Remember me functionality
export async function getRememberedCredentials(): Promise<StoredCredentials | null> {
  const data = await secureGet(REMEMBER_KEY);
  return data ? JSON.parse(data) : null;
}

export async function setRememberedCredentials(
  credentials: StoredCredentials
): Promise<void> {
  await secureSet(REMEMBER_KEY, JSON.stringify(credentials));
}

export async function clearRememberedCredentials(): Promise<void> {
  await secureDelete(REMEMBER_KEY);
}

// Clear all auth data
export async function clearAllAuthData(): Promise<void> {
  await Promise.all([clearToken(), clearStoredUser()]);
}
