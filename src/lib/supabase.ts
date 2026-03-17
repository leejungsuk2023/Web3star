import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables');
}

/** OAuth 후 돌아올 URL. 앱에서는 앱 스킴 또는 호스팅 콜백(에뮬레이터용).
 *  에뮬레이터에서 intent가 안 열리면: 웹을 배포한 뒤 VITE_OAUTH_CALLBACK_URL=https://도메인/oauth-callback.html 설정 후 Supabase Redirect URL에 추가 */
export function getAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    const callbackUrl = import.meta.env.VITE_OAUTH_CALLBACK_URL;
    if (callbackUrl) return callbackUrl;
    return 'com.web3star.app://localhost';
  }
  return window.location.origin;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
