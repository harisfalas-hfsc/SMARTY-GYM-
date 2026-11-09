import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import giftImage from '@/assets/smarty-gift.jpg';
import { giftAnnouncementDelay } from '@/lib/announcement-policy';
import { useAnnouncement } from '@/hooks/useAnnouncement';

// Set back to true to re-enable the Smarty Gift announcement (desktop + mobile).
const GIFT_POPUP_ENABLED = false;

export function SmartyGiftPopup() {
  if (!GIFT_POPUP_ENABLED) return null;
  const [desktop, setDesktop] = useState(false);
  const { open, mounted, setOpen } = useAnnouncement('smarty-gift', giftAnnouncementDelay(desktop));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const previousFocus = document.activeElement;
    const controls = () => [...(panelRef.current?.querySelectorAll<HTMLElement>('button, a[href]') ?? [])];
    controls()[0]?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
    };
    const dismissOutside = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-announcement-control]')) return;
      if (target instanceof Node && panelRef.current && !panelRef.current.contains(target)) setOpen(false);
    };
    window.addEventListener('mousedown', dismissOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', dismissOutside);
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, setOpen]);

  if (!mounted) return null;

  return <>
    {open && <div aria-hidden="true" data-announcement-backdrop="smarty-gift" className="fixed inset-0 z-[58] bg-background/85 backdrop-blur-sm" onClick={() => setOpen(false)} />}
    <div ref={panelRef} data-announcement-control aria-hidden={!open} inert={!open}
      className={`fixed right-0 top-1/2 z-[60] flex -translate-y-1/2 items-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:bottom-5 lg:top-auto lg:translate-y-0 ${open ? 'translate-x-0' : 'translate-x-[calc(100%+10px)]'}`}>
      <Button type="button" size="icon" variant="secondary" onClick={() => setOpen(false)} aria-label="Hide Smarty Gift panel" className="mr-2 h-10 w-10 shrink-0 rounded-full border border-border shadow-soft"><X className="h-5 w-5" /></Button>
      <aside aria-label="Smarty Gift announcement" className="relative isolate h-[332px] max-h-[80dvh] w-[280px] max-w-[calc(100vw-56px)] overflow-hidden rounded-l-3xl border-y-2 border-l-2 border-primary shadow-soft lg:h-[283.875px] lg:max-h-[calc(50dvh-32px)]">
        <img src={giftImage} alt="Smarty Gift box with a blue ribbon" width={1536} height={1024} className="absolute inset-0 -z-20 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 -z-10 bg-strip-shade-strong" />
        <div className="flex h-full flex-col justify-end overflow-y-auto p-4 text-hero-foreground lg:p-3">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold leading-tight"><Gift className="h-6 w-6 shrink-0 text-primary" />Smarty Gift</h2>
          <p className="mt-2 text-base font-semibold leading-snug">Give someone you love<br />30 days of Premium.</p>
          <p className="mt-3 text-2xl font-extrabold leading-tight lg:mt-2">€4.99 <span className="text-xs font-medium">one-time</span></p>
          <p className="mt-2 text-xs font-medium leading-snug">They choose when to start.<br />No automatic renewal.</p>
          <p className="mt-2 text-[11px] leading-snug text-hero-foreground/85">Active Premium buyers only; recipients must never have had Premium.</p>
          <Button asChild className="mt-3 w-full shrink-0 lg:mt-2 lg:h-9"><Link to="/smarty-gift" onClick={() => setOpen(false)}><Gift className="h-4 w-4" />Give Smarty Gift</Link></Button>
        </div>
      </aside>
    </div>
    <Button type="button" variant="ghost" onClick={() => setOpen(true)} aria-label="Show Smarty Gift" data-announcement-control className={`fixed right-0 top-1/2 z-[59] h-24 w-3 -translate-y-1/2 rounded-r-none rounded-l-full bg-primary p-0 shadow-primary transition-all duration-300 hover:w-4 hover:bg-primary lg:bottom-[20%] lg:top-auto lg:translate-y-0 ${open ? 'pointer-events-none opacity-0' : 'opacity-100'}`} />
  </>;
}