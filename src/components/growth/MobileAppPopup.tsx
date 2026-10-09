import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ANDROID_URL, IOS_URL, AppleMark, GooglePlayMark } from "@/components/StoreBadges";

const STORES = [
  { name: "App Store", caption: "Download on the", url: IOS_URL, Icon: AppleMark },
  { name: "Google Play", caption: "Get it on", url: ANDROID_URL, Icon: GooglePlayMark },
];

export function MobileAppPopup() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setDesktop(media.matches);
      if (!media.matches) setOpen(false);
    };
    update();
    media.addEventListener("change", update);
    const timer = window.setTimeout(() => {
      setMounted(true);
      if (media.matches) setOpen(true);
    }, 10000);
    return () => {
      window.clearTimeout(timer);
      media.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const dismissOutside = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-announcement-control]")) return;
      if (target instanceof Node && panelRef.current && !panelRef.current.contains(target)) setOpen(false);
    };
    window.addEventListener("mousedown", dismissOutside);
    return () => window.removeEventListener("mousedown", dismissOutside);
  }, [open]);

  if (!mounted || !desktop) return null;

  return (
    <>
      {open && <div aria-hidden="true" className="fixed inset-0 z-[58] bg-background/85 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <div ref={panelRef} data-announcement-control aria-hidden={!open} inert={!open} className={`fixed top-1/2 -translate-y-1/2 right-0 z-[60] flex items-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? "translate-x-0" : "translate-x-[calc(100%+10px)]"}`}>
        <Button type="button" size="icon" variant="secondary" onClick={() => setOpen(false)} aria-label="Hide app download panel" className="mr-2 h-12 w-12 rounded-full border border-border shadow-soft"><X className="w-7 h-7" /></Button>
        <aside aria-label="Download our mobile application" className="w-[280px] rounded-l-3xl border-y-2 border-l-2 border-primary bg-card py-5 pr-4 pl-3 shadow-soft">
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-primary text-[11px] font-extrabold uppercase tracking-[0.2em]"><Download className="w-3.5 h-3.5 text-primary" /> SMARTYGYM</span>
            <h2 className="mt-1 text-[15px] font-bold leading-tight text-foreground">Download our mobile application for better experience.</h2>
          </div>
          <div className="flex flex-col gap-4">
            {STORES.map(({ name, caption, url, Icon }) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Download SMARTYGYM on ${name}`} className="group flex items-center gap-3 py-1 transition-transform duration-300 hover:-translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="h-14 w-14 shrink-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110"><Icon className="h-10 w-10 text-foreground" /></div>
                <div className="flex-1 min-w-0"><p className="text-[11px] font-medium leading-snug text-muted-foreground">{caption}</p><h3 className="mt-0.5 text-sm font-extrabold leading-tight text-foreground transition-colors group-hover:text-primary">{name}</h3></div>
                <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
              </a>
            ))}
          </div>
        </aside>
      </div>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)} aria-label="Show app downloads" data-announcement-control className={`fixed right-0 top-1/2 z-[59] h-24 w-2 -translate-y-1/2 rounded-r-none rounded-l-full bg-primary p-0 shadow-primary transition-all duration-300 hover:w-3 hover:bg-primary ${open ? "pointer-events-none opacity-0" : "opacity-100"}`} />
      {!open && <Button type="button" variant="ghost" onClick={() => setOpen(true)} aria-label="Show app downloads" data-announcement-control className="fixed right-0 top-1/2 z-[58] h-20 w-6 -translate-y-1/2 p-0 opacity-0" />}
    </>
  );
}