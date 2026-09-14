/**
 * The single background definition of every public page: how it is described to
 * search engines and AI answer engines, which key phrases it owns, how often it
 * changes and how it is summarised in /llms-full.txt.
 *
 * Nothing here is rendered on screen. Page titles/descriptions that a route
 * already defines by hand stay authoritative for that route; this registry is
 * what the sitemaps, the AI-crawler files, the keyword index and the weekly
 * optimizer read.
 */

export type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface PageSeo {
  /** Route path, exactly as it appears in the address bar. */
  path: string;
  /** Search title (<=60 chars where possible). */
  title: string;
  /** Meta description (<=160 chars where possible). */
  description: string;
  /** The one phrase this page should win. */
  keyphrase: string;
  /** Supporting phrases, used for the keyword index and the keywords meta tag. */
  keywords: string[];
  /** Short human name, used for breadcrumbs and AI-crawler listings. */
  name: string;
  /** Plain-text summary for /llms-full.txt. */
  summary: string;
  changefreq: ChangeFreq;
  priority: string;
  /** Schema.org type for the page node. */
  schemaType?: string;
  /** True when the page only exists while payments are on. */
  paidOnly?: boolean;
}

export const PAGE_SEO: PageSeo[] = [
  {
    path: "/",
    name: "Home",
    title: "SmartyGym — YOUR GYM RE-IMAGINED ANYWHERE, ANYTIME.",
    description:
      "An online gym with a personal coach: get personalized workouts built around your goals, your equipment and your schedule, programmed on sports science.",
    keyphrase: "online gym with a personal coach",
    keywords: [
      "personalized workout generator",
      "online gym",
      "personal coach app",
      "workout of the day",
      "smarty coach",
      "training plan generator",
      "home workout plan",
      "gym workout plan",
    ],
    summary:
      "SmartyGym is an online gym with a personal coach. Members answer a short questionnaire and Smarty Coach builds a complete session — warm-up, activation, main work, finisher, cool-down — from a library of 1,300+ demonstrated exercises, adapted to goal, mood, time, location and equipment.",
    changefreq: "weekly",
    priority: "1.0",
    schemaType: "WebPage",
  },
  {
    path: "/how-it-works",
    name: "How it works",
    title: "How SmartyGym works — answer, analyze, train",
    description:
      "Four steps from your goal to a finished session: answer a short questionnaire, Smarty Coach analyses it, your workout is built, you train and log it.",
    keyphrase: "how smartygym works",
    keywords: [
      "pre workout questionnaire",
      "training profile",
      "warm up activation main workout finisher cool down",
      "sets reps tempo rest",
      "guided workout player",
      "session debrief",
    ],
    summary:
      "How it works: you answer (goal, mood, time, location, equipment), Smarty Coach merges the answers with your Training Profile, the session is built with sets, reps, tempo and rest, then you follow the guided player and log the session so the next workout adapts.",
    changefreq: "monthly",
    priority: "0.8",
    schemaType: "WebPage",
  },
  {
    path: "/wod",
    name: "Workout of the Day",
    title: "Workout of the Day — SmartyGym",
    description:
      "Two Workouts of the Day, one bodyweight and one with equipment, built automatically for your profile and sequenced by an 84-day periodization plan.",
    keyphrase: "workout of the day",
    keywords: [
      "wod",
      "daily workout",
      "bodyweight workout of the day",
      "equipment workout of the day",
      "84 day training cycle",
      "recovery day workout",
    ],
    summary:
      "Workout of the Day delivers two ready sessions daily (bodyweight and equipment) for every member, rotated through training categories by an 84-day periodization cycle, with recovery days built in.",
    changefreq: "daily",
    priority: "0.85",
    schemaType: "WebPage",
  },
  {
    path: "/exercise-library",
    name: "Exercise Library",
    title: "Exercise Library — 1,300+ demonstrated exercises",
    description:
      "Browse every exercise Smarty Coach can program: animated demonstrations filtered by muscle group, equipment, movement pattern and difficulty.",
    keyphrase: "exercise library",
    keywords: [
      "exercise database",
      "animated exercise demonstrations",
      "exercises by muscle group",
      "exercises by equipment",
      "movement pattern",
      "how to perform exercise",
    ],
    summary:
      "The Exercise Library holds every movement Smarty Coach may select, each with an animated demonstration, target muscles, equipment, movement pattern and difficulty, filterable and searchable.",
    changefreq: "weekly",
    priority: "0.85",
    schemaType: "CollectionPage",
  },
  {
    path: "/training",
    name: "Training",
    title: "Training guides — strength, conditioning, mobility",
    description:
      "Evidence-based training guides on strength, hypertrophy, conditioning, mobility and recovery, written by sports scientist Haris Falas (CSCS).",
    keyphrase: "training guides",
    keywords: [
      "strength training guide",
      "hypertrophy guide",
      "conditioning guide",
      "mobility guide",
      "periodization",
      "progressive overload",
    ],
    summary:
      "Training guides explain how each training category is programmed, what it is for, and how to progress it, with FAQs and links into the matching workouts and exercises.",
    changefreq: "monthly",
    priority: "0.85",
    schemaType: "CollectionPage",
  },
  {
    path: "/glossary",
    name: "Glossary",
    title: "Training glossary — RPE, tempo, AMRAP, EMOM",
    description:
      "Plain-English definitions of every training term SmartyGym uses: RPE, tempo, AMRAP, EMOM, supersets, training load, deload and more.",
    keyphrase: "training glossary",
    keywords: [
      "rpe meaning",
      "tempo training",
      "amrap",
      "emom",
      "superset",
      "training load",
      "deload",
      "workout terminology",
    ],
    summary:
      "The glossary defines the training vocabulary used across the app — training categories, workout formats, RPE, tempo, load, volume, density and recovery terms — plus the training guides for each topic.",
    changefreq: "monthly",
    priority: "0.75",
    schemaType: "CollectionPage",
  },
  {
    path: "/blog",
    name: "Blog",
    title: "SmartyGym Blog — evidence-based fitness articles",
    description:
      "Fitness articles grounded in sports science: training, programming, recovery and nutrition, written for people who actually train.",
    keyphrase: "fitness blog",
    keywords: [
      "evidence based fitness articles",
      "strength training articles",
      "workout programming articles",
      "recovery articles",
      "sports science blog",
    ],
    summary:
      "The blog publishes evidence-based fitness articles, one new article each week, covering training, programming, recovery, nutrition and habit building.",
    changefreq: "weekly",
    priority: "0.85",
    schemaType: "Blog",
  },
  {
    path: "/tools",
    name: "Tools",
    title: "Free training tools — timer, rounds, 1RM calculator",
    description:
      "Free training tools that work on any phone: an interval workout timer, a rounds tracker and a one-rep-max calculator.",
    keyphrase: "free training tools",
    keywords: [
      "workout timer",
      "interval timer",
      "rounds tracker",
      "1rm calculator",
      "one rep max calculator",
    ],
    summary:
      "Free tools: an interval workout timer, a rounds tracker for circuits and AMRAPs, and a one-rep-max calculator with training-percentage tables.",
    changefreq: "monthly",
    priority: "0.8",
    schemaType: "CollectionPage",
  },
  {
    path: "/tools/workout-timer",
    name: "Workout timer",
    title: "Workout timer — intervals, rounds and rest",
    description:
      "A free interval workout timer for circuits, Tabata, EMOM and AMRAP sessions, with work, rest and round counts you set yourself.",
    keyphrase: "workout timer",
    keywords: ["interval timer", "tabata timer", "emom timer", "hiit timer", "rest timer"],
    summary:
      "The workout timer runs work/rest intervals for circuits, Tabata, EMOM and AMRAP formats with audio cues and a configurable round count.",
    changefreq: "monthly",
    priority: "0.8",
    schemaType: "WebApplication",
  },
  {
    path: "/tools/rounds-tracker",
    name: "Rounds tracker",
    title: "Rounds tracker — count AMRAP and circuit rounds",
    description:
      "A free rounds tracker for AMRAP and circuit training: tap to count rounds and reps and keep your score without losing your place.",
    keyphrase: "rounds tracker",
    keywords: ["amrap counter", "circuit round counter", "rep counter", "workout score tracker"],
    summary:
      "The rounds tracker counts rounds and reps during AMRAP and circuit work, keeping the score visible while you train.",
    changefreq: "monthly",
    priority: "0.8",
    schemaType: "WebApplication",
  },
  {
    path: "/tools/1rm-calculator",
    name: "1RM calculator",
    title: "1RM calculator — one rep max and training loads",
    description:
      "Estimate your one-rep max from any set and get the training percentages for strength, hypertrophy and power work.",
    keyphrase: "1rm calculator",
    keywords: [
      "one rep max calculator",
      "estimate 1rm",
      "training percentages",
      "strength loads",
      "epley formula",
    ],
    summary:
      "The 1RM calculator estimates a one-rep max from reps and load, then prints the percentage table used for strength, hypertrophy and power prescriptions.",
    changefreq: "monthly",
    priority: "0.8",
    schemaType: "WebApplication",
  },
  {
    path: "/pricing",
    name: "Pricing",
    title: "Pricing — SmartyGym membership €9.99/month",
    description:
      "One membership: €9.99 per month for two personalized workouts a day, the full exercise library, every tool, your logbook and all past workouts.",
    keyphrase: "smartygym pricing",
    keywords: [
      "fitness subscription",
      "monthly membership",
      "9.99 per month",
      "cancel anytime",
      "workout app price",
    ],
    summary:
      "Membership is a single monthly plan that unlocks personalized workouts, Workout of the Day, the exercise library, the tools, the logbook and progress tracking. Members can cancel at any time.",
    changefreq: "monthly",
    priority: "0.9",
    schemaType: "WebPage",
    paidOnly: true,
  },
  {
    path: "/faq",
    name: "FAQ",
    title: "SmartyGym FAQ — questions about training and membership",
    description:
      "Answers about how workouts are generated, what equipment you need, how Workout of the Day works, membership and account questions.",
    keyphrase: "smartygym faq",
    keywords: [
      "workout app questions",
      "how workouts are generated",
      "membership questions",
      "cancel membership",
      "equipment needed",
    ],
    summary:
      "The FAQ answers the common questions: how sessions are generated, what happens with limited equipment or injuries, how Workout of the Day is scheduled, and how membership and accounts work.",
    changefreq: "monthly",
    priority: "0.8",
    schemaType: "FAQPage",
  },
  {
    path: "/about",
    name: "About",
    title: "About SmartyGym — your fitness coach",
    description:
      "SmartyGym is not another workout app. Smarty Coach programs strength, hypertrophy, conditioning and mobility on the sports science of Haris Falas (CSCS).",
    keyphrase: "about smartygym",
    keywords: [
      "coaching philosophy",
      "evidence based training",
      "strength and conditioning",
      "periodization",
      "training methodology",
    ],
    summary:
      "About SmartyGym: the coaching philosophy behind Smarty Coach — structured sessions, periodization, progressive overload and exercise selection from a vetted library rather than random workouts.",
    changefreq: "monthly",
    priority: "0.8",
    schemaType: "AboutPage",
  },
  {
    path: "/haris-falas",
    name: "Haris Falas",
    title: "Haris Falas — sports scientist, CSCS strength coach",
    description:
      "Haris Falas, BSc Sport Science and NSCA CSCS, is the sports scientist behind every SmartyGym program: 20+ years coaching strength and conditioning.",
    keyphrase: "haris falas",
    keywords: [
      "sports scientist",
      "cscs strength coach",
      "strength and conditioning specialist",
      "fitness expert",
    ],
    summary:
      "Haris Falas is the sports scientist behind SmartyGym: BSc Sport Science, NSCA CSCS, EXOS Performance and Rehab Specialist, FMS Specialist, ACE Medical Exercise Specialist, with 20+ years of coaching.",
    changefreq: "monthly",
    priority: "0.7",
    schemaType: "ProfilePage",
  },
  {
    path: "/founder-note",
    name: "A note from the founder",
    title: "A note from the founder — why SmartyGym exists",
    description:
      "Why SmartyGym was built: proper coaching, programmed by a sports scientist, available to anyone who trains anywhere.",
    keyphrase: "smartygym founder note",
    keywords: ["founder letter", "why smartygym", "coaching for everyone", "haris falas"],
    summary:
      "The founder's note explains why SmartyGym exists: real coaching quality, programmed by a sports scientist, for people training at home, outdoors or in a gym.",
    changefreq: "monthly",
    priority: "0.6",
    schemaType: "WebPage",
  },
  {
    path: "/community",
    name: "Smarty Community",
    title: "Smarty Community — workouts shared by members",
    description:
      "Workouts members chose to share, exactly as Smarty Coach generated them: open one, train it, rate it and see how others scored it.",
    keyphrase: "shared workouts community",
    keywords: [
      "shared workouts",
      "community workouts",
      "member workouts",
      "workout ratings",
      "train someone elses workout",
    ],
    summary:
      "Smarty Community lists workouts that members shared, with likes, ratings, comments and completion counts. Any shared workout can be opened and trained by another member.",
    changefreq: "daily",
    priority: "0.7",
    schemaType: "CollectionPage",
  },
  {
    path: "/contact",
    name: "Contact",
    title: "Contact SmartyGym — we answer in 24–48 hours",
    description:
      "Questions, feedback, partnerships or support: send a message and the SmartyGym team replies within 24 to 48 hours.",
    keyphrase: "contact smartygym",
    keywords: ["customer support", "feedback", "partnership enquiry", "help"],
    summary: "Contact page for support, feedback and partnership enquiries, answered in 24–48 hours.",
    changefreq: "yearly",
    priority: "0.5",
    schemaType: "ContactPage",
  },
  {
    path: "/privacy",
    name: "Privacy Policy",
    title: "Privacy Policy — SmartyGym",
    description:
      "What SmartyGym collects, why it is needed to build your workouts, how long it is kept, and how to export or delete your data.",
    keyphrase: "smartygym privacy policy",
    keywords: ["data protection", "gdpr", "delete my data", "cookies", "personal data"],
    summary:
      "The Privacy Policy covers the data used to generate workouts, storage and retention, third-party processors, and how members export or delete their account and data.",
    changefreq: "yearly",
    priority: "0.3",
    schemaType: "WebPage",
  },
  {
    path: "/terms",
    name: "Terms of Service",
    title: "Terms of Service — SmartyGym",
    description:
      "The terms for using SmartyGym: your account, acceptable use, membership and billing, cancellation, and the limits of the service.",
    keyphrase: "smartygym terms of service",
    keywords: ["terms and conditions", "membership terms", "acceptable use", "cancellation"],
    summary:
      "The Terms of Service set out account rules, acceptable use, membership and billing terms, cancellation, liability limits and how the terms change.",
    changefreq: "yearly",
    priority: "0.3",
    schemaType: "WebPage",
  },
  {
    path: "/disclaimer",
    name: "Disclaimer",
    title: "Disclaimer — train safely with SmartyGym",
    description:
      "SmartyGym provides fitness information, not medical advice. Read this before training, especially with an injury or medical condition.",
    keyphrase: "fitness disclaimer",
    keywords: ["not medical advice", "train safely", "injury warning", "consult your doctor"],
    summary:
      "The disclaimer states that SmartyGym provides fitness guidance, not medical advice, and that members should get medical clearance where relevant and stop when something hurts.",
    changefreq: "yearly",
    priority: "0.3",
    schemaType: "WebPage",
  },
];

export const PAGE_SEO_BY_PATH: Record<string, PageSeo> = Object.fromEntries(
  PAGE_SEO.map((p) => [p.path, p]),
);

/** Public paths, minus the paid-only pages while Free Access Mode is ON. */
export function publicPages(freeAccessMode: boolean): PageSeo[] {
  return freeAccessMode ? PAGE_SEO.filter((p) => !p.paidOnly) : PAGE_SEO;
}
