/// <reference types="vite/client" />
import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

let initialized = false;

export async function initSocialLogin(): Promise<void> {
  if (initialized) return;
  // 일부 환경에서 isNativePlatform()이 기대와 다르게 false일 수 있어,
  // web 여부는 getPlatform()으로 더 확실히 판정합니다.
  const platform = (Capacitor as any).getPlatform?.() ?? '';
  if (platform === 'web') return;

  const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;
  if (!webClientId) {
    // 네이티브 Google 로그인은 Web Client ID가 필요합니다.
    throw new Error('Missing VITE_GOOGLE_WEB_CLIENT_ID');
  }

  console.warn('[SocialLogin] initializing on platform=', platform);
  await GoogleSignIn.initialize({
    clientId: webClientId,
    scopes: ['openid', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
  });

  initialized = true;
}

export async function googleNativeIdToken(): Promise<string> {
  await initSocialLogin();

  try {
    const res = await GoogleSignIn.signIn();
    const idToken = (res as any)?.idToken;
    if (typeof idToken !== 'string' || !idToken.length) {
      throw new Error('Google login succeeded but idToken missing');
    }
    return idToken;
  } catch (e: any) {
    console.warn('GoogleSignIn.signIn failed:', e);
    const code = e?.code ?? e?.error?.code;
    const message = e?.message ?? e?.error ?? 'Google sign-in failed/canceled';
    throw new Error(code ? `${message} (${code})` : message);
  }
}

