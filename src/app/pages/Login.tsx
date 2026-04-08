import React, { useEffect, useState } from 'react';
import logoImage from '../../assets/signup-hero-new.png';
import { useNavigate, useSearchParams } from 'react-router';
import GoogleIcon from '../components/GoogleIcon';
import { Capacitor } from '@capacitor/core';
import { supabase, getAuthRedirectUrlWithNext, isLikelyNativePlatform } from '../../lib/supabase';
import { googleNativeIdToken } from '../../lib/socialLogin';
import { applyReferralRewards } from '../../lib/referral';
import { useAuth } from '../../context/AuthContext';
import { getSafePostLoginPath } from '../../lib/loginRedirect';
import { clearLastLogoutReason, readLastLogoutReason } from '../../lib/authSession';
import {
  clearStoredPendingNext,
  readStoredPendingNext,
  writeStoredPendingNext,
} from '../../lib/pendingNextAfterOAuth';
import { attachAuthKeyboardScroll } from '../../lib/keyboardLayout';
import {
  AUTH_PAGE_INNER_CLASS,
  AUTH_PAGE_OUTER_CLASS,
  LOGIN_FOOTER_PB_CLASS,
} from '../../lib/nativeLayout';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../components/TermsOfServiceModal';
import {
  clearPendingReferralCookie,
  setPendingReferralCookie,
} from '../../lib/pendingReferralCookie';

const TERMS_AGREED_KEY = 'web3star_terms_agreed';

export default function Login() {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginNext = searchParams.get('next');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastLogout, setLastLogout] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const canProceed = agreedToTerms && agreedToPrivacy;

  useEffect(() => {
    attachAuthKeyboardScroll();
    try {
      if (localStorage.getItem(TERMS_AGREED_KEY) === 'true') {
        setAgreedToTerms(true);
        setAgreedToPrivacy(true);
      }
    } catch {
      /* ignore */
    }

    const info = readLastLogoutReason();
    if (info?.reason) {
      const ageSec = Math.max(0, Math.floor((Date.now() - (info.at || 0)) / 1000));
      setLastLogout(`[last logout] ${info.reason} (${ageSec}s ago) ${info.detail ?? ''}`.trim());
    }
  }, []);

  const proceedGoogleLogin = async (code: string) => {
    setLoading(true);
    try {
      setError('');
      clearLastLogoutReason();
      if (isLikelyNativePlatform()) {
        const idToken = await googleNativeIdToken();
        const { data: sessionData, error: idTokenError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (idTokenError) {
          setError(idTokenError.message);
          return;
        }
        if (sessionData?.user && code.trim()) {
          const refRes = await applyReferralRewards(sessionData.user.id, code);
          if (!refRes.ok) {
            setError(refRes.message);
            return;
          }
          await refreshProfile();
        }
        navigate(getSafePostLoginPath(loginNext));
        return;
      }

      if (code.trim()) {
        try {
          sessionStorage.setItem('pending_referral_code', code.trim());
        } catch {
          /* ignore */
        }
        setPendingReferralCookie(code.trim());
      } else {
        try {
          sessionStorage.removeItem('pending_referral_code');
        } catch {
          /* ignore */
        }
        clearPendingReferralCookie();
      }
      if (loginNext) {
        writeStoredPendingNext(loginNext);
      }
      const computedRedirect = getAuthRedirectUrlWithNext(loginNext);
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: computedRedirect },
      });
      if (oauthError) {
        setError(oauthError.message);
        return;
      }
      if (data?.url) {
        const authUrl = new URL(data.url);
        const returnedRedirectTo = authUrl.searchParams.get('redirect_to');
        const blockLocalhostRedirect =
          Boolean(returnedRedirectTo?.includes('localhost')) && !import.meta.env.DEV;
        if (blockLocalhostRedirect) {
          setError(
            `OAuth misconfiguration: Supabase returned a localhost redirect (${returnedRedirectTo}). ` +
              `Check Site URL and Redirect URLs in Supabase Auth (e.g. for GitHub Pages).`,
          );
          return;
        }
        window.location.href = data.url;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  /** 신규 가입 흐름: 약관 필수 + 입력한 추천코드(있으면)를 OAuth 직전에 붙임 */
  const handleGoogleSignUp = () => {
    if (loading || !canProceed) return;
    try {
      localStorage.setItem(TERMS_AGREED_KEY, 'true');
    } catch {
      /* ignore */
    }
    void proceedGoogleLogin(referralCode.trim());
  };

  /** 기존 계정 로그인: 동일 Google OAuth이나 추천코드는 넣지 않음(실수로 타인 코드 적용 방지) */
  const handleGoogleLogIn = () => {
    if (loading) return;
    void proceedGoogleLogin('');
  };

  React.useEffect(() => {
    if (authLoading) return;
    if (user) {
      const pendingNext = readStoredPendingNext();
      clearStoredPendingNext();
      const effectiveNext = loginNext ?? pendingNext;
      navigate(getSafePostLoginPath(effectiveNext), { replace: true });
    }
  }, [authLoading, user, navigate, loginNext]);

  return (
    <div className={AUTH_PAGE_OUTER_CLASS}>
      <div className={AUTH_PAGE_INNER_CLASS}>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            data-auth-scroll-root
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
          >
            <div className="flex min-h-full flex-col px-6 pt-[max(1rem,env(safe-area-inset-top,24px))]">
              <div className="flex flex-1 flex-col items-center justify-center space-y-5 pb-8">
                <div className="flex w-full flex-col items-center">
                  <img
                    src={logoImage}
                    alt="Web3Star Logo"
                    className="mb-2 w-full mix-blend-screen opacity-90"
                  />
                </div>

                <p className="max-w-sm text-center text-sm text-gray-400">
                  Use Google only. <span className="text-zinc-300">Continue with Google</span> is for new
                  accounts (optional referral below). <span className="text-zinc-300">Log in with Google</span>{' '}
                  is for returning users.
                </p>

                <div className="w-full max-w-md space-y-4">
                  <div>
                    <label htmlFor="login-referral" className="mb-2 block text-sm text-gray-400">
                      Referral code{' '}
                      <span className="text-gray-600">(optional · only for new sign-up button)</span>
                    </label>
                    <input
                      id="login-referral"
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      autoComplete="off"
                      className="w-full rounded-lg border border-gray-800 bg-[#1a1a24] px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      placeholder="Enter referral code"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-cyan-400"
                      />
                      <span className="text-sm text-gray-300">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsTermsModalOpen(true);
                          }}
                          className="inline cursor-pointer border-0 bg-transparent p-0 align-baseline text-sm font-inherit text-cyan-400 underline hover:text-cyan-300"
                        >
                          Terms of Service
                        </button>
                        <span className="text-red-400"> (required)</span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={agreedToPrivacy}
                        onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                        className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-cyan-400"
                      />
                      <span className="text-sm text-gray-300">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsPrivacyPolicyOpen(true);
                          }}
                          className="inline cursor-pointer border-0 bg-transparent p-0 align-baseline text-sm font-inherit text-cyan-400 underline hover:text-cyan-300"
                        >
                          Privacy Policy
                        </button>
                        <span className="text-red-400"> (required)</span>
                      </span>
                    </label>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="w-full max-w-md rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400"
                  >
                    {error}
                  </div>
                )}

                {lastLogout && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="w-full max-w-md rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-center text-sm text-cyan-200"
                  >
                    {lastLogout}
                  </div>
                )}

                <div className="flex w-full max-w-md flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={loading || !canProceed}
                    title={
                      !canProceed ? 'Please accept the Terms of Service and Privacy Policy' : undefined
                    }
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-6 py-3.5 font-semibold text-gray-800 shadow-lg transition-all duration-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <GoogleIcon className="h-5 w-5" />
                    {loading ? 'Connecting…' : 'Continue with Google'}
                  </button>
                  <p className="text-center text-[11px] text-gray-500">New account — uses referral code if filled</p>

                  <button
                    type="button"
                    onClick={handleGoogleLogIn}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-600 bg-zinc-900/80 px-6 py-3.5 font-semibold text-zinc-100 shadow-md transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-800/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <GoogleIcon className="h-5 w-5" />
                    {loading ? 'Connecting…' : 'Log in with Google'}
                  </button>
                  <p className="text-center text-[11px] text-gray-500">
                    Existing account — referral field is ignored
                  </p>
                </div>

                {!canProceed && (
                  <p className="max-w-md text-center text-xs text-gray-500">
                    Check both boxes above to use <span className="text-zinc-400">Continue with Google</span>{' '}
                    (new account). <span className="text-zinc-400">Log in with Google</span> works without them.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            className={`mt-auto w-full shrink-0 border-t border-gray-800/80 bg-[#0a0a0f]/95 px-6 pt-4 backdrop-blur ${LOGIN_FOOTER_PB_CLASS}`}
          >
            {import.meta.env.DEV && Capacitor.isNativePlatform() && (
              <button
                type="button"
                onClick={() => navigate('/app/admob-test')}
                className="mb-3 w-full text-center text-xs text-gray-500 transition-colors hover:text-gray-300"
              >
                AdMob Test (Android/iOS)
              </button>
            )}
          </div>
        </div>
      </div>

      <PrivacyPolicyModal isOpen={isPrivacyPolicyOpen} onClose={() => setIsPrivacyPolicyOpen(false)} />
      <TermsOfServiceModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
    </div>
  );
}
