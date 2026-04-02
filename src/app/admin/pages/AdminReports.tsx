import { useEffect, useState } from 'react';
import { adminStatsSummary } from '../../../lib/adminApi';

export default function AdminReports() {
  const [data, setData] = useState<{
    points_positive_sum: number;
    points_negative_abs_sum: number;
    active_users: number;
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
          상위 활동자·이상 탐지는 집계 RPC를 추가하면 이 페이지에서 차트·랭킹으로 확장할 수 있습니다.
        </p>
      </div>

      {err && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="text-xs text-gray-500">활성 사용자</div>
          <div className="mt-1 text-xl font-semibold text-white tabular-nums">
            {data?.active_users.toLocaleString() ?? '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
