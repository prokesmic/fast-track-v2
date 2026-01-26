module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/client/$1",
    "^@shared/(.*)$": "<rootDir>/shared/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  collectCoverageFrom: [
    "client/lib/**/*.{ts,tsx}",
    "client/hooks/**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
