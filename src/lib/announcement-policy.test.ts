import { describe, expect, it } from 'vitest';
import { APP_DOWNLOAD_DELAY_MS, canShowAppDownloads, giftAnnouncementDelay } from './announcement-policy';

describe('right-side announcement rules', () => {
  it('opens desktop app downloads after 10 seconds', () => {
    expect(APP_DOWNLOAD_DELAY_MS).toBe(10_000);
  });
  it('opens desktop Smarty Gift after 15 seconds', () => {
    expect(giftAnnouncementDelay(true)).toBe(15_000);
  });
  it('opens mobile Smarty Gift after 10 seconds', () => {
    expect(giftAnnouncementDelay(false)).toBe(10_000);
  });
  it('limits app downloads to desktop browsers, never mobile or native apps', () => {
    expect(canShowAppDownloads(true, false)).toBe(true);
    expect(canShowAppDownloads(false, false)).toBe(false);
    expect(canShowAppDownloads(true, true)).toBe(false);
    expect(canShowAppDownloads(false, true)).toBe(false);
  });
});