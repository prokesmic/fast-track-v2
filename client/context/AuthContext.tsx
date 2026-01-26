import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  getToken,
  setToken,
  clearToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  setRememberedCredentials,
  clearRememberedCredentials,
  AuthUser,
} from "../lib/auth";
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
} from "../lib/api";
import { performFullSync } from "../lib/sync";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await getToken();
      if (token) {
        // Validate token by fetching user
        const response = await getMe();
        if (response.data) {
          const authUser: AuthUser = {
            id: response.data.user.id,
            email: response.data.user.email,
          };
          setUser(authUser);
          await setStoredUser(authUser);

          // Auto-sync data on app startup when authenticated
          performFullSync().catch((err) => {
            console.log("Background sync on startup:", err);
          });
        } else {
          // Token is invalid, clear it
          await clearToken();
          await clearStoredUser();
        }
      } else {
        // Check for stored user (offline mode)
        const storedUser = await getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
      // Try to use cached user for offline mode
      const storedUser = await getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(
    async (
      email: string,
      password: string,
      rememberMe = false
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await apiLogin(email, password);

        if (response.error) {
          return { success: false, error: response.error };
        }

        if (response.data) {
          const { user: userData, token } = response.data;

          // Store token and user
          await setToken(token);
          const authUser: AuthUser = { id: userData.id, email: userData.email };
          await setStoredUser(authUser);
          setUser(authUser);

          // Remember credentials if requested
          if (rememberMe) {
            await setRememberedCredentials({ email, token });
          } else {
            await clearRememberedCredentials();
          }

          // Sync local data to cloud after login
          performFullSync().catch((err) => {
            console.log("Background sync after login:", err);
          });

          return { success: true };
        }

        return { success: false, error: "Unexpected error" };
      } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "Network error. Please try again." };
      }
    },
    []
  );

  const register = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await apiRegister(email, password);

        if (response.error) {
          return { success: false, error: response.error };
        }

        if (response.data) {
          const { user: userData, token } = response.data;

          // Store token and user
          await setToken(token);
          const authUser: AuthUser = { id: userData.id, email: userData.email };
          await setStoredUser(authUser);
          setUser(authUser);

          // Sync local data to cloud after registration
          performFullSync().catch((err) => {
            console.log("Background sync after registration:", err);
          });

          return { success: true };
        }

        return { success: false, error: "Unexpected error" };
      } catch (error) {
        console.error("Register error:", error);
        return { success: false, error: "Network error. Please try again." };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await clearToken();
    await clearStoredUser();
    await clearRememberedCredentials();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await getMe();
      if (response.data) {
        const authUser: AuthUser = {
          id: response.data.user.id,
          email: response.data.user.email,
        };
        setUser(authUser);
        await setStoredUser(authUser);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
