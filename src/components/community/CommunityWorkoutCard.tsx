import { Star, ThumbsUp, ThumbsDown, MessageCircle, CheckCircle2, Flame, Clock, Trophy, Sparkles, Crown } from "lucide-react";

const BADGE_ICONS = { flame: Flame, sparkles: Sparkles, crown: Crown, trophy: Trophy } as const;
import { CreatorLink } from "@/components/community/CreatorLink";
import { cn } from "@/lib/utils";
import { MAX_STARS, normalizeStars } from "@/lib/workout/spec";
import { RATING_STARS, type CommunityBadge, type CommunityWorkoutCard as CardData } from "@/lib/community";
import { formatDateShort } from "@/lib/date-format";

function Stars({ n }: { n: number }) {
  const filled = normalizeStars(n);
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: MAX_STARS }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < filled ? "fill-primary text-primary" : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

function Metric({ icon: Icon, value }: { icon: typeof ThumbsUp; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {value.toLocaleString()}
    </span>
  );
}

export function CommunityWorkoutCard({
  workout,
  badges = [],
  onOpen,
}: {
  workout: CardData;
  badges?: CommunityBadge[];
  onOpen: (id: string) => void;
}) {
  const shared = workout.shared_at
    ? formatDateShort(workout.shared_at)
    : "—";
  const initial = (workout.creator_name || "S").slice(0, 1).toUpperCase();
  const visibleBadges = badges.slice(0, 3);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(workout.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(workout.id);
      }}
      className="flex h-full cursor-pointer flex-col rounded-3xl border-2 border-blue-400 bg-card p-5 text-left shadow-soft transition hover:shadow-md"
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary">
        <span className="truncate">{workout.category}</span>
        {workout.format ? <span className="truncate text-muted-foreground">· {workout.format}</span> : null}
      </div>
      <h3 className="mt-2 line-clamp-2 text-lg font-extrabold leading-tight">{workout.name}</h3>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <Stars n={workout.difficulty_stars} />
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {workout.duration_min} min
        </span>
        <span>{shared}</span>
      </div>

      {workout.equipment && workout.equipment.length > 0 && (
        <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
          {workout.equipment.join(" · ")}
        </p>
      )}

      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/40 dark:bg-blue-500/10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Created by</p>
        <div className="mt-1.5 flex items-center gap-2">
          {workout.creator_avatar ? (
            <img
              src={workout.creator_avatar}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initial}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold"><CreatorLink userId={workout.creator_id} name={workout.creator_name} /></p>
            <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
              <span className="shrink-0">
                <Flame className="mr-0.5 inline h-3 w-3" />
                {workout.creator_streak} day streak
              </span>
              <span className="inline-flex min-w-0 items-center gap-1" aria-label={visibleBadges.length ? `${visibleBadges.length} earned badges` : "No badges earned yet"}>
                {Array.from({ length: 3 }).map((_, index) => {
                  const badge = visibleBadges[index];
                  const BadgeIcon = (badge?.icon && BADGE_ICONS[badge.icon as keyof typeof BADGE_ICONS]) || Trophy;
                  return (
                    <span
                      key={badge?.badge_id ?? `empty-badge-${index}`}
                      title={badge?.badge_name ?? "Badge not earned yet"}
                      className={cn(
                        "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                        badge
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 text-muted-foreground/30",
                      )}
                    >
                      <BadgeIcon className="h-2.5 w-2.5" aria-hidden="true" />
                    </span>
                  );
                })}
                <span className="truncate">
                  {badges.length} {badges.length === 1 ? "badge" : "badges"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-0.5">
          {Array.from({ length: RATING_STARS }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3.5 w-3.5",
                i < Math.round(Number(workout.rating_avg))
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30",
              )}
            />
          ))}
        </span>
        {workout.rating_count > 0
          ? `${Number(workout.rating_avg).toFixed(1)} (${workout.rating_count})`
          : "Not rated yet"}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Metric icon={ThumbsUp} value={workout.likes} />
        <Metric icon={ThumbsDown} value={workout.dislikes} />
        <Metric icon={MessageCircle} value={workout.comments_count} />
        <Metric icon={CheckCircle2} value={workout.completions} />
      </div>

    </article>
  );
}
