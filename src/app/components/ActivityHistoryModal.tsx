import { useEffect, useState } from 'react';
import { X, Coins, Zap, UserPlus, Gift } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface ActivityHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MiningLog {
  id: number;
  amount: number;
  type: string;
  slot_number: number | null;
  created_at: string;
}

type ActivityType = 'MINING' | 'AD_POINT' | 'REFERRAL' | 'BONUS';

function getActivityMeta(type: ActivityType) {
  switch (type) {
    case 'MINING':
      return { Icon: Coins, color: 'text-cyan-400', bg: 'bg-cyan-500/20', title: 'Mining Completed', desc: 'Mining cycle finished' };
    case 'AD_POINT':
      return { Icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20', title: 'Ad Bonus', desc: 'Ad slot bonus earned' };
    case 'REFERRAL':
      return { Icon: UserPlus, color: 'text-green-400', bg: 'bg-green-500/20', title: 'Referral Reward', desc: 'Friend joined using your code' };
    case 'BONUS':
      return { Icon: Gift, color: 'text-purple-400', bg: 'bg-purple-500/20', title: 'Bonus', desc: 'Bonus points earned' };
    default:
      return { Icon: Coins, color: 'text-gray-400', bg: 'bg-gray-500/20', title: type, desc: '' };
  }
}

function formatTimeAgo(dateStr: string) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function ActivityHistoryModal({ isOpen, onClose }: ActivityHistoryModalProps) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MiningLog[]>([]);
  const [loading, setLoading] = useState(false);
  /** 조회 실패(RLS 등)일 때만 값 있음. 비어 있으면 진짜로 행이 없거나 아직 로딩 전. */
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !user) return;

    async function fetchLogs() {
      setLoading(true);
      setFetchError(null);
      setLogs([]);
      const { data, error } = await supabase
        .from('mining_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        setFetchError(error.message);
        setLogs([]);
      } else {
        setLogs(data ?? []);
      }
      setLoading(false);
    }

    fetchLogs();
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[80vh] bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Activity History</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Activity List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fetchError ? (
            <div className="space-y-2 px-2 py-10 text-center text-sm text-amber-200/90">
              <p className="font-medium">내역을 불러오지 못했습니다.</p>
              <p className="text-xs text-gray-400 break-words">{fetchError}</p>
              <p className="text-xs text-gray-500">
                Supabase에서 <code className="text-gray-400">mining_logs</code> 읽기 권한(RLS)을 확인해 주세요.
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="space-y-2 px-2 py-12 text-center text-gray-500">
              <p>아직 기록된 활동이 없습니다.</p>
              <p className="text-xs text-gray-600">채굴·광고 보상을 하면 여기에 쌓입니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const { Icon, color, bg, title, desc } = getActivityMeta(log.type as ActivityType);
                return (
                  <div
                    key={log.id}
                    className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-white font-semibold text-sm">{title}</h3>
                          <span className="text-cyan-400 font-semibold text-sm whitespace-nowrap">
                            +{log.amount} Pts
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mb-1">{desc}</p>
                        <span className="text-gray-500 text-xs">{formatTimeAgo(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
