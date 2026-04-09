import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  adminAdjustPoints,
  adminDecideWithdrawal,
  adminListMiningLogs,
  adminListWithdrawals,
  adminUserDisplayLabel,
  type MiningLogRow,
  type WithdrawalRow,
} from '../../../lib/adminApi';

export default function AdminPoints() {
  const [userId, setUserId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [logs, setLogs] = useState<MiningLogRow[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logLoading, setLogLoading] = useState(false);

  const [adjUser, setAdjUser] = useState('');
  const [adjDelta, setAdjDelta] = useState('');
  const [adjReason, setAdjReason] = useState('');

  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [wdLoading, setWdLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLogLoading(true);
    const uid = userId.trim() || null;
    const res = await adminListMiningLogs({
      userId: uid,
      type: typeFilter || undefined,
      limit: 120,
      offset: 0,
    });
    setLogLoading(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    setLogs(res.rows);
    setLogTotal(res.total);
  }, [userId, typeFilter]);

  const loadWd = useCallback(async () => {
    setWdLoading(true);
    const res = await adminListWithdrawals({ status: 'pending', limit: 50, offset: 0 });
    setWdLoading(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    setWithdrawals(res.rows);
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    void loadWd();
  }, [loadWd]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-white">포인트·환전</h1>
        <p className="mt-1 text-sm text-gray-500">거래 내역 조회, 수동 조정, 출금 요청 처리</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white">수동 지급·차감</h2>
        <p className="text-xs text-gray-500">
          RPC <code className="text-cyan-600">admin_adjust_points</code>가 잔액 검증·로그·감사 기록을 한 트랜잭션에서 처리합니다.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            사용자 (이메일·닉네임·초대코드 또는 UUID)
            <input
              value={adjUser}
              onChange={(e) => setAdjUser(e.target.value)}
              placeholder="예: cashwood39 또는 user@gmail.com"
              className="w-80 rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            변동량 (+/- 정수)
            <input
              value={adjDelta}
              onChange={(e) => setAdjDelta(e.target.value)}
              placeholder="-100 또는 500"
              className="w-36 rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            사유
            <input
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              className="w-56 rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={async () => {
              const d = Number(adjDelta);
              if (!adjUser.trim() || Number.isNaN(d) || d === 0) {
                toast.error('사용자 식별자와 유효한 변동량을 입력하세요.');
                return;
              }
              const r = await adminAdjustPoints(adjUser.trim(), d, adjReason);
              if (!r.ok) {
                toast.error(r.message);
                return;
              }
              toast.success(`반영됨 · 잔액 ${r.balance?.toLocaleString() ?? ''}`);
              setAdjDelta('');
              setAdjReason('');
              void loadLogs();
            }}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-500"
          >
            적용
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-white">대기 중 출금·환전</h2>
          <button
            type="button"
            onClick={() => void loadWd()}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
          >
            새로고침
          </button>
        </div>
        {wdLoading ? (
          <p className="text-sm text-gray-500">불러오는 중…</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-sm text-gray-500">대기 요청 없음</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#0f0f18] text-xs uppercase text-gray-500">
                <tr>
                  <th className="border-b border-gray-800 px-3 py-2">ID</th>
                  <th className="border-b border-gray-800 px-3 py-2">사용자</th>
                  <th className="border-b border-gray-800 px-3 py-2">금액</th>
                  <th className="border-b border-gray-800 px-3 py-2">작업</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-gray-800/80">
                    <td className="px-3 py-2 tabular-nums text-gray-400">{w.id}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-gray-300">
                      {w.user_email ?? w.user_id}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-white">{w.amount.toLocaleString()}</td>
                    <td className="space-x-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const r = await adminDecideWithdrawal(w.id, true);
                          if (!r.ok) {
                            toast.error(r.message);
                            return;
                          }
                          toast.success('승인됨');
                          void loadWd();
                          void loadLogs();
                        }}
                        className="rounded bg-emerald-900/50 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-900/70"
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const r = await adminDecideWithdrawal(w.id, false);
                          if (!r.ok) {
                            toast.error(r.message);
                            return;
                          }
                          toast.success('거절됨');
                          void loadWd();
                        }}
                        className="rounded bg-red-900/40 px-2 py-1 text-xs text-red-200 hover:bg-red-900/60"
                      >
                        거절
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white">포인트 거래 로그</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            사용자 (비우면 전체 · 이메일·닉네임·UUID)
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="cashwood39 또는 UUID"
              className="w-80 rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            타입
            <input
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder="MINING, ADMIN_ADJUST…"
              className="w-44 rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={() => void loadLogs()}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            조회
          </button>
        </div>
        <p className="text-xs text-gray-600">총 {logTotal.toLocaleString()}건</p>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#0f0f18] text-xs uppercase text-gray-500">
              <tr>
                <th className="border-b border-gray-800 px-3 py-2">시간</th>
                <th className="border-b border-gray-800 px-3 py-2">사용자</th>
                <th className="border-b border-gray-800 px-3 py-2">amount</th>
                <th className="border-b border-gray-800 px-3 py-2">type</th>
              </tr>
            </thead>
            <tbody>
              {logLoading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                    불러오는 중…
                  </td>
                </tr>
              ) : (
                logs.map((m) => (
                  <tr key={m.id} className="border-b border-gray-800/80">
                    <td className="px-3 py-2 text-xs text-gray-400">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="max-w-[220px] px-3 py-2">
                      <div className="text-sm font-medium text-gray-100">
                        {adminUserDisplayLabel(m.user_nickname, m.user_email, m.user_id)}
                      </div>
                      <div className="truncate font-mono text-[10px] text-gray-600" title={m.user_id}>
                        ID {m.user_id}
                      </div>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-white">{m.amount}</td>
                    <td className="px-3 py-2 text-cyan-200/90">{m.type}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
