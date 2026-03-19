import React, { useState } from 'react';
import logoImage from 'figma:asset/1abedf885993685a4d6cd6ba7515a93facdfdba3.png';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import GoogleIcon from '../components/GoogleIcon';
import { Capacitor } from '@capacitor/core';
import { supabase, getAuthRedirectUrl, isLikelyNativePlatform } from '../../lib/supabase';
import { googleNativeIdToken } from '../../lib/socialLogin';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleGoogleLogin = async () => {
    if (loading) return; // 중복 클릭 방지
    setLoading(true);
    try {
      setError('');
      if (isLikelyNativePlatform()) {
        // Android WebView OAuth 차단(403 disallowed_useragent) 회피: 네이티브 ID 토큰 로그인
        const idToken = await googleNativeIdToken();
        const { error: idTokenError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (idTokenError) {
          setError(idTokenError.message);
          return;
        }
        navigate('/');
        return;
      }

      // 웹: 기존 OAuth 리다이렉트 플로우
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
            className="w-full px-6 py-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg"
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
    </div>
  );
}
