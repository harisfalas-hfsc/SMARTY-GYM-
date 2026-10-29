import { useEffect, useRef, useState } from "react";
import { ClipboardList, ExternalLink, FileText, Salad, TrendingUp, X } from "lucide-react";
import logoDiet from "@/assets/smartydiet-logo.png";
import { Button } from "@/components/ui/button";

const CURRENT_APP: "workout" | "gym" | "move" | "diet" | "logbook" = "workout";

type SisterApp = {
  id: "workout" | "gym" | "move" | "diet" | "logbook";
  name: string;
  tagline: string;
  url: string;
  image: string;
};

const SISTER_APPS: SisterApp[] = [
  {
    id: "diet",
    name: "SmartyDiet",
    tagline: "Create your diet plan. Eat better, live longer.",
    url: "https://smartydiet.com",
    image: logoDiet,
  },
];

const DELAY_MS = 20000;

export const SisterAppsPopup = () => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setMounted(true);
      setOpen(true);
    }, DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-announcement-control]")) return;
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  const others = SISTER_APPS.filter((a) => a.id !== CURRENT_APP);

  if (!mounted) return null;

  return (
    <>
      {open && (
        <div
          aria-hidden="false"
          className="fixed inset-0 z-[58] bg-background/85 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        ref={panelRef}
        data-announcement-control
        aria-hidden={!open}
        className={`fixed top-1/2 -translate-y-1/2 left-0 z-[60] flex items-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "translate-x-0" : "-translate-x-[calc(100%+10px)]"}`}
      >
        <aside className="w-[280px] max-h-[88vh] overflow-y-auto rounded-r-3xl border-y-2 border-r-2 border-primary bg-card py-5 pl-4 pr-3 shadow-soft">
          {others.map((app) => (
            <div key={app.id} className="flex flex-col items-center text-center">
              <img src={app.image} alt={app.name} loading="lazy" className="h-28 w-28 object-contain" />
              <h2 className="mt-2 text-[24px] font-extrabold leading-tight text-primary">Smarty Diet</h2>
              <p className="mt-1 text-[13.5px] font-semibold leading-snug text-foreground">
                Create your diet plan, eat better, live longer.
              </p>
              <div className="mt-4 w-full text-left">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">How it works</p>
                <ol className="flex flex-col gap-2.5">
                  {[
                    { icon: ClipboardList, color: "text-chart-2 border-chart-2", text: "Answer a short questionnaire" },
                    { icon: Salad, color: "text-chart-3 border-chart-3", text: "Choose your food preferences" },
                    { icon: FileText, color: "text-chart-4 border-chart-4", text: "Get your personal diet plan" },
                    { icon: TrendingUp, color: "text-chart-5 border-chart-5", text: "Follow it and track your progress" },
                  ].map((s, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${s.color}`}>
                        <s.icon className="h-4 w-4" />
                      </span>
                      <span className="text-[13px] font-medium leading-snug text-foreground">
                        <span className="font-extrabold text-primary">{i + 1}.</span> {s.text}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <Button asChild className="mt-5 w-full">
                <a href={app.url} target="_blank" rel="noopener noreferrer">
                  Create my diet plan <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          ))}
        </aside>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => setOpen(false)}
          aria-label="Hide panel"
          className="ml-2 h-12 w-12 rounded-full border border-border shadow-soft"
        >
          <X className="w-7 h-7" />
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label="Show sister apps" data-announcement-control
        className={`fixed left-0 top-1/2 z-[59] h-24 w-2 -translate-y-1/2 rounded-l-none rounded-r-full bg-primary p-0 shadow-primary transition-all duration-300 hover:w-3 hover:bg-primary ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}
      />
      {!open && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(true)}
          aria-label="Show sister apps" data-announcement-control
          className="fixed left-0 top-1/2 z-[58] h-20 w-6 -translate-y-1/2 p-0 opacity-0"
        />
      )}
    </>
  );
};

export default SisterAppsPopup;
