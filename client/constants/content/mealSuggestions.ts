/**
 * Meal Break Suggestions
 * Recommendations for what to eat when breaking a fast
 */

export interface MealSuggestion {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  benefits: string[];
}

export interface MealCategory {
  title: string;
  description: string;
  suggestions: MealSuggestion[];
}

export interface FastBreakGuide {
  fastDurationRange: [number, number]; // hours
  title: string;
  overview: string;
  keyPoints: string[];
  avoid: string[];
  categories: MealCategory[];
}

export const FAST_BREAK_GUIDES: FastBreakGuide[] = [
  {
    fastDurationRange: [12, 18],
    title: "Breaking a 12-18 Hour Fast",
    overview:
      "After a standard intermittent fast, your digestive system is ready for normal foods. Focus on nutrient-dense options to maximize the benefits of your fast.",
    keyPoints: [
      "No special precautions needed for this duration",
      "Focus on balanced macronutrients",
      "Include protein with your first meal",
      "Eat mindfully - you may be hungrier than usual",
    ],
    avoid: [
      "Highly processed foods with excess sugar",
      "Extremely large portions (eat until satisfied, not stuffed)",
      "Alcohol on an empty stomach",
    ],
    categories: [
      {
        title: "Protein-Rich Options",
        description: "Protein helps preserve muscle and keeps you satisfied",
        suggestions: [
          {
            id: "eggs",
            name: "Eggs (any style)",
            description:
              "Versatile, easy to digest, complete protein with healthy fats",
            icon: "sunrise",
            color: "#F59E0B",
            benefits: [
              "Complete protein",
              "Easy to digest",
              "Rich in choline for brain health",
            ],
          },
          {
            id: "greek-yogurt",
            name: "Greek Yogurt",
            description: "High protein, probiotics for gut health, pairs well with berries",
            icon: "droplet",
            color: "#3B82F6",
            benefits: [
              "20g protein per cup",
              "Probiotics for gut health",
              "Calcium for bones",
            ],
          },
          {
            id: "grilled-chicken",
            name: "Grilled Chicken or Fish",
            description: "Lean protein that's easy to prepare and digest",
            icon: "award",
            color: "#10B981",
            benefits: [
              "Lean protein source",
              "Low fat, easy to digest",
              "Versatile preparation options",
            ],
          },
        ],
      },
      {
        title: "Healthy Fats",
        description: "Essential for hormone production and nutrient absorption",
        suggestions: [
          {
            id: "avocado",
            name: "Avocado",
            description: "Creamy, satisfying, loaded with potassium and fiber",
            icon: "heart",
            color: "#22C55E",
            benefits: [
              "Heart-healthy monounsaturated fats",
              "More potassium than bananas",
              "Fiber for satiety",
            ],
          },
          {
            id: "nuts",
            name: "Nuts & Seeds",
            description: "Almonds, walnuts, chia seeds - nutrient powerhouses",
            icon: "circle",
            color: "#92400E",
            benefits: [
              "Healthy fats and protein",
              "Minerals like magnesium",
              "Portable and convenient",
            ],
          },
          {
            id: "olive-oil",
            name: "Extra Virgin Olive Oil",
            description: "Drizzle on salads or vegetables for Mediterranean benefits",
            icon: "droplet",
            color: "#84CC16",
            benefits: [
              "Anti-inflammatory properties",
              "Supports heart health",
              "Enhances nutrient absorption",
            ],
          },
        ],
      },
      {
        title: "Vegetables & Fiber",
        description: "Low calorie, high nutrient, supports gut health",
        suggestions: [
          {
            id: "leafy-greens",
            name: "Leafy Greens",
            description: "Spinach, kale, arugula - nutrient dense and low calorie",
            icon: "feather",
            color: "#16A34A",
            benefits: [
              "Very low calorie",
              "High in vitamins K, A, C",
              "Fiber for digestion",
            ],
          },
          {
            id: "cruciferous",
            name: "Cruciferous Vegetables",
            description: "Broccoli, cauliflower, Brussels sprouts - cancer-fighting compounds",
            icon: "star",
            color: "#15803D",
            benefits: [
              "Sulforaphane for detoxification",
              "High fiber content",
              "Very filling",
            ],
          },
        ],
      },
    ],
  },
  {
    fastDurationRange: [18, 24],
    title: "Breaking an 18-24 Hour Fast",
    overview:
      "After a longer fast, your digestive system has been resting. Start with easily digestible foods before moving to heavier options.",
    keyPoints: [
      "Start with something light before a full meal",
      "Consider bone broth or a small snack first",
      "Wait 15-30 minutes before eating a larger meal",
      "Chew thoroughly and eat slowly",
    ],
    avoid: [
      "Large, heavy meals immediately",
      "Fried or very fatty foods as first food",
      "High-sugar foods and drinks",
      "Dairy in large amounts (some people are sensitive after fasting)",
    ],
    categories: [
      {
        title: "Start With (First 30 minutes)",
        description: "Gentle foods to wake up your digestive system",
        suggestions: [
          {
            id: "bone-broth",
            name: "Bone Broth",
            description:
              "Warm, soothing, rich in collagen and electrolytes",
            icon: "coffee",
            color: "#92400E",
            benefits: [
              "Easy on the stomach",
              "Provides electrolytes",
              "Collagen for gut health",
            ],
          },
          {
            id: "small-salad",
            name: "Small Green Salad",
            description: "Light vegetables with olive oil dressing",
            icon: "feather",
            color: "#22C55E",
            benefits: [
              "Provides enzymes",
              "Gentle fiber",
              "Prepares stomach for more food",
            ],
          },
          {
            id: "fermented",
            name: "Fermented Foods",
            description: "Sauerkraut, kimchi, or a few olives - small portions",
            icon: "star",
            color: "#F59E0B",
            benefits: [
              "Probiotics for gut",
              "Digestive enzymes",
              "Stimulates appetite gently",
            ],
          },
        ],
      },
      {
        title: "Main Meal (30+ minutes after)",
        description: "After your digestive system is primed, enjoy a balanced meal",
        suggestions: [
          {
            id: "protein-veg-combo",
            name: "Protein + Vegetables",
            description: "Grilled salmon with roasted vegetables, chicken with salad",
            icon: "award",
            color: "#10B981",
            benefits: [
              "Balanced macronutrients",
              "Satisfying and nutritious",
              "Supports muscle preservation",
            ],
          },
          {
            id: "soup-stew",
            name: "Hearty Soup or Stew",
            description: "Easy to digest, hydrating, can include all food groups",
            icon: "coffee",
            color: "#F97316",
            benefits: [
              "Gentle on digestion",
              "Hydrating",
              "Nutrient-dense",
            ],
          },
        ],
      },
    ],
  },
  {
    fastDurationRange: [24, 72],
    title: "Breaking an Extended Fast (24-72 hours)",
    overview:
      "After an extended fast, your digestive system needs time to restart. Breaking the fast incorrectly can cause discomfort. Take it slow!",
    keyPoints: [
      "ESSENTIAL: Start very small and light",
      "Bone broth is ideal for the first hour",
      "Wait at least 1-2 hours before solid food",
      "Small, frequent portions are better than one large meal",
      "Full digestion can take 2-3 days to normalize",
    ],
    avoid: [
      "NEVER start with a large meal",
      "Avoid raw vegetables initially (hard to digest)",
      "Skip nuts and seeds for the first meal",
      "No alcohol for at least 24 hours",
      "Avoid dairy for first 24 hours",
      "No highly processed or fried foods",
    ],
    categories: [
      {
        title: "Hour 1: Liquids Only",
        description: "Start with liquids to gently reactivate digestion",
        suggestions: [
          {
            id: "bone-broth-extended",
            name: "Bone Broth (Warm)",
            description:
              "1-2 cups of warm bone broth with a pinch of salt",
            icon: "coffee",
            color: "#92400E",
            benefits: [
              "Gentle on empty stomach",
              "Provides electrolytes and minerals",
              "Collagen supports gut lining",
            ],
          },
          {
            id: "diluted-juice",
            name: "Diluted Vegetable Juice",
            description: "Small amount of low-sugar vegetable juice diluted with water",
            icon: "droplet",
            color: "#22C55E",
            benefits: [
              "Gentle nutrients",
              "Hydrating",
              "Won't spike blood sugar",
            ],
          },
        ],
      },
      {
        title: "Hours 2-4: Soft Foods",
        description: "Introduce easily digestible soft foods",
        suggestions: [
          {
            id: "soft-cooked-veg",
            name: "Soft-Cooked Vegetables",
            description: "Steamed zucchini, well-cooked spinach, or mashed avocado",
            icon: "feather",
            color: "#16A34A",
            benefits: [
              "Soft fiber, easy to digest",
              "Gentle nutrients",
              "Won't irritate stomach",
            ],
          },
          {
            id: "ripe-fruit",
            name: "Ripe, Soft Fruit",
            description: "Banana, melon, or ripe papaya in small amounts",
            icon: "sun",
            color: "#FBBF24",
            benefits: [
              "Natural enzymes",
              "Gentle sugars for energy",
              "Easy to digest",
            ],
          },
          {
            id: "soft-eggs",
            name: "Soft-Scrambled Eggs",
            description: "Very soft scrambled eggs with no added fat",
            icon: "sunrise",
            color: "#F59E0B",
            benefits: [
              "Complete protein",
              "Easy to digest when soft",
              "Satisfying",
            ],
          },
        ],
      },
      {
        title: "Hours 4-8: Light Protein",
        description: "Gradually introduce protein as digestion normalizes",
        suggestions: [
          {
            id: "fish-small",
            name: "Small Portion of Fish",
            description: "2-3 oz of baked or steamed white fish",
            icon: "droplet",
            color: "#0EA5E9",
            benefits: [
              "Lean protein",
              "Easy to digest",
              "Omega-3 fatty acids",
            ],
          },
          {
            id: "chicken-small",
            name: "Chicken (Small Portion)",
            description: "2-3 oz of baked chicken breast, well-chewed",
            icon: "award",
            color: "#10B981",
            benefits: [
              "Lean protein for recovery",
              "Low fat",
              "Filling",
            ],
          },
        ],
      },
      {
        title: "Day 2 Onwards",
        description: "Gradually return to normal eating over 1-2 days",
        suggestions: [
          {
            id: "normal-portions",
            name: "Normal Balanced Meals",
            description:
              "Return to regular portions slowly, listening to your body",
            icon: "check-circle",
            color: "#10B981",
            benefits: [
              "Full nutrition",
              "Digestive system recovered",
              "Normal eating resumes",
            ],
          },
        ],
      },
    ],
  },
];

export const getMealGuideForDuration = (hours: number): FastBreakGuide => {
  const guide = FAST_BREAK_GUIDES.find(
    (g) => hours >= g.fastDurationRange[0] && hours < g.fastDurationRange[1]
  );
  return guide || FAST_BREAK_GUIDES[0]; // Default to shortest duration guide
};

export const getAllMealSuggestions = () => {
  const all: MealSuggestion[] = [];
  FAST_BREAK_GUIDES.forEach((guide) => {
    guide.categories.forEach((category) => {
      all.push(...category.suggestions);
    });
  });
  return all;
};
