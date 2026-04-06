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

const TERMS_AGREED_KEY = 'web3star_terms_agreed';

function PreAuthModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (referralCode: string) => void;
  onCancel: () => void;
}) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const canProceed = agreedToTerms && agreedToPrivacy;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-black/70 px-4 py-6 backdrop-blur-sm [-webkit-overflow-scrolling:touch]"
      data-modal-scroll-root
    >
      <div className="flex min-h-[100dvh] min-h-[100%] w-full items-end justify-center pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:items-center sm:py-8">
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-gray-700 bg-[#13131e] p-6 shadow-2xl">
          <h2 className="text-center text-lg font-bold text-white">계속하기 전에</h2>
          <p className="text-center text-xs text-gray-500">
            Google로 로그인합니다. 처음 오시는 분도 같은 버튼으로 가입됩니다. 추천 코드가 있으면 입력하세요(선택).
          </p>

          <div>
            <label htmlFor="modal-referral" className="mb-2 block text-sm text-gray-400">
              추천 코드 <span className="text-gray-600">(선택)</span>
            </label>
            <input
              id="modal-referral"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-[#1a1a24] px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              placeholder="추천 코드"
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsTermsModalOpen(true);
                  }}
                  className="inline cursor-pointer border-0 bg-transparent p-0 align-baseline text-sm font-inherit text-cyan-400 underline hover:text-cyan-300"
                >
                  이용약관
                </button>
                에 동의합니다 <span className="text-red-400">(필수)</span>
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsPrivacyPolicyOpen(true);
                  }}
                  className="inline cursor-pointer border-0 bg-transparent p-0 align-baseline text-sm font-inherit text-cyan-400 underline hover:text-cyan-300"
                >
                  개인정보 처리방침
                </button>
                에 동의합니다 <span className="text-red-400">(필수)</span>
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-700 py-3 text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(TERMS_AGREED_KEY, 'true');
                onConfirm(referralCode.trim());
              }}
              disabled={!canProceed}
              className="flex-1 rounded-lg bg-cyan-500 py-3 text-sm font-semibold text-black transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              동의하고 계속
            </button>
          </div>

          <PrivacyPolicyModal isOpen={isPrivacyPolicyOpen} onClose={() => setIsPrivacyPolicyOpen(false)} />
          <TermsOfServiceModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginNext = searchParams.get('next');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => attachAuthKeyboardScroll(), []);

  const proceedGoogleLogin = async (referralCode = '') => {
    setLoading(true);
    setShowModal(false);
    try {
      setError('');
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
        if (sessionData?.user && referralCode.trim()) {
          const refRes = await applyReferralRewards(sessionData.user.id, referralCode);
          if (!refRes.ok) {
            setError(refRes.message);
            return;
          }
          await refreshProfile();
        }
        navigate(getSafePostLoginPath(loginNext));
        return;
      }

      if (referralCode.trim()) {
        sessionStorage.setItem('pending_referral_code', referralCode.trim());
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
            `OAuth 설정 오류: Supabase가 localhost로 리다이렉트합니다 (${returnedRedirectTo}). ` +
              `GitHub Pages용 Site URL·Redirect URL을 확인하세요.`,
          );
          return;
        }
        window.location.href = data.url;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Google 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (loading) return;
    if (isLikelyNativePlatform()) {
      setShowModal(true);
      return;
    }

    const alreadyAgreed = localStorage.getItem(TERMS_AGREED_KEY) === 'true';
    if (alreadyAgreed) {
      void proceedGoogleLogin();
      return;
    }
    setShowModal(true);
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
              <div className="flex flex-1 flex-col items-center justify-center space-y-6 pb-8">
                <div className="flex w-full flex-col items-center">
                  <img
                    src={logoImage}
                    alt="Web3Star Logo"
                    className="mb-2 w-full mix-blend-screen opacity-90"
                  />
                </div>

                <p className="max-w-sm text-center text-sm text-gray-400">
                  Google 계정 하나로 로그인·가입이 모두 처리됩니다. 이메일·비밀번호 가입은 사용하지 않습니다.
                </p>

                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="w-full max-w-md rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex w-full max-w-md items-center justify-center gap-3 rounded-lg bg-white px-6 py-3.5 font-semibold text-gray-800 shadow-lg transition-all duration-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <GoogleIcon className="h-5 w-5" />
                  {loading ? '연결 중…' : 'Google로 계속하기'}
                </button>
              </div>
            </div>
          </div>

          <div
            className={`mt-auto w-full shrink-0 border-t border-gray-800/80 bg-[#0a0a0f]/95 px-6 pt-4 backdrop-blur ${LOGIN_FOOTER_PB_CLASS}`}
          >
            {Capacitor.isNativePlatform() && (
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

      {showModal && (
        <PreAuthModal onConfirm={(code) => void proceedGoogleLogin(code)} onCancel={() => setShowModal(false)} />
      )}
    </div>
  );
}
