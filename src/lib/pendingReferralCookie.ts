/** OAuth 전체 페이지 이동 후에도 추천 코드를 잃지 않도록 sessionStorage 보조 (SameSite=Lax) */

const COOKIE_KEY = 'web3star_pending_referral';

export function setPendingReferralCookie(value: string): void {
  const t = value.trim();
  if (!t) {
    clearPendingReferralCookie();
    return;
  }
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(t)}; Path=/; Max-Age=600; SameSite=Lax`;
}

export function getPendingReferralCookie(): string | null {
  try {
    const parts = (document.cookie ?? '').split(';').map((p) => p.trim());
    const found = parts.find((p) => p.startsWith(`${COOKIE_KEY}=`));
    if (!found) return null;
    return decodeURIComponent(found.split('=').slice(1).join('='));
  } catch {
    return null;
  }
}

export function clearPendingReferralCookie(): void {
  document.cookie = `${COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
