import { supabase } from './supabase';

export const REFERRAL_BONUS = 100;

export const REFERRAL_MILESTONES = [
  { count: 5, bonus: 100 },
  { count: 10, bonus: 200 },
  { count: 20, bonus: 500 },
  { count: 50, bonus: 1250 },
  { count: 100, bonus: 2500 },
  { count: 200, bonus: 5000 },
  { count: 500, bonus: 12500 },
  { count: 1000, bonus: 25000 },
  { count: 2000, bonus: 50000 },
] as const;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Auth 직후 `users` 행이 트리거로 늦게 생길 수 있어 짧게 재시도합니다.
 */
async function waitForUserRow(
  userId: string,
  maxAttempts = 20,
  delayMs = 400
): Promise<{ point: number; referred_by: string | null } | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data, error } = await supabase
      .from('users')
      .select('point, referred_by')
      .eq('id', userId)
      .single();
    if (!error && data) {
      return data as { point: number; referred_by: string | null };
    }
    await sleep(delayMs);
  }
  return null;
}

export type ApplyReferralResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; message: string };

/**
 * 추천인 코드 적용: 신규 유저 +REFERRAL_BONUS, 추천인 +REFERRAL_BONUS, 마일스톤 보너스.
 * 이미 referred_by가 있으면 스킵(중복 지급 방지).
 */
export async function applyReferralRewards(
  newUserId: string,
  rawCode: string
): Promise<ApplyReferralResult> {
  const referralCode = rawCode.trim();
  if (!referralCode) return { ok: true, skipped: true };

  const { data: referrer, error: refErr } = await supabase
    .from('users')
    .select('id, point')
    .eq('invite_code', referralCode)
    .single();

  if (refErr || !referrer) {
    return { ok: false, message: refErr?.message ?? 'Invalid referral code.' };
  }

  if (referrer.id === newUserId) {
    return { ok: false, message: 'You cannot use your own referral code.' };
  }

  const row = await waitForUserRow(newUserId);
  if (!row) {
    return {
      ok: false,
      message: 'Profile is not ready yet. Please try again in a moment.',
    };
  }

  if (row.referred_by) {
    return { ok: true, skipped: true };
  }

  const newPoint = (row.point ?? 0) + REFERRAL_BONUS;

  const { error: u1 } = await supabase
    .from('users')
    .update({
      referred_by: referrer.id,
      point: newPoint,
    })
    .eq('id', newUserId);

  if (u1) {
    console.error('Referral: update new user failed', u1);
    return { ok: false, message: u1.message };
  }

  const { error: log1 } = await supabase.from('mining_logs').insert({
    user_id: newUserId,
    amount: REFERRAL_BONUS,
    type: 'REFERRAL',
  });
  if (log1) {
    console.warn('Referral: mining_logs (new user) insert failed', log1);
  }

  const { data: freshRef, error: refFetchErr } = await supabase
    .from('users')
    .select('point')
    .eq('id', referrer.id)
    .single();

  if (refFetchErr || freshRef == null) {
    console.error('Referral: fetch referrer point failed', refFetchErr);
    return { ok: false, message: refFetchErr?.message ?? 'Referrer fetch failed.' };
  }

  const { error: u2 } = await supabase
    .from('users')
    .update({
      point: (freshRef.point ?? 0) + REFERRAL_BONUS,
    })
    .eq('id', referrer.id);

  if (u2) {
    console.error('Referral: update referrer failed', u2);
    return { ok: false, message: u2.message };
  }

  const { error: log2 } = await supabase.from('mining_logs').insert({
    user_id: referrer.id,
    amount: REFERRAL_BONUS,
    type: 'REFERRAL',
  });
  if (log2) {
    console.warn('Referral: mining_logs (referrer) insert failed', log2);
  }

  const { count: totalReferrals, error: cntErr } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by', referrer.id);

  if (cntErr) {
    console.warn('Referral: milestone count failed', cntErr);
    return { ok: true };
  }

  const milestone = REFERRAL_MILESTONES.find((m) => m.count === totalReferrals);
  if (!milestone) return { ok: true };

  const { data: currentRef, error: mFetchErr } = await supabase
    .from('users')
    .select('point')
    .eq('id', referrer.id)
    .single();

  if (mFetchErr || !currentRef) {
    console.warn('Referral: milestone fetch referrer failed', mFetchErr);
    return { ok: true };
  }

  const { error: u3 } = await supabase
    .from('users')
    .update({
      point: (currentRef.point ?? 0) + milestone.bonus,
    })
    .eq('id', referrer.id);

  if (u3) {
    console.warn('Referral: milestone update failed', u3);
    return { ok: true };
  }

  const { error: log3 } = await supabase.from('mining_logs').insert({
    user_id: referrer.id,
    amount: milestone.bonus,
    type: 'BONUS',
  });
  if (log3) {
    console.warn('Referral: milestone log insert failed', log3);
  }

  return { ok: true };
}
