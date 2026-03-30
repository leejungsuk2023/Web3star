import React, { useEffect, useState, useCallback } from 'react';
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
      return 'border border-amber-400/35 bg-gradient-to-r from-amber-500/12 via-yellow-500/10 to-amber-600/12';
    case 2:
      return 'border border-zinc-400/30 bg-gradient-to-r from-zinc-500/15 to-zinc-600/10';
    case 3:
      return 'border border-orange-400/30 bg-gradient-to-r from-orange-600/12 to-amber-700/12';
    default:
      return 'border border-gray-800 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm';
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
      <div className="flex shrink-0 items-center justify-between border-b border-gray-800/90 bg-gradient-to-b from-zinc-900/60 to-zinc-900/30 px-6 py-4 backdrop-blur-sm">
        <div className="w-10" />
        <h1 className="text-center text-xl font-bold tracking-tight sm:text-2xl bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Top Miners
        </h1>
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          aria-label="Refresh leaderboard"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-800 bg-gray-900/60 transition-colors hover:bg-gray-800/80 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="shrink-0 border-b border-gray-800/90 bg-gradient-to-r from-gray-900/40 to-gray-800/30 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 sm:text-sm">My Rank</span>
            <div className="text-2xl font-bold tabular-nums text-cyan-400/95">#{myRank ?? '-'}</div>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-500 sm:text-sm">My Points</span>
            <div className="text-2xl font-bold tabular-nums text-white">
              {(profile?.point ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pt-3 [-webkit-overflow-scrolling:touch]">
        <div className="space-y-3 pb-28">
          {leaderboardData.map((user) => (
            <div
              key={user.rank}
              className={`flex items-center gap-4 rounded-2xl p-4 transition-all ${getRankStyles(user.rank)}`}
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
                <p className="text-lg font-bold tabular-nums text-cyan-400/95">
                  {user.points.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">pts</p>
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
