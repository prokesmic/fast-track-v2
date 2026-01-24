import { Colors } from "./theme";

export interface FastingStage {
    id: string;
    name: string;
    timeRange: string;
    startHour: number;
    endHour: number | null; // null for the final open-ended stage
    description: string;
    longDescription: string;
    icon: "droplet" | "trending-down" | "sun" | "zap" | "refresh-cw" | "activity" | "shield";
    color: string;
    benefits: { title: string; description: string }[];
    feelings: { title: string; description: string }[];
}

export const FASTING_STAGES: FastingStage[] = [
    {
        id: "anabolic",
        name: "Blood Sugar Rise",
        timeRange: "0-4 hours",
        startHour: 0,
        endHour: 4,
        description: "Digesting your last meal",
        longDescription:
            "Your body is digesting food and absorbing nutrients. Insulin levels rise to store energy.",
        icon: "droplet",
        color: "#60A5FA", // Blue-400
        benefits: [
            { title: "Nutrient Absorption", description: "Body actively processes and stores nutrients from your active meal." },
            { title: "Energy Refuel", description: "Glycogen stores in liver and muscles are replenished." }
        ],
        feelings: [
            { title: "Satiety", description: "Feeling full and satisfied from your meal." },
            { title: "Energy Peak", description: "Blood sugar spike provides temporary high energy." }
        ]
    },
    {
        id: "catabolic",
        name: "Blood Sugar Fall",
        timeRange: "4-8 hours",
        startHour: 4,
        endHour: 8,
        description: "Insulin levels are dropping",
        longDescription:
            "Blood sugar normalizes. Your body starts transitioning from storing energy to using stored energy.",
        icon: "trending-down",
        color: "#34D399", // Emerald-400
        benefits: [
            { title: "Digestive Rest", description: "Digestive system gets a break as stomach empties." },
            { title: "Insulin Decrease", description: "Pancreas reduces insulin production." }
        ],
        feelings: [
            { title: "Stable Energy", description: "Energy levels level out as blood sugar normalizes." },
            { title: "Mild Hunger", description: "You might feel the first pangs of hunger." }
        ]
    },
    {
        id: "fat_burning",
        name: "Fat Burning",
        timeRange: "8-12 hours",
        startHour: 8,
        endHour: 12,
        description: "Switching to fat for fuel",
        longDescription:
            "Liver glycogen is depleting. Your body begins to access fat stores for energy.",
        icon: "sun",
        color: "#FBBF24", // Amber-400
        benefits: [
            { title: "Glycogen Depletion", description: "Liver sugar stores are nearly empty." },
            { title: "Fat Mobilization", description: "Body starts breaking down fat cells for energy." }
        ],
        feelings: [
            { title: "Hunger Waves", description: "Ghrelin (hunger hormone) may spike." },
            { title: "Mental Clarity", description: "Brain starts utilizing cleaner focus." }
        ]
    },
    {
        id: "ketosis",
        name: "Ketosis",
        timeRange: "12-18 hours",
        startHour: 12,
        endHour: 18,
        description: "Deep fat burning state",
        longDescription:
            "Your body is fully powered by fat. Ketones are produced, sharpening mental clarity.",
        icon: "zap",
        color: "#F87171", // Red-400
        benefits: [
            { title: "Max Fat Burning", description: "Primary fuel source is now body fat." },
            { title: "Ketone Production", description: "Liver produces ketones (BHB) for brain fuel." }
        ],
        feelings: [
            { title: "Reduced Hunger", description: "Ketones naturally suppress appetite." },
            { title: "Sharp Focus", description: "Brain fog clears as ketosis deepens." }
        ]
    },
    {
        id: "autophagy",
        name: "Autophagy",
        timeRange: "18-24 hours",
        startHour: 18,
        endHour: 24,
        description: "Cellular cleaning & repair",
        longDescription:
            "Your cells start recycling old components. A powerful rejuvenation process begins.",
        icon: "refresh-cw",
        color: "#A78BFA", // Violet-400
        benefits: [
            { title: "Cellular Recycling", description: "Body cleans out damaged cells and proteins." },
            { title: "Anti-Aging", description: "Reduction in oxidative stress markers." }
        ],
        feelings: [
            { title: "Lightness", description: "Feeling less bloated and lighter." },
            { title: "Deep Focus", description: "Sustained mental energy." }
        ]
    },
    {
        id: "deep_autophagy",
        name: "Deep Autophagy",
        timeRange: "24-48 hours",
        startHour: 24,
        endHour: 48,
        description: "Peak cellular regeneration",
        longDescription:
            "Autophagy reaches its peak. Your body is aggressively cleaning out damaged cells and stimulating stem cell production.",
        icon: "shield",
        color: "#818CF8", // Indigo-400
        benefits: [
            { title: "Stem Cell Activation", description: "Immune system regeneration begins." },
            { title: "Inflammation Drop", description: "Systemic inflammation decreases significantly." }
        ],
        feelings: [
            { title: "Euphoria", description: "Possible 'fasting high' from ketones." },
            { title: "Wave of Calm", description: "Nervous system settles into deep repair mode." }
        ]
    },
    {
        id: "growth_hormone",
        name: "Growth Hormone",
        timeRange: "48+ hours",
        startHour: 48,
        endHour: null,
        description: "HGH levels surge",
        longDescription:
            "Human Growth Hormone peaks (up to 5x) to preserve muscle mass and accelerate deep tissue recovery.",
        icon: "activity",
        color: "#F472B6", // Pink-400
        benefits: [
            { title: "Muscle Protection", description: "HGH surges to prevent muscle loss." },
            { title: "Rapid Repair", description: "Accelerated tissue healing and metabolic reset." }
        ],
        feelings: [
            { title: "True Hunger", description: "True hunger returns; listen to your body." },
            { title: "Alertness", description: "Heightened senses and mental acuity." }
        ]
    }
];

export const getStageForDuration = (hours: number): FastingStage => {
    return (
        FASTING_STAGES.find(
            (stage) => hours >= stage.startHour && (stage.endHour === null || hours < stage.endHour)
        ) || FASTING_STAGES[0]
    );
};
