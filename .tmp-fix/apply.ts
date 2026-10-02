import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const upd: any[] = JSON.parse(readFileSync("/tmp/a/upd.json", "utf8"));
let ok = 0;
for (const u of upd) {
  const { error } = await db.from(u.t).update({ main_workout: u.h }).eq("id", u.id);
  if (error) console.log(u.id, error.message); else ok++;
}
console.log("applied", ok, "of", upd.length);
