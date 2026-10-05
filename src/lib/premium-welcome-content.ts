export const PREMIUM_WELCOME_INTRO =
  "We are glad to have you with us, and we hope your SMARTYGYM experience is a great one. Here are a few useful ways to get the most from your membership."

export const PREMIUM_WELCOME_SECTIONS = [
  {
    icon: "workouts",
    title: "Smarty Workouts",
    body: "Explore the complete workout collection by goal, level and equipment, then open any session when you are ready to train.",
    href: "https://smartygym.com/smarty-workouts",
    action: "Explore workouts",
    tone: "blue",
  },
  {
    icon: "daily",
    title: "Workout of the Day",
    body: "Open one ready-to-follow workout each day and keep your training varied, balanced and consistent.",
    href: "https://smartygym.com/wod",
    action: "See today's workout",
    tone: "green",
  },
  {
    icon: "create",
    title: "Create Your Own Workout",
    body: "Use Smarty Coach for a workout built around your choices, or Build It Yourself exercise by exercise.",
    href: "https://smartygym.com/create-your-own-workout",
    action: "Create a workout",
    tone: "violet",
  },
  {
    icon: "tools",
    title: "Training Tools",
    body: "Use the workout timer, rounds tracker and 1RM calculator whenever your session needs them.",
    href: "https://smartygym.com/tools",
    action: "Open the tools",
    tone: "orange",
  },
  {
    icon: "blog",
    title: "SMARTYGYM Blog",
    body: "Read practical, evidence-based guidance that helps you understand your training and make better decisions.",
    href: "https://smartygym.com/blog",
    action: "Read the blog",
    tone: "rose",
  },
  {
    icon: "checkins",
    title: "Smarty Check-ins",
    body: "Take a quick check-in to see how you are doing and turn your daily signals into useful guidance.",
    href: "https://smartygym.com/smarty-checkins",
    action: "Start a check-in",
    tone: "cyan",
  },
  {
    icon: "ritual",
    title: "Smarty Ritual",
    body: "Make space for a short daily ritual designed to support recovery, focus and consistency beyond the workout.",
    href: "https://smartygym.com/smarty-ritual",
    action: "Open today's ritual",
    tone: "yellow",
  },
] as const

export const premiumWelcomeTitle = (name?: string | null) =>
  `Welcome onboard${name?.trim() ? `, ${name.trim()}` : ""}!`
