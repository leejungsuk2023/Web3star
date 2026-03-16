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
    <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden max-w-md mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <button
          onClick={() => navigate('/profile')}
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

      {/* Page Content */}
      <Outlet />

      {/* Bottom Navigation Bar */}
      <nav className="bg-gradient-to-t from-gray-900/95 to-gray-900/80 backdrop-blur-md border-t border-gray-800 px-6 py-4">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              location.pathname === '/'
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                : 'bg-gray-800/50 group-hover:bg-gray-700/50'
            }`}>
              <Home className={`w-5 h-5 transition-colors ${
                location.pathname === '/'
                  ? 'text-white'
                  : 'text-gray-500 group-hover:text-gray-300'
              }`} />
            </div>
            <span className={`text-xs transition-colors ${
              location.pathname === '/'
                ? 'text-white font-medium'
                : 'text-gray-500 group-hover:text-gray-300'
            }`}>Home</span>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              location.pathname === '/leaderboard'
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                : 'bg-gray-800/50 group-hover:bg-gray-700/50'
            }`}>
              <Trophy className={`w-5 h-5 transition-colors ${
                location.pathname === '/leaderboard'
                  ? 'text-white'
                  : 'text-gray-500 group-hover:text-gray-300'
              }`} />
            </div>
            <span className={`text-xs transition-colors ${
              location.pathname === '/leaderboard'
                ? 'text-white font-medium'
                : 'text-gray-500 group-hover:text-gray-300'
            }`}>Leaderboard</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              location.pathname === '/profile'
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30'
                : 'bg-gray-800/50 group-hover:bg-gray-700/50'
            }`}>
              <User className={`w-5 h-5 transition-colors ${
                location.pathname === '/profile'
                  ? 'text-white'
                  : 'text-gray-500 group-hover:text-gray-300'
              }`} />
            </div>
            <span className={`text-xs transition-colors ${
              location.pathname === '/profile'
                ? 'text-white font-medium'
                : 'text-gray-500 group-hover:text-gray-300'
            }`}>Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
