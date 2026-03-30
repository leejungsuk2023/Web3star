/** 4-hour mining cooldown — matches Home.tsx */
export const MINING_COOLDOWN_MS = 4 * 60 * 60 * 1000;

/** True after user has completed a mining tap (logo + flow) and the 4h timer is still running. */
export function isMiningCooldownActive(lastMinedAt: string | null | undefined, nowMs = Date.now()): boolean {
  if (!lastMinedAt) return false;
  const mined = new Date(lastMinedAt).getTime();
  if (Number.isNaN(mined)) return false;
  return nowMs - mined < MINING_COOLDOWN_MS;
}

/**
 * Rewarded slot progress only applies during the current mining cooldown.
 * After cooldown ends, user must tap the logo again (mine) before slots unlock — ignore stale DB rows.
 */
export function effectiveAdSlotsViewed(
  lastMinedAt: string | null | undefined,
  adSlotsViewed: unknown,
  nowMs = Date.now(),
): number[] {
  if (!isMiningCooldownActive(lastMinedAt, nowMs)) return [];
  if (!Array.isArray(adSlotsViewed)) return [];
  return adSlotsViewed.filter((n): n is number => typeof n === 'number' && n >= 1 && n <= 5);
}

/** Bottom 5 rewarded ads: only after logo/mining started this cycle (cooldown active). */
export function canOpenRewardedAdSlotModal(cooldownActive: boolean, activeSlotsLength: number, adCooldownSec: number): boolean {
  return cooldownActive && activeSlotsLength < 5 && adCooldownSec === 0;
}
