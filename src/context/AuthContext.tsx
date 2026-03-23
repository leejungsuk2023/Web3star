import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { InAppBrowser } from '@capacitor/inappbrowser';
import { supabase } from '../lib/supabase';
import { applyReferralRewards } from '../lib/referral';

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
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch profile:', error);
      return;
    }
    setProfile(data as UserProfile);
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
    const hash = url.split('#')[1];
    if (!hash) return;
    const params = new URLSearchParams(hash);
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
    App.addListener('appUrlOpen', handler).then((h) => { listener = h; });
    return () => {
      listener?.remove();
    };
  }, [setSessionFromOAuthUrl]);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Web Google OAuth: Signup/Login stores referral code before redirect; apply after session exists.
  useEffect(() => {
    if (!user?.id) return;
    const code = sessionStorage.getItem('pending_referral_code');
    if (!code?.trim()) return;
    sessionStorage.removeItem('pending_referral_code');
    void applyReferralRewards(user.id, code).then(async (res) => {
      if (!res.ok) {
        console.warn('[referral] pending_referral_code apply failed:', res.message);
        return;
      }
      await fetchProfile(user.id);
    });
  }, [user?.id, fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
