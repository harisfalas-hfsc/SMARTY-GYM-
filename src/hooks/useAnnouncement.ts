import { useCallback, useEffect, useState } from 'react';
import { MobileAnnouncementClock } from '@/lib/announcement-policy';

type Entry = { delay: number; shown: boolean; open: boolean; update: (open: boolean) => void };
const entries = new Map<string, Entry>();
let clock: MobileAnnouncementClock | undefined;
let interval: ReturnType<typeof setInterval> | undefined;

function dialogOpen() {
  return document.documentElement.dataset.smartyCoach === 'open' ||
    [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].some(
      element => element.getAttribute('data-state') !== 'closed' && element.getAttribute('aria-hidden') !== 'true',
    );
}

function tick() {
  if (!clock) return;
  const blocked = dialogOpen() || [...entries.values()].some(entry => entry.open);
  clock.advance(performance.now(), blocked);
  if (blocked) return;
  const next = [...entries.values()].filter(entry => !entry.shown).sort((a, b) => a.delay - b.delay)[0];
  if (next && clock.claim(next.delay)) {
    next.shown = true;
    next.open = true;
    next.update(true);
  }
}

/** Independent desktop timers; a shared idle-time clock on mobile. */
export function useAnnouncement(id: string, delay: number, enabled = true, waitForDialog = true) {
  const [open, updateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      updateOpen(false);
      if (!enabled) return;
      if (!media.matches) {
        if (!clock) clock = new MobileAnnouncementClock(performance.now());
        entries.set(id, { delay, shown: false, open: false, update: value => { setMounted(true); updateOpen(value); } });
        if (!interval) interval = setInterval(tick, 100);
        cleanup = () => {
          entries.delete(id);
          if (!entries.size) {
            clearInterval(interval);
            interval = undefined;
            clock = undefined;
          }
        };
      } else {
        let timer = window.setTimeout(function tryOpen() {
          if (waitForDialog && dialogOpen()) {
            timer = window.setTimeout(tryOpen, 1_000);
            return;
          }
          setMounted(true);
          updateOpen(true);
        }, delay);
        cleanup = () => window.clearTimeout(timer);
      }
    };
    setup();
    media.addEventListener('change', setup);
    return () => { cleanup(); media.removeEventListener('change', setup); };
  }, [id, delay, enabled, waitForDialog]);

  const setOpen = useCallback((value: boolean) => {
    const entry = entries.get(id);
    if (entry && clock) {
      // Account for time since the last tick before changing blocking state.
      clock.advance(performance.now(), dialogOpen() || [...entries.values()].some(item => item.open));
      if (value) {
        if (dialogOpen()) return;
        for (const other of entries.values()) {
          if (other !== entry && other.open) { other.open = false; other.update(false); }
        }
      }
      entry.open = value;
      entry.shown = true;
    }
    updateOpen(value);
  }, [id]);
  return { open, mounted, setOpen };
}