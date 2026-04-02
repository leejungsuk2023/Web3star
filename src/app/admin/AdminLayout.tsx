import React from 'react';
import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const nav = [
  { to: '/admin', label: '대시보드', end: true },
  { to: '/admin/users', label: '사용자' },
  { to: '/admin/points', label: '포인트·환전' },
  { to: '/admin/mining', label: '채굴 활동' },
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
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#06060a] px-6 text-center">
        <h1 className="text-xl font-semibold text-white">접근 거부</h1>
        <p className="max-w-md text-sm text-gray-400">
          관리자 권한이 있는 계정만 이 영역을 사용할 수 있습니다. SQL로 본인 계정에{' '}
          <code className="rounded bg-gray-800 px-1 text-cyan-300">role = &apos;admin&apos;</code>을 설정했는지
          확인하세요.
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
