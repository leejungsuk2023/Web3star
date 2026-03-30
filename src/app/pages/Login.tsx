import React, { useEffect, useState } from 'react';
import logoImage from '../../assets/signup-hero-new.png';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import GoogleIcon from '../components/GoogleIcon';
import { Capacitor } from '@capacitor/core';
import { supabase, getAuthRedirectUrl, isLikelyNativePlatform } from '../../lib/supabase';
import { googleNativeIdToken } from '../../lib/socialLogin';
import { applyReferralRewards } from '../../lib/referral';
import { useAuth } from '../../context/AuthContext';
import { getPostAuthPath } from '../../lib/deployTarget';
import { attachAuthKeyboardScroll } from '../../lib/keyboardLayout';
import {
  AUTH_PAGE_INNER_CLASS,
  AUTH_PAGE_OUTER_CLASS,
  LOGIN_FOOTER_PB_CLASS,
  LOGIN_SCROLL_TOP_PT_CLASS,
} from '../../lib/nativeLayout';
import { useKeyboardOpen } from '../../lib/useKeyboardOpen';
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
        <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-[#13131e] p-6 shadow-2xl space-y-5">
        <h2 className="text-white font-bold text-lg text-center">Before you continue</h2>
        <p className="text-xs text-gray-500 text-center">
          You can sign in with Google. If you have a referral code, enter it below (optional).
        </p>

        {/* Referral Code */}
        <div>
          <label htmlFor="modal-referral" className="block text-sm text-gray-400 mb-2">
            Referral code <span className="text-gray-600">(optional)</span>
          </label>
          <input
            id="modal-referral"
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            className="w-full px-4 py-3 bg-[#1a1a24] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors text-sm"
            placeholder="Enter referral code"
          />
        </div>

        {/* Terms */}
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-cyan-400 cursor-pointer flex-shrink-0"
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
                className="text-cyan-400 hover:text-cyan-300 underline inline p-0 bg-transparent border-0 cursor-pointer text-sm font-inherit align-baseline"
              >
                Terms of Service
              </button>
              <span className="text-red-400"> (required)</span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToPrivacy}
              onChange={(e) => setAgreedToPrivacy(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-cyan-400 cursor-pointer flex-shrink-0"
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
                className="text-cyan-400 hover:text-cyan-300 underline inline p-0 bg-transparent border-0 cursor-pointer text-sm font-inherit align-baseline"
              >
                Privacy Policy
              </button>
              <span className="text-red-400"> (required)</span>
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              localStorage.setItem(TERMS_AGREED_KEY, 'true');
              onConfirm(referralCode.trim());
            }}
            disabled={!canProceed}
            className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Agree & continue
          </button>
        </div>

        <PrivacyPolicyModal
          isOpen={isPrivacyPolicyOpen}
          onClose={() => setIsPrivacyPolicyOpen(false)}
        />
        <TermsOfServiceModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
        />
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  isOpen,
  loading,
  email,
  onEmailChange,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  loading: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-black/70 px-4 py-6 backdrop-blur-sm [-webkit-overflow-scrolling:touch]"
      data-modal-scroll-root
    >
      <div className="flex min-h-[100dvh] min-h-[100%] w-full items-end justify-center pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:items-center sm:py-8">
        <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-[#13131e] p-6 shadow-2xl space-y-4">
          <h2 className="text-center text-lg font-bold text-white">Reset password</h2>
          <p className="text-center text-xs text-gray-500">
            Enter your account email. We will send a password reset link.
          </p>

          <div>
            <label htmlFor="reset-email" className="mb-2 block text-sm text-gray-400">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-[#1a1a24] px-4 py-3 text-sm text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              placeholder="Enter your email"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-700 py-3 text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading || !email.trim()}
              className="flex-1 rounded-lg bg-cyan-500 py-3 text-sm font-semibold text-black transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Sending...' : 'Send link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const isKeyboardOpen = useKeyboardOpen();

  useEffect(() => attachAuthKeyboardScroll(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate(getPostAuthPath());
  };

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
        navigate(getPostAuthPath());
        return;
      }

      if (referralCode.trim()) {
        sessionStorage.setItem('pending_referral_code', referralCode.trim());
      }
      const computedRedirect = getAuthRedirectUrl();
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
        const providerRedirectUri = authUrl.searchParams.get('redirect_uri');
        const oauthUrlSnapshot = {
          returnedRedirectTo,
          providerRedirectUri,
          authUrlHost: authUrl.host,
        };
        if (returnedRedirectTo?.includes('localhost')) {
          setError(
            `OAuth misconfiguration detected: Supabase returned localhost redirect (${returnedRedirectTo}). ` +
              `Check Supabase Auth URL config (Site URL + Redirect URLs) for GitHub Pages.`,
          );
          return;
        }
        window.location.href = data.url;
      }
    } catch (e: any) {
      setError(e?.message ?? 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (loading) return;
    // Some Android devices may restore WebView/localStorage after reinstall.
    // Always show pre-auth modal on native to avoid stale "agreed" flags skipping referral/consent UI.
    if (isLikelyNativePlatform()) {
      setShowModal(true);
      return;
    }

    const alreadyAgreed = localStorage.getItem(TERMS_AGREED_KEY) === 'true';
    if (alreadyAgreed) {
      proceedGoogleLogin();
      return;
    }
    setShowModal(true);
  };

  const handlePasswordReset = async () => {
    const targetEmail = resetEmail.trim();
    if (!targetEmail) {
      setError('Please enter your email first.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: getAuthRedirectUrl(),
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    toast.success('Password reset email sent. Check your inbox.');
    setIsResetModalOpen(false);
  };

  React.useEffect(() => {
    if (authLoading) return;
    if (user) {
      navigate(getPostAuthPath(), { replace: true });
    }
  }, [authLoading, user, navigate]);

  return (
    <div className={AUTH_PAGE_OUTER_CLASS}>
      <div className={AUTH_PAGE_INNER_CLASS}>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            data-auth-scroll-root
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
            style={{ paddingBottom: isKeyboardOpen ? 12 : 0 }}
          >
            <div className="flex min-h-full flex-col px-6 pt-[max(1rem,env(safe-area-inset-top,24px))]">
              {/* Center block: logo, Google, email/password (space-y keeps fields tight) */}
              <div className="flex flex-1 flex-col items-center justify-center space-y-8">
                <div className="flex w-full flex-col items-center">
                  <img
                    src={logoImage}
                    alt="Web3Star Logo"
                    className="mb-4 w-full mix-blend-screen opacity-90"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="w-full rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400"
                  >
                    {error}
                  </div>
                )}

                <div className="w-full space-y-4">
                  <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-6 py-3.5 font-semibold text-gray-800 shadow-lg transition-all duration-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <GoogleIcon className="h-5 w-5" />
                      Continue with Google
                    </button>

                    <div className="my-4 flex items-center gap-4">
                      <div className="h-px flex-1 bg-gray-800" />
                      <span className="text-sm text-gray-500">or</span>
                      <div className="h-px flex-1 bg-gray-800" />
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm text-gray-400">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-gray-800 bg-[#1a1a24] px-4 py-3 text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="mb-2 block text-sm text-gray-400">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-800 bg-[#1a1a24] px-4 py-3 text-white placeholder-gray-600 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {!isKeyboardOpen && (
            <div
              className={`mt-auto w-full shrink-0 space-y-4 border-t border-gray-800/80 bg-[#0a0a0f]/95 px-6 pt-4 backdrop-blur ${LOGIN_FOOTER_PB_CLASS}`}
            >
              {Capacitor.isNativePlatform() && (
                <button
                  type="button"
                  onClick={() => navigate('/app/admob-test')}
                  className="mb-1 w-full text-center text-xs text-gray-500 transition-colors hover:text-gray-300"
                >
                  AdMob Test (Android/iOS)
                </button>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="submit"
                  form="login-form"
                  disabled={loading}
                  className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-black shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-200 hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/signup')}
                  className="w-full rounded-lg border border-cyan-500/50 px-4 py-3 font-semibold text-cyan-300 transition-colors hover:border-cyan-400 hover:text-cyan-200"
                >
                  Sign Up
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setIsResetModalOpen(true);
                }}
                className="w-full text-center text-sm text-gray-400 transition-colors hover:text-cyan-400"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pre-auth modal */}
      {showModal && (
        <PreAuthModal
          onConfirm={(code) => proceedGoogleLogin(code)}
          onCancel={() => setShowModal(false)}
        />
      )}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        loading={loading}
        email={resetEmail}
        onEmailChange={setResetEmail}
        onClose={() => setIsResetModalOpen(false)}
        onSubmit={handlePasswordReset}
      />
    </div>
  );
}
