import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { loadRemoteCached } from "@/lib/remote-data";
import { useEffect, useState } from "react";
import { Loader2, Trophy, Users, Star, MessageSquare, Dumbbell, Flame } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { SwipeToExplore } from "@/components/ui/SwipeToExplore";
import { MemberAvatar } from "@/components/community/MemberCard";
import { normalizeStars } from "@/lib/workout/spec";
import {
  CommunityGateDialog,
  useCommunityAccess,
} from "@/components/community/useCommunityAccess";
import {
  fetchCommunityCreators,
  fetchCommunityWorkouts,
  fetchLatestComments,
  fetchLeaders,
} from "@/lib/community-queries";
import type {
  CommunityComment,
  CommunityMember,
  CommunityWorkoutCard as CardData,
} from "@/lib/community";
import pageHeroImage from "@/assets/community-card.jpg";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      {
        name: "keywords",
        content:
          withExtendedKeywords("/community", "shared workouts community, shared workouts, community workouts, member workouts, workout ratings, train someone elses workout"),
      },
      { title: "Smarty Community — Train together | Smarty Gym" },
      {
        name: "description",
        content:
          "Shared workouts from every Smarty member, member rankings, workout rankings and the comments on every shared session.",
      },
      { property: "og:title", content: "Smarty Community — Train together" },
      {
        property: "og:description",
        content: "Shared workouts, member rankings, workout rankings and shared-workout comments.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://smartygym.com/community" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://smartygym.com/community" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": "https://smartygym.com/community#webpage",
              url: "https://smartygym.com/community",
              name: "Smarty Community — Train together",
              inLanguage: "en",
              isPartOf: { "@id": "https://smartygym.com/#website" },
              publisher: { "@id": "https://smartygym.com/#organization" },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartygym.com/" },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Smarty Community",
                  item: "https://smartygym.com/community",
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: CommunityPage,
});

type WorkoutSortKey = "latest" | "oldest";
type MemberSortKey = "score" | "current_streak" | "workouts_completed" | "workouts_shared";
type RankSortKey = "completed" | "liked" | "rated" | "commented";
type TalkSortKey = "newest" | "oldest" | "discussed";

const SLOTS = 10;

const MEMBER_FILTERS: { value: MemberSortKey; label: string; unit: string }[] = [
  { value: "score", label: "Score", unit: "pts" },
  { value: "current_streak", label: "Streak", unit: "days" },
  { value: "workouts_completed", label: "Completed", unit: "done" },
  { value: "workouts_shared", label: "Shared", unit: "shared" },
];

const WORKOUT_FILTERS: { value: WorkoutSortKey; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
];

const RANK_FILTERS: { value: RankSortKey; label: string; unit: string }[] = [
  { value: "completed", label: "Most completed", unit: "done" },
  { value: "liked", label: "Most liked", unit: "likes" },
  { value: "rated", label: "Top rated", unit: "avg" },
  { value: "commented", label: "Most commented", unit: "comments" },
];

const TALK_FILTERS: { value: TalkSortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "discussed", label: "Most discussed" },
];

/** Highlight a keyword in the site blue. */
function Hi({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-primary">{children}</span>;
}

/** Short per-panel description shown under the main subtitle; changes as you swipe. */
const PANEL_DESCRIPTIONS: React.ReactNode[] = [
  <>
    <Hi>Share</Hi> your own workouts and <Hi>train</Hi> sessions created by other members. Every
    shared workout is ready to open, save and log.
  </>,
  <>
    Members climb the <Hi>rankings</Hi> by training, sharing and staying consistent. Complete
    workouts, keep your streak alive and take your place at the top.
  </>,
  <>
    The most completed, liked, rated and discussed workouts rise here. <Hi>Train</Hi> the community
    favourites and see which sessions everyone loves.
  </>,
  <>
    Real feedback on every shared session. Read what members say, join the conversation and help
    others <Hi>discover</Hi> their next workout.
  </>,
];

/** A distinct badge for every one of the ten positions. */
const POSITION_BADGES = ["🥇", "🥈", "🥉", "🏅", "🎖️", "⭐", "🔥", "💪", "⚡", "🎯"];

function badgeFor(index: number) {
  return POSITION_BADGES[index] ?? "•";
}

function CommunityPage() {
  const navigate = useNavigate();
  const { freeAccessMode } = useFreeAccessMode();
  const access = useCommunityAccess();

  const [mobileApi, setMobileApi] = useState<CarouselApi>();
  const [desktopApi, setDesktopApi] = useState<CarouselApi>();
  const [mobilePanel, setMobilePanel] = useState(0);
  const [desktopPanel, setDesktopPanel] = useState(0);

  const [workoutSort, setWorkoutSort] = useState<WorkoutSortKey>("latest");
  const [memberSort, setMemberSort] = useState<MemberSortKey>("score");
  const [rankSort, setRankSort] = useState<RankSortKey>("completed");
  const [talkSort, setTalkSort] = useState<TalkSortKey>("newest");

  const [workouts, setWorkouts] = useState<CardData[] | null>(null);
  const [members, setMembers] = useState<CommunityMember[] | null>(null);
  const [ranked, setRanked] = useState<CardData[] | null>(null);
  const [comments, setComments] = useState<
    (CommunityComment & { workout_name?: string | null })[] | null
  >(null);

  useEffect(() => {
    let active = true;
    setWorkouts(null);
    void loadRemoteCached(`community:workouts:${workoutSort}`, () =>
      fetchCommunityWorkouts({ sort: workoutSort, limit: SLOTS }),
    ).then((r) => {
      if (active) setWorkouts(r);
    });
    return () => {
      active = false;
    };
  }, [workoutSort]);

  useEffect(() => {
    let active = true;
    setMembers(null);
    const load =
      memberSort === "workouts_shared"
        ? fetchCommunityCreators("workouts_shared", SLOTS)
        : fetchLeaders(memberSort, SLOTS);
    void loadRemoteCached(`community:members:${memberSort}`, () => load).then((r) => {
      if (active) setMembers(r);
    });
    return () => {
      active = false;
    };
  }, [memberSort]);

  useEffect(() => {
    let active = true;
    setRanked(null);
    void loadRemoteCached(`community:ranked:${rankSort}`, () =>
      fetchCommunityWorkouts({ sort: rankSort, limit: SLOTS }),
    ).then((r) => {
      if (active) setRanked(r);
    });
    return () => {
      active = false;
    };
  }, [rankSort]);

  useEffect(() => {
    let active = true;
    setComments(null);
    void loadRemoteCached(`community:comments:${talkSort}`, () =>
      fetchLatestComments(30, talkSort === "oldest" ? "oldest" : "newest"),
    ).then((rows) => {
      if (!active) return;
      if (talkSort !== "discussed") return setComments(rows.slice(0, SLOTS));
      const counts = new Map<string, number>();
      for (const c of rows) counts.set(c.workout_id, (counts.get(c.workout_id) ?? 0) + 1);
      setComments(
        [...rows]
          .sort(
            (a, b) =>
              (counts.get(b.workout_id) ?? 0) - (counts.get(a.workout_id) ?? 0) ||
              +new Date(b.created_at) - +new Date(a.created_at),
          )
          .slice(0, SLOTS),
      );
    });
    return () => {
      active = false;
    };
  }, [talkSort]);

  useEffect(() => {
    if (!mobileApi) return;
    const updatePanel = () => setMobilePanel(mobileApi.selectedScrollSnap());
    updatePanel();
    mobileApi.on("select", updatePanel);
    mobileApi.on("reInit", updatePanel);
    return () => {
      mobileApi.off("select", updatePanel);
      mobileApi.off("reInit", updatePanel);
    };
  }, [mobileApi]);

  useEffect(() => {
    if (!desktopApi) return;
    const updatePanel = () => setDesktopPanel(desktopApi.selectedScrollSnap());
    updatePanel();
    desktopApi.on("select", updatePanel);
    desktopApi.on("reInit", updatePanel);
    return () => {
      desktopApi.off("select", updatePanel);
      desktopApi.off("reInit", updatePanel);
    };
  }, [desktopApi]);

  function open(id: string) {
    access.guard(() =>
      navigate({ to: "/community/workout/$workoutId", params: { workoutId: id } }),
    );
  }

  const panels = [
    <SharedWorkoutsPanel
      key="shared"
      rows={workouts}
      sort={workoutSort}
      onSort={setWorkoutSort}
      onOpen={open}
    />,
    <MemberRankingPanel key="members" rows={members} sort={memberSort} onSort={setMemberSort} />,
    <WorkoutRankingPanel
      key="ranked"
      rows={ranked}
      sort={rankSort}
      onSort={setRankSort}
      onOpen={open}
    />,
    <TalkPanel
      key="talk"
      comments={comments}
      sort={talkSort}
      onSort={setTalkSort}
      onOpen={open}
    />,
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:max-w-7xl lg:px-10 lg:py-16 xl:max-w-[1440px]">
      <PageHeader image={pageHeroImage}
        eyebrow="Smarty Community"
        icon={Users}
        title="Together"
        subtitle="Train together. Share your workouts. Discover sessions from every Smarty member, climb the rankings and take your place in the community."
      />


      <div className="md:hidden">
        <SwipeToExplore
          onPrev={() => mobileApi?.scrollPrev()}
          onNext={() => mobileApi?.scrollNext()}
        />
        <CarouselDots api={mobileApi} activeIndex={mobilePanel} count={panels.length} />
        <Carousel setApi={setMobileApi} opts={{ loop: true, align: "center" }} className="w-full">
          <CarouselContent className="-ml-3">
            {panels.map((panel, i) => (
              <CarouselItem key={i} className="basis-[84%] pl-3">
                <div className="h-[560px]">{panel}</div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="hidden md:block">
        <CarouselDots api={desktopApi} activeIndex={desktopPanel} count={panels.length} />
        <Carousel setApi={setDesktopApi} opts={{ loop: true, align: "center" }} className="w-full">
          <CarouselPrevious className="-left-11 z-10 hidden h-8 w-8 rounded-full border-2 border-blue-400 bg-card/80 text-primary shadow-soft backdrop-blur-sm hover:bg-primary/10 md:flex [&>svg]:h-4 [&>svg]:w-4" />
          <CarouselContent className="-ml-4">
            {panels.map((panel, i) => (
              <CarouselItem key={i} className="basis-[72%] pl-4 lg:basis-[56%]">
                <div className="h-[620px]">{panel}</div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselNext className="-right-11 z-10 hidden h-8 w-8 rounded-full border-2 border-blue-400 bg-card/80 text-primary shadow-soft backdrop-blur-sm hover:bg-primary/10 md:flex [&>svg]:h-4 [&>svg]:w-4" />
        </Carousel>
      </div>

      <div className="mt-8 text-center">
        <Button asChild className="h-12 rounded-2xl px-6 font-bold">
          <Link
            to="/community/workouts"
            search={{ sort: "latest", difficulty: 0, category: "", q: "" }}
          >
            See all shared workouts
          </Link>
        </Button>
      </div>

      {access.checked && !access.premium && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {freeAccessMode ? (
            <>
              <Link to="/auth" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
                Sign in
              </Link>{" "}
              to open workouts, like, comment, and train shared sessions.
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
              >
                {access.signedIn ? "Renew membership" : "Join SmartyGym"}
              </Link>{" "}
              to open workouts, like, comment, and train shared sessions.
            </>
          )}
        </p>
      )}



      <CommunityGateDialog
        open={access.gateOpen}
        onOpenChange={access.setGateOpen}
        signedIn={access.signedIn}
      />
    </div>
  );
}

function CarouselDots({
  api,
  activeIndex,
  count,
}: {
  api: CarouselApi | undefined;
  activeIndex: number;
  count: number;
}) {
  return (
    <div className="mb-3 flex h-5 items-center justify-center gap-2" aria-label="Community panels">
      {Array.from({ length: count }, (_, index) => (
        <Button
          key={index}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Go to panel ${index + 1}${index === 0 ? ": Shared workouts" : ""}`}
          aria-current={activeIndex === index ? "true" : undefined}
          onClick={() => api?.scrollTo(index)}
          className="h-5 w-5 rounded-full p-0 hover:bg-transparent"
        >
          <span
            className={`block rounded-full transition-all ${
              activeIndex === index ? "h-2.5 w-5 bg-primary" : "h-2 w-2 bg-muted-foreground/35"
            }`}
          />
        </Button>
      ))}
    </div>
  );
}

/* ---------------- shared shell ---------------- */

type FilterDef = { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void };

function Panel({
  title,
  icon: Icon,
  filters,
  filterControl,
  children,
}: {
  title: string;
  icon: typeof Trophy;
  filters: FilterDef[];
  filterControl?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-blue-400 bg-card shadow-soft">
      <header className="border-b border-blue-200 bg-blue-50 p-4 dark:border-blue-500/40 dark:bg-blue-500/10">
        <h2 className="flex h-7 items-center gap-2 text-lg font-extrabold uppercase tracking-tight">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </h2>
        <div className="mt-3 rounded-2xl border border-blue-300 p-3 dark:border-blue-500/40">
          {filterControl ?? <div className="grid grid-cols-1 gap-2">
            {filters.map((f) => {
              return (
                <Select key={f.label} value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-blue-300 text-sm font-semibold dark:border-blue-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })}
          </div>}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </section>
  );
}

function Spinner() {
  return (
    <div className="grid h-full place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

/** Reserved position for a rank that nobody has claimed yet. */
function EmptySlot({ index, label }: { index: number; label: string }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-blue-200 p-2.5 dark:border-blue-500/40">
      <span className="w-7 shrink-0 text-center text-sm opacity-60">{badgeFor(index)}</span>
      <span className="h-8 w-8 shrink-0 rounded-full border border-dashed border-blue-300 dark:border-blue-500/50" />
      <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-muted-foreground">
        {label}
      </p>
    </li>
  );
}

function fillSlots(count: number) {
  return Array.from({ length: Math.max(0, SLOTS - count) }, (_, i) => count + i);
}

/* ---------------- panels ---------------- */

function SharedWorkoutsPanel({
  rows,
  sort,
  onSort,
  onOpen,
}: {
  rows: CardData[] | null;
  sort: WorkoutSortKey;
  onSort: (s: WorkoutSortKey) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <Panel
      title="Shared workouts"
      icon={Dumbbell}
      filters={[
        {
          label: "sort",
          value: sort,
          options: WORKOUT_FILTERS.map((f) => ({ value: f.value, label: f.label })),
          onChange: (v) => onSort(v as WorkoutSortKey),
        },
      ]}
    >
      {!rows ? (
        <Spinner />
      ) : (
        <ul className="space-y-2">
          {rows.slice(0, SLOTS).map((w) => (
            <li
              key={w.id}
              className="rounded-2xl border border-blue-200 p-3 dark:border-blue-500/40"
            >
              <button
                type="button"
                onClick={() => onOpen(w.id)}
                className="flex w-full items-start gap-3 text-left"
              >
                <MemberAvatar name={w.creator_name} avatar={w.creator_avatar} size={8} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{w.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {w.creator_name || "Smarty member"} · {w.category} · {w.duration_min} min ·{" "}
                    {"★".repeat(normalizeStars(w.difficulty_stars) || 1)}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                    ⭐ {w.rating_count ? Number(w.rating_avg).toFixed(1) : "—"} · 👍 {w.likes} · 💬{" "}
                    {w.comments_count} · ✅ {w.completions}
                  </p>
                </div>
              </button>
            </li>
          ))}
          {fillSlots(rows.length).map((i) => (
            <EmptySlot key={i} index={i} label="Free slot — share a workout to fill it" />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function MemberRankingPanel({
  rows,
  sort,
  onSort,
}: {
  rows: CommunityMember[] | null;
  sort: MemberSortKey;
  onSort: (s: MemberSortKey) => void;
}) {
  const unit = MEMBER_FILTERS.find((f) => f.value === sort)?.unit ?? "";
  const valueOf = (m: CommunityMember) =>
    sort === "score"
      ? m.score
      : sort === "current_streak"
        ? m.current_streak
        : sort === "workouts_completed"
          ? m.workouts_completed
          : m.workouts_shared;

  return (
    <Panel
      title="Member ranking"
      icon={Trophy}
      filters={[
        {
          label: "Sort",
          value: sort,
          onChange: (v) => onSort(v as MemberSortKey),
          options: MEMBER_FILTERS.map((f) => ({ value: f.value, label: f.label })),
        },
      ]}
    >
      {!rows ? (
        <Spinner />
      ) : (
        <ol className="space-y-2">
          {rows.slice(0, SLOTS).map((m, i) => (
            <li
              key={m.user_id}
              className="flex items-center gap-3 rounded-2xl border border-blue-200 p-2.5 dark:border-blue-500/40"
            >
              <span className="w-7 shrink-0 text-center text-sm font-black text-primary">
                {badgeFor(i)}
              </span>
              <MemberAvatar name={m.display_name} avatar={m.avatar_url} size={8} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{m.display_name || "Smarty member"}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  <Flame className="mr-0.5 inline h-3 w-3" />
                  {m.current_streak} day streak · {m.workouts_shared} shared
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                {valueOf(m).toLocaleString()}{" "}
                <span className="text-[10px] font-semibold uppercase">{unit}</span>
              </span>
            </li>
          ))}
          {fillSlots(rows.length).map((i) => (
            <EmptySlot key={i} index={i} label="Waiting for someone to take this position" />
          ))}
        </ol>
      )}
    </Panel>
  );
}

function WorkoutRankingPanel({
  rows,
  sort,
  onSort,
  onOpen,
}: {
  rows: CardData[] | null;
  sort: RankSortKey;
  onSort: (s: RankSortKey) => void;
  onOpen: (id: string) => void;
}) {
  const unit = RANK_FILTERS.find((f) => f.value === sort)?.unit ?? "";
  const valueOf = (w: CardData) =>
    sort === "completed"
      ? w.completions
      : sort === "liked"
        ? w.likes
        : sort === "commented"
          ? w.comments_count
          : Number(Number(w.rating_avg ?? 0).toFixed(1));

  return (
    <Panel
      title="Workout ranking"
      icon={Star}
      filters={[
        {
          label: "Sort",
          value: sort,
          onChange: (v) => onSort(v as RankSortKey),
          options: RANK_FILTERS.map((f) => ({ value: f.value, label: f.label })),
        },
      ]}
    >
      {!rows ? (
        <Spinner />
      ) : (
        <ol className="space-y-2">
          {rows.slice(0, SLOTS).map((w, i) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => onOpen(w.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-blue-200 p-2.5 text-left transition hover:border-primary dark:border-blue-500/40"
              >
                <span className="w-7 shrink-0 text-center text-sm font-black text-primary">
                  {badgeFor(i)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{w.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    by {w.creator_name || "Smarty member"} · {w.category} · {w.duration_min} min
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                  {valueOf(w).toLocaleString()}{" "}
                  <span className="text-[10px] font-semibold uppercase">{unit}</span>
                </span>
              </button>
            </li>
          ))}
          {fillSlots(rows.length).map((i) => (
            <EmptySlot key={i} index={i} label="Waiting for a shared workout to take this position" />
          ))}
        </ol>
      )}
    </Panel>
  );
}

function TalkPanel({
  comments,
  sort,
  onSort,
  onOpen,
}: {
  comments: (CommunityComment & { workout_name?: string | null })[] | null;
  sort: TalkSortKey;
  onSort: (s: TalkSortKey) => void;
  onOpen: (id: string) => void;
}) {
  const [selectedComment, setSelectedComment] = useState<
    (CommunityComment & { workout_name?: string | null }) | null
  >(null);

  return (
    <>
    <Panel
      title="Workout comments"
      icon={MessageSquare}
      filters={[
        {
          label: "Sort",
          value: sort,
          onChange: (v) => onSort(v as TalkSortKey),
          options: TALK_FILTERS.map((f) => ({ value: f.value, label: f.label })),
        },
      ]}
    >
      {!comments ? (
        <Spinner />
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelectedComment(c)}
                className="flex w-full gap-3 rounded-2xl border border-blue-200 p-3 text-left transition hover:border-primary dark:border-blue-500/40"
              >
                <MemberAvatar name={c.author_name} avatar={c.author_avatar} size={8} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">
                    {c.author_name || "Smarty member"}
                    <span className="ml-1 font-normal text-muted-foreground">on</span>{" "}
                    <span className="text-primary">{c.workout_name || "a shared workout"}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 break-words text-sm">{c.body}</p>
                </div>
              </button>
            </li>
          ))}
          {fillSlots(comments.length).map((i) => (
            <EmptySlot key={i} index={i} label="No comment here yet — open a shared workout to talk" />
          ))}
        </ul>
      )}
    </Panel>
    <Dialog open={selectedComment !== null} onOpenChange={(open) => !open && setSelectedComment(null)}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-3xl border-2 border-blue-400 bg-card p-0 shadow-soft">
        <DialogHeader className="space-y-0 border-b border-blue-200 bg-blue-50 p-4 text-left dark:border-blue-500/40 dark:bg-blue-500/10">
          <DialogTitle className="flex items-center gap-2 pr-6 text-lg font-extrabold uppercase tracking-tight">
            <MessageSquare className="h-5 w-5 text-primary" />
            Comment
          </DialogTitle>
          <DialogDescription className="sr-only">Full comment on a shared workout</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <MemberAvatar
              name={selectedComment?.author_name ?? null}
              avatar={selectedComment?.author_avatar ?? null}
              size={10}
            />
            <p className="min-w-0 truncate text-sm font-bold">
              {selectedComment?.author_name || "Smarty member"}
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200 p-3 dark:border-blue-500/40">
            <p className="break-words text-sm leading-6">{selectedComment?.body}</p>
          </div>
          {selectedComment ? (
            <Button
              type="button"
              className="w-full rounded-2xl font-bold"
              onClick={() => {
                const workoutId = selectedComment.workout_id;
                setSelectedComment(null);
                onOpen(workoutId);
              }}
            >
              {selectedComment.workout_name || "Open shared workout"}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
