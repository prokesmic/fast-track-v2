export interface FastingStage {
  id: string;
  name: string;
  timeRange: string;
  startHours: number;
  endHours: number;
  icon: string;
  color: string;
  description: string;
  benefits: { title: string; description: string }[];
  feelings: { title: string; description: string }[];
}

export const FASTING_STAGES: FastingStage[] = [
  {
    id: "fed",
    name: "Blood Sugar Rise",
    timeRange: "0-2 hours",
    startHours: 0,
    endHours: 2,
    icon: "trending-up",
    color: "#EF4444",
    description:
      "In the initial fasting phase, up to two hours after your last meal, your body actively digests and absorbs nutrients. Blood sugar levels rise as glucose from digested carbohydrates enters the bloodstream. This glucose influx stimulates the pancreas to release insulin, a hormone that facilitates glucose uptake into cells for energy or storage as glycogen in the liver and muscles.",
    benefits: [
      {
        title: "Energy Availability",
        description:
          "The immediate benefit of this phase is the rapid availability of glucose, which provides a quick source of energy for cellular functions and physical activity.",
      },
      {
        title: "Nutrient Utilization",
        description:
          "Efficient digestion and absorption support various bodily functions and builtCellular processes.",
      },
    ],
    feelings: [
      {
        title: "Satiety",
        description:
          "You may feel full and satisfied due to recent food intake.",
      },
      {
        title: "Increased Energy",
        description:
          "There may be a temporary increase in energy and alertness as blood sugar levels peak.",
      },
    ],
  },
  {
    id: "early_fasting",
    name: "Blood Sugar Drop",
    timeRange: "2-5 hours",
    startHours: 2,
    endHours: 5,
    icon: "trending-down",
    color: "#F97316",
    description:
      "Once digestion ends and absorbed glucose is utilized or stored, blood sugar levels begin to decline. Insulin levels also decrease, signaling the body to transition from the fed state to the post-absorptive state. During this period, glycogen stored in the liver begins to break down to release glucose, maintaining blood sugar levels.",
    benefits: [
      {
        title: "Metabolic Shift",
        description:
          "This phase sets the stage for the body to transition from utilizing readily available glucose to tapping into stored glycogen.",
      },
      {
        title: "Hormonal Regulation",
        description:
          "Declining insulin levels in the bloodstream enhance insulin sensitivity, which can improve metabolic health.",
      },
    ],
    feelings: [
      {
        title: "Mild Hunger",
        description:
          "As blood sugar levels drop, you may start to feel the first signs of hunger.",
      },
      {
        title: "Reduced Energy",
        description:
          "The initial surge of energy begins to fade and leads to more stabilized energy levels.",
      },
    ],
  },
  {
    id: "blood_sugar_normal",
    name: "Blood Sugar Normalization",
    timeRange: "5-8 hours",
    startHours: 5,
    endHours: 8,
    icon: "activity",
    color: "#EAB308",
    description:
      "In this phase, blood sugar levels stabilize because glycogenolysis (the breakdown of glycogen) continues to provide a steady supply of glucose. The body maintains normal blood sugar levels through this process, preventing hypoglycemia.",
    benefits: [
      {
        title: "Stable Energy Supply",
        description:
          "The steady release of glucose from glycogen ensures a continuous energy supply, supporting cognitive and physical functions.",
      },
      {
        title: "Hypoglycemia Prevention",
        description:
          "Maintaining normal blood sugar levels prevents symptoms associated with low blood sugar, such as dizziness and weakness.",
      },
    ],
    feelings: [
      {
        title: "Maintained Alertness",
        description:
          "Energy levels remain stable and support mental clarity and focus.",
      },
      {
        title: "Mild to Moderate Hunger",
        description:
          "Hunger may increase as the body further transitions from the fed state.",
      },
    ],
  },
  {
    id: "gluconeogenesis",
    name: "Gluconeogenesis",
    timeRange: "8-12 hours",
    startHours: 8,
    endHours: 12,
    icon: "zap",
    color: "#84CC16",
    description:
      "Once glycogen stores are depleted, the body initiates gluconeogenesis, a metabolic pathway that creates glucose from non-carbohydrate sources such as lactate, glycerol, and amino acids. This process primarily occurs in the liver and to a lesser extent in the kidneys.",
    benefits: [
      {
        title: "Glucose Production",
        description:
          "Gluconeogenesis ensures a continuous supply of glucose for vital organs, especially the brain, which is highly dependent on glucose.",
      },
      {
        title: "Metabolic Flexibility",
        description:
          "The ability to produce glucose from various substrates emphasizes the body's adaptability in managing energy needs.",
      },
    ],
    feelings: [
      {
        title: "Increased Hunger",
        description:
          "The body signals a need for energy, which may lead to stronger feelings of hunger.",
      },
      {
        title: "Mild Fatigue",
        description:
          "As the body changes its energy production mechanisms, you may experience mild fatigue.",
      },
    ],
  },
  {
    id: "fat_burning",
    name: "Fat Burning",
    timeRange: "12-18 hours",
    startHours: 12,
    endHours: 18,
    icon: "flame",
    color: "#F59E0B",
    description:
      "Upon entering the fasted state, the body begins to shift its primary energy source from glucose to fat. This transition involves lipolysis, the breakdown of triglycerides in adipose tissue into free fatty acids and glycerol, which are then used for energy.",
    benefits: [
      {
        title: "Fat Loss",
        description:
          "Mobilization of stored fat for energy contributes to fat loss, making this phase advantageous for weight management.",
      },
      {
        title: "Enhanced Insulin Sensitivity",
        description:
          "Reduced insulin levels in the bloodstream enhance insulin sensitivity, which can improve metabolic health.",
      },
    ],
    feelings: [
      {
        title: "Increased Ketone Production",
        description:
          "As fatty acids are metabolized, the liver begins to produce ketones, an alternative energy source for the brain and muscles.",
      },
      {
        title: "Mild Ketosis",
        description:
          "You may experience symptoms such as a metallic taste in the mouth, mild headache, or increased urination as ketone levels rise.",
      },
    ],
  },
  {
    id: "ketosis",
    name: "Ketosis",
    timeRange: "18-24 hours",
    startHours: 18,
    endHours: 24,
    icon: "flame",
    color: "#EF4444",
    description:
      "Ketosis becomes more pronounced as the liver increases ketone production. These ketones serve as a significant energy source for the brain and other tissues, reducing the need for glucose and sparing muscle protein.",
    benefits: [
      {
        title: "Improved Cognitive Function",
        description:
          "Ketones provide a stable and effective energy source for the brain, potentially improving cognitive function and mental clarity.",
      },
      {
        title: "Fat Adaptation",
        description:
          "Increased dependence of the body on fat for energy supports continued fat loss and metabolic health.",
      },
    ],
    feelings: [
      {
        title: "Mental Clarity",
        description:
          "Many people report improved focus and mental clarity during ketosis.",
      },
      {
        title: "Reduced Hunger",
        description:
          "The presence of ketones may suppress appetite, making it easier to continue fasting.",
      },
    ],
  },
  {
    id: "autophagy",
    name: "Autophagy",
    timeRange: "24-48 hours",
    startHours: 24,
    endHours: 48,
    icon: "refresh-cw",
    color: "#8B5CF6",
    description:
      "Autophagy, a cellular maintenance process, intensifies during prolonged fasting. This mechanism involves the breakdown and recycling of damaged or dysfunctional cellular components, thereby supporting cellular health and function.",
    benefits: [
      {
        title: "Cell Repair",
        description:
          "Autophagy helps remove damaged cells and proteins, potentially reducing the risk of various diseases and supporting longevity.",
      },
      {
        title: "Enhanced Immunity",
        description:
          "By clearing out old and dysfunctional cells, autophagy supports the efficiency of the immune system.",
      },
    ],
    feelings: [
      {
        title: "Detox Feeling",
        description:
          "You may experience mild detox symptoms such as headaches or fatigue as the body eliminates waste products.",
      },
      {
        title: "Reduced Inflammation",
        description:
          "Autophagy may lead to reduced inflammation, potentially alleviating symptoms of chronic inflammatory conditions.",
      },
    ],
  },
  {
    id: "growth_hormone",
    name: "Growth Hormone Surge",
    timeRange: "48-54 hours",
    startHours: 48,
    endHours: 54,
    icon: "arrow-up-circle",
    color: "#06B6D4",
    description:
      "During this fasting period, growth hormone levels significantly increase. Growth hormone plays a key role in growth, metabolism, and maintaining muscle mass.",
    benefits: [
      {
        title: "Muscle Preservation",
        description:
          "Elevated growth hormone levels help maintain muscle mass during prolonged fasting.",
      },
      {
        title: "Fat Metabolism",
        description:
          "Growth hormone enhances lipolysis, further supporting fat loss and energy production from fat stores.",
      },
    ],
    feelings: [
      {
        title: "Increased Energy",
        description:
          "The metabolic benefits of higher growth hormone levels may lead to increased energy and vitality.",
      },
      {
        title: "Muscle Preservation",
        description:
          "Despite ongoing fasting, muscle mass is preserved, reducing the risk of muscle atrophy.",
      },
    ],
  },
  {
    id: "insulin_sensitivity",
    name: "Insulin Sensitivity",
    timeRange: "54-72 hours",
    startHours: 54,
    endHours: 72,
    icon: "target",
    color: "#10B981",
    description:
      "As fasting continues, insulin sensitivity significantly improves. Lower insulin levels in the bloodstream reduce the risk of insulin resistance, a precursor to type 2 diabetes.",
    benefits: [
      {
        title: "Improved Glucose Metabolism",
        description:
          "Enhanced insulin sensitivity facilitates efficient glucose uptake and utilization, improving overall metabolic health.",
      },
      {
        title: "Reduced Diabetes Risk",
        description:
          "Reducing insulin resistance lowers the risk of type 2 diabetes and related complications.",
      },
    ],
    feelings: [
      {
        title: "Stable Blood Sugar",
        description:
          "Improved insulin sensitivity contributes to stable blood sugar levels, reducing the risk of hypoglycemia.",
      },
      {
        title: "Increased Satiety",
        description:
          "Better regulation of blood sugar levels may lead to improved satiety and reduced hunger.",
      },
    ],
  },
  {
    id: "immune_regeneration",
    name: "Immune Regeneration",
    timeRange: "72+ hours",
    startHours: 72,
    endHours: 168,
    icon: "shield",
    color: "#2DD4BF",
    description:
      "Prolonged fasting triggers immune cell regeneration. Research shows that prolonged fasting can stimulate the production of new white blood cells, enhancing immune function and resilience.",
    benefits: [
      {
        title: "Immune System Rejuvenation",
        description:
          "Regeneration of immune cells strengthens the immune system, potentially improving the body's ability to fight infections and diseases.",
      },
      {
        title: "Longevity",
        description:
          "Enhanced immune function and cellular repair mechanisms support overall health and longevity.",
      },
    ],
    feelings: [
      {
        title: "Improved Health",
        description:
          "Many people report a sense of rejuvenation and improved overall health after prolonged fasting.",
      },
      {
        title: "Reduced Inflammation",
        description:
          "Continued reduction in inflammation may alleviate symptoms of chronic inflammatory conditions and support overall health.",
      },
    ],
  },
];

export function getCurrentStage(hoursElapsed: number): FastingStage {
  for (let i = FASTING_STAGES.length - 1; i >= 0; i--) {
    if (hoursElapsed >= FASTING_STAGES[i].startHours) {
      return FASTING_STAGES[i];
    }
  }
  return FASTING_STAGES[0];
}

export function getStageProgress(hoursElapsed: number): number {
  const stage = getCurrentStage(hoursElapsed);
  const stageRange = stage.endHours - stage.startHours;
  const elapsed = hoursElapsed - stage.startHours;
  return Math.min(elapsed / stageRange, 1);
}
