/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseEnv) {
  // Do not crash the entire site (landing page should still be viewable).
  // Auth features will fail until env vars are configured in deployment.
  console.error('[Web3Star] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

/** anon JWT payload의 ref가 URL 서브도메인과 같아야 함. 다르면 Supabase가 "Invalid API key" 반환 */
function decodeSupabaseJwtRef(anonKey: string): string | null {
  try {
    const mid = anonKey.split('.')[1];
    if (!mid) return null;
    const base64 = mid.replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - (base64.length % 4)) % 4);
    const json = JSON.parse(atob(base64 + pad)) as { ref?: string };
    return json.ref ?? null;
  } catch {
    return null;
  }
}

function assertSupabaseProjectMatchesAnonKey(url: string, anonKey: string) {
  let host: string;
  try {
    host = new URL(url).hostname.split('.')[0];
  } catch {
    return;
  }
  const ref = decodeSupabaseJwtRef(anonKey);
  if (!ref || !host) return;
  if (ref !== host) {
    throw new Error(
      `Supabase 설정 오류: URL 프로젝트(${host})와 anon 키의 ref(${ref})가 다릅니다. ` +
        `대시보드 → Project Settings → API에서 Project URL과 anon public 키를 같은 화면에서 함께 복사해 .env.local에 넣은 뒤 ` +
        `npm run build && npx cap sync 후 앱을 다시 설치하세요. (이 상태면 로그인 시 "Invalid API key"가 납니다.)`,
    );
  }
}

if (hasSupabaseEnv) {
  assertSupabaseProjectMatchesAnonKey(supabaseUrl!, supabaseAnonKey!);
}

export function isLikelyNativePlatform(): boolean {
  // Capacitor.isNativePlatform()만으로 분기하면, 일부 환경에서 기대대로 동작하지 않을 수 있어
  // UA로 한 번 더 보정합니다.
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // ignore
  }

  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('android') || ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios');
}

/** OAuth 후 돌아올 URL. 앱에서는 앱 스킴 또는 호스팅 콜백(에뮬레이터용).
 *  에뮬레이터에서 intent가 안 열리면: 웹을 배포한 뒤 VITE_OAUTH_CALLBACK_URL=https://도메인/oauth-callback.html 설정 후 Supabase Redirect URL에 추가 */
export function getAuthRedirectUrl(): string {
  if (isLikelyNativePlatform()) {
    const callbackUrl = import.meta.env.VITE_OAUTH_CALLBACK_URL;
    if (callbackUrl) return callbackUrl;
    return 'com.web3star.app://localhost';
  }
  // Web deployment can live under a subpath (e.g. GitHub Pages `/Web3star/`).
  // Return to app login route so OAuth completion continues inside the app flow.
  const basePath = import.meta.env.BASE_URL || '/';
  const appBaseUrl = new URL(basePath, window.location.origin);
  return new URL('app/login', appBaseUrl).toString();
}

const fallbackSupabaseUrl = 'https://example.supabase.co';
const fallbackSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWYiOiJleGFtcGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjAsImV4cCI6MzI1MDM2ODAwMDB9.placeholder';

export const supabase = createClient(
  hasSupabaseEnv ? supabaseUrl! : fallbackSupabaseUrl,
  hasSupabaseEnv ? supabaseAnonKey! : fallbackSupabaseAnonKey,
);
