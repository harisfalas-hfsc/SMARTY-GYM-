// Plain workout text (Haris Falas, 14 Oct 2026): every workout line is simple —
// dose, exercise, side, rest, intervals. No tempo, no cues, no case studies.
// One module: the generator, the stored-workout repair and the publish gate
// all use it, so every workout source reads the same way.

const TOKEN_RE = /\{\{exercise:[A-Za-z0-9_-]+:[^}]*\}\}/g;
const LEAD_DOSE_RE = /^(?:\d+\s*sets?\s*[x×]\s*)?\d+(?:\s*[–-]\s*\d+)?\s*(?:reps?|sec|secs|seconds|s|min|mins|minutes?)\b(?:\s+hold)?(?:\s+(?:each|per)\s+(?:side|leg|arm))?/i;
const DOSE_ANYWHERE_RE = /\b\d+(?:\s*[–-]\s*\d+)?\s*(?:reps?|sec|secs|seconds|min|mins|minutes?)\b(?:\s+(?:each|per)\s+(?:side|leg|arm))?/i;
const UNIT = (u: string) => (/^m(in|ins|inute|inutes)?$/i.test(u) && !/^m$/i.test(u) ? "min" : "sec");

/** Keeps only the structural parts of the text written after an exercise. */
function plainTail(post: string, timedDose: boolean): string[] {
  const kept: string[] = [];
  const add = (v: string) => { if (v && !kept.some((k) => k.toLowerCase() === v.toLowerCase())) kept.push(v); };
  const text = post.replace(/^[\s—–:;,.-]+/, "");
  // A dose written after the exercise ("— 30 sec each leg", "(2 minutes per side)") stays first.
  const lead = text.replace(/^\(/, "").match(LEAD_DOSE_RE);
  if (lead) add(lead[0].trim());
  if (/\btabata\b/i.test(text)) add("Tabata");
  const sets = text.match(/\b([2-9]|\d{2})\s*sets?(?:\s+total)?\b/i);
  if (sets && !lead?.[0].includes(sets[0])) add(sets[0]);
  const intervals = text.match(/\b\d{1,2}\s*(?:rounds?|intervals?)(?:\s+of\s+\d+\s*sec(?:onds?)?\s+work\s*\/\s*\d+\s*sec(?:onds?)?\s+rest)?(?:[^.;—]*?\b\d{1,2}\s*total\b)?/i);
  if (intervals) add(intervals[0].trim());
  const side = text.match(/\b(?:(\d+)\s+)?(each|per)\s+(side|leg|arm)\b/i);
  if (side && !kept.some((k) => /\b(each|per)\s+(side|leg|arm)\b/i.test(k))) add(side[1] && !timedDose ? `${side[1]} each ${side[3]!.toLowerCase()}` : `each ${side[3]!.toLowerCase()}`);
  const load = text.match(/\b\d+(?:[.,]\d+)?\s*(?:kg|lb|%\s*(?:1RM|of))\b[^.;,—]{0,20}/i);
  if (load && load[0].length <= 30) add(load[0].trim());
  const rest = text.replace(intervals?.[0] ?? "\u0000", " ").match(/\brest(?:\s+for)?\s+(\d+(?:\s*[–-]\s*\d+)?)\s*(sec|secs|seconds|s|min|mins|minutes?)\b(\s+between\s+(?:sets|rounds|exercises|sides|stations))?/i);
  const restAfter = rest ? null : text.match(/\b(\d+)\s*(sec|secs|seconds|min|mins|minutes?)\s+rest\b/i);
  if (restAfter && restAfter[1] !== "0") add(`rest ${restAfter[1]} ${UNIT(restAfter[2]!)}`);
  if (rest && !/^0$/.test(rest[1]!)) add(`rest ${rest[1]!.replace(/\s+/g, "")} ${UNIT(rest[2]!)}${rest[3] ?? ""}`);
  return kept;
}

/** One exercise line in its plain form ("3 sets × 10 reps {{ex}} — Rest 30 sec"). */
export function plainExerciseLine(text: string): string {
  const toks = [...text.matchAll(TOKEN_RE)];
  if (!toks.length) return text;
  const last = toks[toks.length - 1]!;
  const head = text.slice(0, last.index! + last[0].length).replace(/\s{2,}/g, " ").trim();
  const pre = text.slice(0, toks[0]!.index!);
  const timedDose = /\b\d+\s*(sec|secs|seconds|s|min|mins|minutes?)\b/i.test(pre) && !/\breps?\b/i.test(pre);
  const kept = plainTail(text.slice(last.index! + last[0].length), timedDose);
  if (!kept.length) return head;
  const tail = kept.join(", ");
  return `${head} — ${tail[0]!.toUpperCase()}${tail.slice(1)}`;
}

/** A plain-text prep line without an exercise link (soft tissue, breathing). */
function plainPrepLine(text: string): string {
  const parts = text.split(/\s+—\s+/);
  if (parts.length < 2) return text;
  const rest = parts.slice(1).join(" — ");
  const head = parts[0]!.trim();
  const dose = /\d/.test(head) ? null : DOSE_ANYWHERE_RE.exec(rest)?.[0];
  const side = /\b(each|per)\s+(side|leg|arm)\b/i.exec(rest);
  const bits = [dose, side && !dose?.match(/each|per/i) ? `each ${side[2]!.toLowerCase()}` : null].filter(Boolean);
  return bits.length ? `${head} — ${bits.join(" ")}` : head;
}

const LONG_PARAGRAPH = 120;

/** Short form of a section intro paragraph (keeps every number the timing reads). */
export function plainParagraph(text: string): string {
  const t = text.trim();
  let m = t.match(/^EMOM (\d+) min\. At the start of every minute do the next exercise in the list: (\d+) sec work, then rest until the minute ends\. Go through the list (\d+) times?\.$/i);
  if (m) return `EMOM ${m[1]} min: ${m[2]} sec work, then rest until the next minute. Go through the list ${m[3]} times.`;
  m = t.match(/^AMRAP (\d+) min\. Do as many rounds as you can of the list below[^.]*\.(?:\s*Rest only when you need it\.)?$/i);
  if (m) return `AMRAP ${m[1]} min: as many rounds as you can of the list below.`;
  if (t.length <= LONG_PARAGRAPH) return t;
  m = t.match(/^(Breathe[^:,.;]*?\d+\s*(?:sec|seconds|min|minutes?))\b/i);
  if (m) return `${m[1]}.`;
  // Otherwise keep the structural sentences only (format, rounds, time cap, work/rest), as few as fit.
  const sentences = (t.match(/[^.!?]+[.!?]?/g) ?? [t]).map((s) => s.replace(/,?\s*including (?:transitions|recovery)\b/gi, "").trim());
  const structural = sentences
    .filter((s) => /\b\d+\b/.test(s) && /\b(rounds?|cap|emom|amrap|tabata|intervals?|blocks?|for time|circuit|work|rest)\b/i.test(s))
    .filter((s) => !/\b(tempo|reserve|inhale|exhale|breath|shoulders|approximately|budget|deliberate|intentional|change position|belt|plates|pacing|out of 10|entries|bilateral|side-specific|every repetition|do not|reps available|technically|familiar|comfortable|total:)\b/i.test(s));
  for (let n = Math.min(3, structural.length); n >= 1; n--) {
    const out = structural.slice(0, n).join(" ").trim();
    if (out.length <= LONG_PARAGRAPH || n === 1) { if (out && out.length < t.length) return out; break; }
  }
  // Straight-set intros carry no timing: one plain sentence.
  if (/\b(sets?|straight|each exercise|each movement)\b/i.test(t)) return "Complete all sets of one exercise before moving on.";
  return t;
}

const isHeading = (text: string) => /^[🧽🔥💪⚡🧘]/u.test(text.trim());
const BLOCK_RE = /(<(p|li)\b[^>]*>)([^<]*)(<\/\2>)/g;

/** The whole workout in plain form. Tokens, sections, doses, rest and timing words stay. */
export function plainWorkoutHtml(html: string): string {
  if (!html) return html;
  const soft = html.search(/🧽/);
  const softEnd = soft < 0 ? -1 : (() => { const r = html.slice(soft).search(/🔥|💪|⚡|🧘/); return r < 0 ? html.length : soft + r; })();
  return html.replace(BLOCK_RE, (all, open: string, _tag: string, inner: string, close: string, offset: number) => {
    const text = inner.replace(/&nbsp;/g, " ");
    if (!text.trim() || isHeading(text)) return all;
    if (/\{\{exercise:/.test(text)) return `${open}${plainExerciseLine(text)}${close}`;
    if (soft >= 0 && offset > soft && offset < softEnd) return `${open}${plainPrepLine(text)}${close}`;
    return `${open}${plainParagraph(text)}${close}`;
  });
}

/** Lines that are still too wordy for a SmartyGym workout (publish gate). */
export function wordyLines(html: string): string[] {
  const out: string[] = [];
  for (const m of (html ?? "").matchAll(BLOCK_RE)) {
    const text = (m[3] ?? "").replace(/&nbsp;/g, " ").trim();
    if (!text || isHeading(text)) continue;
    if (/\{\{exercise:/.test(text)) {
      if (text.length - plainExerciseLine(text).length >= 30) out.push(text);
    } else if (text.length > LONG_PARAGRAPH && plainParagraph(text) !== text) out.push(text);
  }
  return out;
}
