import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Home, Trophy, User, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const nickname = profile?.nickname ?? 'User';
  const points = profile?.point ?? 0;

  return (
    <div className="relative mx-auto flex h-dvh max-h-dvh min-h-0 w-full max-w-md flex-col overflow-hidden text-white">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#101018] via-[#08080f] to-black"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 -top-10 z-0 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/35 via-indigo-500/30 to-purple-600/25 blur-[56px]"
        aria-hidden
      />
      {/* Top Header — shrink-0 h-14 band; extra top padding when env inset is large */}
      <header className="relative z-10 flex min-h-14 shrink-0 items-center justify-between px-6 pb-2 pt-[max(0.5rem,env(safe-area-inset-top,24px))]">
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
      </header>

      {/* Page Content — scroll on short viewports so bottom cards aren’t clipped above the tab bar */}
      <div className="relative z-10 min-h-0 flex-1 flex flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
        <Outlet />
      </div>

      {/* Bottom tab bar — h-16 band + safe-area bottom */}
      <nav className="relative z-10 flex min-h-16 shrink-0 items-end border-t border-gray-800 bg-gradient-to-t from-gray-900/95 to-gray-900/80 px-6 pb-[max(0.75rem,calc(0.5rem+env(safe-area-inset-bottom,24px)))] pt-3 backdrop-blur-md">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          <button
            onClick={() => navigate('/app')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              location.pathname === '/app'
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                : 'bg-gray-800/50 group-hover:bg-gray-700/50'
            }`}>
              <Home className={`w-5 h-5 transition-colors ${
                location.pathname === '/app'
                  ? 'text-white'
                  : 'text-gray-500 group-hover:text-gray-300'
              }`} />
            </div>
            <span className={`text-xs transition-colors ${
              location.pathname === '/app'
                ? 'text-white font-medium'
                : 'text-gray-500 group-hover:text-gray-300'
            }`}>Home</span>
          </button>

          <button
            onClick={() => navigate('/app/leaderboard')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              location.pathname === '/app/leaderboard'
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                : 'bg-gray-800/50 group-hover:bg-gray-700/50'
            }`}>
              <Trophy className={`w-5 h-5 transition-colors ${
                location.pathname === '/app/leaderboard'
                  ? 'text-white'
                  : 'text-gray-500 group-hover:text-gray-300'
              }`} />
            </div>
            <span className={`text-xs transition-colors ${
              location.pathname === '/app/leaderboard'
                ? 'text-white font-medium'
                : 'text-gray-500 group-hover:text-gray-300'
            }`}>Leaderboard</span>
          </button>

          <button
            onClick={() => navigate('/app/profile')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              location.pathname === '/app/profile'
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                : 'bg-gray-800/50 group-hover:bg-gray-700/50'
            }`}>
              <User className={`w-5 h-5 transition-colors ${
                location.pathname === '/app/profile'
                  ? 'text-white'
                  : 'text-gray-500 group-hover:text-gray-300'
              }`} />
            </div>
            <span className={`text-xs transition-colors ${
              location.pathname === '/app/profile'
                ? 'text-white font-medium'
                : 'text-gray-500 group-hover:text-gray-300'
            }`}>Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
