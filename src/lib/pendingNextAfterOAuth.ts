/** Google OAuth 직전에 저장해, 리디렉트로 `?next=` 가 사라져도 관리자 경로로 복귀할 수 있게 함 */

export const PENDING_NEXT_KEY = 'web3star_pending_next';

const PENDING_NEXT_COOKIE_KEY = 'web3star_pending_next_cookie';

const LOCAL_TTL_MS = 15 * 60 * 1000;

function setPendingNextCookie(value: string) {
  document.cookie = `${PENDING_NEXT_COOKIE_KEY}=${encodeURIComponent(value)}; Path=/; Max-Age=600; SameSite=Lax`;
}

function getPendingNextCookie(): string | null {
  try {
    const cookie = document.cookie ?? '';
    const parts = cookie.split(';').map((p) => p.trim());
    const found = parts.find((p) => p.startsWith(`${PENDING_NEXT_COOKIE_KEY}=`));
    if (!found) return null;
    return decodeURIComponent(found.split('=').slice(1).join('='));
  } catch {
    return null;
  }
}

function clearPendingNextCookie() {
  document.cookie = `${PENDING_NEXT_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function readLocalPendingNext(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_NEXT_KEY);
    if (!raw?.trim()) return null;
    if (raw.startsWith('{')) {
      const o = JSON.parse(raw) as { path?: string; at?: number };
      if (o.path?.trim().startsWith('/admin') && typeof o.at === 'number') {
        if (Date.now() - o.at > LOCAL_TTL_MS) {
          localStorage.removeItem(PENDING_NEXT_KEY);
          return null;
        }
        return o.path.trim();
      }
      return null;
    }
    return raw.trim();
  } catch {
    return null;
  }
}

/** OAuth 전: 세션·로컬·쿠키에 저장 (루트 URL로만 돌아와도 복구) */
export function writeStoredPendingNext(path: string): void {
  const t = path.trim();
  if (!t) return;
  try {
    sessionStorage.setItem(PENDING_NEXT_KEY, t);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(PENDING_NEXT_KEY, JSON.stringify({ path: t, at: Date.now() }));
  } catch {
    /* ignore */
  }
  try {
    setPendingNextCookie(t);
  } catch {
    /* ignore */
  }
}

/** 로그인 완료 후 읽기: session → local(TTL) → cookie */
export function readStoredPendingNext(): string | null {
  try {
    const s = sessionStorage.getItem(PENDING_NEXT_KEY);
    if (s?.trim()) return s.trim();
  } catch {
    /* ignore */
  }
  const fromLocal = readLocalPendingNext();
  if (fromLocal) return fromLocal;
  return getPendingNextCookie();
}

export function clearStoredPendingNext(): void {
  try {
    sessionStorage.removeItem(PENDING_NEXT_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(PENDING_NEXT_KEY);
  } catch {
    /* ignore */
  }
  clearPendingNextCookie();
}
