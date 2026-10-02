import { readFileSync, writeFileSync } from "fs";
import { complianceIssues, hardIssues } from "../src/lib/workout/smarty-compliance";
import { prepAllowed, prepTokens, isBodyweightEquipment } from "../src/lib/workout/prep-vocabulary";
const lib: any[] = JSON.parse(readFileSync("/tmp/a/exfull.json", "utf8"));
const byId = new Map(lib.map((e) => [e.id, e]));
const sw: any[] = JSON.parse(readFileSync("/tmp/a/sw.json", "utf8"));
const uw: any[] = JSON.parse(readFileSync("/tmp/a/uw.json", "utf8"));
const MAP: Record<string, string[]> = {
  "recovery-seated-forward-fold": ["1511", "pilates-spine-stretch-forward", "1576"],
  "recovery-cobra-stretch": ["1366"],
  "recovery-cervical-side-bend": ["1403", "0716"],
  "recovery-shoulder-cars": ["1167", "1428"],
  "recovery-doorway-chest-stretch": ["1271", "1167"],
  "recovery-cross-body-shoulder-stretch": ["0669", "1271"],
  "recovery-scapular-wall-slides": ["3021"],
  "recovery-arm-circles": ["1167", "1428"],
  "recovery-9090-hip-rotation": ["1424", "2567", "0257"],
  "recovery-thoracic-rotation-quadruped": ["2329", "3639"],
  "recovery-supine-spinal-twist": ["3639", "2329"],
  "recovery-thread-the-needle": ["2329", "3639", "1346"],
  "recovery-figure-4-stretch": ["2567", "1424"],
  "recovery-childs-pose": ["1346", "0690"],
  "recovery-butterfly-stretch": ["1494"],
  "recovery-couch-stretch": ["1512", "0613"],
  "recovery-ankle-rocks": ["1368"],
  "pilates-pelvic-curl": ["1422", "3147"],
  "bw-reverse-lunge": ["3470", "1460"],
  "bw-tuck-jump": ["3223", "0514", "3224"],
  "bw-wide-push-up": ["0662", "0493"],
  "bw-lateral-bound": ["3361"],
};
const ACT_FILL = ["1604","cat-cow-stretch","3021","bird-dog","fire-hydrant","clamshell","0276","3147","1368","1428","1685","0257","1422","3013"].filter((i) => byId.has(i));
const CD_FILL = ["1511","1346","1271","0669","2567","1424","1494","1512","3639","1403","1366","2329","1363","0690"].filter((i) => byId.has(i));
const TOK = /\{\{exercise:([A-Za-z0-9_-]+):([^}]*)\}\}/g;
const ids = (h: string) => new Set([...h.matchAll(TOK)].map((m) => m[1]));
const hard = (w: any, html: string) => hardIssues(complianceIssues({ ...w, main_workout: html }, lib)).length;
const prepOk = (e: any, s: "activation" | "cooldown") => e && e.gif_path && prepAllowed(e.name, s) && isBodyweightEquipment(e.equipment);
function swapAt(html: string, idx: number, raw: string, id: string) { const e = byId.get(id)!; return html.slice(0, idx) + `{{exercise:${id}:${e.name}}}` + html.slice(idx + raw.length); }
function fix(w: any, html: string, log: any[], gate: boolean) {
  // 1. Prep sections: bodyweight mobility/stability/stretch only.
  for (let guard = 0; guard < 20; guard++) {
    const bad = prepTokens(html).find((t) => { const e = byId.get(t.id); return e && !(prepAllowed(e.name, t.section) && isBodyweightEquipment(e.equipment)); });
    if (!bad) break;
    const used = ids(html);
    const fill = (bad.section === "activation" ? ACT_FILL : CD_FILL).find((i) => !used.has(i) && prepOk(byId.get(i), bad.section));
    if (!fill) break;
    log.push({ workout: w.name, section: bad.section, from: bad.name, to: byId.get(fill).name, reason: "prep rule" });
    html = swapAt(html, bad.index, bad.raw, fill);
  }
  // 2. Animation swaps (only when the workout stays rule-legal).
  let base = gate ? hard(w, html) : 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of [...html.matchAll(TOK)]) {
      const alts = MAP[m[1]]; if (!alts) continue;
      const used = ids(html);
      const sec = prepTokens(html).find((t) => t.index === m.index!)?.section;
      for (const a of alts) {
        const e = byId.get(a); if (!e?.gif_path || used.has(a)) continue;
        if (sec && !prepOk(e, sec)) continue;
        const next = swapAt(html, m.index!, m[0], a);
        if (gate && hard(w, next) > base) continue;
        log.push({ workout: w.name, section: sec ?? "work", from: m[2], to: e.name, reason: "animation" });
        html = next; changed = true; break;
      }
      if (changed) break;
    }
  }
  return html;
}
const upd: any[] = [];
const log: any[] = []; const sql: string[] = []; const fixed = new Map<string, string>();
let before = 0, after = 0;
for (const w of sw) {
  const h0 = w.main_workout ?? ""; before += hard(w, h0) ? 1 : 0;
  const h = fix(w, h0, log, true); after += hard(w, h) ? 1 : 0;
  fixed.set(w.name, h);
  if (h !== h0) upd.push({ t: "smarty_workouts", id: w.id, h }); if (h !== h0) sql.push(`update public.smarty_workouts set main_workout = $q$${h}$q$, updated_at = now() where id = '${w.id}';`);
}
for (const u of uw) {
  const src = fixed.get(u.name);
  const h0 = u.main_workout ?? "";
  const h = src ?? fix({ name: u.name }, h0, log, false);
  if (h !== h0) upd.push({ t: "workouts", id: u.id, h }); if (h !== h0) sql.push(`update public.workouts set main_workout = $q$${h}$q$, updated_at = now() where id = '${u.id}';`);
}
writeFileSync("/tmp/a/updates.sql", sql.join("\n"));
writeFileSync("/dev-server/audits/smarty-workouts-gif-prep-changes-2026-10-02.json", JSON.stringify(log, null, 1));
const c: Record<string, number> = {}; for (const l of log) c[l.reason] = (c[l.reason] ?? 0) + 1;
console.log({ before, after, updates: sql.length, ...c, workoutsTouched: new Set(log.map((l) => l.workout)).size });
writeFileSync("/tmp/a/upd.json", JSON.stringify(upd));
