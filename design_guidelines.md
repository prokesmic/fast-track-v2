# Fasting App - Premium Design Guidelines

## Authentication & User Profile
- **No authentication required** - local-first personal wellness app
- **Profile/Settings screen** with:
  - User-customizable avatar (generate 3 luxury wellness avatars: ethereal lotus, zen stones with glow, luminous moon)
  - Display name field
  - Preferences: theme (system/light/dark), notifications, weight units (lbs/kg)

## Navigation Architecture
**Tab Bar Navigation** (4 tabs + floating action)
1. **Home** - Active fast with animated progress
2. **Plans** - Preset fasting schedules
3. **History** - Calendar and analytics
4. **Profile** - Settings and lifetime stats

**Floating Action Button**: 64×64pt glass-morphic circle, gradient fill (teal→purple), centered bottom, visible when no fast is active, pulsing glow animation

**Tab Bar Design**: Frosted glass background with blur, floating 16pt above screen bottom, 80pt height, pill-shaped (24pt corner radius), icons with gradient fill on active state

## Screen Specifications

### Home Screen
- **Purpose**: Monitor active fast with immersive visuals
- **Layout**:
  - No header (full-screen canvas)
  - Non-scrollable
  - Animated mesh gradient background (teal→purple→pink, slow 30s loop)
  - Safe area: top = insets.top + Spacing.xl, bottom = tabBarHeight + 32pt
- **Components**:
  - Massive circular progress ring (280pt diameter):
    - 16pt stroke width, rounded caps
    - Gradient stroke (teal→purple)
    - Outer glow effect (8pt radius, 0.4 opacity, gradient color)
    - Smooth per-second animation
    - Inner text: elapsed time (72pt, bold, gradient text)
  - Below ring: Fast type label (20pt semibold) + target end time (16pt, secondary color)
  - Floating glass card (bottom third): Current streak counter, total hours fasted, with subtle shimmer animation
  - "End Fast" button: Glass-morphic, destructive red accent, requires confirmation alert

### Plans Screen
- **Purpose**: Browse premium fasting schedules
- **Layout**:
  - Transparent header with "Fasting Plans" (32pt bold)
  - Scrollable vertical stack
  - Gradient background (lighter than Home, teal→purple subtle)
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + 32pt
- **Components**:
  - Plan cards (glass-morphic design):
    - Frosted background, 1pt white/15% border
    - 20pt corner radius
    - Floating shadow: {width: 0, height: 8, opacity: 0.15, radius: 16}
    - Gradient accent bar (left edge, 4pt width)
    - Plan name (24pt bold), description (16pt), difficulty badge (gradient pill)
    - "Start" button (gradient fill, white text, 48pt height)
  - Hover/press: Scale to 0.98, increase glow
  - Popular plans: 16:8, 18:6, 20:4, OMAD, 5:2, Custom
  - Tapping opens full-screen modal with benefits, schedule visualization (timeline graphic)

### History Screen
- **Purpose**: View progress and trends with data visualization
- **Layout**:
  - Transparent header: "History" (32pt bold), right button: filter icon
  - Scrollable
  - Subtle gradient background
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + 32pt
- **Components**:
  - Calendar heatmap (glass card):
    - 7×5 grid, cells 44×44pt
    - Gradient intensity based on fast completion (transparent→teal→purple)
    - 8pt corner radius per cell, 4pt gap
    - Animated fade-in when scrolled into view
  - Stats overview cards (horizontal scroll):
    - Average fast duration, completion rate, best streak
    - Glass-morphic, gradient accent icons
  - Completed fasts list:
    - Glass cards with gradient left accent
    - Date, duration, type, success checkmark (animated)

### Profile Screen
- **Purpose**: Personalization and settings
- **Layout**:
  - Transparent header, right button: "Edit"
  - Scrollable form
  - Gradient background (purple→pink subtle)
  - Safe area: top = headerHeight + Spacing.xl, bottom = tabBarHeight + 32pt
- **Components**:
  - Hero section: Large avatar (120pt circle, gradient border 3pt), display name (28pt bold)
  - Lifetime stats (glass card grid):
    - Total hours fasted, total fasts, current streak
    - Large gradient numbers (48pt bold), labels (14pt)
    - Subtle counting animation on load
  - Settings sections (glass cards):
    - Notifications, Theme, Weight tracking, Units
    - Toggle switches with gradient active state
    - Chevron navigation for nested screens
  - About & Privacy (text links, purple gradient)

### Start Fast Modal
- **Purpose**: Configure new fast with elegant controls
- **Layout**:
  - Full-screen modal, gradient background (teal→purple)
  - Custom header: "Cancel" (left, white), "Start Fast" (right, bold white)
  - Scrollable form
  - Safe area: top = insets.top + Spacing.xl, bottom = insets.bottom + Spacing.xl
- **Components**:
  - Fast type selector: Horizontal scrolling glass pills, gradient fill on selected
  - Time pickers: Glass-morphic wheels, white text, gradient underline
  - Duration preview: Large animated countdown (56pt bold)
  - Optional note field: Glass input with frosted background
  - Haptic feedback on all interactions

## Premium Design System

### Color Palette
- **Primary Gradient**: Teal (#2DD4BF) → Purple (#A78BFA) → Pink (#EC4899)
- **Glass Overlay**: White 10% with 20pt blur (light), Black 15% with 24pt blur (dark)
- **Accents**: 
  - Success: Mint green (#10B981) with glow
  - Destructive: Coral red (#EF4444) with glow
- **Backgrounds**:
  - Light: Animated mesh gradient (white → teal 5% → purple 5%)
  - Dark: Deep gradient (navy #0F172A → purple 10% → black)
- **Text**: Pure black (#000000) / Pure white (#FFFFFF), gradient text for emphasis
- **Shadows**: Multi-layer (small sharp + large soft for depth)

### Typography
- **Display**: SF Pro Display, 72pt bold (timers, hero numbers)
- **Headers**: SF Pro Display, 32pt bold
- **Subheaders**: SF Pro Text, 20pt semibold
- **Body**: SF Pro Text, 16pt regular
- **Captions**: SF Pro Text, 14pt medium
- **Gradient text** for primary headings and key numbers

### Visual Design
- **Glass Morphism**: All cards use frosted glass effect with:
  - Background blur (20-24pt)
  - White 10-15% overlay (light mode) or Black 15-20% (dark)
  - 1pt white/15% border
  - Floating shadows: {width: 0, height: 8, opacity: 0.15, radius: 16}
- **Progress Ring**: 
  - Gradient stroke with outer glow (8pt radius, animated pulse every 2s)
  - Inner gradient fill for background track (5% opacity)
- **Buttons**:
  - Primary: Gradient fill (teal→purple), 48pt height, 16pt corner radius
  - Secondary: Glass background, gradient border
  - Press state: Scale 0.96, haptic medium impact
- **FAB**: Glass circle, gradient fill, white icon, continuous pulsing glow, shadow:
  - shadowOffset: {width: 0, height: 4}
  - shadowOpacity: 0.25
  - shadowRadius: 12
- **Icons**: SF Symbols, gradient fill for active states, 24pt default size
- **Animations**:
  - Page transitions: Smooth slide with fade (300ms)
  - Card entries: Staggered fade-up (100ms delay between items)
  - Progress updates: Smooth spring animation
  - Success states: Scale pulse + gradient shimmer

### Critical Assets
1. **3 Luxury Avatars**:
   - Ethereal lotus (gradient pink→purple with glow)
   - Zen stones (gradient earth tones with golden highlights)
   - Luminous moon (gradient blue→white with halo)
   All with transparent backgrounds, subtle glow effects
2. **Empty State**: Minimalist gradient clock icon with floating particles

### Interaction & Animation
- **Micro-interactions**: All touchables scale to 0.96 on press with haptic feedback
- **Progress ring**: Updates every second with smooth spring animation, pulses every 2s
- **Fast completion**: Radial gradient burst animation, haptic success pattern, confetti particles
- **Background**: Animated mesh gradient continuously shifts (30s loop)
- **Cards**: Parallax effect on scroll (subtle 3D depth)
- **Transitions**: Modal presentations use custom gradient fade

### Accessibility
- Dynamic Type support (all text scales)
- VoiceOver: Descriptive labels ("12 hours 30 minutes remaining of 16 hour fast")
- Reduce Motion: Disable mesh animation, simplify transitions
- High Contrast: Increase border opacity to 40%, reduce transparency
- Color-independent indicators (icons + labels for all states)
- Minimum touch target: 44×44pt