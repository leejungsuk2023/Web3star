import { supabase } from './supabase';

const PREFIX = 'web3star_auth_sess_v1_';
const LAST_LOGOUT_REASON_KEY = 'web3star_last_logout_reason_v1';

/**
 * claim RPC 직후 서버 토큰은 최신인데 WebView localStorage 반영이 늦을 수 있음.
 * 같은 틱에서 verify가 돌면 불일치로 오탐 로그아웃 → 메모리에 먼저 올려 검증과 맞춘다.
 */
const memAuthSessionToken = new Map<string, string>();
const claimInFlightByUser = new Map<string, Promise<string | null>>();
const MISMATCH_RECHECK_DELAY_MS = 450;
const MISMATCH_RECHECK_ATTEMPTS = 2;

function rememberAuthSessionToken(userId: string, token: string): void {
  memAuthSessionToken.set(userId, token);
}

function forgetAuthSessionToken(userId: string): void {
  memAuthSessionToken.delete(userId);
}

/** 스토리지보다 RPC 직후 메모리 값을 우선 (지연 쓰기 레이스 방지) */
function readEffectiveLocalAuthSessionNorm(userId: string): string | null {
  const nMem = normalizeAuthSessionToken(memAuthSessionToken.get(userId));
  if (nMem) return nMem;
  return normalizeAuthSessionToken(readStoredAuthSessionToken(userId));
}

type LogoutReason =
  | 'single_session_mismatch_enforce'
  | 'single_session_mismatch_verify'
  | 'unknown';

export function writeLastLogoutReason(reason: LogoutReason, detail?: string): void {
  const payload = JSON.stringify({
    at: Date.now(),
    reason,
    detail: detail?.slice(0, 300) ?? '',
  });
  try {
    localStorage.setItem(LAST_LOGOUT_REASON_KEY, payload);
    return;
  } catch {
    /* fall through */
  }
  try {
    sessionStorage.setItem(LAST_LOGOUT_REASON_KEY, payload);
  } catch {
    /* ignore */
  }
}

export function readLastLogoutReason(): { at: number; reason: LogoutReason; detail?: string } | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LAST_LOGOUT_REASON_KEY);
  } catch {
    /* fall through */
  }
  if (!raw) {
    try {
      raw = sessionStorage.getItem(LAST_LOGOUT_REASON_KEY);
    } catch {
      raw = null;
    }
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const p = parsed as Record<string, unknown>;
    const at = typeof p.at === 'number' ? p.at : 0;
    const reason = typeof p.reason === 'string' ? (p.reason as LogoutReason) : 'unknown';
    const detail = typeof p.detail === 'string' ? p.detail : undefined;
    return { at, reason, detail };
  } catch {
    return null;
  }
}

export function clearLastLogoutReason(): void {
  try {
    localStorage.removeItem(LAST_LOGOUT_REASON_KEY);
  } catch {
    /* fall through */
  }
  try {
    sessionStorage.removeItem(LAST_LOGOUT_REASON_KEY);
  } catch {
    /* ignore */
  }
}

async function signOutWithReason(userId: string, reason: LogoutReason, detail?: string): Promise<void> {
  writeLastLogoutReason(reason, detail);
  await supabase.auth.signOut();
  clearStoredAuthSessionToken(userId);
}

async function waitForClaimInFlight(userId: string): Promise<void> {
  const pending = claimInFlightByUser.get(userId);
  if (!pending) return;
  try {
    await pending;
  } catch {
    /* ignore claim errors; caller handles next steps */
  }
}

/** UUID 비교 오탐(대소문자·공백) 방지 */
export function normalizeAuthSessionToken(t: string | null | undefined): string | null {
  if (t == null) return null;
  const s = String(t).trim().toLowerCase();
  return s.length ? s : null;
}

export function authSessionStorageKey(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function readStoredAuthSessionToken(userId: string): string | null {
  const k = authSessionStorageKey(userId);
  try {
    const a = localStorage.getItem(k);
    if (a != null && a !== '') return a;
  } catch {
    /* fall through */
  }
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}

/** localStorage 실패(용량·WebView) 시 sessionStorage 폴백. 성공 시 읽어 검증. */
export function writeStoredAuthSessionToken(userId: string, token: string): boolean {
  rememberAuthSessionToken(userId, token);
  const k = authSessionStorageKey(userId);
  try {
    localStorage.setItem(k, token);
    if (localStorage.getItem(k) === token) {
      try {
        sessionStorage.removeItem(k);
      } catch {
        /* ignore */
      }
      return true;
    }
  } catch {
    /* try sessionStorage */
  }
  try {
    sessionStorage.setItem(k, token);
    return sessionStorage.getItem(k) === token;
  } catch {
    return false;
  }
}

export function clearStoredAuthSessionToken(userId: string): void {
  forgetAuthSessionToken(userId);
  const k = authSessionStorageKey(userId);
  try {
    localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

async function assertSessionUserId(userId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return Boolean(user && user.id === userId);
}

async function claimAndPersistToken(userId: string, source: string): Promise<string | null> {
  const pending = claimInFlightByUser.get(userId);
  if (pending) return pending;

  const task = (async (): Promise<string | null> => {
    if (!(await assertSessionUserId(userId))) return null;

    const { data, error } = await supabase.rpc('claim_my_auth_session');
    if (error || data == null) {
      if (error) console.warn(`[Auth] claim_my_auth_session (${source}) failed:`, error.message);
      return null;
    }

    const t = String(data);
    if (!writeStoredAuthSessionToken(userId, t)) {
      console.warn(`[Auth] ${source}: storage write failed after claim; syncing from server`);
      const { data: tok, error: tokErr } = await supabase.rpc('get_my_auth_session_token');
      if (!tokErr && tok != null) {
        writeStoredAuthSessionToken(userId, String(tok));
      }
    }
    return t;
  })();

  claimInFlightByUser.set(userId, task);
  try {
    return await task;
  } finally {
    claimInFlightByUser.delete(userId);
  }
}

async function confirmPersistentMismatch(
  userId: string,
  initialServerN: string | null,
): Promise<{ confirmed: boolean; localN: string | null; serverN: string | null }> {
  let serverN = initialServerN;
  let localN = readEffectiveLocalAuthSessionNorm(userId);

  for (let i = 0; i < MISMATCH_RECHECK_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, MISMATCH_RECHECK_DELAY_MS));
    await waitForClaimInFlight(userId);
    if (!(await assertSessionUserId(userId))) {
      return { confirmed: false, localN, serverN };
    }

    localN = readEffectiveLocalAuthSessionNorm(userId);
    if (!localN || !serverN || localN === serverN) {
      return { confirmed: false, localN, serverN };
    }

    const { data, error } = await supabase.rpc('get_my_auth_session_token');
    if (error) {
      console.warn('[Auth] get_my_auth_session_token recheck failed:', error.message);
      return { confirmed: false, localN, serverN };
    }
    serverN = normalizeAuthSessionToken(data != null ? String(data) : null);
    if (!serverN || localN === serverN) {
      return { confirmed: false, localN, serverN };
    }
  }

  return { confirmed: Boolean(localN && serverN && localN !== serverN), localN, serverN };
}

/** 새 로그인 직후: 서버 토큰을 갱신하고 로컬에 저장 */
export async function claimAuthSessionAndStore(userId: string): Promise<void> {
  await claimAndPersistToken(userId, 'claim');
}

export type UserProfileLike = {
  id: string;
  auth_session_token?: string | null;
};

/**
 * 프로필 로드 직후 호출. false면 이미 signOut 처리됨(다른 기기에서 세션 탈취).
 * row는 토큰 갱신 시 메모리상 필드를 갱신할 수 있음.
 */
export async function enforceSingleAuthSession(
  userId: string,
  row: UserProfileLike,
): Promise<boolean> {
  if (String(row.id) !== String(userId)) {
    return true;
  }
  if (!(await assertSessionUserId(userId))) {
    return true;
  }

  let serverTok =
    row.auth_session_token != null && row.auth_session_token !== ''
      ? String(row.auth_session_token)
      : null;
  const localN = readEffectiveLocalAuthSessionNorm(userId);
  const serverN = normalizeAuthSessionToken(serverTok);

  const doClaim = async (): Promise<string | null> => {
    const t = await claimAndPersistToken(userId, 'enforce');
    if (!t) return null;
    row.auth_session_token = t;
    return t;
  };

  if (!serverN) {
    await doClaim();
    return true;
  }

  if (!localN) {
    await doClaim();
    return true;
  }

  if (localN !== serverN) {
    const confirmed = await confirmPersistentMismatch(userId, serverN);
    if (!confirmed.confirmed) {
      return true;
    }
    await signOutWithReason(
      userId,
      'single_session_mismatch_enforce',
      `local=${confirmed.localN} server=${confirmed.serverN}`,
    );
    return false;
  }

  return true;
}

/** 서버 토큰만 조회해 로컬과 비교 (폴링·앱 복귀) */
export async function verifyAuthSessionToken(userId: string): Promise<void> {
  if (!(await assertSessionUserId(userId))) return;
  await waitForClaimInFlight(userId);

  const localN = readEffectiveLocalAuthSessionNorm(userId);
  if (!localN) return;

  const { data, error } = await supabase.rpc('get_my_auth_session_token');
  if (error) {
    console.warn('[Auth] get_my_auth_session_token failed:', error.message);
    return;
  }

  const serverN = normalizeAuthSessionToken(data != null ? String(data) : null);
  if (serverN && serverN !== localN) {
    const confirmed = await confirmPersistentMismatch(userId, serverN);
    if (!confirmed.confirmed) {
      return;
    }
    await signOutWithReason(
      userId,
      'single_session_mismatch_verify',
      `local=${confirmed.localN} server=${confirmed.serverN}`,
    );
  }
}

const REALTIME_VERIFY_DEBOUNCE_MS = 650;

/**
 * 다른 기기에서 `claim_my_auth_session`으로 토큰이 바뀌면 Realtime 후 RPC로 재확인.
 * 채굴/포인트 등으로 `users` 행이 자주 갱신되므로 디바운스를 넉넉히 두어 claim 직후 저장과의 레이스를 줄임.
 */
export function subscribeAuthSessionInvalidation(userId: string): () => void {
  let debounce: number | null = null;
  const scheduleVerify = () => {
    if (debounce != null) window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      debounce = null;
      void verifyAuthSessionToken(userId);
    }, REALTIME_VERIFY_DEBOUNCE_MS);
  };

  const channel = supabase
    .channel(`auth-session-invalidate:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      },
      () => {
        scheduleVerify();
      },
    )
    .subscribe();

  return () => {
    if (debounce != null) window.clearTimeout(debounce);
    void supabase.removeChannel(channel);
  };
}
