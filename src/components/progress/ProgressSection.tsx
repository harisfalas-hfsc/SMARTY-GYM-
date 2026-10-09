import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loadRemote } from "@/lib/remote-data";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Flame,
  Trophy,
  Timer,
  Activity,
  Crown,
  Sparkles,
  Medal,
  Lock,
  ChevronRight,
  Download,
} from "lucide-react";
import { TrainingLoadPanel } from "@/components/performance/TrainingLoadPanel";
import { RecentLoadTrend } from "@/components/performance/RecentLoadTrend";
import { CheckinsPanel } from "@/components/checkins/CheckinsPanel";
import { InsightsSection } from "@/components/progress/InsightsSection";

import { getProgressExport, getProgressOverview, type ProgressOverview } from "@/lib/progress.functions";
import { exportProgressPdf } from "@/lib/progress-export";
import { CATEGORY_LABEL, CATEGORY_UNIT } from "@/lib/progress-config";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-format";
import { SCORE_RULES } from "@/lib/progress-config";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Award tiers by level within each category: Bronze -> Legend. */
const AWARD_TIERS = [
  { name: "Bronze", ring: "#cd7f32", bg: "linear-gradient(135deg,#f3c49b,#b8732e)", text: "#3b1f07" },
  { name: "Silver", ring: "#a8b2bd", bg: "linear-gradient(135deg,#f1f4f7,#9aa5b1)", text: "#1f2933" },
  { name: "Gold", ring: "#e6b422", bg: "linear-gradient(135deg,#ffe98a,#d69e0b)", text: "#3d2a00" },
  { name: "Platinum", ring: "#5fd3c6", bg: "linear-gradient(135deg,#d9fbf6,#3bb3a6)", text: "#063b36" },
  { name: "Diamond", ring: "#4aa8ff", bg: "linear-gradient(135deg,#cfe8ff,#2f7de1)", text: "#04213f" },
  { name: "Master", ring: "#a26bff", bg: "linear-gradient(135deg,#e6d6ff,#7b3fe4)", text: "#1f0a45" },
  { name: "Elite", ring: "#ff5c8a", bg: "linear-gradient(135deg,#ffd3df,#e0336a)", text: "#43061a" },
  { name: "Legend", ring: "#ff7a1a", bg: "linear-gradient(135deg,#ffe07a,#ff4d1a)", text: "#3f0f00" },
];

const ICONS: Record<string, typeof Trophy> = {
  trophy: Trophy,
  flame: Flame,
  crown: Crown,
  sparkles: Sparkles,
  medal: Medal,
};

function num(n: number) {
  return n.toLocaleString();
}

function Stat({
  icon: Icon,
  label,
  value,
  to,
  onClick,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
  to?: { filter: "all" | "completed" | "planned" | "favorites" | "scheduled" };
  onClick?: () => void;
}) {
  const body = (
    <>
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </>
  );
  if (onClick)
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        className="h-auto min-h-32 w-full items-start justify-start whitespace-normal rounded-2xl border-2 border-blue-400 bg-card p-4 text-left text-foreground"
      >
        <span>{body}</span>
      </Button>
    );
  if (!to) return <div className="rounded-2xl border-2 border-blue-400 bg-card p-4">{body}</div>;
  return (
    <Link
      to="/logbook"
      search={{ filter: to.filter, view: "list" as const }}
      className="block rounded-2xl border-2 border-blue-400 bg-card p-4 transition hover:border-primary/60"
    >
      {body}
      <span className="mt-2 block text-[11px] font-semibold text-primary">See these workouts →</span>
    </Link>
  );
}

function BadgeUnlockedToast({ names, onClose }: { names: string[]; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-sm animate-in fade-in slide-in-from-bottom-4 rounded-2xl border-2 border-blue-400 bg-card p-4 shadow-lg sm:bottom-6">
      <p className="text-xs font-bold uppercase tracking-wider text-primary">Badge unlocked</p>
      <p className="mt-1 font-extrabold">{names.join(" • ")}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Your Smarty Progress Score has increased.
      </p>
      <button type="button" onClick={onClose} className="mt-3 text-xs font-semibold text-primary">
        Nice!
      </button>
    </div>
  );
}

/**
 * The whole progress picture. It lives inside the logbook so history, calendar
 * and progress are one place, never three.
 */
export function ProgressSection() {
  const { user } = useAuth();
  const fetchOverview = useServerFn(getProgressOverview);
  const fetchExport = useServerFn(getProgressExport);
  const [data, setData] = useState<ProgressOverview | null>(null);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const { freeAccessMode } = useFreeAccessMode();
  const [detail, setDetail] = useState<"score" | "rank" | "current" | "longest" | "days" | "membership" | "awards" | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [exportFrom, setExportFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [exportTo, setExportTo] = useState(today);
  const [exporting, setExporting] = useState(false);

  const downloadProgress = async () => {
    setExporting(true);
    try {
      const report = await fetchExport({ data: { from: exportFrom, to: exportTo } });
      await exportProgressPdf(report);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    void loadRemote("progress:overview", () => fetchOverview({ data: {} } as never), user.id)
      .then((r) => {
        if (!active) return;
        setData(r);
        if (r.newlyEarned.length) setUnlocked(r.newlyEarned.map((b) => b.name));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [fetchOverview, user?.id]);

  const byCategory = useMemo(() => {
    if (!data) return [];
    const earned = new Set(data.badges.map((b) => b.badge_id));
    const value = (c: string) =>
      c === "checkins"
        ? (data.stats.checkin_longest_streak ?? 0)
        : c === "subscription"
        ? data.stats.subscription_months
        : c === "generated"
          ? data.stats.workouts_generated
          : c === "completed"
            ? data.stats.workouts_completed
            : data.stats.longest_streak;
    const cats = freeAccessMode
      ? ["completed", "streak", "generated", "checkins"]
      : ["completed", "streak", "generated", "checkins", "subscription"];
    return cats.map((c) => {
      const defs = data.definitions
        .filter((d) => d.category === c)
        .sort((a, b) => a.threshold - b.threshold);
      const next = defs.find((d) => !earned.has(d.id));
      return { category: c, defs, next, value: value(c), earned };
    });
  }, [data, freeAccessMode]);

  if (!data)
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const s = data.stats;
  const scoreParts = [
    { label: "Completed workouts", value: s.workouts_completed, points: s.workouts_completed * SCORE_RULES.perCompletedWorkout },
    { label: "Generated workouts", value: s.workouts_generated, points: s.workouts_generated * SCORE_RULES.perGeneratedWorkout },
    { label: "Active training days", value: s.active_days, points: s.active_days * SCORE_RULES.perStreakDay },
    ...(freeAccessMode
      ? []
      : [{ label: "Membership months", value: s.subscription_months, points: s.subscription_months * SCORE_RULES.perSubscriptionMonth }]),
    { label: "Award points", value: data.badges.length, points: s.badge_points },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border-2 border-blue-400 bg-card p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Progress report</p>
            <h2 className="mt-1 text-lg font-extrabold">Export your complete progress</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose the period for one PDF covering workouts, performance, progress, awards and check-ins.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[390px]">
            <label className="text-xs font-semibold text-muted-foreground">From
              <input type="date" value={exportFrom} max={exportTo} onChange={(event) => setExportFrom(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" />
            </label>
            <label className="text-xs font-semibold text-muted-foreground">To
              <input type="date" value={exportTo} min={exportFrom} max={today} onChange={(event) => setExportTo(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" />
            </label>
            <Button className="col-span-2" disabled={exporting || !exportFrom || !exportTo || exportFrom > exportTo} onClick={() => void downloadProgress()}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? "Preparing PDF" : "Download progress PDF"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-blue-400 bg-card p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Smarty Progress</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button type="button" onClick={() => setDetail("score")} className="text-left">
            <p className="text-3xl font-black leading-none">{num(s.score)}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-primary">Score · View details</p>
          </button>
          <button type="button" onClick={() => setDetail("rank")} className="text-left">
            <p className="text-3xl font-black leading-none">#{data.rank}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-primary">
              Rank of {num(data.totalRanked)} · Details
            </p>
          </button>
          <button type="button" onClick={() => setDetail("current")} className="text-left">
            <p className="text-3xl font-black leading-none">{s.current_streak}d</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-primary">
              Current streak · Details
            </p>
          </button>
          <button type="button" onClick={() => setDetail("longest")} className="text-left">
            <p className="text-3xl font-black leading-none">{s.longest_streak}d</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-primary">
              Longest streak · Details
            </p>
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-extrabold">Workouts</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={Activity}
            label="Completed"
            value={num(s.workouts_completed)}
            to={{ filter: "completed" }}
          />
          <Stat
            icon={Sparkles}
            label="Generated"
            value={num(s.workouts_generated)}
            to={{ filter: "all" }}
          />
          <Stat
            icon={Activity}
            label="Not completed"
            value={num(Math.max(0, s.workouts_generated - s.workouts_completed))}
            to={{ filter: "planned" }}
          />
          <Stat icon={Timer} label="Training days" value={num(s.active_days)} onClick={() => setDetail("days")} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-extrabold">Training load</h2>
        <TrainingLoadPanel />
        <div className="mt-3">
          <RecentLoadTrend />
        </div>
        <Link
          to="/training-load-science"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700 hover:underline dark:text-green-500 dark:hover:text-green-400"
        >
          Discover the training load science
          <ChevronRight className="h-4 w-4" />
        </Link>
      </section>


      <section>
        <h2 className="text-lg font-extrabold">Check-ins</h2>
        <div className="mt-3">
          <CheckinsPanel />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-extrabold">Awards</h2>
        <div className="mt-3 space-y-4">
          {byCategory.map(({ category, defs, next, value, earned }) => {
            const unit = CATEGORY_UNIT[category] ?? "";
            const pct = next ? Math.min(100, Math.round((value / next.threshold) * 100)) : 100;
            return (
              <div key={category} className="rounded-2xl border-2 border-blue-400 bg-card p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold">{CATEGORY_LABEL[category]}</p>
                  <p className="text-xs text-muted-foreground">
                    {defs.filter((d) => earned.has(d.id)).length}/{defs.length} earned
                  </p>
                </div>

                {next ? (
                  <div className="mt-3">
                    <p className="text-sm font-semibold">Next: {next.name}</p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {num(value)} / {num(next.threshold)}. {" "}
                      {num(Math.max(0, next.threshold - value))} {unit} to go
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-primary">
                    Maximum current level. Keep improving your score and ranking.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {defs.map((d, i) => {
                    const Icon = ICONS[d.icon] ?? Trophy;
                    const has = earned.has(d.id);
                    const when = data.badges.find((b) => b.badge_id === d.id)?.earned_at;
                    const tier = AWARD_TIERS[Math.min(i, AWARD_TIERS.length - 1)];
                    return (
                      <div
                        key={d.id}
                        title={
                          has && when ? `${tier.name} · ${d.description}. Earned ${formatDate(when)}` : `${tier.name} · ${d.description}`
                        }
                        className={cn(
                          "flex min-w-[92px] flex-1 flex-col items-center gap-1 rounded-xl border-2 p-3 text-center sm:flex-none",
                          !has && "opacity-60 grayscale-[35%]",
                        )}
                        style={{
                          borderColor: tier.ring,
                          background: has ? tier.bg : "transparent",
                          color: has ? tier.text : undefined,
                          boxShadow: has ? `0 4px 14px -4px ${tier.ring}` : undefined,
                        }}
                      >
                        {has ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" style={{ color: tier.ring }} />}
                        <span className="text-[10px] font-extrabold uppercase tracking-wider" style={has ? undefined : { color: tier.ring }}>
                          {tier.name}
                        </span>
                        <span className="text-[11px] font-semibold leading-tight">
                          {num(d.threshold)} {unit}
                        </span>
                        {has && when && <span className="text-[10px]">{formatDate(when)}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Button asChild>
        <Link to="/create-your-own-workout">Train now</Link>
      </Button>

      <InsightsSection />

      {unlocked.length > 0 && <BadgeUnlockedToast names={unlocked} onClose={() => setUnlocked([])} />}

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[82vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl p-5">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle>
              {detail === "score" ? "Progress score" : detail === "rank" ? "Your ranking" : detail === "current" ? "Current streak" : detail === "longest" ? "Longest streak" : detail === "days" ? "Training days" : detail === "membership" ? "Membership" : "Awards earned"}
            </DialogTitle>
            <DialogDescription>
              {detail === "score" ? "A transparent total built from your saved training activity and awards." : detail === "rank" ? "Members are ordered by score, then completed workouts, longest streak, and the time the score was reached." : detail === "current" ? "Consecutive calendar days with a completed workout, ending today or yesterday." : detail === "longest" ? "Your best run of consecutive calendar days with completed workouts." : detail === "days" ? "The number of different calendar days on which you completed at least one workout." : detail === "membership" ? "Whole active membership months recorded on your account." : (freeAccessMode ? "Awards already unlocked from completed workouts, generated workouts and streaks." : "Awards already unlocked from completed workouts, generated workouts, streaks, and membership.")}
            </DialogDescription>
          </DialogHeader>

          {detail === "score" ? (
            <div className="space-y-2">
              {scoreParts.map((part) => (
                <div key={part.label} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm">
                  <span>{part.label} <span className="text-muted-foreground">× {part.value}</span></span>
                  <strong>{num(part.points)} pts</strong>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-black"><span>Total</span><span>{num(s.score)} pts</span></div>
            </div>
          ) : detail === "awards" ? (
            data.badges.length ? (
              <ul className="space-y-2">
                {data.badges.map((badge) => <li key={badge.badge_id} className="rounded-xl border border-border p-3"><p className="font-bold">{badge.badge_name}</p><p className="text-xs text-muted-foreground">{badge.points} points · earned {formatDate(badge.earned_at)}</p></li>)}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No awards earned yet. The Awards section shows the next target in each category.</p>
          ) : (
            <div className="rounded-xl border border-border p-4">
              <p className="text-3xl font-black">{detail === "rank" ? `#${data.rank} of ${num(data.totalRanked)}` : detail === "current" ? `${s.current_streak} days` : detail === "longest" ? `${s.longest_streak} days` : detail === "days" ? `${s.active_days} days` : `${s.subscription_months} months`}</p>
              {(detail === "current" || detail === "longest" || detail === "days") ? <Button asChild variant="outline" className="mt-4 w-full"><Link to="/logbook" search={{ filter: "completed", view: "calendar" as const }}>View completed days</Link></Button> : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
