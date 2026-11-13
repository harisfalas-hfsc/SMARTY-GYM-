import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SORTS } from "@/lib/community";
import { MAX_STARS } from "@/lib/workout/spec";

export function MobileWorkoutFilters({ sort, difficulty, category, categories, active, onChange, onReset }: {
  sort: string; difficulty: number; category: string; categories: string[]; active: boolean;
  onChange: (patch: Record<string, unknown>) => void; onReset: () => void;
}) {
  const trigger = "h-10 w-full min-w-0 gap-1 rounded-md px-2 text-[11px] font-semibold focus:ring-0 focus-visible:ring-2 [&>span]:truncate [&>svg]:h-3 [&>svg]:w-3";
  return <div className="sticky top-14 z-30 -mx-4 grid grid-cols-[1fr_1fr_1.2fr_2.5rem] items-center gap-1.5 border-y border-coach-line bg-background px-3 py-2 md:hidden" aria-label="Shared workout filters">
    <Select value={sort} onValueChange={value => onChange({ sort: value })}>
      <SelectTrigger aria-label="Sort workouts" className={trigger}><span>{sort === "latest" ? "Newest" : SORTS.find(s => s.id === sort)?.label}</span></SelectTrigger>
      <SelectContent>{SORTS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
    </Select>
    <Select value={String(difficulty)} onValueChange={value => onChange({ difficulty: Number(value) })}>
      <SelectTrigger aria-label="Difficulty" className={trigger}><span>{difficulty ? `${difficulty} stars` : "Level"}</span></SelectTrigger>
      <SelectContent><SelectItem value="0">Any difficulty</SelectItem>{Array.from({ length: MAX_STARS }, (_, i) => <SelectItem key={i} value={String(i + 1)}>{i + 1} stars</SelectItem>)}</SelectContent>
    </Select>
    <Select value={category || "all"} onValueChange={value => onChange({ category: value === "all" ? "" : value })}>
      <SelectTrigger aria-label="Category" className={trigger}><span>{category || "Category"}</span></SelectTrigger>
      <SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
    </Select>
    <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Clear filters" title="Clear filters" disabled={!active} onClick={onReset}><RotateCcw className="h-4 w-4" /></Button>
  </div>;
}