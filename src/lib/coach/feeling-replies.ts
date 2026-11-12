// Deterministic, zero-AI coach replies. Same person + same day + same feeling = same reply;
// a different day rotates to a different line, with context from real snapshot data only.
export type Feeling = "great" | "tired" | "sore" | "short" | "decide";
export type ReplyContext = {
  member: boolean;
  seed: string | null; // account key, so members don't all see the same line
  date: Date;
  readinessScore: number | null;
  lastSessionName: string | null;
  recommendationName: string | null;
  turn?: number; // extra taps on the same feeling show the next line
};

const POOLS: Record<Feeling, string[]> = {
  great: [
    "Love it. Let's put that energy to work — give today a real effort.",
    "That's what I like to hear. Days like this are for quality work, so make every set count.",
    "Good energy is a gift. Warm up properly, then push a little harder than last time.",
    "Perfect. Today is a good day to add one rep or a little more weight.",
    "Great. Stay sharp with your form — strong and controlled beats fast and sloppy.",
    "Excellent. Use the energy, but respect the rests. That's where the next set is won.",
    "Brilliant. Let's turn a good feeling into a good session.",
    "You feel ready, so let's train like it. Focus on every rep, start to finish.",
    "Nice. On days like this, finish the workout knowing you gave it everything you had.",
    "Feeling great is the best time to beat your last result. Go for it.",
    "Let's go. Activation first, then attack the main workout with intent.",
    "Good. Energy high, ego low — keep the technique clean and the effort honest.",
  ],
  tired: [
    "No problem. Showing up still counts. Choose something lighter and keep the effort comfortable.",
    "Tired days are part of training. Go easier today — Recovery or Mobility & Stability is a smart choice.",
    "Listen to your body. A lighter session today keeps you moving without digging a hole.",
    "Do less, but do it well. Shorter, easier and clean is still a win.",
    "Start with the warm-up and see how you feel. If the energy doesn't come, keep it light.",
    "Quality over intensity today. Move well, breathe well, go home feeling better.",
    "Consistency beats intensity. An easy session today protects tomorrow's hard one.",
    "Tired is fine. Drop the weights a little and focus on smooth, controlled reps.",
    "Make today about moving, not about records. Recovery is training too.",
    "Good that you're here. Keep it easy, sleep well tonight, and we go again.",
    "Low energy? Pick a shorter workout and finish it strong rather than a long one half-done.",
    "Gentle effort today. Leave the session with more energy than you came in with.",
  ],
  sore: [
    "Some soreness is normal after hard training. Train a different area or choose Recovery today.",
    "Let the sore muscles rest. Move gently and train something else.",
    "Soreness tells you that you worked. Give those muscles a day before you load them again.",
    "Easy movement helps soreness more than sitting still. Recovery or Mobility & Stability is perfect today.",
    "Train around it: if your legs are sore, work upper body, and the other way round.",
    "Mild soreness is fine to train through lightly. Sharp pain is not — stop and get it checked.",
    "Sleep, water and normal meals do most of the repair. Keep today light.",
    "Warm up well and take it easy. If it eases as you move, a light session is fine.",
    "Don't chase intensity on sore muscles. Smooth, controlled work only today.",
    "A Recovery session today means you come back stronger tomorrow.",
    "Respect the soreness. Lighter loads, full range of motion, no rushing.",
    "Sore is part of the process. Keep moving gently and give it time.",
  ],
  short: [
    "Short on time is not a reason to skip. Pick a shorter workout and give every minute full focus.",
    "Twenty focused minutes beats an hour of distraction. Choose a short one and go.",
    "Keep the warm-up, keep the effort high, and keep it short.",
    "No time to waste — today's Workout of the Day or a short Smarty Workout gets it done.",
    "A short session still counts toward your week. Start now and finish strong.",
    "Less time means more focus. Phone away, follow the rests, get it done.",
    "Even 15 minutes keeps the habit alive. Pick the shortest workout that fits.",
    "Short and sharp today. Never skip the warm-up, just keep everything moving.",
    "Quick session? Good. Choose one workout, start the timer, don't overthink it.",
    "You don't need an hour. You need a plan and the next 20 minutes.",
    "Busy day? Do something short now rather than something perfect never.",
    "Short on time — keep the quality high and the rests honest.",
  ],
  decide: [
    "I've got you. Follow my recommendation in your briefing — it's matched to you.",
    "Don't overthink it. Start with my recommendation and get moving.",
    "The best workout is the one you start. My recommendation is ready below.",
    "Let me decide for you: open the recommended workout and follow it as written.",
    "Decisions waste energy. I've already picked your session — just press start.",
    "Trust the plan. My recommendation fits your goals, your equipment and your recent training.",
    "Easy: take my recommendation. If it doesn't feel right, today's Workout of the Day is the backup.",
    "Leave the thinking to me today. Your job is the work.",
    "No need to choose. Warm up, then follow the recommended workout.",
    "I'd start with my recommendation. Simple, planned, ready.",
  ],
};

const VISITOR_DECIDE = [
  "Start with today's Workout of the Day. It's planned for you, so there's nothing to decide.",
  "Easy — open today's Workout of the Day and follow it. That's your plan.",
  "Don't overthink it. Today's Workout of the Day is ready, start there.",
  "The Workout of the Day is the simplest choice. One workout, planned for today.",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const dayNumber = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

function opener(d: Date): string {
  const h = d.getHours();
  const dow = d.getDay();
  const time = h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.";
  if (dow === 1) return `${time} New week, new start.`;
  if (dow === 5) return `${time} Let's finish the week well.`;
  if (dow === 0 || dow === 6) return `${time} Weekend training — great habit.`;
  return time;
}

export function pickLine(pool: string[], seed: string | null, feeling: string, date: Date, turn = 0): string {
  // Day-by-day walk through the pool: consecutive days never repeat.
  const offset = hash(`${seed ?? "visitor"}:${feeling}`) % pool.length;
  return pool[(dayNumber(date) + offset + turn) % pool.length];
}

export function feelingReply(f: Feeling, ctx: ReplyContext): string {
  const pool = f === "decide" && !ctx.member ? VISITOR_DECIDE : POOLS[f];
  const parts = [opener(ctx.date), pickLine(pool, ctx.seed, f, ctx.date, ctx.turn ?? 0)];
  const score = ctx.member ? ctx.readinessScore : null;
  if (score != null) {
    if (f === "great" && score < 6) parts.push(`Your check-in readiness is ${score}/10, so warm up well and keep an eye on how you feel.`);
    if ((f === "tired" || f === "sore") && score < 6) parts.push(`Your check-in says the same — readiness ${score}/10. Lighter is the right call.`);
    if ((f === "tired" || f === "sore") && score >= 8) parts.push(`Your readiness is ${score}/10, so a light session will feel good.`);
  }
  if (ctx.member && f === "sore" && ctx.lastSessionName) parts.push(`Your last session was ${ctx.lastSessionName} — give those muscles a break today.`);
  if (ctx.member && f === "decide" && ctx.recommendationName) parts.push(`Today that's ${ctx.recommendationName}.`);
  return parts.join(" ");
}
