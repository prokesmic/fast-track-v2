export interface FastingPlan {
  id: string;
  name: string;
  fastingHours: number;
  eatingHours: number;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  benefits: string[];
}

export const FASTING_PLANS: FastingPlan[] = [
  {
    id: "16-8",
    name: "16:8",
    fastingHours: 16,
    eatingHours: 8,
    description:
      "The most popular intermittent fasting method. Fast for 16 hours and eat within an 8-hour window.",
    difficulty: "Easy",
    benefits: [
      "Improved insulin sensitivity",
      "Enhanced fat burning",
      "Easy to maintain long-term",
      "Flexible eating window",
    ],
  },
  {
    id: "18-6",
    name: "18:6",
    fastingHours: 18,
    eatingHours: 6,
    description:
      "A slightly more advanced protocol with deeper fat burning benefits and cellular repair.",
    difficulty: "Medium",
    benefits: [
      "Increased autophagy",
      "Greater fat oxidation",
      "Enhanced mental clarity",
      "Reduced inflammation",
    ],
  },
  {
    id: "20-4",
    name: "20:4",
    fastingHours: 20,
    eatingHours: 4,
    description:
      "Also known as the Warrior Diet. Eat one large meal and snacks within a 4-hour window.",
    difficulty: "Hard",
    benefits: [
      "Maximum fat burning",
      "Deep autophagy activation",
      "Improved growth hormone",
      "Simplified meal planning",
    ],
  },
  {
    id: "omad",
    name: "OMAD",
    fastingHours: 23,
    eatingHours: 1,
    description:
      "One Meal A Day. Consume all daily calories in a single meal for maximum fasting benefits.",
    difficulty: "Expert",
    benefits: [
      "Extreme autophagy",
      "Maximum ketone production",
      "Ultimate simplicity",
      "Deep cellular repair",
    ],
  },
  {
    id: "14-10",
    name: "14:10",
    fastingHours: 14,
    eatingHours: 10,
    description:
      "Perfect for beginners. A gentle introduction to intermittent fasting with a wide eating window.",
    difficulty: "Easy",
    benefits: [
      "Gentle metabolic benefits",
      "Easy transition from regular eating",
      "Improved digestion",
      "Better sleep quality",
    ],
  },
  {
    id: "12-12",
    name: "12:12",
    fastingHours: 12,
    eatingHours: 12,
    description:
      "The easiest fasting method. Simply avoid eating for 12 hours, often overnight.",
    difficulty: "Easy",
    benefits: [
      "Circadian rhythm alignment",
      "Improved sleep",
      "Digestive rest",
      "Sustainable habit building",
    ],
  },
];

export function getPlanById(id: string): FastingPlan | undefined {
  return FASTING_PLANS.find((plan) => plan.id === id);
}
