import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";

export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Espa\u00f1ol" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "fr", name: "French", nativeName: "Fran\u00e7ais" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const LANGUAGE_KEY = "@fasttrack_language";

const resources = {
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
};

// Get device language, defaulting to English
const getDeviceLanguage = (): LanguageCode => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode || "en";
  const supportedLang = LANGUAGES.find((l) => l.code === deviceLocale);
  return supportedLang ? (deviceLocale as LanguageCode) : "en";
};

// Initialize i18n
export const initI18n = async () => {
  // Try to get saved language preference
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (e) {
    console.warn("Failed to load language preference:", e);
  }

  const initialLanguage = savedLanguage || getDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  return i18n;
};

// Change language and persist the choice
export const changeLanguage = async (languageCode: LanguageCode) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
    await i18n.changeLanguage(languageCode);
  } catch (e) {
    console.warn("Failed to save language preference:", e);
  }
};

// Get current language
export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language as LanguageCode) || "en";
};

export default i18n;
