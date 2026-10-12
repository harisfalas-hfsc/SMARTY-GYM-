import { it } from "vitest";
import { readFileSync } from "node:fs";
import { complianceIssues, hardIssues } from "@/lib/workout/smarty-compliance";
it("audit", () => {
  const lib = JSON.parse(readFileSync("/tmp/lib.json", "utf8"));
  const all = JSON.parse(readFileSync("/tmp/all.json", "utf8"));
  const prop = new Map(JSON.parse(readFileSync("/tmp/proposed.json", "utf8")).map((p: any) => [p.id, p]));
  let bad = 0, noFocus = 0;
  for (const w of all) {
    const n = { ...w, ...(prop.get(w.id) as any ?? {}) };
    if (!n.focus) noFocus++;
    const h = hardIssues(complianceIssues(n, lib));
    if (h.length) { bad++; console.log("BREAK", n.name, JSON.stringify(h).slice(0, 400)); }
  }
  console.log("TOTAL", all.length, "BAD", bad, "NOFOCUS", noFocus);
});
