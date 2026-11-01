import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import giftImage from '@/assets/smarty-gift.jpg';
import { giftAnnouncementDelay } from '@/lib/announcement-policy';

export function SmartyGiftPopup() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)').matches;
    let timer = window.setTimeout(function tryOpen() {
      if (document.documentElement.dataset.smartyCoach === 'open' || document.querySelector('[role="dialog"]')) {
        timer = window.setTimeout(tryOpen, 1_000);
        return;
      }
      setMounted(true);
      setOpen(true);
    }, giftAnnouncementDelay(desktop));
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const dismissOutside = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-announcement-control]')) return;
      if (target instanceof Node && panelRef.current && !panelRef.current.contains(target)) setOpen(false);
    };
    window.addEventListener('mousedown', dismissOutside);
    return () => window.removeEventListener('mousedown', dismissOutside);
  }, [open]);

  if (!mounted) return null;

  return <>
    <div ref={panelRef} data-announcement-control aria-hidden={!open} inert={!open}
      className={`fixed right-0 top-1/2 z-[60] flex -translate-y-1/2 items-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:bottom-5 lg:top-auto lg:translate-y-0 ${open ? 'translate-x-0' : 'translate-x-[calc(100%+10px)]'}`}>
      <Button type="button" size="icon" variant="secondary" onClick={() => setOpen(false)} aria-label="Hide Smarty Gift panel" className="mr-2 h-10 w-10 shrink-0 rounded-full border border-border shadow-soft"><X className="h-5 w-5" /></Button>
      <aside aria-label="Smarty Gift announcement" className="max-h-[80dvh] w-[280px] max-w-[calc(100vw-56px)] overflow-y-auto rounded-l-3xl border-y-2 border-l-2 border-primary bg-card shadow-soft lg:max-h-[calc(50dvh-32px)]">
        <img src={giftImage} alt="Smarty Gift box with a blue ribbon" width={1536} height={1024} className="h-24 w-full object-cover" />
        <div className="p-3">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-primary"><Gift className="h-5 w-5" />Smarty Gift</h2>
          <p className="mt-1 text-sm font-semibold leading-snug text-foreground">Give someone you love 30 days of Premium.</p>
          <p className="mt-2 text-lg font-bold text-primary">€4.99 <span className="text-xs font-medium text-muted-foreground">one-time</span></p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">They choose when to start. No automatic renewal. Exclusively from active Premium members to someone who has never had Premium.</p>
          <Button asChild className="mt-3 w-full"><Link to="/smarty-gift" onClick={() => setOpen(false)}><Gift className="h-4 w-4" />Give Smarty Gift</Link></Button>
        </div>
      </aside>
    </div>
    <Button type="button" variant="ghost" onClick={() => setOpen(true)} aria-label="Show Smarty Gift" data-announcement-control className={`fixed right-0 top-1/2 z-[59] h-24 w-3 -translate-y-1/2 rounded-r-none rounded-l-full bg-primary p-0 shadow-primary transition-all duration-300 hover:w-4 hover:bg-primary lg:bottom-[20%] lg:top-auto lg:translate-y-0 ${open ? 'pointer-events-none opacity-0' : 'opacity-100'}`} />
  </>;
}