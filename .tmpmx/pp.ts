import { filterPool } from "@/lib/workout/pool.server";
import { orderedPriority, pickPriorityByPattern } from "@/lib/workout/priority";
const lib = [...require("/tmp/wu/e0.json"), ...require("/tmp/wu/e1000.json")].filter((e: any) => e.is_active !== false && e.gif_path);
for (const [cat, fmt, eq] of [["CHALLENGE","TABATA",["bodyweight"]],["CARDIO","CIRCUIT",["bodyweight"]],["METABOLIC","EMOM",["trx"]]] as any) {
const pool = filterPool(lib, { category: cat, format: fmt, equipmentMode: eq[0]==="bodyweight"?"BODYWEIGHT":"EQUIPMENT", selectedEquipment: eq, customEquipment: [], level: "beginner", focus: null, dislikedIds: [], favoriteIds: [], bannedTerms: [], location: "anywhere", age: null } as never);
console.log(cat, pool.length, "prio:", orderedPriority(pool).map((e) => e.name).join(", "));
console.log("  pick6:", pickPriorityByPattern(pool, 6, { conditioningFirst: true }).map((e) => e.name).join(", "));
console.log("  adv:", pool.filter((e:any)=>e.difficulty==="advanced").map((e:any)=>e.name).slice(0,10).join(", "));
}
