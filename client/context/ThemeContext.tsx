import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useNativeColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeType = "light" | "dark" | "system";

interface ThemeContextType {
    themeType: ThemeType;
    setThemeType: (type: ThemeType) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    themeType: "system",
    setThemeType: () => { },
    isDark: false,
});

const THEME_KEY = "user_theme_preference";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useNativeColorScheme();
    const [themeType, setThemeType] = useState<ThemeType>("system");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Load persisted theme preference
        (async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_KEY);
                if (savedTheme) {
                    setThemeType(savedTheme as ThemeType);
                }
            } catch (error) {
                console.error("Failed to load theme preference:", error);
            } finally {
                setIsReady(true);
            }
        })();
    }, []);

    const handleSetTheme = async (type: ThemeType) => {
        setThemeType(type);
        try {
            await AsyncStorage.setItem(THEME_KEY, type);
        } catch (error) {
            console.error("Failed to save theme preference:", error);
        }
    };

    const isDark =
        themeType === "system"
            ? systemColorScheme === "dark"
            : themeType === "dark";

    if (!isReady) {
        return null; // Or a splash screen
    }

    return (
        <ThemeContext.Provider
            value={{
                themeType,
                setThemeType: handleSetTheme,
                isDark,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    return useContext(ThemeContext);
}
