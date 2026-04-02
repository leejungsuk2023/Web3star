import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminListMiningLogs, type MiningLogRow } from '../../../lib/adminApi';

export default function AdminMining() {
  const [userId, setUserId] = useState('');
  const [typeFilter, setTypeFilter] = useState('MINING');
  const [rows, setRows] = useState<MiningLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminListMiningLogs({
      userId: userId.trim() || null,
      type: typeFilter.trim() || undefined,
      limit: 150,
      offset: 0,
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    setRows(res.rows);
    setTotal(res.total);
  }, [userId, typeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">채굴 활동</h1>
        <p className="mt-1 text-sm text-gray-500">
          채굴·광고·관리자 조정 로그를 한곳에서 봅니다. 비정상 패턴은 별도 규칙/알림(추가 RPC)으로 확장할 수 있습니다.
        </p>
      </div>

      <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90">
        앱에서 채굴 버튼을 막으려면 사용자 화면에서 <code className="text-cyan-300">mining_disabled</code> 및{' '}
        <code className="text-cyan-300">account_status</code>를 확인하는 로직을 연결하세요. DB에는 이미 플래그가
        있습니다.
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          사용자 UUID
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="비우면 전체"
            className="w-72 rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 font-mono text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          타입 필터
          <input
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-40 rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          조회
        </button>
      </div>

      <p className="text-xs text-gray-500">총 {total.toLocaleString()}건</p>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#0f0f18] text-xs uppercase text-gray-500">
            <tr>
              <th className="border-b border-gray-800 px-3 py-2">시간</th>
              <th className="border-b border-gray-800 px-3 py-2">user</th>
              <th className="border-b border-gray-800 px-3 py-2">amount</th>
              <th className="border-b border-gray-800 px-3 py-2">type</th>
              <th className="border-b border-gray-800 px-3 py-2">slot</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                  불러오는 중…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                  결과 없음
                </td>
              </tr>
            ) : (
              rows.map((m) => (
                <tr key={m.id} className="border-b border-gray-800/80 hover:bg-white/[0.02]">
                  <td className="px-3 py-2 text-xs text-gray-400">
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-2 font-mono text-xs">{m.user_id}</td>
                  <td className="px-3 py-2 tabular-nums">{m.amount}</td>
                  <td className="px-3 py-2 text-cyan-200/80">{m.type}</td>
                  <td className="px-3 py-2 text-gray-500">{m.slot_number ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
