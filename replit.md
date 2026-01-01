# FastTrack - Intermittent Fasting App

## Overview
FastTrack is a comprehensive intermittent fasting app built with Expo and React Native. It helps users track their fasting periods, view progress over time, and maintain healthy fasting habits.

## Features
- **Fasting Timer**: Visual progress ring showing elapsed time with real-time fasting stage indicators
- **Multiple Fasting Plans**: Pre-built plans (16:8, 18:6, 20:4, OMAD, 14:10, 12:12) and custom options
- **Fasting Stages**: Real-time indicators showing body state (fed, early fasting, fat burning, ketosis, autophagy)
- **History Calendar**: Heatmap calendar showing completed fasts with streak tracking
- **Weight Tracking**: Log and track weight over time
- **Profile Settings**: Customizable avatar, display name, weight units, notifications

## Tech Stack
- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: Express.js (minimal, mainly for API structure)
- **Storage**: AsyncStorage for local data persistence
- **Navigation**: React Navigation 7+ with bottom tabs
- **Styling**: Custom theme with iOS 26 liquid glass design language
- **Animations**: React Native Reanimated

## Project Structure
```
client/
├── components/
│   ├── Button.tsx
│   ├── CalendarHeatmap.tsx
│   ├── Card.tsx
│   ├── ErrorBoundary.tsx
│   ├── FAB.tsx
│   ├── FastHistoryItem.tsx
│   ├── FastingStage.tsx
│   ├── PlanCard.tsx
│   ├── ProgressRing.tsx
│   ├── StatsCard.tsx
│   ├── ThemedText.tsx
│   └── ThemedView.tsx
├── constants/
│   └── theme.ts
├── hooks/
│   ├── useFasting.ts
│   ├── useColorScheme.ts
│   ├── useScreenOptions.ts
│   └── useTheme.ts
├── lib/
│   ├── plans.ts
│   ├── query-client.ts
│   └── storage.ts
├── navigation/
│   ├── MainTabNavigator.tsx
│   └── RootStackNavigator.tsx
├── screens/
│   ├── HistoryScreen.tsx
│   ├── HomeScreen.tsx
│   ├── PlanDetailModal.tsx
│   ├── PlansScreen.tsx
│   ├── ProfileScreen.tsx
│   └── StartFastModal.tsx
└── App.tsx
```

## Navigation
- **Home Tab**: Active fasting timer and quick stats
- **Plans Tab**: Browse and select fasting schedules
- **History Tab**: Calendar view and past fasts
- **Profile Tab**: Settings, stats, and preferences

## Data Models
- **Fast**: id, startTime, endTime, targetDuration, planId, planName, completed, note
- **UserProfile**: displayName, avatarId, weightUnit, notificationsEnabled
- **WeightEntry**: id, date, weight

## Color Palette
- Primary: #2DD4BF (Teal)
- Secondary: #A78BFA (Purple)
- Success: #10B981 (Green)
- Destructive: #EF4444 (Red)

## Development
- Expo app runs on port 8081
- Express backend runs on port 5000
- Use `npm run dev` to start the development server
