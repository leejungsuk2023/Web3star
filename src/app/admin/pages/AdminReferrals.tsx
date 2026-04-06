import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  adminAdjustPoints,
  adminListInvitedUsers,
  adminListReferralProgramLogs,
  adminListReferralSummaries,
  adminUserDisplayLabel,
  type InvitedUserRow,
  type MiningLogRow,
  type ReferralSummaryRow,
} from '../../../lib/adminApi';

const PAGE_SIZE = 50;

export default function AdminReferrals() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ReferralSummaryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [detailUser, setDetailUser] = useState<ReferralSummaryRow | null>(null);
  const [invited, setInvited] = useState<InvitedUserRow[]>([]);
  const [refLogs, setRefLogs] = useState<MiningLogRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [invitedTotal, setInvitedTotal] = useState(0);
  const [logsTotal, setLogsTotal] = useState(0);

  const [adjustUser, setAdjustUser] = useState<ReferralSummaryRow | null>(null);
  const [adjDelta, setAdjDelta] = useState('');
  const [adjReason, setAdjReason] = useState('referral_correction');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const res = await adminListReferralSummaries({
      search: search.trim() || undefined,
      limit: PAGE_SIZE,
      offset,
    });
    setLoading(false);
    if (!res.ok) {
      setErr(res.message);
      return;
    }
    setRows(res.rows);
    setTotal(res.total);
  }, [search, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (u: ReferralSummaryRow) => {
    setDetailUser(u);
    setDetailLoading(true);
    setInvited([]);
    setRefLogs([]);
    setInvitedTotal(0);
    setLogsTotal(0);
    const [inv, logs] = await Promise.all([
      adminListInvitedUsers({ referrerId: u.id, limit: 100, offset: 0 }),
      adminListReferralProgramLogs({ userId: u.id, limit: 120, offset: 0 }),
    ]);
    setDetailLoading(false);
    if (!inv.ok) {
      toast.error(inv.message);
    } else {
      setInvited(inv.rows);
      setInvitedTotal(inv.total);
    }
    if (!logs.ok) {
      toast.error(logs.message);
    } else {
      setRefLogs(logs.rows);
      setLogsTotal(logs.total);
    }
  };

  async function submitAdjust() {
    if (!adjustUser) return;
    const delta = Number(adjDelta);
    if (!Number.isFinite(delta) || delta === 0 || !Number.isInteger(delta)) {
      toast.error('변동량은 0이 아닌 정수로 입력하세요.');
      return;
    }
    const reason = adjReason.trim();
    if (!reason) {
      toast.error('사유를 입력하세요.');
      return;
    }
    const r = await adminAdjustPoints(adjustUser.id, delta, reason);
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    toast.success('포인트가 조정되었습니다.');
    setAdjustUser(null);
    setAdjDelta('');
    setAdjReason('referral_correction');
    await load();
    if (detailUser?.id === adjustUser.id) {
      await openDetail({ ...adjustUser, point: r.balance ?? adjustUser.point });
    }
  }

  const maxOffset = Math.max(0, total - PAGE_SIZE);
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">레퍼럴(추천인)</h1>
        <p className="mt-1 text-sm text-gray-500">
          사용자별 초대 인원·추천 관련 로그 합계를 확인하고, 오류 시{' '}
          <code className="text-cyan-600">admin_adjust_points</code>로 잔액을 수정합니다. (로그는
          ADMIN_ADJUST로 남습니다.)
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          검색
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="이메일, 닉네임, 초대코드, UUID 일부"
            className="w-64 rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white placeholder-gray-600"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          새로고침
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-white enabled:hover:bg-white/5 disabled:opacity-40"
          >
            이전
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setOffset((o) => Math.min(maxOffset, o + PAGE_SIZE))}
            className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-white enabled:hover:bg-white/5 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="text-xs text-gray-500">
        총 {total.toLocaleString()}명
        {total > 0
          ? ` · ${offset + 1}–${Math.min(offset + rows.length, total)} 표시`
          : ''}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-[#0f0f18] text-xs uppercase text-gray-500">
            <tr>
              <th className="border-b border-gray-800 px-3 py-3">사용자 ID</th>
              <th className="border-b border-gray-800 px-3 py-3">닉네임</th>
              <th className="border-b border-gray-800 px-3 py-3">이메일</th>
              <th className="border-b border-gray-800 px-3 py-3">가입일</th>
              <th className="border-b border-gray-800 px-3 py-3">레퍼럴 수</th>
              <th className="border-b border-gray-800 px-3 py-3">추천 로그 합</th>
              <th className="border-b border-gray-800 px-3 py-3">현재 포인트</th>
              <th className="border-b border-gray-800 px-3 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  불러오는 중…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  결과 없음
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/80 hover:bg-white/[0.02]">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      title={u.id}
                      onClick={() => void navigator.clipboard.writeText(u.id).then(() => toast.success('ID 복사됨'))}
                      className="max-w-[200px] truncate text-left font-mono text-[11px] text-cyan-500/90 hover:underline"
                    >
                      {u.id}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-gray-200">
                    {adminUserDisplayLabel(u.nickname, u.email, u.id)}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-gray-400">{u.email ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {new Date(u.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-amber-200/90">{u.referral_count}</td>
                  <td className="px-3 py-2 tabular-nums text-violet-300">
                    {u.referral_points_from_logs.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-white">{u.point.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void openDetail(u)}
                        className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
                      >
                        내역
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustUser(u);
                          setAdjDelta('');
                          setAdjReason('referral_correction');
                        }}
                        className="rounded bg-cyan-900/40 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-900/60"
                      >
                        포인트 조정
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detailUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal
          onClick={() => setDetailUser(null)}
        >
          <div
            className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-xl border border-gray-700 bg-[#0c0c12] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">레퍼럴 상세</h3>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="rounded px-2 py-1 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                닫기
              </button>
            </div>
            <div className="space-y-1 border-b border-gray-800 px-4 py-3 text-sm">
              <div className="font-mono text-xs text-gray-400 break-all">{detailUser.id}</div>
              <div className="text-white">{detailUser.nickname ?? '—'}</div>
              <div className="text-xs text-gray-500">
                초대 코드 <span className="text-gray-300">{detailUser.invite_code ?? '—'}</span>
                {' · '}레퍼럴 {detailUser.referral_count}명 · 추천 로그 합{' '}
                {detailUser.referral_points_from_logs.toLocaleString()} · 잔액{' '}
                {detailUser.point.toLocaleString()}
              </div>
            </div>
            <div className="max-h-[calc(88vh-8rem)] overflow-y-auto px-4 py-3">
              {detailLoading ? (
                <p className="text-sm text-gray-500">불러오는 중…</p>
              ) : (
                <>
                  <h4 className="mb-2 text-xs font-medium uppercase text-gray-500">
                    초대한 회원 ({invitedTotal.toLocaleString()})
                  </h4>
                  {invited.length === 0 ? (
                    <p className="mb-4 text-sm text-gray-600">없음</p>
                  ) : (
                    <ul className="mb-6 space-y-2 text-xs">
                      {invited.map((c) => (
                        <li
                          key={c.id}
                          className="rounded-lg border border-gray-800/80 bg-black/20 px-2 py-2 text-gray-300"
                        >
                          <div className="font-medium text-gray-100">
                            {adminUserDisplayLabel(c.nickname, c.email, c.id)}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-gray-600 break-all">{c.id}</div>
                          <div className="mt-1 text-gray-500">
                            가입 {new Date(c.created_at).toLocaleString()} · 포인트{' '}
                            {c.point.toLocaleString()}
                          </div>
                          <div className="text-gray-600">referred_by: {c.referred_by ?? '—'}</div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h4 className="mb-2 text-xs font-medium uppercase text-gray-500">
                    이 계정의 추천 관련 로그 REFERRAL·BONUS ({logsTotal.toLocaleString()})
                  </h4>
                  {refLogs.length === 0 ? (
                    <p className="text-sm text-gray-600">없음</p>
                  ) : (
                    <ul className="space-y-2 text-xs">
                      {refLogs.map((m) => (
                        <li
                          key={m.id}
                          className="rounded-lg border border-gray-800/80 bg-black/20 px-2 py-2 text-gray-300"
                        >
                          <div className="flex justify-between gap-2 text-gray-500">
                            <span>{new Date(m.created_at).toLocaleString()}</span>
                            <span className="text-cyan-500/90">{m.type}</span>
                          </div>
                          <div className="mt-1 tabular-nums text-white">
                            {m.amount > 0 ? '+' : ''}
                            {m.amount} pts
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {adjustUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal
          onClick={() => setAdjustUser(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-700 bg-[#0c0c12] p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-white">포인트 조정</h3>
            <p className="mt-1 font-mono text-xs text-gray-500 break-all">{adjustUser.id}</p>
            <p className="mt-2 text-sm text-gray-400">
              현재 잔액{' '}
              <span className="tabular-nums text-cyan-300">{adjustUser.point.toLocaleString()}</span>
            </p>
            <label className="mt-4 flex flex-col gap-1 text-xs text-gray-500">
              변동량 (+/- 정수)
              <input
                value={adjDelta}
                onChange={(e) => setAdjDelta(e.target.value)}
                placeholder="-100 또는 500"
                className="rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="mt-3 flex flex-col gap-1 text-xs text-gray-500">
              사유
              <input
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustUser(null)}
                className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void submitAdjust()}
                className="rounded-lg bg-cyan-700 px-4 py-2 text-sm text-white hover:bg-cyan-600"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
