import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { adminStatsSummary } from '../../../lib/adminApi';

export default function AdminDashboard() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">포인트 흐름과 활성 사용자 요약</p>
      </div>

      {err && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5">
          <div className="text-xs uppercase tracking-wide text-gray-500">누적 발행(양수 합)</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-400 tabular-nums">
            {data ? data.points_positive_sum.toLocaleString() : '—'}
          </div>
          <div className="mt-1 text-xs text-gray-600">mining_logs amount &gt; 0</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5">
          <div className="text-xs uppercase tracking-wide text-gray-500">누적 소모(음수 절댓값)</div>
          <div className="mt-2 text-2xl font-semibold text-amber-400 tabular-nums">
            {data ? data.points_negative_abs_sum.toLocaleString() : '—'}
          </div>
          <div className="mt-1 text-xs text-gray-600">mining_logs amount &lt; 0</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5">
          <div className="text-xs uppercase tracking-wide text-gray-500">활성 계정 수</div>
          <div className="mt-2 text-2xl font-semibold text-cyan-400 tabular-nums">
            {data ? data.active_users.toLocaleString() : '—'}
          </div>
          <div className="mt-1 text-xs text-gray-600">account_status = active</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/admin/users"
          className="rounded-lg bg-cyan-600 px-4 py-2 font-medium text-black hover:bg-cyan-500"
        >
          사용자 관리
        </Link>
        <Link
          to="/admin/points"
          className="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 hover:bg-white/5"
        >
          포인트·환전
        </Link>
        <Link
          to="/admin/system"
          className="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 hover:bg-white/5"
        >
          감사 로그
        </Link>
      </div>
    </div>
  );
}
