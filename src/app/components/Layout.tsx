import React, { useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Capacitor } from '@capacitor/core';
import { Home, Trophy, User, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ActivityHistoryModal from './ActivityHistoryModal';
import {
  LAYOUT_HEADER_PT_CLASS,
  LAYOUT_NAV_PB_CLASS,
  LAYOUT_ROOT_CLASS,
} from '../../lib/nativeLayout';
import headerShieldLogo from '../../assets/web3star-header-shield-logo.png';

/** Preview baseline. Real native already has WebView top inset, so use a smaller extra header lift there. */
const HEADER_PADDING_TOP_PREVIEW_PX = 108;
const HEADER_PADDING_TOP_NATIVE_PX = 96;
const PULL_REFRESH_THRESHOLD_PX = 90;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const headerBarRef = useRef<HTMLDivElement>(null);
  const platform = Capacitor.getPlatform();
  const scrollRef = useRef<HTMLDivElement>(null);
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
  const headerPaddingTopPx = Capacitor.isNativePlatform()
    ? HEADER_PADDING_TOP_NATIVE_PX
    : HEADER_PADDING_TOP_PREVIEW_PX;

  useLayoutEffect(() => {
    const el = headerBarRef.current;
    if (!el || !inAppShell) return;
    el.style.setProperty('padding-top', `${headerPaddingTopPx}px`, 'important');
    return () => {
      el.style.removeProperty('padding-top');
    };
  }, [headerPaddingTopPx, inAppShell]);

  const nickname = profile?.nickname ?? 'User';
  const points = profile?.point ?? 0;
  const onAppHome =
    location.pathname === '/app' || location.pathname.includes('/__preview/home');
  const onAppLeaderboard =
    location.pathname === '/app/leaderboard' ||
    location.pathname.includes('/__preview/leaderboard');
  const onAppProfile =
    location.pathname === '/app/profile' ||
    location.pathname.includes('/__preview/profile');
  const isAndroid = platform === 'android' || /Android/i.test(navigator.userAgent);

  // Android: when user pulls down while already at top, trigger a hard refresh.
  // This helps recover from occasional "stuck/lag" states.
  const touchStartYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullDeltaYRef = useRef(0);
  const lastReloadAtRef = useRef(0);
  const [pullRefreshState, setPullRefreshState] = useState<'hidden' | 'pull' | 'ready' | 'refreshing'>('hidden');
  const [activityHistoryOpen, setActivityHistoryOpen] = useState(false);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isAndroid) return;
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop <= 0) {
      touchStartYRef.current = e.touches[0]?.clientY ?? 0;
      pullDeltaYRef.current = 0;
      pullingRef.current = true;
      setPullRefreshState('pull');
    } else {
      pullingRef.current = false;
      setPullRefreshState('hidden');
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isAndroid) return;
    if (!pullingRef.current) return;
    const y = e.touches[0]?.clientY ?? 0;
    const delta = y - touchStartYRef.current;
    if (delta <= 0) {
      pullDeltaYRef.current = 0;
      setPullRefreshState('pull');
      return;
    }

    pullDeltaYRef.current = delta;
    if (delta > PULL_REFRESH_THRESHOLD_PX) {
      setPullRefreshState('ready');
    } else if (delta > 16) {
      setPullRefreshState('pull');
    }
  };

  const onTouchEnd = () => {
    if (!isAndroid) return;
    if (!pullingRef.current) {
      setPullRefreshState('hidden');
      return;
    }
    pullingRef.current = false;

    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop > 0) {
      setPullRefreshState('hidden');
      return;
    }

    // Threshold tuned for "pull down" feel (pixels in CSS pixels)
    if (pullDeltaYRef.current > PULL_REFRESH_THRESHOLD_PX) {
      const now = Date.now();
      if (now - lastReloadAtRef.current < 3000) {
        setPullRefreshState('hidden');
        return; // debounce
      }
      lastReloadAtRef.current = now;
      setPullRefreshState('refreshing');
      window.setTimeout(() => {
        window.location.reload();
      }, 150);
      return;
    }
    setPullRefreshState('hidden');
  };

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
          className={`relative flex min-h-14 w-full items-center justify-between px-6 pb-2 ${inAppShell ? '' : LAYOUT_HEADER_PT_CLASS}`}
        >
          {/* Brand fills the same padding-top band only (explicit height = pad), centered X+Y like reference mockup */}
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 z-[1] flex items-center justify-center px-3 sm:px-5 ${inAppShell ? '' : 'min-h-[2.75rem] py-1'}`}
            style={inAppShell ? { height: `${headerPaddingTopPx}px` } : undefined}
          >
            <div className="flex h-full w-max max-w-full flex-nowrap items-center justify-center gap-1 sm:gap-1.5">
              <img
                src={headerShieldLogo}
                alt="Web3Star"
                className="h-14 w-auto max-h-14 shrink-0 object-contain sm:h-16 sm:max-h-16 md:h-[4.25rem] md:max-h-[4.25rem]"
                decoding="async"
              />
              <p className="-ml-0.5 whitespace-nowrap text-center text-xs font-semibold leading-none tracking-wide text-white sm:-ml-1 sm:text-sm md:text-base lg:text-lg">
                Your Gateway to Web3 Creation
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              navigate(
                devNativePreview
                  ? '/app/__preview/profile?nativePreview=1'
                  : '/app/profile'
              )
            }
            className="relative z-[2] w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform active:scale-95"
          >
            <User className="w-6 h-6 text-white" />
          </button>
          <div className="relative z-[2] flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-400">{nickname}</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {points.toLocaleString()} Pts
              </div>
            </div>
            <button
              type="button"
              aria-label="포인트·활동 내역"
              onClick={() => setActivityHistoryOpen(true)}
              className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {isAndroid && pullRefreshState !== 'hidden' && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-[#0a0f1c]/85 px-3 py-1.5 backdrop-blur-sm">
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                pullRefreshState === 'refreshing'
                  ? 'animate-spin text-cyan-300'
                  : pullRefreshState === 'ready'
                    ? 'text-cyan-300'
                    : 'text-zinc-300'
              }`}
            />
            <span className="text-[11px] text-zinc-100">
              {pullRefreshState === 'ready'
                ? 'Release to refresh'
                : pullRefreshState === 'refreshing'
                  ? 'Refreshing...'
                  : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* justify-start: keep hero + card under the timer; avoid vertically centering the whole block (felt “too low” vs tab bar) */}
      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
      >
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
            onClick={() =>
              navigate(
                devNativePreview
                  ? '/app/__preview/leaderboard?nativePreview=1'
                  : '/app/leaderboard'
              )
            }
            className="group flex min-h-[4.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-1 active:opacity-90"
          >
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all ${
                onAppLeaderboard
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800/50 group-hover:bg-gray-700/50'
              }`}
            >
              <Trophy
                className={`h-7 w-7 transition-colors ${
                  onAppLeaderboard
                    ? 'text-white'
                    : 'text-gray-500 group-hover:text-gray-300'
                }`}
              />
            </div>
            <span
              className={`px-0.5 text-center text-sm leading-snug transition-colors ${
                onAppLeaderboard
                  ? 'font-medium text-white'
                  : 'text-gray-500 group-hover:text-gray-300'
              }`}
            >
              Leaderboard
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                devNativePreview
                  ? '/app/__preview/profile?nativePreview=1'
                  : '/app/profile'
              )
            }
            className="group flex min-h-[4.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-1 active:opacity-90"
          >
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all ${
                onAppProfile
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800/50 group-hover:bg-gray-700/50'
              }`}
            >
              <User
                className={`h-7 w-7 transition-colors ${
                  onAppProfile
                    ? 'text-white'
                    : 'text-gray-500 group-hover:text-gray-300'
                }`}
              />
            </div>
            <span
              className={`text-center text-sm leading-tight transition-colors ${
                onAppProfile
                  ? 'font-medium text-white'
                  : 'text-gray-500 group-hover:text-gray-300'
              }`}
            >
              Profile
            </span>
          </button>
        </div>
      </nav>

      <ActivityHistoryModal
        isOpen={activityHistoryOpen}
        onClose={() => setActivityHistoryOpen(false)}
      />
    </div>
  );
}
