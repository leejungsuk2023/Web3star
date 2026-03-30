import { describe, expect, it } from 'vitest';
import {
  MINING_COOLDOWN_MS,
  canOpenRewardedAdSlotModal,
  effectiveAdSlotsViewed,
  isMiningCooldownActive,
} from './miningAdSlots';

describe('isMiningCooldownActive', () => {
  it('is false when never mined', () => {
    expect(isMiningCooldownActive(null, 1_000_000)).toBe(false);
    expect(isMiningCooldownActive(undefined, 1_000_000)).toBe(false);
  });

  it('is true when mined within 4h', () => {
    const now = 10_000_000;
    const last = new Date(now - MINING_COOLDOWN_MS + 60_000).toISOString();
    expect(isMiningCooldownActive(last, now)).toBe(true);
  });

  it('is false when mined before 4h elapsed', () => {
    const now = 10_000_000;
    const last = new Date(now - MINING_COOLDOWN_MS - 1).toISOString();
    expect(isMiningCooldownActive(last, now)).toBe(false);
  });
});

describe('effectiveAdSlotsViewed', () => {
  it('returns empty when cooldown ended even if DB has slots', () => {
    const now = 10_000_000;
    const last = new Date(now - MINING_COOLDOWN_MS - 1).toISOString();
    expect(effectiveAdSlotsViewed(last, [1, 2, 3], now)).toEqual([]);
  });

  it('returns DB slots during cooldown', () => {
    const now = 10_000_000;
    const last = new Date(now - 60_000).toISOString();
    expect(effectiveAdSlotsViewed(last, [1, 2], now)).toEqual([1, 2]);
  });

  it('filters invalid slot numbers', () => {
    const now = 10_000_000;
    const last = new Date(now - 60_000).toISOString();
    expect(effectiveAdSlotsViewed(last, [1, 99, 'x', 3], now)).toEqual([1, 3]);
  });
});

describe('canOpenRewardedAdSlotModal', () => {
  it('requires cooldown active', () => {
    expect(canOpenRewardedAdSlotModal(false, 0, 0)).toBe(false);
    expect(canOpenRewardedAdSlotModal(true, 0, 0)).toBe(true);
  });

  it('blocks when 5/5 or ad cooldown', () => {
    expect(canOpenRewardedAdSlotModal(true, 5, 0)).toBe(false);
    expect(canOpenRewardedAdSlotModal(true, 2, 5)).toBe(false);
  });
});
