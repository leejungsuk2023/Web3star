import React, { useState } from 'react';
import logoImage from 'figma:asset/1abedf885993685a4d6cd6ba7515a93facdfdba3.png';
import { useNavigate } from 'react-router';
import GoogleIcon from '../components/GoogleIcon';
import { supabase, getAuthRedirectUrl, isLikelyNativePlatform } from '../../lib/supabase';
import { googleNativeIdToken } from '../../lib/socialLogin';

const TERMS_AGREED_KEY = 'web3star_terms_agreed';
const REFERRAL_BONUS = 100; // 추천인/피추천인 각각 지급

const REFERRAL_MILESTONES = [
  { count: 5,    bonus: 100 },
  { count: 10,   bonus: 200 },
  { count: 20,   bonus: 500 },
  { count: 50,   bonus: 1250 },
  { count: 100,  bonus: 2500 },
  { count: 200,  bonus: 5000 },
  { count: 500,  bonus: 12500 },
  { count: 1000, bonus: 25000 },
  { count: 2000, bonus: 50000 },
];

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const termsAgreed = agreedToTerms && agreedToPrivacy;

  // 추천인 코드 적용: 신규 유저 +100pts, 추천인 +100pts, 마일스톤 보너스 체크
  const applyReferralCode = async (newUserId: string) => {
    if (!referralCode) return;

    const { data: referrer } = await supabase
      .from('users')
      .select('id, point')
      .eq('invite_code', referralCode.trim())
      .single();
    if (!referrer) return;

    // 1. 신규 유저: referred_by 설정 + +100pts
    const { data: newUser } = await supabase
      .from('users')
      .select('point')
      .eq('id', newUserId)
      .single();
    await supabase.from('users').update({
      referred_by: referrer.id,
      point: (newUser?.point ?? 0) + REFERRAL_BONUS,
    }).eq('id', newUserId);
    await supabase.from('mining_logs').insert({
      user_id: newUserId, amount: REFERRAL_BONUS, type: 'REFERRAL',
    });

    // 2. 추천인: +100pts
    const { data: freshReferrer } = await supabase
      .from('users').select('point').eq('id', referrer.id).single();
    await supabase.from('users').update({
      point: (freshReferrer?.point ?? referrer.point) + REFERRAL_BONUS,
    }).eq('id', referrer.id);
    await supabase.from('mining_logs').insert({
      user_id: referrer.id, amount: REFERRAL_BONUS, type: 'REFERRAL',
    });

    // 3. 추천인 마일스톤 체크
    const { count: totalReferrals } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', referrer.id);

    const milestone = REFERRAL_MILESTONES.find(m => m.count === totalReferrals);
    if (milestone) {
      const { data: currentRef } = await supabase
        .from('users').select('point').eq('id', referrer.id).single();
      await supabase.from('users').update({
        point: (currentRef?.point ?? 0) + milestone.bonus,
      }).eq('id', referrer.id);
      await supabase.from('mining_logs').insert({
        user_id: referrer.id, amount: milestone.bonus, type: 'BONUS',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      setError('서비스 이용약관과 개인정보 보호정책에 동의해 주세요.');
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
        setError('유효하지 않은 추천인 코드입니다. 다시 확인해 주세요.');
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

    // 추천인 보너스 적용 (이메일 가입)
    if (signUpData?.user?.id && referralCode) {
      await applyReferralCode(signUpData.user.id);
    }

    localStorage.setItem(TERMS_AGREED_KEY, 'true');
    navigate('/');
  };

  const handleGoogleSignup = async () => {
    if (loading) return;
    if (!termsAgreed) {
      setError('서비스 이용약관과 개인정보 보호정책에 동의해 주세요.');
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
        if (sessionData?.user && referralCode) {
          await applyReferralCode(sessionData.user.id);
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
              추천인 코드 <span className="text-gray-600">(선택)</span>
            </label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#1a1a24] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              placeholder="추천인 코드 입력"
            />
          </div>

          {/* Terms Agreement */}
          <div className="p-4 bg-[#1a1a24] border border-gray-800 rounded-lg space-y-3">
            <p className="text-xs text-gray-500 mb-1">가입 전 아래 약관에 동의해 주세요</p>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-cyan-400 cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                <a
                  href="#"
                  onClick={(e) => e.stopPropagation()}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  서비스 이용약관
                </a>
                에 동의합니다 <span className="text-red-400">(필수)</span>
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
                <a
                  href="#"
                  onClick={(e) => e.stopPropagation()}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  개인정보 보호정책
                </a>
                에 동의합니다 <span className="text-red-400">(필수)</span>
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
            Google로 시작하기
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-gray-800"></div>
            <span className="text-sm text-gray-500">또는</span>
            <div className="flex-1 h-px bg-gray-800"></div>
          </div>

          {/* Email/Password/Nickname Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-gray-400 mb-2">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#1a1a24] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                placeholder="이메일 입력"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-400 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#1a1a24] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                placeholder="비밀번호 입력"
                required
              />
            </div>

            <div>
              <label htmlFor="nickname" className="block text-sm text-gray-400 mb-2">
                닉네임
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#1a1a24] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                placeholder="닉네임 입력"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !termsAgreed}
              className="w-full mt-4 px-6 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '가입 중...' : '마이닝 시작하기'}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <div className="text-sm text-gray-400">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
