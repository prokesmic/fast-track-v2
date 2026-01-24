export interface Tip {
    id: string;
    text: string;
    category: "nutrition" | "motivation" | "science" | "hydration";
    icon: string;
}

export const TIPS: Tip[] = [
    {
        id: "1",
        text: "Drinking water with a pinch of salt can help maintain electrolyte balance during a fast.",
        category: "hydration",
        icon: "droplet"
    },
    {
        id: "2",
        text: "Hunger comes in waves. If you ride it out for 20 minutes, it usually subsides.",
        category: "motivation",
        icon: "activity"
    },
    {
        id: "3",
        text: "After 12 hours, your body starts producing ketones, a cleaner fuel source for your brain.",
        category: "science",
        icon: "zap"
    },
    {
        id: "4",
        text: "Break your fast with protein and healthy fats to avoid a massive insulin spike.",
        category: "nutrition",
        icon: "check-circle"
    },
    {
        id: "5",
        text: "Black coffee and plain tea are your friends. They don't break your fast!",
        category: "nutrition",
        icon: "coffee"
    },
    {
        id: "6",
        text: "Autophagy (cellular repair) peaks around 24 hours of fasting.",
        category: "science",
        icon: "refresh-cw"
    },
    {
        id: "7",
        text: "You are stronger than your cravings. Keep pushing!",
        category: "motivation",
        icon: "thumbs-up"
    },
    {
        id: "8",
        text: "Sleep is crucial. Your body burns most fat while you sleep deeply.",
        category: "science",
        icon: "moon"
    }
];

export const getRandomTip = (): Tip => {
    const index = Math.floor(Math.random() * TIPS.length);
    return TIPS[index];
};
