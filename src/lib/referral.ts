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

/**
 * PRD/DB에선 referred_by가 "초대 코드 문자열"일 수 있고, 클라이언트는 UUID(추천인 id)로 통일해 저장합니다.
 * DB 트리거가 가입 직후 referred_by만 채우면, 예전 로직(if referred_by)이 전체를 스킵해 피추천인 100pt가 누락됐습니다.
 */
export function isConflictingExistingReferral(
  referredBy: string | null | undefined,
  enteredCode: string,
  referrerId: string
): boolean {
  const rb = referredBy?.trim() || '';
  if (!rb) return false;
  return rb !== enteredCode.trim() && rb !== referrerId;
}

export type ApplyReferralResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; message: string };

/**
 * 추천인 코드 적용: 신규 유저 +REFERRAL_BONUS, 추천인 +REFERRAL_BONUS, 마일스톤 보너스.
 * 피추천인: mining_logs에 REFERRAL이 이미 있으면 포인트 중복 없이 스킵(멱등).
 */
export async function applyReferralRewards(
  newUserId: string,
  rawCode: string
): Promise<ApplyReferralResult> {
  const referralCode = rawCode.trim();
  if (!referralCode) return { ok: true, skipped: true };

  const { data: referrer, error: refErr } = await supabase
    .from('users')
    .select('id, point, invite_code')
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

  if (isConflictingExistingReferral(row.referred_by, referralCode, referrer.id)) {
    return {
      ok: false,
      message: 'A different referral is already registered on your account.',
    };
  }

  const { data: selfRefLog } = await supabase
    .from('mining_logs')
    .select('id')
    .eq('user_id', newUserId)
    .eq('type', 'REFERRAL')
    .limit(1)
    .maybeSingle();

  if (selfRefLog) {
    if (row.referred_by !== referrer.id) {
      const { error: fixRb } = await supabase
        .from('users')
        .update({ referred_by: referrer.id })
        .eq('id', newUserId)
        .select('id');
      if (fixRb) {
        console.warn('Referral: normalize referred_by failed', fixRb);
      }
    }
    return { ok: true, skipped: true };
  }

  const newPoint = (row.point ?? 0) + REFERRAL_BONUS;

  const { data: updatedSelf, error: u1 } = await supabase
    .from('users')
    .update({
      referred_by: referrer.id,
      point: newPoint,
    })
    .eq('id', newUserId)
    .select('id');

  if (u1) {
    console.error('Referral: update new user failed', u1);
    return { ok: false, message: u1.message };
  }
  if (!updatedSelf?.length) {
    console.error('Referral: update new user affected 0 rows (RLS or missing row)');
    return {
      ok: false,
      message: 'Could not apply referral reward to your account. Please contact support.',
    };
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

  const { data: updatedRef, error: u2 } = await supabase
    .from('users')
    .update({
      point: (freshRef.point ?? 0) + REFERRAL_BONUS,
    })
    .eq('id', referrer.id)
    .select('id');

  if (u2) {
    console.error('Referral: update referrer failed', u2);
    return { ok: false, message: u2.message };
  }
  if (!updatedRef?.length) {
    console.error('Referral: update referrer affected 0 rows (RLS)');
    return {
      ok: false,
      message: 'Could not credit the referrer. Please contact support.',
    };
  }

  const { error: log2 } = await supabase.from('mining_logs').insert({
    user_id: referrer.id,
    amount: REFERRAL_BONUS,
    type: 'REFERRAL',
  });
  if (log2) {
    console.warn('Referral: mining_logs (referrer) insert failed', log2);
  }

  const ic = referrer.invite_code?.trim();
  const countRes = ic
    ? await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .or(`referred_by.eq.${referrer.id},referred_by.eq.${ic}`)
    : await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', referrer.id);
  const { count: totalReferrals, error: cntErr } = countRes;

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
