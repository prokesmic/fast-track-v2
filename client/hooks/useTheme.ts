import { Colors } from "@/constants/theme";
import { useThemeContext } from "@/context/ThemeContext";

export function useTheme() {
  const { isDark, themeType, setThemeType } = useThemeContext();
  const theme = isDark ? Colors.dark : Colors.light;

  return {
    theme,
    isDark,
    colorScheme: (isDark ? "dark" : "light") as "light" | "dark",
    themeType,
    setThemeType,
  };
}
