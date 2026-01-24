import React from "react";
import { Platform } from "react-native";

// @ts-ignore
import featherFont from "@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf";
// @ts-ignore
import fontAwesomeFont from "@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf";

export function WebFontFix() {
  if (Platform.OS !== "web") return null;

  return (
    <style type="text/css">{`
      @font-face {
        font-family: 'feather';
        src: url('https://cdnjs.cloudflare.com/ajax/libs/react-native-vector-icons/9.2.0/Fonts/Feather.ttf') format('truetype');
      }
      @font-face {
        font-family: 'FontAwesome5Free-Solid';
        src: url('https://cdnjs.cloudflare.com/ajax/libs/react-native-vector-icons/9.2.0/Fonts/FontAwesome5_Solid.ttf') format('truetype');
      }
      @font-face {
        font-family: 'FontAwesome5Free-Regular';
        src: url('https://cdnjs.cloudflare.com/ajax/libs/react-native-vector-icons/9.2.0/Fonts/FontAwesome5_Regular.ttf') format('truetype');
      }
    `}</style>
  );
}
