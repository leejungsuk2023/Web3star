import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  adminMiningDailyStats,
  adminMiningTopMiners,
  adminStatsSummary,
  adminUserDisplayLabel,
  type AdminDailyMiningRow,
  type AdminTopMinerRow,
} from '../../../lib/adminApi';

const chartTick = { fill: '#6b7280', fontSize: 11 };
const gridStroke = '#27272f';

export default function AdminDashboard() {
  const [summary, setSummary] = useState<{
    points_positive_sum: number;
    points_negative_abs_sum: number;
    active_users: number;
    suspended_users: number;
    mining_disabled_users: number;
    total_mining_sum: number;
    today_mining_sum: number;
    abnormal_mining_users_24h: number;
  } | null>(null);
  const [daily, setDaily] = useState<AdminDailyMiningRow[]>([]);
  const [topMiners, setTopMiners] = useState<AdminTopMinerRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [s, d, t] = await Promise.all([
        adminStatsSummary(),
        adminMiningDailyStats(14),
        adminMiningTopMiners(10),
      ]);
      if (cancelled) return;
      if (!s.ok) {
        setErr(s.message);
        return;
      }
      setSummary({
        points_positive_sum: s.points_positive_sum,
        points_negative_abs_sum: s.points_negative_abs_sum,
        active_users: s.active_users,
        suspended_users: s.suspended_users,
        mining_disabled_users: s.mining_disabled_users,
        total_mining_sum: s.total_mining_sum,
        today_mining_sum: s.today_mining_sum,
        abnormal_mining_users_24h: s.abnormal_mining_users_24h,
      });
      if (d.ok) setDaily(d.rows);
      if (t.ok) setTopMiners(t.rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lineData = daily.map((r) => ({
    ...r,
    label: r.day?.slice(5) ?? r.day,
  }));

  const barData = topMiners.map((r) => {
    const full = adminUserDisplayLabel(r.nickname, r.email, r.id);
    return {
      name: full.slice(0, 16),
      total: Number(r.total_mined),
      full,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">
          로그인 직후 전체 포인트·채굴·계정 현황을 숫자로 확인합니다. 상세 수정은{' '}
          <Link to="/admin/mining" className="text-cyan-400 hover:underline">
            채굴·사용자 활동
          </Link>
          에서 진행하세요.
        </p>
      </div>

      {err && (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">통계 RPC 오류</p>
          <p className="mt-1 text-amber-200/90">{err}</p>
          <p className="mt-2 text-xs text-amber-200/70">
            Supabase에서 <code className="text-cyan-300">docs/supabase-admin-panel-v2-update.sql</code> 를 실행해
            최신 RPC를 배포했는지 확인하세요.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="전체 채굴량 합계 (MINING)"
          value={summary?.total_mining_sum}
          sub="type=MINING, amount&gt;0"
          accent="text-violet-400"
        />
        <StatCard
          label="오늘 채굴량"
          value={summary?.today_mining_sum}
          sub="오늘 0시(서버) 이후"
          accent="text-fuchsia-400"
        />
        <StatCard
          label="포인트 발행 vs 소모"
          value={summary ? `${summary.points_positive_sum.toLocaleString()} / ${summary.points_negative_abs_sum.toLocaleString()}` : undefined}
          sub="mining_logs 양수합 · 음수 절댓값합"
          accent="text-emerald-400"
          raw
        />
        <StatCard
          label="활성 / 정지 (계정)"
          value={summary ? `${summary.active_users} / ${summary.suspended_users}` : undefined}
          sub="account_status — 사용자 목록에서 상태를 suspended 로 바꿀 때만 증가"
          accent="text-cyan-400"
          raw
        />
        <StatCard
          label="채굴 차단"
          value={summary?.mining_disabled_users}
          sub="users.mining_disabled — 채굴 OFF 버튼으로 차단한 인원"
          accent="text-amber-400"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="비정상 채굴 의심 (24h)"
          value={summary?.abnormal_mining_users_24h}
          sub="최근 24시간 MINING 6회 초과 사용자 수 (4시간 쿨다운 기준 이론상 최대 6회/일)"
          accent="text-rose-400"
          to="/admin/mining?abnormal=1"
          linkTitle="클릭하면 해당 사용자 목록(채굴·사용자 활동)으로 이동합니다."
        />
        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5 text-sm text-gray-500">
          <div className="text-xs uppercase tracking-wide text-gray-500">보안·로그</div>
          <p className="mt-2 text-gray-400">
            포인트 지급/차감·역할 변경 등은 RPC 한 트랜잭션과{' '}
            <code className="text-cyan-600">admin_audit_log</code>에 기록됩니다. RLS로 일반 사용자는 본인 데이터만
            조회합니다.
          </p>
          <Link
            to="/admin/system"
            className="mt-3 inline-block text-cyan-400 hover:underline"
          >
            감사 로그 보기 →
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-4">
          <h2 className="text-sm font-medium text-white">일별 채굴량 추이</h2>
          <p className="text-xs text-gray-500">최근 14일 · MINING 양수 합</p>
          <div className="mt-4 h-56 w-full min-w-0">
            {lineData.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-600">데이터 없음</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="label" tick={chartTick} />
                  <YAxis tick={chartTick} width={44} />
                  <Tooltip
                    contentStyle={{ background: '#12121c', border: '1px solid #27272f', borderRadius: 8 }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Line type="monotone" dataKey="total_mined" name="채굴량" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-4">
          <h2 className="text-sm font-medium text-white">상위 채굴자 (누적 TOP 10)</h2>
          <p className="text-xs text-gray-500">MINING 타입 양수 합 기준</p>
          <div className="mt-4 h-56 w-full min-w-0">
            {barData.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-600">데이터 없음</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                  <XAxis type="number" tick={chartTick} />
                  <YAxis type="category" dataKey="name" width={72} tick={chartTick} />
                  <Tooltip
                    contentStyle={{ background: '#12121c', border: '1px solid #27272f', borderRadius: 8 }}
                    formatter={(v: number) => [v.toLocaleString(), '누적 채굴']}
                    labelFormatter={(_, payload) => (payload?.[0]?.payload?.full as string) ?? ''}
                  />
                  <Bar dataKey="total" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5">
        <h2 className="text-sm font-medium text-white">리더보드 스타일 (상위 10)</h2>
        <ol className="mt-3 space-y-2 text-sm">
          {topMiners.map((r, i) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-800/80 bg-black/20 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-gray-300">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-300">
                  {i + 1}
                </span>
                <span>
                  <span className="font-medium text-white">
                    {adminUserDisplayLabel(r.nickname, r.email, r.id)}
                  </span>
                  <span className="ml-2 font-mono text-xs text-gray-600" title={r.id}>
                    {r.id.slice(0, 8)}…
                  </span>
                </span>
              </span>
              <span className="tabular-nums text-violet-300">{Number(r.total_mined).toLocaleString()} pts</span>
            </li>
          ))}
          {topMiners.length === 0 && <li className="text-gray-600">데이터 없음</li>}
        </ol>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/admin/mining"
          className="rounded-lg bg-cyan-600 px-4 py-2 font-medium text-black hover:bg-cyan-500"
        >
          사용자별 채굴·수정
        </Link>
        <Link
          to="/admin/users"
          className="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 hover:bg-white/5"
        >
          사용자
        </Link>
        <Link
          to="/admin/referrals"
          className="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 hover:bg-white/5"
        >
          레퍼럴(추천인)
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

function StatCard({
  label,
  value,
  sub,
  accent,
  raw,
  to,
  linkTitle,
}: {
  label: string;
  value: number | string | undefined;
  sub: string;
  accent: string;
  raw?: boolean;
  /** 설정 시 카드 전체가 링크로 동작합니다. */
  to?: string;
  linkTitle?: string;
}) {
  const inner = (
    <>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${accent}`}>
        {value === undefined ? '—' : raw ? value : typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="mt-1 text-xs text-gray-600">{sub}</div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        title={linkTitle}
        className="block rounded-xl border border-gray-800 bg-[#0f0f18] p-5 no-underline transition hover:border-gray-600 hover:bg-[#12121c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-[#0f0f18] p-5">
      {inner}
    </div>
  );
}
