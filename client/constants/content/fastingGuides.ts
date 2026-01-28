/**
 * Fasting Guides Content
 * Educational content about fasting methods and best practices
 */

export interface GuideSection {
  title: string;
  content: string;
}

export interface FastingGuide {
  id: string;
  title: string;
  subtitle: string;
  category: "beginner" | "intermediate" | "advanced";
  readTime: number; // minutes
  icon: string;
  color: string;
  sections: GuideSection[];
  tips: string[];
}

export const FASTING_GUIDES: FastingGuide[] = [
  // BEGINNER GUIDES
  {
    id: "intro-to-fasting",
    title: "Introduction to Intermittent Fasting",
    subtitle: "Everything you need to know to get started",
    category: "beginner",
    readTime: 5,
    icon: "book-open",
    color: "#10B981",
    sections: [
      {
        title: "What is Intermittent Fasting?",
        content:
          "Intermittent fasting (IF) is an eating pattern that cycles between periods of fasting and eating. It doesn't specify which foods to eat but rather when you should eat them. Common methods include the 16:8 method (16 hours fasting, 8 hours eating), the 5:2 diet (eating normally 5 days, restricting calories 2 days), and the Eat-Stop-Eat method (24-hour fasts once or twice per week).",
      },
      {
        title: "How Does It Work?",
        content:
          "When you fast, several things happen in your body on the cellular and molecular level. Your body adjusts hormone levels to make stored body fat more accessible. Cells initiate cellular repair processes and change gene expression. Insulin levels drop significantly, facilitating fat burning. Human growth hormone increases, benefiting fat loss and muscle gain.",
      },
      {
        title: "Benefits of Fasting",
        content:
          "Research shows intermittent fasting can help with weight loss, improve metabolic health, protect against disease, and may even help you live longer. It simplifies your day by reducing the time spent on meal preparation and can improve mental clarity and focus during fasting periods.",
      },
      {
        title: "Getting Started",
        content:
          "Start with a 12-hour fast overnight (e.g., 8 PM to 8 AM). Gradually extend your fasting window as your body adapts. Stay hydrated with water, black coffee, or unsweetened tea. Listen to your body and don't push too hard too fast. Most people adapt within 2-4 weeks.",
      },
    ],
    tips: [
      "Start with shorter fasting windows and gradually increase",
      "Stay well-hydrated during fasting periods",
      "Keep busy to distract from hunger",
      "Break your fast with nutritious, balanced meals",
      "Be patient - it takes time to adapt",
    ],
  },
  {
    id: "16-8-method",
    title: "The 16:8 Method Explained",
    subtitle: "The most popular intermittent fasting approach",
    category: "beginner",
    readTime: 4,
    icon: "clock",
    color: "#3B82F6",
    sections: [
      {
        title: "What is 16:8?",
        content:
          "The 16:8 method involves fasting for 16 hours and eating within an 8-hour window each day. For example, you might eat between 12 PM and 8 PM, then fast from 8 PM until noon the next day. This method is popular because it's relatively easy to follow and fits well with most lifestyles.",
      },
      {
        title: "Sample Schedule",
        content:
          "A typical 16:8 schedule might look like this: Skip breakfast, have your first meal at noon (lunch), eat a snack around 3-4 PM if needed, have dinner by 8 PM, then fast until noon the next day. You can adjust the eating window to fit your schedule - some prefer 10 AM to 6 PM or 2 PM to 10 PM.",
      },
      {
        title: "What to Eat",
        content:
          "During your eating window, focus on nutrient-dense foods. Include lean proteins, healthy fats, complex carbohydrates, and plenty of vegetables. Avoid overeating to 'make up' for the fasting period. Eat until satisfied, not stuffed. Quality matters as much as timing.",
      },
      {
        title: "During the Fast",
        content:
          "During the 16-hour fast, you can consume zero-calorie beverages: water (plain or sparkling), black coffee, and unsweetened tea. These won't break your fast and can help manage hunger. Some people find that morning coffee suppresses appetite effectively.",
      },
    ],
    tips: [
      "Choose an eating window that fits your social life",
      "Prepare meals in advance to avoid breaking your fast early",
      "Black coffee in the morning can help suppress appetite",
      "Don't obsess over exact times - close enough is fine",
      "Weekend schedules can be more flexible",
    ],
  },
  {
    id: "staying-hydrated",
    title: "Hydration During Fasting",
    subtitle: "Why water is your best friend while fasting",
    category: "beginner",
    readTime: 3,
    icon: "droplet",
    color: "#06B6D4",
    sections: [
      {
        title: "Why Hydration Matters",
        content:
          "Staying hydrated is crucial during fasting. Water helps maintain energy levels, supports detoxification, reduces hunger, and keeps your metabolism functioning properly. Many hunger signals are actually thirst signals in disguise. Proper hydration can make fasting significantly easier.",
      },
      {
        title: "How Much to Drink",
        content:
          "Aim for at least 8-10 glasses (64-80 oz) of water per day. During fasting, you may need more since you're not getting water from food. A good rule is to drink when thirsty and check that your urine is light yellow. Darker urine indicates you need more fluids.",
      },
      {
        title: "What You Can Drink",
        content:
          "Safe beverages during fasting include: plain water, sparkling water, black coffee (no sugar or cream), green tea, herbal tea, and bone broth (for longer fasts). Avoid sugary drinks, diet sodas (controversial), and anything with calories that could break your fast.",
      },
      {
        title: "Electrolytes",
        content:
          "For longer fasts (24+ hours), consider adding electrolytes. A pinch of salt in water, or sugar-free electrolyte supplements, can prevent headaches and fatigue. Magnesium, potassium, and sodium are the key electrolytes to maintain.",
      },
    ],
    tips: [
      "Start your day with a large glass of water",
      "Keep a water bottle with you at all times",
      "Set reminders to drink if you often forget",
      "Add lemon or cucumber for flavor without calories",
      "Monitor urine color as a hydration indicator",
    ],
  },

  // INTERMEDIATE GUIDES
  {
    id: "extended-fasting",
    title: "Extended Fasting (24-48 hours)",
    subtitle: "Taking your fasting practice to the next level",
    category: "intermediate",
    readTime: 6,
    icon: "trending-up",
    color: "#8B5CF6",
    sections: [
      {
        title: "What is Extended Fasting?",
        content:
          "Extended fasting refers to fasts lasting 24 hours or longer. While 16:8 is great for daily practice, occasional extended fasts can provide deeper benefits including enhanced autophagy, greater insulin sensitivity improvements, and more significant metabolic adaptations. These should be done occasionally, not daily.",
      },
      {
        title: "The 24-Hour Fast",
        content:
          "A 24-hour fast means eating one meal per day (OMAD) or fasting from dinner to dinner. For example, finish dinner at 7 PM, then don't eat until 7 PM the next day. This is a good stepping stone before attempting longer fasts. Many people do this once or twice per week.",
      },
      {
        title: "The 36-48 Hour Fast",
        content:
          "Longer fasts of 36-48 hours provide more time for deep autophagy and ketosis. These are typically done monthly or quarterly. Preparation is key: ease into it with a low-carb meal, stay well-hydrated, and plan low-intensity activities. Breaking the fast properly is crucial.",
      },
      {
        title: "Managing Extended Fasts",
        content:
          "During extended fasts, expect waves of hunger that come and go. Stay busy, drink plenty of water with electrolytes, and rest when needed. Light walking is fine, but avoid intense exercise. If you feel unwell, it's okay to break the fast early. Safety first.",
      },
    ],
    tips: [
      "Start with 24 hours before attempting longer fasts",
      "Always consult a doctor before extended fasting",
      "Keep electrolytes handy (salt, potassium, magnesium)",
      "Plan your fast around low-stress periods",
      "Break your fast with easily digestible foods",
    ],
  },
  {
    id: "autophagy-guide",
    title: "Understanding Autophagy",
    subtitle: "Your body's cellular cleaning system",
    category: "intermediate",
    readTime: 5,
    icon: "refresh-cw",
    color: "#EC4899",
    sections: [
      {
        title: "What is Autophagy?",
        content:
          "Autophagy (from Greek 'self-eating') is your body's way of cleaning out damaged cells and regenerating newer, healthier cells. It's like a cellular recycling program. The 2016 Nobel Prize in Medicine was awarded for discoveries about autophagy mechanisms, highlighting its importance to health.",
      },
      {
        title: "When Does Autophagy Occur?",
        content:
          "Autophagy is triggered by nutrient deprivation. While it begins within hours of fasting, significant autophagy typically requires 24-48 hours of fasting. The process peaks around 48-72 hours. Exercise, especially while fasted, can also enhance autophagy.",
      },
      {
        title: "Benefits of Autophagy",
        content:
          "Research links autophagy to numerous benefits: reduced inflammation, improved brain function, potential cancer prevention, slower aging, better immune function, and protection against neurodegenerative diseases. It's essentially your body's maintenance and repair mode.",
      },
      {
        title: "Maximizing Autophagy",
        content:
          "To maximize autophagy: extend your fasts occasionally (24-48 hours), exercise in a fasted state, reduce protein intake during eating windows (protein, especially leucine, inhibits autophagy), and consider occasional longer fasts quarterly. Quality sleep also supports autophagic processes.",
      },
    ],
    tips: [
      "Fasts of 24+ hours significantly boost autophagy",
      "Coffee may enhance autophagy without breaking your fast",
      "Exercise amplifies autophagy, especially fasted cardio",
      "High protein intake can inhibit autophagy",
      "Don't obsess - regular shorter fasts still provide benefits",
    ],
  },

  // ADVANCED GUIDES
  {
    id: "metabolic-flexibility",
    title: "Building Metabolic Flexibility",
    subtitle: "Train your body to switch fuel sources efficiently",
    category: "advanced",
    readTime: 7,
    icon: "activity",
    color: "#F59E0B",
    sections: [
      {
        title: "What is Metabolic Flexibility?",
        content:
          "Metabolic flexibility is your body's ability to efficiently switch between burning carbohydrates and fats for fuel. A metabolically flexible person can easily tap into fat stores during fasting while still effectively using carbs when available. This is the hallmark of metabolic health.",
      },
      {
        title: "Why It Matters",
        content:
          "Poor metabolic flexibility is linked to insulin resistance, obesity, diabetes, and chronic disease. When you're metabolically flexible, you have stable energy throughout the day, less hunger and cravings, better workout performance, and easier weight management.",
      },
      {
        title: "Building Flexibility Through Fasting",
        content:
          "Regular fasting trains your body to access fat stores efficiently. Start with daily 16:8 fasting, occasionally extend to 24 hours, and practice fasted exercise. Over time, your body becomes better at producing ketones and using fat for fuel. This adaptation typically takes 2-6 weeks.",
      },
      {
        title: "Signs of Improved Flexibility",
        content:
          "You'll know you're becoming more metabolically flexible when: fasting feels easier, you have stable energy without constant eating, you can skip meals without irritability or brain fog, fasted workouts feel good, and you don't experience energy crashes after meals.",
      },
    ],
    tips: [
      "Consistency is key - fast regularly to build adaptation",
      "Reduce refined carbs to improve fat-burning capacity",
      "Practice fasted morning workouts",
      "Consider occasional low-carb days",
      "Track how you feel during fasts to monitor progress",
    ],
  },
  {
    id: "fasting-and-exercise",
    title: "Fasted Training Strategies",
    subtitle: "Optimize your workouts while fasting",
    category: "advanced",
    readTime: 6,
    icon: "zap",
    color: "#EF4444",
    sections: [
      {
        title: "Benefits of Fasted Training",
        content:
          "Training in a fasted state can enhance fat oxidation, improve insulin sensitivity, boost growth hormone, and increase metabolic adaptations. Many athletes and fitness enthusiasts use fasted training for body composition improvements and metabolic benefits.",
      },
      {
        title: "Types of Fasted Workouts",
        content:
          "Low-intensity cardio (walking, light cycling) is ideal fasted - you can go longer and burn more fat. Moderate lifting can work well but keep sessions shorter. High-intensity training is more challenging fasted and may require adaptation. Start with low intensity and progress gradually.",
      },
      {
        title: "Timing Your Workouts",
        content:
          "For 16:8 fasting: morning fasted workouts before your eating window are popular. Train, then break your fast with a protein-rich meal. Alternatively, train at the end of your eating window when fueled, then fast overnight for recovery. Experiment to find what works for you.",
      },
      {
        title: "Performance Considerations",
        content:
          "Accept that peak performance may temporarily decrease when adapting to fasted training. Stay hydrated with electrolytes. For important workouts or competitions, you may want to be fed. Listen to your body - dizziness or extreme weakness means you should eat.",
      },
    ],
    tips: [
      "Start with low-intensity fasted cardio",
      "Pre-workout coffee can boost performance",
      "Electrolytes are essential for fasted training",
      "Break your fast with protein within 1-2 hours post-workout",
      "Don't attempt PR lifts while deeply fasted",
    ],
  },
];

export const getGuidesByCategory = (category: FastingGuide["category"]) =>
  FASTING_GUIDES.filter((guide) => guide.category === category);

export const getGuideById = (id: string) =>
  FASTING_GUIDES.find((guide) => guide.id === id);
