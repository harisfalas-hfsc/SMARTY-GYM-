export const APP_DOWNLOAD_DELAY_MS = 10_000;
export const SISTER_APPS_DELAY_MS = 20_000;

/** Virtual time advances only while the phone is free of announcements/dialogs. */
export class MobileAnnouncementClock {
  elapsed = 0;
  private previousTime: number;

  constructor(now: number) {
    this.previousTime = now;
  }

  advance(now: number, blocked: boolean) {
    if (!blocked) this.elapsed += Math.max(0, now - this.previousTime);
    this.previousTime = now;
  }

  claim(delay: number) {
    if (this.elapsed < delay) return false;
    // Preserve the exact scheduled gap, not polling overshoot.
    this.elapsed = delay;
    return true;
  }
}

export function giftAnnouncementDelay(desktop: boolean) {
  return desktop ? 15_000 : 10_000;
}

export function canShowAppDownloads(desktop: boolean, nativeShell: boolean) {
  return desktop && !nativeShell;
}