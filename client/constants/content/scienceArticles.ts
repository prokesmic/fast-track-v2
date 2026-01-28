/**
 * Science Articles Content
 * Evidence-based articles about the science of fasting
 */

export interface ScienceArticle {
  id: string;
  title: string;
  subtitle: string;
  category: "metabolism" | "longevity" | "brain" | "weight" | "health";
  readTime: number;
  icon: string;
  color: string;
  summary: string;
  content: string[];
  references?: string[];
}

export const SCIENCE_ARTICLES: ScienceArticle[] = [
  {
    id: "insulin-and-fasting",
    title: "How Fasting Affects Insulin",
    subtitle: "Understanding the metabolic switch",
    category: "metabolism",
    readTime: 4,
    icon: "activity",
    color: "#10B981",
    summary:
      "Learn how fasting lowers insulin levels and why this matters for fat burning, metabolic health, and disease prevention.",
    content: [
      "Insulin is a hormone produced by your pancreas that regulates blood sugar. When you eat, especially carbohydrates, insulin rises to shuttle glucose into cells for energy. When insulin is elevated, your body is in 'storage mode' and fat burning is inhibited.",
      "During fasting, insulin levels drop significantly. After about 12 hours without food, insulin reaches its lowest point. This low-insulin state signals your body to switch from burning glucose to burning stored fat for fuel - a process called lipolysis.",
      "Chronically elevated insulin (from frequent eating and high-carb diets) is linked to insulin resistance, type 2 diabetes, obesity, and metabolic syndrome. Regular fasting gives your body a break from constant insulin exposure, improving insulin sensitivity over time.",
      "Research shows that intermittent fasting can reduce fasting insulin levels by 20-31% and improve insulin sensitivity. This means your cells respond better to insulin when you do eat, requiring less insulin to do the same job.",
      "The benefits extend beyond weight loss. Lower insulin levels are associated with reduced inflammation, better cardiovascular health, and potentially slower aging. Many researchers believe that managing insulin is key to long-term health.",
    ],
    references: [
      "Harvie et al. (2011) - International Journal of Obesity",
      "Patterson et al. (2015) - Annual Review of Nutrition",
      "Anton et al. (2018) - Obesity Journal",
    ],
  },
  {
    id: "ketosis-explained",
    title: "Ketosis: Your Fat-Burning Mode",
    subtitle: "What happens when you become fat-adapted",
    category: "metabolism",
    readTime: 5,
    icon: "zap",
    color: "#8B5CF6",
    summary:
      "Discover how your body produces ketones during fasting and why this metabolic state offers unique health benefits.",
    content: [
      "Ketosis is a metabolic state where your body primarily burns fat for fuel instead of glucose. When carbohydrate intake is very low or during extended fasting, your liver converts fatty acids into ketone bodies (beta-hydroxybutyrate, acetoacetate, and acetone).",
      "You typically enter ketosis after 12-36 hours of fasting, depending on your activity level, muscle mass, and metabolic flexibility. Signs include reduced hunger, mental clarity, and sometimes a slightly fruity breath from acetone.",
      "Ketones are actually a superior fuel for the brain. Unlike fatty acids, ketones can cross the blood-brain barrier. Many people report enhanced mental clarity and focus during ketosis - a state our ancestors regularly experienced.",
      "Beyond energy production, ketones act as signaling molecules. Beta-hydroxybutyrate (BHB) activates genes related to longevity, reduces oxidative stress, and may have anti-inflammatory effects. This is one reason extended fasting is being studied for various health conditions.",
      "You don't need to stay in ketosis permanently to benefit. Periodic ketosis through fasting or low-carb days can improve your metabolic flexibility, help your body become better at switching between fuel sources, and provide the signaling benefits of ketone bodies.",
    ],
    references: [
      "Cahill (2006) - Annual Review of Nutrition",
      "Newman & Verdin (2017) - Annual Review of Nutrition",
      "Puchalska & Crawford (2017) - Cell Metabolism",
    ],
  },
  {
    id: "autophagy-science",
    title: "The Science of Autophagy",
    subtitle: "Cellular recycling for longevity",
    category: "longevity",
    readTime: 6,
    icon: "refresh-cw",
    color: "#EC4899",
    summary:
      "Explore the Nobel Prize-winning discovery of autophagy and how fasting triggers this powerful cellular renewal process.",
    content: [
      "Autophagy (from Greek 'self-eating') is your body's way of cleaning out damaged cells and regenerating new ones. Japanese scientist Yoshinori Ohsumi won the 2016 Nobel Prize in Medicine for discovering the mechanisms of autophagy, highlighting its importance to human health.",
      "Think of autophagy as cellular housekeeping. Your cells contain organelles, proteins, and other components that can become damaged over time. Autophagy breaks down these damaged parts and recycles them into raw materials for new cellular components.",
      "Autophagy is triggered by nutrient deprivation - when you fast, cells don't receive the constant influx of nutrients and enter a 'clean-up' mode. This process begins within hours of fasting but becomes more significant after 24 hours, with peak activity around 48-72 hours.",
      "The benefits are profound: autophagy removes protein aggregates linked to neurodegenerative diseases (Alzheimer's, Parkinson's), eliminates dysfunctional mitochondria, helps prevent cancer by destroying damaged DNA, and is associated with longevity in numerous animal studies.",
      "While we can't directly measure autophagy in humans easily, research suggests regular fasting promotes autophagic processes. You don't need multi-day fasts - daily time-restricted eating provides some benefits, with occasional longer fasts (24-48 hours) potentially boosting autophagy further.",
    ],
    references: [
      "Ohsumi (2016) - Nobel Prize Lecture",
      "Levine & Kroemer (2019) - Cell",
      "Alirezaei et al. (2010) - Autophagy Journal",
    ],
  },
  {
    id: "fasting-and-brain",
    title: "Fasting and Brain Health",
    subtitle: "How not eating makes you think better",
    category: "brain",
    readTime: 5,
    icon: "cpu",
    color: "#3B82F6",
    summary:
      "Understand why fasting enhances cognitive function, protects neurons, and may help prevent neurodegenerative diseases.",
    content: [
      "Many people report mental clarity and enhanced focus during fasting. This isn't just anecdotal - there are solid biological reasons why fasting benefits the brain. Evolutionarily, it makes sense: when food was scarce, our ancestors needed sharp minds to find their next meal.",
      "During fasting, your brain switches from glucose to ketones for fuel. Ketones are actually a more efficient energy source for neurons, producing more ATP (cellular energy) with less oxidative stress. This cleaner-burning fuel may explain the mental clarity many experience.",
      "Fasting increases production of BDNF (Brain-Derived Neurotrophic Factor), a protein that promotes the growth of new neurons and strengthens existing ones. BDNF is often called 'Miracle-Gro for the brain' - higher levels are associated with better memory, learning, and mood.",
      "Research in animals shows fasting protects against neurodegenerative diseases. Studies suggest intermittent fasting may help prevent Alzheimer's, Parkinson's, and stroke. The mechanisms include reduced inflammation, enhanced autophagy in brain cells, and improved mitochondrial function.",
      "For cognitive benefits, you don't need extreme fasts. Even 16-hour daily fasts have been shown to increase BDNF. The key is consistency over time. Many people find that their best mental work happens during their fasting window, particularly in the morning.",
    ],
    references: [
      "Mattson et al. (2018) - Nature Reviews Neuroscience",
      "Longo & Mattson (2014) - Cell Metabolism",
      "Baik et al. (2020) - Nutrients",
    ],
  },
  {
    id: "fasting-weight-loss",
    title: "Why Fasting Works for Weight Loss",
    subtitle: "The science behind effective fat loss",
    category: "weight",
    readTime: 4,
    icon: "trending-down",
    color: "#F59E0B",
    summary:
      "Learn why intermittent fasting is effective for weight loss and how it differs from traditional calorie restriction.",
    content: [
      "Intermittent fasting works for weight loss through multiple mechanisms. Yes, most people naturally eat fewer calories when restricting their eating window. But the benefits go far beyond simple calorie reduction - hormonal changes make fasting particularly effective.",
      "When you fast, insulin drops and growth hormone increases. This hormonal environment promotes fat burning while preserving muscle mass. Traditional calorie restriction without fasting often leads to muscle loss along with fat loss, slowing metabolism.",
      "Fasting increases your metabolic rate in the short term - up to 14% in some studies. This is contrary to the myth that skipping meals slows metabolism. The increase comes from elevated norepinephrine, which mobilizes fat stores for energy.",
      "Unlike continuous calorie restriction, fasting allows you to eat satisfying meals. This makes it more sustainable long-term. Studies show similar weight loss between fasting and traditional diets, but fasting groups often show better adherence and maintenance.",
      "Fasting also targets visceral fat (dangerous belly fat around organs) more effectively than overall calorie restriction. This type of fat is strongly linked to metabolic disease. Reducing visceral fat improves health markers even without significant weight loss.",
    ],
    references: [
      "Varady et al. (2013) - Nutrition Reviews",
      "Ho et al. (2018) - International Journal of Obesity",
      "Moro et al. (2016) - Journal of Translational Medicine",
    ],
  },
  {
    id: "inflammation-fasting",
    title: "Fasting and Inflammation",
    subtitle: "Reducing chronic inflammation naturally",
    category: "health",
    readTime: 4,
    icon: "shield",
    color: "#EF4444",
    summary:
      "Discover how intermittent fasting reduces inflammatory markers and may help prevent chronic diseases.",
    content: [
      "Chronic low-grade inflammation is at the root of many modern diseases: heart disease, diabetes, cancer, Alzheimer's, and autoimmune conditions. Unlike acute inflammation (which helps heal injuries), chronic inflammation damages tissues over time.",
      "Research shows fasting significantly reduces inflammatory markers. Studies have found decreases in CRP (C-reactive protein), IL-6, TNF-alpha, and other inflammatory cytokines. These reductions occur even with daily 16:8 fasting.",
      "One mechanism is through reducing oxidative stress. Eating constantly generates reactive oxygen species (ROS) that contribute to inflammation. Fasting gives your body a break from this constant oxidative load and allows antioxidant systems to catch up.",
      "Fasting also reduces inflammation by lowering insulin and blood sugar levels. Hyperglycemia (high blood sugar) triggers inflammatory pathways. By improving insulin sensitivity and stabilizing blood sugar, fasting addresses a root cause of inflammation.",
      "The anti-inflammatory effects of fasting may explain many of its health benefits. Reduced inflammation is linked to better cardiovascular health, lower cancer risk, improved autoimmune symptoms, and slower aging. Regular fasting is a powerful tool for managing chronic inflammation.",
    ],
    references: [
      "Faris et al. (2012) - Nutrition Research",
      "Mindikoglu et al. (2020) - Scientific Reports",
      "Wegman et al. (2015) - Rejuvenation Research",
    ],
  },
];

export const getArticlesByCategory = (category: ScienceArticle["category"]) =>
  SCIENCE_ARTICLES.filter((article) => article.category === category);

export const getArticleById = (id: string) =>
  SCIENCE_ARTICLES.find((article) => article.id === id);
