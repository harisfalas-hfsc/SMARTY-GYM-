import { describe, expect, it } from 'vitest';
import { APP_DOWNLOAD_DELAY_MS, canShowAppDownloads, giftAnnouncementDelay, MobileAnnouncementClock, SISTER_APPS_DELAY_MS } from './announcement-policy';

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
  it('keeps the existing Diet schedule at 20 seconds', () => {
    expect(SISTER_APPS_DELAY_MS).toBe(20_000);
  });
  it('waits 10 full seconds after Gift closes at second 30', () => {
    const clock = new MobileAnnouncementClock(0);
    clock.advance(10_000, false);
    expect(clock.claim(10_000)).toBe(true);
    clock.advance(30_000, true);
    expect(clock.claim(20_000)).toBe(false);
    clock.advance(39_999, false);
    expect(clock.claim(20_000)).toBe(false);
    clock.advance(40_000, false);
    expect(clock.claim(20_000)).toBe(true);
  });
  it('waits 10 full seconds even when Gift closes immediately at second 12', () => {
    const clock = new MobileAnnouncementClock(0);
    clock.advance(10_000, false);
    clock.claim(10_000);
    clock.advance(12_000, true);
    clock.advance(21_999, false);
    expect(clock.claim(20_000)).toBe(false);
    clock.advance(22_000, false);
    expect(clock.claim(20_000)).toBe(true);
  });
  it('pauses the remaining countdown while a dismissed announcement is reopened', () => {
    const clock = new MobileAnnouncementClock(0);
    clock.advance(10_000, false);
    clock.claim(10_000);
    clock.advance(12_000, true);
    clock.advance(16_000, false);
    clock.advance(40_000, true);
    clock.advance(45_999, false);
    expect(clock.claim(20_000)).toBe(false);
    clock.advance(46_000, false);
    expect(clock.claim(20_000)).toBe(true);
  });
  it('does not consume the initial delay while Coach or another dialog is open', () => {
    const clock = new MobileAnnouncementClock(0);
    clock.advance(60_000, true);
    clock.advance(69_999, false);
    expect(clock.claim(10_000)).toBe(false);
    clock.advance(70_000, false);
    expect(clock.claim(10_000)).toBe(true);
  });
});