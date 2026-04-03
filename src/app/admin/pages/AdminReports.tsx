import React, { useEffect, useState } from 'react';
import { adminStatsSummary } from '../../../lib/adminApi';

export default function AdminReports() {
  const [data, setData] = useState<{
    points_positive_sum: number;
    points_negative_abs_sum: number;
    active_users: number;
    total_mining_sum: number;
    today_mining_sum: number;
    suspended_users: number;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await adminStatsSummary();
      if (cancelled) return;
      if (!res.ok) {
        setErr(res.message);
        return;
      }
      setData({
        points_positive_sum: res.points_positive_sum,
        points_negative_abs_sum: res.points_negative_abs_sum,
        active_users: res.active_users,
        total_mining_sum: res.total_mining_sum,
        today_mining_sum: res.today_mining_sum,
        suspended_users: res.suspended_users,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const net =
    data != null ? data.points_positive_sum - data.points_negative_abs_sum : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">통계·리포트</h1>
        <p className="mt-1 text-sm text-gray-500">
          요약 수치는 대시보드와 동일 RPC입니다. 차트·랭킹은 대시보드에서 확인하세요.
        </p>
      </div>

      {err && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5">
          <div className="text-xs text-gray-500">발행 합(양수)</div>
          <div className="mt-1 text-xl font-semibold text-emerald-400 tabular-nums">
            {data?.points_positive_sum.toLocaleString() ?? '—'}
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5">
          <div className="text-xs text-gray-500">소모 합(음수 절댓값)</div>
          <div className="mt-1 text-xl font-semibold text-amber-400 tabular-nums">
            {data?.points_negative_abs_sum.toLocaleString() ?? '—'}
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5">
          <div className="text-xs text-gray-500">순 흐름(대략)</div>
          <div className="mt-1 text-xl font-semibold text-cyan-400 tabular-nums">
            {net != null ? net.toLocaleString() : '—'}
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5">
          <div className="text-xs text-gray-500">전체 채굴량 (MINING)</div>
          <div className="mt-1 text-xl font-semibold text-violet-400 tabular-nums">
            {data?.total_mining_sum.toLocaleString() ?? '—'}
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5">
          <div className="text-xs text-gray-500">오늘 채굴량</div>
          <div className="mt-1 text-xl font-semibold text-fuchsia-400 tabular-nums">
            {data?.today_mining_sum.toLocaleString() ?? '—'}
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5">
          <div className="text-xs text-gray-500">활성 / 정지</div>
          <div className="mt-1 text-xl font-semibold text-white tabular-nums">
            {data != null
              ? `${data.active_users.toLocaleString()} / ${data.suspended_users.toLocaleString()}`
              : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
