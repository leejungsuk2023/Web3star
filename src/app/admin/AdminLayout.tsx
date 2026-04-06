import React from 'react';
import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const nav = [
  { to: '/admin', label: '대시보드', end: true },
  { to: '/admin/users', label: '사용자' },
  { to: '/admin/referrals', label: '추천·레퍼럴' },
  { to: '/admin/points', label: '포인트·환전' },
  { to: '/admin/mining', label: '채굴·활동' },
  { to: '/admin/content', label: '미션·이벤트' },
  { to: '/admin/reports', label: '통계' },
  { to: '/admin/system', label: '시스템·감사' },
];

function navClassName({ isActive }: { isActive: boolean }) {
  return [
    'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-cyan-500/15 text-cyan-300' : 'text-gray-400 hover:bg-white/5 hover:text-white',
  ].join(' ');
}

export default function AdminLayout() {
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || (user && profileLoading)) return;
    if (user) return;
    const next = encodeURIComponent(`${location.pathname}${location.search}` || '/admin');
    navigate(`/app/login?next=${next}`, { replace: true });
  }, [loading, user, profileLoading, location.pathname, location.search, navigate]);

  if (loading || (user && profileLoading)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#06060a] text-gray-400">
        로딩 중…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#06060a] text-gray-400">
        로그인으로 이동 중…
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    const loginWithAdminNext = `/app/login?next=${encodeURIComponent('/admin')}`;
    const signOutAndGoLogin = async () => {
      await supabase.auth.signOut();
      navigate(loginWithAdminNext, { replace: true });
    };

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#06060a] px-6 text-center">
        <h1 className="text-xl font-semibold text-white">접근 거부</h1>
        <p className="max-w-md text-sm text-gray-400">
          {!profile && !profileLoading ? (
            <>
              <strong className="text-gray-200">public.users</strong> 테이블에 이 계정 행이 없을 수 있습니다. Google 로그인만
              한 경우 자주 발생합니다. Supabase SQL에서{' '}
              <code className="rounded bg-gray-800 px-1 text-cyan-300">docs/supabase-fix-missing-public-user-admin.sql</code>{' '}
              를 실행한 뒤 아래에서 권한을 다시 확인하세요.
            </>
          ) : (
            <>
              지금 로그인한 계정은 관리자가 아닙니다. 다른 이메일로 들어왔다면 아래 버튼으로 로그아웃한 뒤, Supabase에서{' '}
              <code className="rounded bg-gray-800 px-1 text-cyan-300">role = &apos;admin&apos;</code>이 붙은 계정으로 다시
              로그인하세요.
            </>
          )}
        </p>
        <div className="w-full max-w-md rounded-lg border border-gray-800 bg-[#0f0f18] px-4 py-3 text-left text-xs text-gray-300">
          <div>
            <span className="text-gray-500">로그인 계정 email:</span>{' '}
            <span className="font-mono text-gray-200">{user.email ?? '—'}</span>
          </div>
          <div className="mt-1">
            <span className="text-gray-500">public.users.role:</span>{' '}
            <span className="font-mono text-gray-200">{profile?.role ?? '—'}</span>
          </div>
          <div className="mt-1">
            <span className="text-gray-500">public.users.account_status:</span>{' '}
            <span className="font-mono text-gray-200">{profile?.account_status ?? '—'}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <button
            type="button"
            onClick={() => void signOutAndGoLogin()}
            className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-black hover:bg-cyan-500"
          >
            로그아웃 후 관리자 계정으로 로그인
          </button>
          <button
            type="button"
            onClick={async () => {
              await refreshProfile();
            }}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-white hover:bg-white/5"
          >
            권한 다시 확인
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-white hover:bg-white/5"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-[#06060a] text-gray-200">
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-800 bg-[#0a0a12] p-4">
        <div className="mb-6 text-xs font-semibold uppercase tracking-wider text-cyan-400">Web3Star Admin</div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/', { replace: true });
          }}
          className="mt-4 rounded-lg border border-gray-700 py-2 text-left text-sm text-gray-500 hover:text-white"
        >
          로그아웃
        </button>
      </aside>
      <main className="min-w-0 flex-1 overflow-x-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
