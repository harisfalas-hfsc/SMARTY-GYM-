export const APP_DOWNLOAD_DELAY_MS = 10_000;

export function giftAnnouncementDelay(desktop: boolean) {
  return desktop ? 15_000 : 10_000;
}

export function canShowAppDownloads(desktop: boolean, nativeShell: boolean) {
  return desktop && !nativeShell;
}