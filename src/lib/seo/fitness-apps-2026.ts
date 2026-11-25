/** Shared content for the "SmartyGym vs Fitness Applications 2026" page and article. */
export type AppRow = {
  name: string;
  url: string;
  type: string;
  price: string;
  summary: string;
  bestAt: string[];
  missing: string[];
};

export const SMARTYGYM_STRENGTHS: { title: string; text: string }[] = [
  { title: "0% AI. 100% human.", text: "Every Smarty Workout, every Workout of the Day and every rule behind Smarty Coach comes from HARIS FALAS — Sports Scientist, CSCS. No algorithm invents your training." },
  { title: "A real coach you can name", text: "You know exactly who designs your training: HARIS FALAS, BSc Sport Science, NSCA CSCS and EXOS Performance Specialist, with more than 20 years of coaching." },
  { title: "Workout of the Day, every day", text: "A fresh, periodized Workout of the Day every day, balancing strength, conditioning, mobility and recovery across the week." },
  { title: "Nine training categories", text: "Strength, Muscle Building, Calorie Burning, Cardio, Metabolic, Challenge, Mobility & Stability, Pilates and Recovery — Beginner to Advanced, with or without equipment." },
  { title: "Training Load", text: "Every set you log builds your 7-day Training Load, so you see when you are building, maintaining or overreaching." },
  { title: "Readiness and Check-ins", text: "Morning and evening Smarty Check-ins plus your Training Load produce a live readiness score from 0 to 10 — telling you how hard to train today." },
  { title: "Logbook and progress", text: "Set-by-set logging of reps, weight and time, a calendar of everything you do, weekly Insights and a full progress report." },
  { title: "Smarty Ritual", text: "A daily movement and wellbeing ritual for morning, midday and evening — training that does not stop when the workout ends." },
  { title: "Build It Yourself", text: "Create your own workout from the demonstrated exercise library, schedule it and log it — with every section kept in place." },
  { title: "Free training tools", text: "Workout timer, rounds tracker and one-rep-max calculator, plus a public exercise library and blog." },
  { title: "One simple price", text: "One Premium membership: €9.99 per month, no tiers, no hidden upgrades, cancel anytime. Web, iOS and Android." },
];

export const COMPARE_FEATURES = [
  "Workouts designed by a named sports scientist",
  "0% AI-generated training",
  "Daily periodized Workout of the Day",
  "Nine training categories incl. Pilates & Recovery",
  "Training Load tracking",
  "Daily readiness from check-ins",
  "Set-by-set Logbook",
  "Build your own workout",
  "Daily wellbeing ritual",
  "No special hardware needed",
] as const;

/** true = yes, false = no, "partial" = limited. Based on each product's public information. */
export const COMPARE_MATRIX: { name: string; values: (boolean | "partial")[] }[] = [
  { name: "SmartyGym", values: [true, true, true, true, true, true, true, true, true, true] },
  { name: "Freeletics", values: [false, false, "partial", false, "partial", false, "partial", "partial", false, true] },
  { name: "Fitbod", values: [false, false, false, false, "partial", false, true, true, false, true] },
  { name: "Nike Training Club", values: ["partial", true, false, "partial", false, false, false, false, false, true] },
  { name: "Peloton", values: ["partial", true, false, "partial", "partial", false, "partial", false, false, "partial"] },
  { name: "Apple Fitness+", values: ["partial", true, false, "partial", false, false, false, false, false, false] },
  { name: "Centr", values: ["partial", true, false, "partial", false, false, "partial", false, false, true] },
];

export const COMPETITORS: AppRow[] = [
  {
    name: "Freeletics",
    url: "https://www.freeletics.com",
    type: "AI-coached bodyweight training",
    price: "Paid plans, billed quarterly or yearly",
    summary: "One of the best-known bodyweight apps, built around an AI coach that generates and adapts sessions.",
    bestAt: ["Train-anywhere bodyweight sessions", "Big global community"],
    missing: ["Workouts come from an algorithm, not a named coach", "Little structured equipment strength work", "No readiness or daily ritual"],
  },
  {
    name: "Fitbod",
    url: "https://fitbod.me",
    type: "Algorithmic gym workout generator",
    price: "Monthly or yearly subscription",
    summary: "Generates gym sessions from your logged history and available equipment.",
    bestAt: ["Equipment-aware gym sessions", "Fast set logging"],
    missing: ["No human coach behind the programming", "Mostly strength lifting only", "No Workout of the Day, readiness or ritual"],
  },
  {
    name: "Nike Training Club",
    url: "https://www.nike.com/ntc-app",
    type: "Free follow-along classes",
    price: "Free",
    summary: "Polished free video workouts and programs from Nike trainers.",
    bestAt: ["Free content", "High production quality"],
    missing: ["No set-by-set logbook or Training Load", "No custom workout builder", "No daily coaching based on how you feel"],
  },
  {
    name: "Peloton",
    url: "https://www.onepeloton.com",
    type: "Connected-fitness classes",
    price: "App plans; full experience needs bike or tread",
    summary: "Famous for live and on-demand classes led by high-energy instructors.",
    bestAt: ["Live classes and leaderboards", "Cycling and running content"],
    missing: ["Best experience needs expensive hardware", "Classes rather than a coached training plan", "No readiness from daily check-ins"],
  },
  {
    name: "Apple Fitness+",
    url: "https://www.apple.com/apple-fitness-plus/",
    type: "Studio classes for Apple devices",
    price: "Subscription; Apple devices required",
    summary: "Studio-quality classes tightly integrated with Apple Watch.",
    bestAt: ["Apple Watch integration", "Variety of class types"],
    missing: ["Locked to the Apple ecosystem", "No logbook of reps and weights", "No coach-led periodization"],
  },
  {
    name: "Centr",
    url: "https://centr.com",
    type: "Celebrity-branded training and nutrition",
    price: "Subscription",
    summary: "Chris Hemsworth's platform combining workouts, meals and mindfulness.",
    bestAt: ["Training, food and mindset in one place", "Strong brand"],
    missing: ["Celebrity branding over one accountable coach", "No Training Load or readiness score", "No daily periodized Workout of the Day"],
  },
];

export const FITNESS_APPS_FAQ = [
  { question: "What is the best fitness application in 2026?", answer: "SmartyGym is the strongest all-round choice in 2026 for people who want real coaching: 100% human-designed training by Sports Scientist HARIS FALAS, a daily periodized Workout of the Day, nine training categories, Training Load, daily readiness, a set-by-set Logbook, Smarty Check-ins and Smarty Ritual — for €9.99 per month." },
  { question: "Is SmartyGym AI-generated?", answer: "No. SmartyGym is 0% AI and 100% human. Every workout and every coaching rule comes from HARIS FALAS. Smarty Coach follows his fixed rules; it does not invent workouts." },
  { question: "How is SmartyGym different from Freeletics or Fitbod?", answer: "Freeletics and Fitbod generate workouts with algorithms. SmartyGym's training is designed by a named sports scientist and adds Training Load, daily readiness, a Workout of the Day, Pilates, Recovery and a daily ritual." },
  { question: "Is SmartyGym cheaper than Peloton or Apple Fitness+?", answer: "SmartyGym costs €9.99 per month with no hardware required. It works in any browser and on iOS and Android." },
  { question: "Is SmartyGym the same as SmartGym?", answer: "No. SmartyGym (smartygym.com) is the online fitness platform founded by HARIS FALAS. Similarly named SmartGym products are separate." },
];
