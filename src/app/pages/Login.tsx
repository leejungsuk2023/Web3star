import React, { useState } from 'react';
import logoImage from 'figma:asset/1abedf885993685a4d6cd6ba7515a93facdfdba3.png';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import GoogleIcon from '../components/GoogleIcon';
import { Capacitor } from '@capacitor/core';
import { supabase, getAuthRedirectUrl, isLikelyNativePlatform } from '../../lib/supabase';
import { googleNativeIdToken } from '../../lib/socialLogin';
import { applyReferralRewards } from '../../lib/referral';
import { useAuth } from '../../context/AuthContext';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import ComingSoonModal from '../components/ComingSoonModal';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4">
      <div className="w-full max-w-md bg-[#13131e] border border-gray-700 rounded-2xl p-6 space-y-5 shadow-2xl">
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
        <ComingSoonModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default function Login() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const alreadyAgreed = () => localStorage.getItem(TERMS_AGREED_KEY) === 'true';

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

    navigate('/');
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
        navigate('/');
        return;
      }

      if (referralCode.trim()) {
        sessionStorage.setItem('pending_referral_code', referralCode.trim());
      }
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getAuthRedirectUrl() },
      });
      if (oauthError) {
        setError(oauthError.message);
        return;
      }
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message ?? 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (loading) return;
    if (alreadyAgreed()) {
      // Returning user (terms already saved): skip modal
      proceedGoogleLogin();
    } else {
      // First-time flow: show terms + optional referral modal
      setShowModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-12">
          <img
            src={logoImage}
            alt="Web3Star Logo"
            className="w-full mb-4 mix-blend-screen opacity-90"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" aria-live="polite" className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full px-6 py-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon className="w-5 h-5" />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-800"></div>
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-800"></div>
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm text-gray-400 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#1a1a24] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm text-gray-400 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#1a1a24] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 px-6 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Links */}
        <div className="flex flex-col items-center gap-4 mt-6">
          {Capacitor.isNativePlatform() && (
            <button
              type="button"
              onClick={() => navigate('/admob-test')}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              AdMob Test (Android/iOS)
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              if (!email) {
                setError('Please enter your email first.');
                return;
              }
              const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${getAuthRedirectUrl()}/login`,
              });
              if (resetError) {
                setError(resetError.message);
              } else {
                toast.success('Password reset email sent. Check your inbox.');
              }
            }}
            className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            Forgot Password?
          </button>
          <div className="text-sm text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Pre-auth modal */}
      {showModal && (
        <PreAuthModal
          onConfirm={(code) => proceedGoogleLogin(code)}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
