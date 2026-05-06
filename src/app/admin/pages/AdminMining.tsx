import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import {
  adminAdjustPoints,
  adminListAbnormalMiningUsers24h,
  adminListMiningLogs,
  adminListUsers,
  adminSetAccountStatus,
  adminSetMiningDisabled,
  adminSetUserRole,
  adminUserDisplayLabel,
  type AbnormalMiningUserRow,
  type AdminUserRow,
  type MiningLogRow,
} from '../../../lib/adminApi';

function lastActivityLabel(u: AdminUserRow): string {
  const tLog = u.last_log_at ? new Date(u.last_log_at).getTime() : 0;
  const tMine = u.last_mined_at ? new Date(u.last_mined_at).getTime() : 0;
  const m = Math.max(tLog, tMine);
  return m > 0 ? new Date(m).toLocaleString() : '—';
}

export default function AdminMining() {
  const [searchParams, setSearchParams] = useSearchParams();
  const abnormalParam = searchParams.get('abnormal');
  const showAbnormalPanel =
    abnormalParam === '1' || abnormalParam === 'true' || abnormalParam === '24h';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [abnormalRows, setAbnormalRows] = useState<AbnormalMiningUserRow[]>([]);
  const [abnormalTotal, setAbnormalTotal] = useState(0);
  const [abnormalLoading, setAbnormalLoading] = useState(false);

  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);
  const [detailLogs, setDetailLogs] = useState<MiningLogRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [logTypeFilter, setLogTypeFilter] = useState('');
  const [logRows, setLogRows] = useState<MiningLogRow[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logLoading, setLogLoading] = useState(false);

  const [deltas, setDeltas] = useState<Record<string, string>>({});
  const [adjustReason, setAdjustReason] = useState('관리자 테이블 조정');

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const res = await adminListUsers({
      search: search.trim() || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      limit: 100,
      offset: 0,
    });
    setLoadingUsers(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    setUsers(res.rows);
    setUserTotal(res.total);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const loadAbnormal = useCallback(async () => {
    setAbnormalLoading(true);
    const res = await adminListAbnormalMiningUsers24h({ limit: 200, offset: 0 });
    setAbnormalLoading(false);
    if (!res.ok) {
      toast.error(res.message);
      setAbnormalRows([]);
      setAbnormalTotal(0);
      return;
    }
    setAbnormalRows(res.rows);
    setAbnormalTotal(res.total);
  }, []);

  useEffect(() => {
    if (!showAbnormalPanel) return;
    void loadAbnormal();
  }, [showAbnormalPanel, loadAbnormal]);

  useEffect(() => {
    if (!detailUser) return;
    const next = users.find((x) => x.id === detailUser.id);
    if (next) setDetailUser(next);
  }, [users, detailUser?.id]);

  const loadGlobalLogs = useCallback(async () => {
    setLogLoading(true);
    const res = await adminListMiningLogs({
      userId: null,
      type: logTypeFilter.trim() || undefined,
      limit: 120,
      offset: 0,
    });
    setLogLoading(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    setLogRows(res.rows);
    setLogTotal(res.total);
  }, [logTypeFilter]);

  useEffect(() => {
    void loadGlobalLogs();
  }, [loadGlobalLogs]);

  const openDetail = async (u: AdminUserRow) => {
    setDetailUser(u);
    setDetailLoading(true);
    const res = await adminListMiningLogs({ userId: u.id, limit: 80, offset: 0 });
    setDetailLoading(false);
    if (!res.ok) {
      toast.error(res.message);
      setDetailLogs([]);
      return;
    }
    setDetailLogs(res.rows);
  };

  const openDetailFromAbnormal = async (r: AbnormalMiningUserRow) => {
    const res = await adminListUsers({ search: r.user_id, limit: 30, offset: 0 });
    if (res.ok) {
      const u = res.rows.find((x) => x.id === r.user_id);
      if (u) {
        void openDetail(u);
        return;
      }
    }
    toast.error('사용자 정보를 불러오지 못했습니다. 아래 검색에 UUID를 붙여넣어 조회해 보세요.');
  };

  const closeAbnormalPanel = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('abnormal');
    setSearchParams(next, { replace: true });
  };

  async function apply(
    label: string,
    fn: () => Promise<{ ok: true } | { ok: false; message: string }>,
  ) {
    const r = await fn();
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    toast.success(label);
    await loadUsers();
    if (detailUser) void openDetail(detailUser);
  }

  const applyDelta = async (userId: string) => {
    const raw = (deltas[userId] ?? '').trim();
    const d = Number(raw);
    if (!raw || Number.isNaN(d) || d === 0) {
      toast.error('유효한 변동 숫자를 입력하세요.');
      return;
    }
    const r = await adminAdjustPoints(userId, d, adjustReason || 'admin');
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    toast.success(`반영 · 잔액 ${r.balance?.toLocaleString() ?? ''}`);
    setDeltas((p) => ({ ...p, [userId]: '' }));
    await loadUsers();
    void loadGlobalLogs();
    if (detailUser?.id === userId) void openDetail(detailUser);
  };

  const sortedUsers = useMemo(() => users, [users]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-white">채굴·사용자 활동</h1>
        <p className="mt-1 text-sm text-gray-500">
          사용자 ID·닉네임·이메일로 검색하고, 누적 채굴량·포인트·최근 활동을 한눈에 봅니다. 테이블에서 포인트 조정·VIP·채굴
          ON/OFF를 바로 적용할 수 있습니다.
        </p>
      </div>

      {showAbnormalPanel && (
        <section className="space-y-3 rounded-xl border border-rose-900/45 bg-rose-950/15 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-rose-100">비정상 채굴 의심 (24h)</h2>
              <p className="mt-1 text-xs text-gray-500">
                최근 24시간 동안 MINING 로그가 6회를 넘은 계정입니다. 대시보드 &quot;비정상 채굴 의심&quot; 인원 수와 같은
                기준입니다. Supabase에{' '}
                <code className="text-cyan-600">docs/supabase-admin-list-abnormal-mining-users-24h.sql</code> 배포가
                필요합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadAbnormal()}
                className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
              >
                새로고침
              </button>
              <button
                type="button"
                onClick={closeAbnormalPanel}
                className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
              >
                패널 닫기
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">총 {abnormalTotal.toLocaleString()}명</p>
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-[#0f0f18] text-xs uppercase text-gray-500">
                <tr>
                  <th className="border-b border-gray-800 px-2 py-2">사용자</th>
                  <th className="border-b border-gray-800 px-2 py-2">24h MINING 횟수</th>
                  <th className="border-b border-gray-800 px-2 py-2">작업</th>
                </tr>
              </thead>
              <tbody>
                {abnormalLoading ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                      불러오는 중…
                    </td>
                  </tr>
                ) : abnormalRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                      해당 없음
                    </td>
                  </tr>
                ) : (
                  abnormalRows.map((r) => (
                    <tr key={r.user_id} className="border-b border-gray-800/80 hover:bg-white/[0.02]">
                      <td className="max-w-[280px] px-2 py-2 align-top">
                        <div className="font-mono text-[11px] text-gray-500" title={r.user_id}>
                          {r.user_id.slice(0, 13)}…
                        </div>
                        <div className="text-gray-200">{r.nickname || '—'}</div>
                        <div className="truncate text-xs text-gray-500">{r.email ?? '—'}</div>
                      </td>
                      <td className="px-2 py-2 tabular-nums text-rose-200">
                        {r.mining_count_24h.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <button
                          type="button"
                          onClick={() => void openDetailFromAbnormal(r)}
                          className="rounded border border-gray-600 px-2 py-1 text-xs text-cyan-300 hover:bg-white/5"
                        >
                          로그
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white">사용자별 채굴량</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            검색 (이메일·닉네임·초대코드·UUID 일부)
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색…"
              className="w-64 rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white placeholder-gray-600"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            역할
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
            >
              <option value="">전체</option>
              <option value="user">user</option>
              <option value="vip">vip</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            계정
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
            >
              <option value="">전체</option>
              <option value="active">active</option>
              <option value="suspended">suspended</option>
              <option value="deleted">deleted</option>
            </select>
          </label>
          <label className="flex min-w-[200px] flex-col gap-1 text-xs text-gray-500">
            포인트 조정 사유 (테이블 적용 시)
            <input
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            조회
          </button>
        </div>

        <p className="text-xs text-gray-500">
          총 {userTotal.toLocaleString()}명 · 표시 {sortedUsers.length}명 ·{' '}
          <code className="text-gray-600">total_mined</code> 컬럼은 Supabase v2 RPC 배포 후 표시됩니다.
        </p>

        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead className="bg-[#0f0f18] text-xs uppercase text-gray-500">
              <tr>
                <th className="border-b border-gray-800 px-2 py-2">사용자</th>
                <th className="border-b border-gray-800 px-2 py-2">누적 채굴</th>
                <th className="border-b border-gray-800 px-2 py-2">포인트</th>
                <th className="border-b border-gray-800 px-2 py-2">최근 활동</th>
                <th className="border-b border-gray-800 px-2 py-2">역할·상태·채굴</th>
                <th className="border-b border-gray-800 px-2 py-2">포인트 ±</th>
                <th className="border-b border-gray-800 px-2 py-2">상세</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                    불러오는 중…
                  </td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                    결과 없음
                  </td>
                </tr>
              ) : (
                sortedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800/80 hover:bg-white/[0.02]">
                    <td className="max-w-[220px] px-2 py-2 align-top">
                      <div className="font-mono text-[11px] text-gray-500" title={u.id}>
                        {u.id.slice(0, 13)}…
                      </div>
                      <div className="text-gray-200">{u.nickname || '—'}</div>
                      <div className="truncate text-xs text-gray-500">{u.email ?? '—'}</div>
                    </td>
                    <td className="px-2 py-2 tabular-nums text-violet-300">
                      {u.total_mined != null ? Number(u.total_mined).toLocaleString() : '—'}
                    </td>
                    <td className="px-2 py-2 tabular-nums text-white">{Number(u.point).toLocaleString()}</td>
                    <td className="px-2 py-2 text-xs text-gray-400">{lastActivityLabel(u)}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1">
                        <select
                          value={u.role ?? 'user'}
                          onChange={(e) =>
                            void apply('역할 변경', () =>
                              adminSetUserRole(u.id, e.target.value as 'user' | 'vip' | 'admin'),
                            )
                          }
                          className="max-w-[7rem] rounded border border-gray-700 bg-[#12121c] px-1 py-0.5 text-xs text-white"
                        >
                          <option value="user">user</option>
                          <option value="vip">vip</option>
                          <option value="admin">admin</option>
                        </select>
                        <select
                          value={u.account_status ?? 'active'}
                          onChange={(e) =>
                            void apply('계정 상태', () =>
                              adminSetAccountStatus(
                                u.id,
                                e.target.value as 'active' | 'suspended' | 'deleted',
                              ),
                            )
                          }
                          className="max-w-[7rem] rounded border border-gray-700 bg-[#12121c] px-1 py-0.5 text-xs text-white"
                        >
                          <option value="active">active</option>
                          <option value="suspended">suspended</option>
                          <option value="deleted">deleted</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            void apply(u.mining_disabled ? '채굴 허용' : '채굴 차단', () =>
                              adminSetMiningDisabled(u.id, !u.mining_disabled),
                            )
                          }
                          className={
                            u.mining_disabled
                              ? 'rounded bg-amber-900/40 px-2 py-0.5 text-left text-[11px] text-amber-200'
                              : 'rounded bg-gray-800 px-2 py-0.5 text-left text-[11px] text-gray-300'
                          }
                        >
                          채굴 {u.mining_disabled ? 'OFF' : 'ON'}
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <div className="flex flex-wrap items-center gap-1">
                        <input
                          type="number"
                          value={deltas[u.id] ?? ''}
                          onChange={(e) => setDeltas((p) => ({ ...p, [u.id]: e.target.value }))}
                          placeholder="±"
                          className="w-20 rounded border border-gray-700 bg-[#12121c] px-2 py-1 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => void applyDelta(u.id)}
                          className="rounded bg-cyan-700 px-2 py-1 text-[11px] text-white hover:bg-cyan-600"
                        >
                          적용
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => void openDetail(u)}
                        className="rounded border border-gray-600 px-2 py-1 text-xs text-cyan-300 hover:bg-white/5"
                      >
                        로그
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">전체 활동 로그</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            타입 (비우면 전체)
            <input
              value={logTypeFilter}
              onChange={(e) => setLogTypeFilter(e.target.value)}
              placeholder="MINING, ADMIN_ADJUST…"
              className="w-48 rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={() => void loadGlobalLogs()}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            새로고침
          </button>
        </div>
        <p className="text-xs text-gray-500">총 {logTotal.toLocaleString()}건</p>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-[#0f0f18] text-xs uppercase text-gray-500">
              <tr>
                <th className="border-b border-gray-800 px-2 py-2">시간</th>
                <th className="border-b border-gray-800 px-2 py-2">사용자</th>
                <th className="border-b border-gray-800 px-2 py-2">amount</th>
                <th className="border-b border-gray-800 px-2 py-2">type</th>
                <th className="border-b border-gray-800 px-2 py-2">slot</th>
              </tr>
            </thead>
            <tbody>
              {logLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                    불러오는 중…
                  </td>
                </tr>
              ) : logRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                    결과 없음
                  </td>
                </tr>
              ) : (
                logRows.map((m) => (
                  <tr key={m.id} className="border-b border-gray-800/80 hover:bg-white/[0.02]">
                    <td className="px-2 py-2 text-xs text-gray-400">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="max-w-[220px] px-2 py-2">
                      <div className="text-sm font-medium text-gray-100">
                        {adminUserDisplayLabel(m.user_nickname, m.user_email, m.user_id)}
                      </div>
                      <div
                        className="mt-0.5 truncate font-mono text-[10px] text-gray-600"
                        title={m.user_id}
                      >
                        ID {m.user_id}
                      </div>
                    </td>
                    <td className="px-2 py-2 tabular-nums">{m.amount}</td>
                    <td className="px-2 py-2 text-cyan-200/80">{m.type}</td>
                    <td className="px-2 py-2 text-gray-500">{m.slot_number ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal
          onClick={() => setDetailUser(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-xl border border-gray-700 bg-[#0c0c12] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">활동 상세</h3>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="rounded px-2 py-1 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                닫기
              </button>
            </div>
            <div className="space-y-2 border-b border-gray-800 px-4 py-3 text-sm">
              <div className="font-mono text-xs text-gray-400 break-all">{detailUser.id}</div>
              <div className="text-white">{detailUser.nickname || '—'}</div>
              <div className="text-gray-500">{detailUser.email ?? '—'}</div>
              <div className="text-xs text-gray-500">
                누적 채굴{' '}
                <span className="text-violet-300">
                  {detailUser.total_mined != null ? Number(detailUser.total_mined).toLocaleString() : '—'}
                </span>
                {' · '}포인트{' '}
                <span className="text-cyan-300">{Number(detailUser.point).toLocaleString()}</span>
              </div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
              {detailLoading ? (
                <p className="text-sm text-gray-500">불러오는 중…</p>
              ) : detailLogs.length === 0 ? (
                <p className="text-sm text-gray-500">로그 없음</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {detailLogs.map((m) => (
                    <li
                      key={m.id}
                      className="rounded-lg border border-gray-800/80 bg-black/20 px-2 py-2 text-gray-300"
                    >
                      <div className="flex justify-between gap-2 text-gray-500">
                        <span>{new Date(m.created_at).toLocaleString()}</span>
                        <span className="text-cyan-500/90">{m.type}</span>
                      </div>
                      <div className="mt-1 tabular-nums text-white">{m.amount > 0 ? '+' : ''}{m.amount} pts</div>
                      {m.slot_number != null && (
                        <div className="text-gray-600">slot {m.slot_number}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
