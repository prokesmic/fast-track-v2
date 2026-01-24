export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Feather icon name
    category: "streak" | "hours" | "milestone" | "lifestyle";
    requirement: number; // e.g., 3 for 3 days streak
    color: string;
}

export const BADGES: Badge[] = [
    // --- Streaks ---
    { id: "streak_3", name: "Consistency Is Key", description: "Reach a 3-day fasting streak", icon: "zap", category: "streak", requirement: 3, color: "#FBBF24" },
    { id: "streak_7", name: "Unstoppable", description: "Reach a 7-day fasting streak", icon: "trending-up", category: "streak", requirement: 7, color: "#F472B6" },
    { id: "streak_14", name: "Habit Master", description: "Reach a 14-day fasting streak", icon: "award", category: "streak", requirement: 14, color: "#A78BFA" },
    { id: "streak_21", name: "Habit Formed", description: "Reach a 21-day fasting streak", icon: "check-circle", category: "streak", requirement: 21, color: "#8B5CF6" },
    { id: "streak_30", name: "Month of Zen", description: "Reach a 30-day fasting streak", icon: "star", category: "streak", requirement: 30, color: "#60A5FA" },
    { id: "streak_60", name: "Iron Will", description: "Reach a 60-day fasting streak", icon: "shield", category: "streak", requirement: 60, color: "#EF4444" },
    { id: "streak_90", name: "Quarter Century", description: "Reach a 90-day fasting streak", icon: "anchor", category: "streak", requirement: 90, color: "#10B981" },
    { id: "streak_180", name: "Half Year Hero", description: "Reach a 180-day fasting streak", icon: "sun", category: "streak", requirement: 180, color: "#F59E0B" },
    { id: "streak_365", name: "Year of Focus", description: "Reach a 365-day fasting streak", icon: "globe", category: "streak", requirement: 365, color: "#6366F1" },

    // --- Volume (Total Fasts) ---
    { id: "fasts_1", name: "First Step", description: "Complete your first fast", icon: "flag", category: "milestone", requirement: 1, color: "#34D399" },
    { id: "fasts_5", name: "High Five", description: "Complete 5 fasts", icon: "heart", category: "milestone", requirement: 5, color: "#EC4899" },
    { id: "fasts_10", name: "Dedicated", description: "Complete 10 fasts", icon: "check-circle", category: "milestone", requirement: 10, color: "#10B981" },
    { id: "fasts_25", name: "Quarter Century", description: "Complete 25 fasts", icon: "award", category: "milestone", requirement: 25, color: "#8B5CF6" },
    { id: "fasts_50", name: "Seasoned", description: "Complete 50 fasts", icon: "star", category: "milestone", requirement: 50, color: "#F59E0B" },
    { id: "fasts_100", name: "Club 100", description: "Complete 100 fasts", icon: "crown", category: "milestone", requirement: 100, color: "#FCD34D" },
    { id: "fasts_250", name: "Elite Faster", description: "Complete 250 fasts", icon: "target", category: "milestone", requirement: 250, color: "#EF4444" },
    { id: "fasts_500", name: "Master Faster", description: "Complete 500 fasts", icon: "zap", category: "milestone", requirement: 500, color: "#6366F1" },
    { id: "fasts_1000", name: "Legendary", description: "Complete 1000 fasts", icon: "award", category: "milestone", requirement: 1000, color: "#A78BFA" },

    // --- Single Fast Duration ---
    { id: "duration_12", name: "Beginner", description: "Complete a fast of 12 hours", icon: "clock", category: "hours", requirement: 12, color: "#9CA3AF" },
    { id: "duration_14", name: "Getting Serious", description: "Complete a fast of 14 hours", icon: "watch", category: "hours", requirement: 14, color: "#60A5FA" },
    { id: "duration_16", name: "16:8 Warrior", description: "Complete a fast of 16 hours", icon: "clock", category: "hours", requirement: 16, color: "#60A5FA" },
    { id: "duration_18", name: "Pushing Limits", description: "Complete a fast of 18 hours", icon: "activity", category: "hours", requirement: 18, color: "#8B5CF6" },
    { id: "duration_20", name: "Warrior Mode", description: "Complete a fast of 20 hours", icon: "target", category: "hours", requirement: 20, color: "#818CF8" },
    { id: "duration_24", name: "OMAD Legend", description: "Complete a fast of 24 hours", icon: "sun", category: "hours", requirement: 24, color: "#F472B6" },
    { id: "duration_36", name: "Monk Mode", description: "Complete a fast of 36 hours", icon: "moon", category: "hours", requirement: 36, color: "#8B5CF6" },
    { id: "duration_48", name: "2 Day Deep", description: "Complete a fast of 48 hours", icon: "layers", category: "hours", requirement: 48, color: "#EF4444" },
    { id: "duration_72", name: "Autophagy King", description: "Complete a fast of 72 hours", icon: "hexagon", category: "hours", requirement: 72, color: "#10B981" },
    { id: "duration_100", name: "Centurion", description: "Complete a fast of 100 hours", icon: "shield", category: "hours", requirement: 100, color: "#F59E0B" },
    { id: "duration_168", name: "Week Warrior", description: "Complete a full 1 week fast", icon: "calendar", category: "hours", requirement: 168, color: "#6366F1" },

    // --- Lifestyle & Consistency ---
    { id: "lifestyle_early_bird", name: "Early Bird", description: "Start a fast before 8 PM", icon: "sunrise", category: "lifestyle", requirement: 0, color: "#F59E0B" },
    { id: "lifestyle_night_owl", name: "Night Owl", description: "Start a fast after 10 PM", icon: "moon", category: "lifestyle", requirement: 0, color: "#6366F1" },
    { id: "lifestyle_weekend", name: "Weekend Warrior", description: "Fast on Saturday and Sunday", icon: "calendar", category: "lifestyle", requirement: 0, color: "#EC4899" },
    { id: "lifestyle_perfect_week", name: "Perfect Week", description: "Fast every day for 7 days", icon: "check-square", category: "lifestyle", requirement: 7, color: "#10B981" },
];
