import { supabase } from './supabase';

const PREFIX = 'web3star_auth_sess_v1_';

export function authSessionStorageKey(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function readStoredAuthSessionToken(userId: string): string | null {
  try {
    return localStorage.getItem(authSessionStorageKey(userId));
  } catch {
    return null;
  }
}

export function writeStoredAuthSessionToken(userId: string, token: string): void {
  try {
    localStorage.setItem(authSessionStorageKey(userId), token);
  } catch {
    /* ignore */
  }
}

export function clearStoredAuthSessionToken(userId: string): void {
  try {
    localStorage.removeItem(authSessionStorageKey(userId));
  } catch {
    /* ignore */
  }
}

/** 새 로그인 직후: 서버 토큰을 갱신하고 로컬에 저장 */
export async function claimAuthSessionAndStore(userId: string): Promise<void> {
  const { data, error } = await supabase.rpc('claim_my_auth_session');
  if (error) {
    console.warn('[Auth] claim_my_auth_session failed:', error.message);
    return;
  }
  if (data != null) {
    writeStoredAuthSessionToken(userId, String(data));
  }
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
  let serverTok =
    row.auth_session_token != null && row.auth_session_token !== ''
      ? String(row.auth_session_token)
      : null;
  const local = readStoredAuthSessionToken(userId);

  const doClaim = async (): Promise<string | null> => {
    const { data, error } = await supabase.rpc('claim_my_auth_session');
    if (error || data == null) {
      if (error) console.warn('[Auth] claim_my_auth_session (enforce) failed:', error.message);
      return null;
    }
    const t = String(data);
    writeStoredAuthSessionToken(userId, t);
    row.auth_session_token = t;
    return t;
  };

  if (!serverTok) {
    await doClaim();
    return true;
  }

  if (!local) {
    await doClaim();
    return true;
  }

  if (local !== serverTok) {
    await supabase.auth.signOut();
    clearStoredAuthSessionToken(userId);
    return false;
  }

  return true;
}

/** 서버 토큰만 조회해 로컬과 비교 (폴링·앱 복귀) */
export async function verifyAuthSessionToken(userId: string): Promise<void> {
  const local = readStoredAuthSessionToken(userId);
  if (!local) return;

  const { data, error } = await supabase.rpc('get_my_auth_session_token');
  if (error) {
    console.warn('[Auth] get_my_auth_session_token failed:', error.message);
    return;
  }

  const server = data != null ? String(data) : null;
  if (server && server !== local) {
    await supabase.auth.signOut();
    clearStoredAuthSessionToken(userId);
  }
}
