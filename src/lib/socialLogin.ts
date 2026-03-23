/// <reference types="vite/client" />
import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

let initialized = false;

export async function initSocialLogin(): Promise<void> {
  if (initialized) return;
  // In some setups `isNativePlatform()` can be unreliable; use getPlatform() for web detection.
  const platform = (Capacitor as any).getPlatform?.() ?? '';
  if (platform === 'web') return;

  const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;
  if (!webClientId) {
    // Native Google Sign-In requires the Web client ID.
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

