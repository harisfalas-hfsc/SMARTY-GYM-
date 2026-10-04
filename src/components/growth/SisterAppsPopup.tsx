import { useEffect, useRef, useState } from "react";
import { ExternalLink, Sparkles, X } from "lucide-react";
import logoMove from "@/assets/smartymove-logo.png";
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
    tagline: "Eat smart. Fuel your body. Live longer.",
    url: "https://smartydiet.com",
    image: logoDiet,
  },
  {
    id: "move",
    name: "SmartyMove",
    tagline: "Check your posture. Correct your movement. Live better.",
    url: "https://smartymove.com",
    image: logoMove,
  },
];

const DELAY_MS = 30000;

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
        aria-hidden={!open}
        className={`fixed top-1/2 -translate-y-1/2 left-0 z-[60] flex items-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "translate-x-0" : "-translate-x-[calc(100%+10px)]"}`}
      >
        <aside className="w-[280px] rounded-r-3xl border-y-2 border-r-2 border-primary bg-card py-5 pl-4 pr-3 shadow-soft">
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-primary text-[11px] font-extrabold uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Smarty Family
            </span>
            <h2 className="mt-1 text-[15px] font-bold leading-tight text-foreground">
              Complete your wellness journey
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {others.map((app) => (
              <a
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 py-1 transition-transform duration-300 hover:translate-x-1 focus-visible:outline-none"
              >
                <div className="h-14 w-14 shrink-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                  <img
                    src={app.image}
                    alt={app.name}
                    loading="lazy"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold leading-tight text-foreground transition-colors group-hover:text-primary">{app.name}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-muted-foreground">{app.tagline}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
              </a>
            ))}
          </div>
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
        aria-label="Show sister apps"
        className={`fixed left-0 top-1/2 z-[59] h-24 w-2 -translate-y-1/2 rounded-l-none rounded-r-full bg-primary p-0 shadow-primary transition-all duration-300 hover:w-3 hover:bg-primary ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}
      />
      {!open && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(true)}
          aria-label="Show sister apps"
          className="fixed left-0 top-1/2 z-[58] h-20 w-6 -translate-y-1/2 p-0 opacity-0"
        />
      )}
    </>
  );
};

export default SisterAppsPopup;
