import { createClient } from "@supabase/supabase-js";
import { generateWorkoutContent } from "@/lib/workout/generate.server";
import { complianceIssues } from "@/lib/workout/smarty-compliance";
import { parseWorkoutSteps } from "@/lib/workout/parse-steps";
import { activationDoseViolation } from "@/lib/workout/prep-vocabulary";
import { equipmentFamilyOf } from "@/lib/workout/doctrine";
const U = require("fs").readFileSync(".env","utf8").match(/VITE_SUPABASE_URL="?([^"\n]+)/)[1];
const db = createClient(U, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const lib = [...require("/tmp/wu/e0.json"), ...require("/tmp/wu/e1000.json")].filter((e: any) => e.is_active !== false);
const map = new Map(lib.map((e: any) => [e.id, e]));
const S: [string, string, string[], string][] = [
  ["BW STRENGTH","STRENGTH",["bodyweight"],"anywhere"],["BW MUSCLE BUILDING","MUSCLE BUILDING",["bodyweight"],"anywhere"],
  ["BW METABOLIC","METABOLIC",["bodyweight"],"anywhere"],["BW CARDIO","CARDIO",["bodyweight"],"anywhere"],["BW CHALLENGE","CHALLENGE",["bodyweight"],"anywhere"],
  ["DB METABOLIC","METABOLIC",["dumbbells"],"home"],["KB METABOLIC","METABOLIC",["kettlebells"],"home"],["TRX METABOLIC","METABOLIC",["trx"],"home"],["MB METABOLIC","METABOLIC",["medicine_ball"],"home"],
  ["GYM STRENGTH","STRENGTH",["dumbbells","barbell","machines","cables","bench","rack","kettlebells"],"gym"],["GYM MUSCLE BUILDING","MUSCLE BUILDING",["dumbbells","barbell","machines","cables","bench","rack"],"gym"],
  ["GYM METABOLIC (full gym)","METABOLIC",["dumbbells","barbell","machines","cables","bench","rack","kettlebells"],"gym"],
  ["MOBILITY","MOBILITY & STABILITY",["bodyweight"],"anywhere"],["PILATES","PILATES",["bodyweight"],"anywhere"],["RECOVERY","RECOVERY",["bodyweight"],"anywhere"],
];
const tally: Record<string, number> = {}; let runs = 0, bad = 0, errs = 0; const ex: string[] = [];
for (const [label, cat, eq, loc] of S) for (const minutes of [10,20,30,45,60]) for (const stars of [1,2,3]) {
  runs++;
  try {
    const bw = eq.every((e) => e === "bodyweight");
    const r = await generateWorkoutContent(db as never, { category: cat as never, format: null, equipmentMode: bw ? "BODYWEIGHT" : "EQUIPMENT", selectedEquipment: eq, stars, minutes, focus: null, location: loc, deterministic: true } as never, []);
    const w = { id: "x", name: r.name, category: cat, format: r.format, difficulty_stars: stars, duration_min: minutes, equipment: eq, main_workout: r.main_workout };
    const issues = complianceIssues(w, lib, map).filter((i) => !/Too few priority/.test(i) || true);
    const steps = parseWorkoutSteps(r.main_workout);
    for (const s of steps.filter((s) => s.section === "Activation")) { const v = activationDoseViolation(s.name, s.prescription); if (v) issues.push("ACT DOSE"); }
    if (cat.startsWith("GYM") || label.includes("full gym")) {
      const fams = steps.filter((s) => s.section === "Main Workout").map((s) => equipmentFamilyOf((map.get(s.exerciseId) as any)?.equipment));
      if (r.format !== "REPS & SETS" && fams.some((f) => f === "machine" || f === "cable")) issues.push("MACHINE IN DYNAMIC");
    }
    if (["STRENGTH","MUSCLE BUILDING","MOBILITY & STABILITY","PILATES"].includes(cat) && r.format !== "REPS & SETS") issues.push("WRONG FORMAT " + r.format);
    if (issues.length) { bad++; for (const i of issues) tally[i] = (tally[i] ?? 0) + 1; if (ex.length < 12) ex.push(`${label} ${minutes}' ${stars}*: ${issues.join("; ")}`); }
    if (minutes === 30 && stars === 2) console.log(`${label} 30' int [${r.format}]: ` + steps.filter((s) => s.section !== "Cool-down").map((s) => `${s.section[0]}:${s.prescription.slice(0,14)} ${map.get(s.exerciseId)?.name ?? s.name}`).join(" | ").slice(0, 600));
  } catch (e) { errs++; ex.push(`${label} ${minutes}' ${stars}*: ERROR ${(e as Error).message.slice(0,100)}`); }
}
console.log({ runs, bad, errs, tally }); console.log(ex.join("\n"));
