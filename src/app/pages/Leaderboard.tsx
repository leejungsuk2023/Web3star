import { useEffect, useState, useCallback } from 'react';
import { Crown, Medal, Trophy, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface LeaderboardUser {
  rank: number;
  nickname: string;
  points: number;
}

function getRankBadge(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-300 fill-gray-300" />;
    case 3:
      return <Trophy className="w-5 h-5 text-amber-600 fill-amber-600" />;
    default:
      return null;
  }
}

function getRankStyles(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-400/30';
    case 2:
      return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-300/30';
    case 3:
      return 'bg-gradient-to-r from-amber-500/20 to-amber-700/20 border-amber-500/30';
    default:
      return 'bg-zinc-800/50 border-zinc-700/50';
  }
}

function maskNickname(nickname: string) {
  if (nickname.length <= 3) return nickname + '***';
  return nickname.slice(0, 3) + '***';
}

export default function Leaderboard() {
  const { profile } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const myPoint = profile?.point ?? 0;

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setFetchError(false);

    const { data, error } = await supabase
      .from('users')
      .select('nickname, point')
      .order('point', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch leaderboard:', error);
      setFetchError(true);
      setLoading(false);
      return;
    }

    const ranked = (data ?? []).map((user, index) => ({
      rank: index + 1,
      nickname: user.nickname ?? 'Anonymous',
      points: user.point ?? 0,
    }));
    setLeaderboardData(ranked);

    if (profile) {
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('point', myPoint);

      if (!countError && count !== null) {
        setMyRank(count + 1);
      }
    }

    setLoading(false);
  }, [myPoint, profile]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-900 px-6 py-6 border-b border-zinc-800 flex items-center justify-between">
        <div className="w-10" />
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Top Miners
        </h1>
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          aria-label="Refresh leaderboard"
          className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sticky My Rank Bar */}
      <div className="bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-zinc-400 text-sm">My Rank</span>
            <div className="text-2xl font-bold text-blue-400">#{myRank ?? '-'}</div>
          </div>
          <div className="text-right">
            <span className="text-zinc-400 text-sm">My Points</span>
            <div className="text-2xl font-bold text-white">
              {(profile?.point ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pt-4 [-webkit-overflow-scrolling:touch]">
        <div className="space-y-3 pb-28">
          {leaderboardData.map((user) => (
            <div
              key={user.rank}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankStyles(user.rank)}`}
            >
              {/* Rank Number with Badge */}
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <span className={`text-lg font-bold ${user.rank <= 3 ? 'text-white' : 'text-zinc-500'}`}>
                  #{user.rank}
                </span>
                {getRankBadge(user.rank)}
              </div>

              {/* User Nickname */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{maskNickname(user.nickname)}</p>
              </div>

              {/* Points */}
              <div className="text-right">
                <p className="text-lg font-bold text-blue-400">
                  {user.points.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">points</p>
              </div>
            </div>
          ))}

          {fetchError && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-3">Failed to load leaderboard.</p>
              <button
                onClick={fetchLeaderboard}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Tap to retry
              </button>
            </div>
          )}

          {!fetchError && leaderboardData.length === 0 && !loading && (
            <div className="text-center text-zinc-500 py-12">
              No miners yet. Be the first!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
