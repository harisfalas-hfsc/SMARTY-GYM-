import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { adminListRituals, adminUpdateRitual } from "@/lib/ritual.functions";

type Row = Awaited<ReturnType<typeof adminListRituals>>["rituals"][number];

function fmt(iso: string, today: string) {
  if (iso === today) return "Today";
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function preview(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 110);
}

export function AdminRitualsTab() {
  const list = useServerFn(adminListRituals);
  const save = useServerFn(adminUpdateRitual);
  const [data, setData] = useState<{ today: string; rituals: Row[] } | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => list().then(setData).catch((e) => toast.error(String(e?.message ?? e)));
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!data.rituals.length) return <p className="text-sm text-muted-foreground">No rituals yet.</p>;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{data.rituals.length} rituals — one per day, in order, then the cycle starts again.</p>
      {data.rituals.map((r) => {
        const isToday = r.next === data.today;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => setEditing(r)}
            className={`flex w-full items-start gap-3 rounded-2xl border-2 p-3 text-left transition hover:bg-accent ${isToday ? "border-primary bg-primary/10" : "border-blue-400 bg-card"}`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 font-bold text-primary">{r.number}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{preview(r.morning_content) || "—"}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Next: <strong className="text-foreground">{fmt(r.next, data.today)}</strong> · After that: {fmt(r.following, data.today)}
              </span>
            </span>
          </button>
        );
      })}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogTitle>Ritual {editing?.number}</DialogTitle>
          {editing && (
            <div className="space-y-3">
              {(["morning_content", "midday_content", "evening_content"] as const).map((k) => (
                <label key={k} className="block space-y-1">
                  <span className="text-sm font-semibold capitalize">{k.split("_")[0]}</span>
                  <Textarea
                    rows={8}
                    value={editing[k]}
                    onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
                  />
                </label>
              ))}
              <Button
                disabled={saving}
                className="w-full"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await save({ data: { id: editing.id, morning_content: editing.morning_content, midday_content: editing.midday_content, evening_content: editing.evening_content } });
                    toast.success("Ritual saved");
                    setEditing(null);
                    await load();
                  } catch (e: any) {
                    toast.error(e?.message ?? "Could not save");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
