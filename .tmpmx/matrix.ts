import { createClient } from "@supabase/supabase-js";
import { generateWorkoutContent } from "@/lib/workout/generate.server";
import { complianceIssues, hardIssues } from "@/lib/workout/smarty-compliance";
const U = require("fs").readFileSync(".env","utf8").match(/VITE_SUPABASE_URL="?([^"\n]+)/)[1];
const db = createClient(U, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const lib = [...require("/tmp/wu/e0.json"), ...require("/tmp/wu/e1000.json")].filter((e: any) => e.is_active !== false);
const S: [string,string,string[]][] = [["BW STRENGTH","STRENGTH",["bodyweight"]],["GYM STRENGTH","STRENGTH",["full_gym"]],["BW MUSCLE BUILDING","MUSCLE BUILDING",["bodyweight"]],["GYM MUSCLE BUILDING","MUSCLE BUILDING",["full_gym"]],["BW CARDIO","CARDIO",["bodyweight"]],["BW CHALLENGE","CHALLENGE",["bodyweight"]],["TRX METABOLIC","METABOLIC",["trx","bodyweight"]],["MB METABOLIC","METABOLIC",["other","bodyweight"]],["KB METABOLIC","METABOLIC",["kettlebells"]],["DB METABOLIC","METABOLIC",["dumbbells"]],["GYM METABOLIC","METABOLIC",["full_gym"]],["BW CALORIE","CALORIE BURNING",["bodyweight"]],["RECOVERY","RECOVERY",["bodyweight"]],["MOBILITY","MOBILITY & STABILITY",["bodyweight"]],["PILATES","PILATES",["bodyweight"]]];
let bad=0,errs=0,runs=0;const out:string[]=[];
for (const [label,cat,eq] of S) for (const min of [10,20,30,45,60]) for (const stars of [1,2,3]) { runs++;
  try { const r = await generateWorkoutContent(db as never, { category: cat, format: null, equipmentMode: eq[0]==="bodyweight"?"BODYWEIGHT":"EQUIPMENT", selectedEquipment: eq, customEquipment: eq.includes("other")?["medicine ball"]:[], stars, minutes: min, focus: null, location: eq[0]==="bodyweight"?"anywhere":"gym", deterministic: true } as never, []);
    const iss = complianceIssues({ id:"x", name:"x", category:cat, format:r.format, difficulty_stars:stars, duration_min:min, equipment:eq, main_workout:r.main_workout }, lib);
    if (iss.length) { bad++; out.push(`${label} ${min}' ${stars}*: ${iss.join("; ")}`); } } catch (e) { errs++; out.push(`${label} ${min}' ${stars}* ERROR ${(e as Error).message}`); } }
console.log({ runs, bad, errs }); console.log(out.join("\n"));
