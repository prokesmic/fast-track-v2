# Fasting App - Design Guidelines

## Authentication & User Profile
- **No authentication required** - local-first personal utility app
- Include **Profile/Settings screen** with:
  - User-customizable avatar (generate 3 calming, wellness-themed preset avatars: lotus, zen stones, peaceful moon)
  - Display name field
  - Preferences: theme toggle (light/dark), notification settings, weight unit (lbs/kg)

## Navigation Architecture
**Tab Bar Navigation** (4 tabs + floating action)
1. **Home** - Active fasting timer and quick stats
2. **Plans** - Preset and custom fasting schedules
3. **History** - Calendar view and past fasts
4. **Profile** - Settings, stats, and preferences

**Floating Action Button (FAB)** - Center of screen bottom: "Start Fast" (primary action, visible when no fast is active)

## Screen Specifications

### Home Screen
- **Purpose**: Monitor active fast, see progress
- **Layout**:
  - Transparent header, no buttons
  - Non-scrollable main content
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**:
  - Large circular progress ring showing elapsed/remaining time
  - Current fast type label (e.g., "16:8 Intermission")
  - Time remaining (hours:minutes)
  - Target end time
  - "End Fast Early" button (destructive, requires confirmation)
  - Quick stats cards: current streak, longest streak, total fasts completed

### Plans Screen
- **Purpose**: Browse and select fasting schedules
- **Layout**:
  - Default header with title "Fasting Plans"
  - Scrollable list
  - Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**:
  - Popular plans section: cards for 16:8, 18:6, 20:4, OMAD (One Meal A Day), 5:2, Custom
  - Each card shows: plan name, description, difficulty badge, "Start" button
  - Tapping card opens detail modal with benefits and schedule visualization

### History Screen
- **Purpose**: View past fasting sessions and trends
- **Layout**:
  - Default header with title "History"
  - Scrollable content
  - Safe area: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**:
  - Calendar heatmap (current month) - cells colored by fast completion
  - Filter toggle: Week/Month/All Time
  - List of completed fasts: date, duration, fast type, success indicator

### Profile Screen
- **Purpose**: Settings, lifetime stats, personalization
- **Layout**:
  - Transparent header, right button: "Edit"
  - Scrollable form
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**:
  - Avatar picker (3 preset wellness-themed avatars)
  - Display name field
  - Lifetime stats cards: total hours fasted, total fasts, current streak
  - Settings sections:
    - Notifications (fast start/end reminders)
    - Theme (system/light/dark)
    - Weight tracking toggle
    - Units (imperial/metric)
    - About & Privacy Policy links

### Start Fast Modal (Native Modal)
- **Purpose**: Configure and begin a new fast
- **Layout**:
  - Custom header with "Cancel" (left) and "Start" (right)
  - Scrollable form
  - Safe area: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl
- **Components**:
  - Fast type selector (16:8, 18:6, custom)
  - Start time picker (default: now)
  - End time (auto-calculated, editable)
  - Optional: add note field
  - Submit in header

## Design System

### Color Palette
- **Primary**: Calming teal (#2DD4BF) - progress, active states
- **Secondary**: Soft purple (#A78BFA) - accents, badges
- **Success**: Green (#10B981) - completed fasts
- **Destructive**: Red (#EF4444) - end fast early
- **Background (Light)**: White (#FFFFFF)
- **Background (Dark)**: Deep navy (#0F172A)
- **Surface**: Light gray (#F8FAFC) / Dark surface (#1E293B)
- **Text Primary**: #0F172A / #F1F5F9
- **Text Secondary**: #64748B / #94A3B8

### Typography
- **Headers**: SF Pro Display, 28pt bold
- **Subheaders**: SF Pro Text, 20pt semibold
- **Body**: SF Pro Text, 16pt regular
- **Captions**: SF Pro Text, 14pt regular
- **Timer Display**: SF Pro Rounded, 48pt bold (monospaced for stability)

### Visual Design
- **Icons**: System SF Symbols (timer, calendar, person, chart)
- **Progress Ring**: 12pt stroke, rounded caps, gradient (primary to secondary)
- **Cards**: 16pt corner radius, subtle surface elevation (no shadow on light, slight glow on dark)
- **FAB**: 60×60pt circle, primary color, system icon "plus", floating shadow:
  - shadowOffset: {width: 0, height: 2}
  - shadowOpacity: 0.10
  - shadowRadius: 2
- **Buttons**: 48pt height, rounded corners (12pt), haptic feedback on press
- **Calendar Cells**: 40×40pt, 8pt corner radius, opacity-based intensity for heatmap

### Critical Assets
1. **3 Preset Avatars** (wellness theme):
   - Lotus flower illustration (peaceful pink/purple gradient)
   - Zen stones stack (earth tones, balanced)
   - Crescent moon (soft blue/white, night theme)
2. **Empty State Illustration**: Minimalist clock with gentle motion lines (for first-time Home screen)

### Interaction Design
- Fast completion triggers celebratory haptic pattern + subtle confetti animation
- Circular progress ring smoothly animates every minute
- All touchables have 0.7 opacity press state
- Calendar cells pulse gently when tapped
- Modal presentations use default iOS sheet style with detents

### Accessibility
- Dynamic Type support for all text
- VoiceOver labels for timer ("12 hours 30 minutes remaining")
- High contrast mode support for progress indicators
- Minimum touch target: 44×44pt
- Color is never the only indicator (use icons + text for states)