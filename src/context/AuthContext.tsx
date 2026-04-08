import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { InAppBrowser } from '@capacitor/inappbrowser';
import { supabase } from '../lib/supabase';
import { clearStoredPendingNext } from '../lib/pendingNextAfterOAuth';
import {
  clearPendingReferralCookie,
  getPendingReferralCookie,
} from '../lib/pendingReferralCookie';
import { applyReferralRewards } from '../lib/referral';
import {
  claimAuthSessionAndStore,
  clearStoredAuthSessionToken,
  enforceSingleAuthSession,
  verifyAuthSessionToken,
  subscribeAuthSessionInvalidation,
} from '../lib/authSession';

function isPermanentReferralFailure(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('invalid referral') ||
    m.includes('cannot use your own') ||
    m.includes('different referral') ||
    m.includes('already registered on your account')
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export interface UserProfile {
  id: string;
  email: string | null;
  nickname: string | null;
  point: number;
  invite_code: string | null;
  referred_by: string | null;
  last_mined_at: string | null;
  ad_slots_viewed: number[];
  created_at: string;
  /** docs/supabase-admin-panel.sql 적용 후 */
  role?: string;
  account_status?: string;
  mining_disabled?: boolean;
  /** docs/supabase-single-session.sql — 동일 계정 다른 기기 로그인 시 불일치로 로그아웃 */
  auth_session_token?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** 세션 확정 후 프로필 fetch 진행 중 */
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: false,
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);
  const fetchProfileQueueRef = useRef<Promise<void>>(Promise.resolve());

  const fetchProfile = useCallback(async (userId: string) => {
    const task = async () => {
      setProfileLoading(true);
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_user_row');
        if (rpcError) {
          console.error('[Auth] get_my_user_row failed:', rpcError.message, rpcError);
        }

        const rowFromRpc = ((): Record<string, unknown> | null => {
          if (rpcData == null) return null;
          if (typeof rpcData === 'string') {
            try {
              const parsed = JSON.parse(rpcData) as unknown;
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed as Record<string, unknown>;
              }
            } catch {
              return null;
            }
            return null;
          }
          if (typeof rpcData === 'object' && !Array.isArray(rpcData)) {
            return rpcData as Record<string, unknown>;
          }
          return null;
        })();

        if (!rpcError && rowFromRpc) {
          const rid = rowFromRpc.id != null ? String(rowFromRpc.id) : '';
          if (rid === userId) {
            const row = rowFromRpc as unknown as UserProfile;
            const ok = await enforceSingleAuthSession(userId, row);
            if (ok) {
              setProfile(row);
            }
            return;
          }
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Failed to fetch profile:', error);
          setProfile(null);
          return;
        }
        const row = data as UserProfile;
        const ok = await enforceSingleAuthSession(userId, row);
        if (ok) {
          setProfile(row);
        }
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileQueueRef.current = fetchProfileQueueRef.current.then(task).catch((err) => {
      console.error('[Auth] fetchProfile failed:', err);
    });
    await fetchProfileQueueRef.current;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // OAuth 리다이렉트 URL에서 토큰 추출 후 세션 설정 (공통)
  const setSessionFromOAuthUrl = useCallback(async (url: string) => {
    if (!url || !url.includes('access_token')) return;
    if (!url.includes('capacitor://localhost') && !url.includes('com.web3star.app://localhost')) return;
    let params: URLSearchParams | null = null;
    try {
      const parsed = new URL(url);
      const hash = parsed.hash?.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
      if (hash) params = new URLSearchParams(hash);
      if (!params || !params.get('access_token')) {
        params = parsed.searchParams;
      }
    } catch {
      const hash = url.split('#')[1];
      if (hash) params = new URLSearchParams(hash);
    }
    if (!params) return;
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const result = await App.getLaunchUrl();
          const launchUrl = result?.url;
          if (launchUrl) await setSessionFromOAuthUrl(launchUrl);
        } catch {
          // getLaunchUrl 실패 시 무시 (딥링크로 열리지 않았을 때)
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        // 앱 재실행/복귀로 기존 세션을 복원할 때도 현재 기기를 최신 세션으로 확정해
        // verify 단계의 토큰 불일치 즉시 로그아웃 오탐을 줄인다.
        await claimAuthSessionAndStore(session.user.id);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    })();
  }, [fetchProfile, setSessionFromOAuthUrl]);

  // WebView/Custom Tab 리다이렉트로 앱이 열릴 때 URL 수신 후 세션 설정 + 브라우저 닫기
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listener: { remove: () => Promise<void> } | null = null;
    const handler = async (event: { url: string }) => {
      await setSessionFromOAuthUrl(event.url);
      try {
        await InAppBrowser.close();
      } catch {
        // 브라우저가 이미 닫혀 있으면 무시
      }
    };
    App.addListener('appUrlOpen', handler).then((h) => {
      listener = h;
    });
    return () => {
      listener?.remove();
    };
  }, [setSessionFromOAuthUrl]);

  useEffect(() => {
    lastUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearStoredPendingNext();
        try {
          sessionStorage.removeItem('pending_referral_code');
        } catch {
          /* ignore */
        }
        clearPendingReferralCookie();
        const uid = lastUserIdRef.current;
        if (uid) {
          clearStoredAuthSessionToken(uid);
        }
      }
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        return;
      }
      void (async () => {
        if (event === 'SIGNED_IN') {
          await claimAuthSessionAndStore(session.user.id);
        }
        await fetchProfile(session.user.id);
      })();
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  /** Realtime: 다른 기기에서 claim 시 토큰 변경 감지 (RPC 재확인, 디바운스 적용) */
  useEffect(() => {
    if (!user?.id) return;
    return subscribeAuthSessionInvalidation(user.id);
  }, [user?.id]);

  /** 폴링 + 앱 복귀만 검사 (탭 visibility는 WebView/브라우저마다 오탐이 나와 제외) */
  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;

    const tick = () => {
      void verifyAuthSessionToken(uid);
    };

    const interval = window.setInterval(tick, 30_000);

    const resumeListenerPromise = Capacitor.isNativePlatform()
      ? App.addListener('resume', tick)
      : null;

    return () => {
      window.clearInterval(interval);
      void resumeListenerPromise?.then((h) => h.remove());
    };
  }, [user?.id]);

  // Web Google OAuth: 로그인 직전 referral을 sessionStorage(+쿠키 백업)에 두고, 세션 후 적용. DB/세션 준비 지연 시 재시도.
  useEffect(() => {
    if (!user?.id) return;

    let code = '';
    try {
      code = sessionStorage.getItem('pending_referral_code')?.trim() ?? '';
    } catch {
      /* ignore */
    }
    if (!code) {
      const fromCookie = getPendingReferralCookie()?.trim() ?? '';
      if (!fromCookie) return;
      code = fromCookie;
      try {
        sessionStorage.setItem('pending_referral_code', code);
      } catch {
        /* ignore */
      }
    }

    let cancelled = false;
    const run = async () => {
      const delays = [0, 600, 1500, 3000, 5000];
      for (let i = 0; i < delays.length; i++) {
        if (cancelled) return;
        if (delays[i] > 0) await sleep(delays[i]);
        if (cancelled) return;

        const res = await applyReferralRewards(user.id, code);
        if (res.ok) {
          try {
            sessionStorage.removeItem('pending_referral_code');
          } catch {
            /* ignore */
          }
          clearPendingReferralCookie();
          await fetchProfile(user.id);
          return;
        }

        if (isPermanentReferralFailure(res.message)) {
          try {
            sessionStorage.removeItem('pending_referral_code');
          } catch {
            /* ignore */
          }
          clearPendingReferralCookie();
          console.warn('[referral] permanent failure, cleared pending:', res.message);
          return;
        }
      }
      console.warn(
        '[referral] pending_referral_code: transient errors after retries; code left for next session if you sign out/in',
      );
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
