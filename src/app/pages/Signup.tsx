import React, { useState } from 'react';
import logoImage from 'figma:asset/1abedf885993685a4d6cd6ba7515a93facdfdba3.png';
import { useNavigate } from 'react-router';
import GoogleIcon from '../components/GoogleIcon';
import { supabase, getAuthRedirectUrl, isLikelyNativePlatform } from '../../lib/supabase';
import { googleNativeIdToken } from '../../lib/socialLogin';
import { applyReferralRewards } from '../../lib/referral';
import { useAuth } from '../../context/AuthContext';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import ComingSoonModal from '../components/ComingSoonModal';

const TERMS_AGREED_KEY = 'web3star_terms_agreed';

export default function Signup() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const termsAgreed = agreedToTerms && agreedToPrivacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setError('');
    setLoading(true);

    if (referralCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('invite_code', referralCode.trim())
        .single();
      if (!referrer) {
        setError('Invalid referral code. Please check and try again.');
        setLoading(false);
        return;
      }
    }

    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
          referral_code: referralCode.trim() || undefined,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (signUpData?.user?.id && referralCode.trim()) {
      const refRes = await applyReferralRewards(signUpData.user.id, referralCode);
      if (!refRes.ok) {
        setError(refRes.message);
        setLoading(false);
        return;
      }
      await refreshProfile();
    }

    localStorage.setItem(TERMS_AGREED_KEY, 'true');
    navigate('/');
  };

  const handleGoogleSignup = async () => {
    if (loading) return;
    if (!termsAgreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setLoading(true);
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
        localStorage.setItem(TERMS_AGREED_KEY, 'true');
        navigate('/');
        return;
      }

      if (referralCode) {
        sessionStorage.setItem('pending_referral_code', referralCode.trim());
      }
      localStorage.setItem(TERMS_AGREED_KEY, 'true');
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
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

        <div className="space-y-4">
          {/* Referral Code Input (applies to all signup methods) */}
          <div>
            <label htmlFor="referralCode" className="block text-sm text-gray-400 mb-2">
              Referral code <span className="text-gray-600">(optional)</span>
            </label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#1a1a24] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              placeholder="Enter referral code"
            />
          </div>

          {/* Terms Agreement */}
          <div className="p-4 bg-[#1a1a24] border border-gray-800 rounded-lg space-y-3">
            <p className="text-xs text-gray-500 mb-1">Before signing up, please agree to the following</p>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-cyan-400 cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
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

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-cyan-400 cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
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

          {/* Google Signup Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading || !termsAgreed}
            className="w-full px-6 py-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <GoogleIcon className="w-5 h-5" />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-gray-800"></div>
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-800"></div>
          </div>

          {/* Email/Password/Nickname Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label htmlFor="nickname" className="block text-sm text-gray-400 mb-2">
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#1a1a24] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                placeholder="Enter your nickname"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !termsAgreed}
              className="w-full mt-4 px-6 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing up...' : 'Start mining'}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <div className="text-sm text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Log in
            </button>
          </div>
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
