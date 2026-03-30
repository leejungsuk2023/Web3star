import React, { useLayoutEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Capacitor } from '@capacitor/core';
import { Home, Trophy, User, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import {
  LAYOUT_HEADER_PT_CLASS,
  LAYOUT_NAV_PB_CLASS,
  LAYOUT_ROOT_CLASS,
} from '../../lib/nativeLayout';

/** Plain px + !important: some Android WebViews drop invalid calc/max/env on inline styles, so nothing moved. */
const NATIVE_HEADER_PADDING_TOP_PX = 108;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const headerBarRef = useRef<HTMLDivElement>(null);
  const platform = Capacitor.getPlatform();
  const androidWebViewUa =
    typeof navigator !== 'undefined' && /; wv\)/i.test(navigator.userAgent);
  const devNativePreview =
    import.meta.env.DEV &&
    new URLSearchParams(location.search).get('nativePreview') === '1';
  const inAppShell =
    Capacitor.isNativePlatform() ||
    platform === 'android' ||
    platform === 'ios' ||
    androidWebViewUa ||
    devNativePreview;

  useLayoutEffect(() => {
    const el = headerBarRef.current;
    if (!el || !inAppShell) return;
    el.style.setProperty('padding-top', `${NATIVE_HEADER_PADDING_TOP_PX}px`, 'important');
    return () => {
      el.style.removeProperty('padding-top');
    };
  }, [inAppShell]);

  const nickname = profile?.nickname ?? 'User';
  const points = profile?.point ?? 0;
  const onAppHome =
    location.pathname === '/app' || location.pathname.includes('/__preview/home');

  return (
    <div className={LAYOUT_ROOT_CLASS}>
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#101018] via-[#08080f] to-black"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 -top-10 z-0 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/35 via-indigo-500/30 to-purple-600/25 blur-[56px]"
        aria-hidden
      />
      <header data-app-header className="relative z-10 shrink-0">
        <div
          ref={headerBarRef}
          className={`flex min-h-14 w-full items-center justify-between px-6 pb-2 ${inAppShell ? '' : LAYOUT_HEADER_PT_CLASS}`}
        >
          <button
            onClick={() => navigate('/app/profile')}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform active:scale-95"
          >
            <User className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-400">{nickname}</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {points.toLocaleString()} Pts
              </div>
            </div>
            <button
              aria-label="Notifications"
              onClick={() => toast.info('Notifications coming soon!')}
              className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* justify-start: keep hero + card under the timer; avoid vertically centering the whole block (felt “too low” vs tab bar) */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
        <div className="flex min-h-full min-w-0 w-full flex-1 flex-col justify-start">
          <Outlet />
        </div>
      </div>

      {/* Bottom tab bar — larger tap targets (~56px icon tile + text-sm labels) */}
      <nav
        className={`relative z-10 flex min-h-[5.25rem] shrink-0 items-center border-t border-gray-800 bg-gradient-to-t from-gray-900/95 to-gray-900/80 px-4 pt-2 backdrop-blur-md ${LAYOUT_NAV_PB_CLASS}`}
      >
        <div className="mx-auto flex w-full max-w-sm items-stretch justify-around gap-1">
          <button
            type="button"
            onClick={() =>
              navigate(
                devNativePreview ? '/app/__preview/home?nativePreview=1' : '/app'
              )
            }
            className="group flex min-h-[4.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-1 active:opacity-90"
          >
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all ${
                onAppHome
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800/50 group-hover:bg-gray-700/50'
              }`}
            >
              <Home
                className={`h-7 w-7 transition-colors ${
                  onAppHome
                    ? 'text-white'
                    : 'text-gray-500 group-hover:text-gray-300'
                }`}
              />
            </div>
            <span
              className={`text-center text-sm leading-tight transition-colors ${
                onAppHome
                  ? 'font-medium text-white'
                  : 'text-gray-500 group-hover:text-gray-300'
              }`}
            >
              Home
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/leaderboard')}
            className="group flex min-h-[4.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-1 active:opacity-90"
          >
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all ${
                location.pathname === '/app/leaderboard'
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800/50 group-hover:bg-gray-700/50'
              }`}
            >
              <Trophy
                className={`h-7 w-7 transition-colors ${
                  location.pathname === '/app/leaderboard'
                    ? 'text-white'
                    : 'text-gray-500 group-hover:text-gray-300'
                }`}
              />
            </div>
            <span
              className={`px-0.5 text-center text-sm leading-snug transition-colors ${
                location.pathname === '/app/leaderboard'
                  ? 'font-medium text-white'
                  : 'text-gray-500 group-hover:text-gray-300'
              }`}
            >
              Leaderboard
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/profile')}
            className="group flex min-h-[4.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-1 active:opacity-90"
          >
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all ${
                location.pathname === '/app/profile'
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800/50 group-hover:bg-gray-700/50'
              }`}
            >
              <User
                className={`h-7 w-7 transition-colors ${
                  location.pathname === '/app/profile'
                    ? 'text-white'
                    : 'text-gray-500 group-hover:text-gray-300'
                }`}
              />
            </div>
            <span
              className={`text-center text-sm leading-tight transition-colors ${
                location.pathname === '/app/profile'
                  ? 'font-medium text-white'
                  : 'text-gray-500 group-hover:text-gray-300'
              }`}
            >
              Profile
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
