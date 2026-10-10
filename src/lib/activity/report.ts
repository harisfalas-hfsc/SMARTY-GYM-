/** Pure helpers for the admin User Activity report (shared by email, Admin page and PDF). */

export const ACTIVITY_TZ = "Europe/Nicosia";

export type ActivityKind =
  | "joined"
  | "profile"
  | "subscribed"
  | "membership-end"
  | "created"
  | "copied"
  | "completed"
  | "scheduled"
  | "shared"
  | "favorited"
  | "liked"
  | "disliked"
  | "rated"
  | "commented"
  | "checkin"
  | "badge"
  | "feedback"
  | "message";

export interface ActivityEvent {
  userId: string;
  at: string;
  kind: ActivityKind;
  text: string;
}

export interface ActivityUser {
  userId: string;
  name: string;
  email: string;
  joinedAt: string | null;
  access: string;
  membershipEndsAt: string | null;
  events: ActivityEvent[];
}

export interface ActivityReport {
  fromDate: string;
  toDate: string;
  generatedAt: string;
  totals: { users: number; events: number; byKind: Partial<Record<ActivityKind, number>> };
  users: ActivityUser[];
}

export const KIND_LABEL: Record<ActivityKind, string> = {
  joined: "Created account",
  profile: "Training profile",
  subscribed: "Subscribed",
  "membership-end": "Membership ends",
  created: "Created workout",
  copied: "Added shared workout",
  completed: "Completed",
  scheduled: "Scheduled",
  shared: "Shared",
  favorited: "Favorited",
  liked: "Liked",
  disliked: "Disliked",
  rated: "Rated",
  commented: "Commented",
  checkin: "Check-in",
  badge: "Badge earned",
  feedback: "Feedback",
  message: "Message",
};

function tzOffsetMs(date: Date, tz: string): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** UTC instant of local midnight for a YYYY-MM-DD date in tz (DST-safe). */
export function localMidnightUtc(dateISO: string, tz = ACTIVITY_TZ): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let t = guess - tzOffsetMs(new Date(guess), tz);
  t = guess - tzOffsetMs(new Date(t), tz);
  return new Date(t);
}

export function addDaysISO(dateISO: string, n: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function localDate(now: Date, tz = ACTIVITY_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** [from, to) UTC bounds covering local dates fromDate..toDate inclusive. */
export function rangeBounds(fromDate: string, toDate: string, tz = ACTIVITY_TZ) {
  return { from: localMidnightUtc(fromDate, tz).toISOString(), to: localMidnightUtc(addDaysISO(toDate, 1), tz).toISOString() };
}

export function fmtDateTime(iso: string | null, tz = ACTIVITY_TZ): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { timeZone: tz, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function fmtDate(iso: string | null, tz = ACTIVITY_TZ): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: tz, day: "2-digit", month: "short", year: "numeric" });
}

export function buildReport(
  fromDate: string,
  toDate: string,
  people: Omit<ActivityUser, "events">[],
  events: ActivityEvent[],
  now = new Date(),
): ActivityReport {
  const byUser = new Map<string, ActivityEvent[]>();
  const byKind: Partial<Record<ActivityKind, number>> = {};
  for (const e of events) {
    (byUser.get(e.userId) ?? byUser.set(e.userId, []).get(e.userId)!).push(e);
    byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
  }
  const info = new Map(people.map((p) => [p.userId, p]));
  const users: ActivityUser[] = [...byUser.entries()].map(([userId, evs]) => ({
    ...(info.get(userId) ?? { userId, name: "Unknown member", email: "", joinedAt: null, access: "—", membershipEndsAt: null }),
    events: evs.sort((a, b) => a.at.localeCompare(b.at)),
  }));
  users.sort((a, b) => b.events.length - a.events.length || a.name.localeCompare(b.name));
  return { fromDate, toDate, generatedAt: now.toISOString(), totals: { users: users.length, events: events.length, byKind }, users };
}

export function reportCsv(r: ActivityReport): string {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = ["Member,Email,Access,Joined,Membership ends,Date & time (Cyprus),Activity,Details"];
  for (const u of r.users)
    for (const e of u.events)
      rows.push([u.name, u.email, u.access, fmtDate(u.joinedAt), fmtDate(u.membershipEndsAt), fmtDateTime(e.at), KIND_LABEL[e.kind], e.text].map(q).join(","));
  return rows.join("\n");
}

/** Fake sample used for preview emails only. */
export function sampleReport(): ActivityReport {
  const names = ["Haris Falas", "Christos Georgiou", "Maria Ioannou", "Andreas Nicolaou", "Elena Charalambous", "Nikos Petrou", "Sofia Constantinou", "Giorgos Demetriou", "Anna Kyriakou", "Petros Michael"];
  const plan: [ActivityKind, string][] = [
    ["joined", "Created an account"],
    ["profile", "Completed the training profile"],
    ["subscribed", "Subscribed to Premium (€9.99/month)"],
    ["created", "Created workout “Solid Lift Session” (Strength)"],
    ["scheduled", "Scheduled “Metabolic Advanced Session” for 18:00"],
    ["completed", "Completed “Solid Pace Session” (Cardio)"],
    ["favorited", "Favorited “Metabolic Advanced Session”"],
    ["liked", "Liked shared workout “Core Burner”"],
    ["shared", "Shared “Full Body Flow” with the community"],
    ["checkin", "Completed the Morning Smarty Check-in"],
    ["badge", "Earned badge “5 Workouts”"],
  ];
  const base = Date.UTC(2026, 9, 9, 5, 0);
  const people: Omit<ActivityUser, "events">[] = [];
  const events: ActivityEvent[] = [];
  names.forEach((name, i) => {
    const userId = `sample-${i}`;
    people.push({
      userId,
      name,
      email: `${name.split(" ")[0].toLowerCase()}@example.com`,
      joinedAt: new Date(base - (i + 3) * 86_400_000 * 7).toISOString(),
      access: i % 3 === 2 ? "Free member" : "Premium",
      membershipEndsAt: i % 3 === 2 ? null : new Date(base + (i + 5) * 86_400_000).toISOString(),
    });
    const count = 5 + (i % 3);
    for (let k = 0; k < count; k++) {
      const [kind, text] = plan[(i + k * 2) % plan.length];
      events.push({ userId, kind, text, at: new Date(base + (k * 97 + i * 13) * 60_000).toISOString() });
    }
  });
  return buildReport("2026-10-09", "2026-10-09", people, events);
}
