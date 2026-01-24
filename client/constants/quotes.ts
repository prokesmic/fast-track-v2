export type QuoteCategory = "general" | "start" | "middle" | "end" | "overtime";

export const MOTIVATION_QUOTES = [
    { text: "The object of fasting is to strip the body of its toxins.", author: "Gandhi", category: "general" },
    { text: "He who eats until he is sick must fast until he is well.", author: "Hebrew Proverb", category: "general" },
    { text: "Fasting is the first principle of medicine.", author: "Rumi", category: "general" },
    { text: "A fast is not a hunger strike. It is a spiritual tool.", author: "Unknown", category: "start" },
    { text: "Discipline is choosing what you want most over what you want now.", author: "Abraham Lincoln", category: "middle" },
    { text: "Your body is a temple, but only if you treat it as one.", author: "Astrid Alauda", category: "general" },
    { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown", category: "start" },
    { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi", category: "end" },
    { text: "Fasting of the body is food for the soul.", author: "John Chrysostom", category: "general" },
    { text: "Hunger is the first element of self-discipline.", author: "Muhammad", category: "middle" },
    { text: "The pain of discipline is far less than the pain of regret.", author: "Sarah Bombell", category: "middle" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "David Goggins", category: "end" },
    { text: "You are stronger than your cravings.", author: "Unknown", category: "middle" },
    { text: "Every hour is a victory.", author: "Unknown", category: "middle" },
    { text: "Almost there. Finish strong!", author: "Unknown", category: "end" },
    { text: "You are rewriting your biology right now.", author: "Unknown", category: "start" },
    { text: "This is where the magic happens.", author: "Unknown", category: "overtime" },
    { text: "Pushing boundaries is how we grow.", author: "Unknown", category: "overtime" },
];

export function getRandomQuote(category?: QuoteCategory) {
    const pool = category ? MOTIVATION_QUOTES.filter(q => q.category === category || q.category === "general") : MOTIVATION_QUOTES;
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
}

export function getQuoteForProgress(progress: number, isOvertime: boolean) {
    if (isOvertime) return getRandomQuote("overtime");
    if (progress < 0.2) return getRandomQuote("start");
    if (progress > 0.8) return getRandomQuote("end");
    return getRandomQuote("middle");
}
