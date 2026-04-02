import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  adminListUsers,
  adminSetAccountStatus,
  adminSetMiningDisabled,
  adminSetUserRole,
  type AdminUserRow,
} from '../../../lib/adminApi';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const res = await adminListUsers({
      search: search.trim() || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      limit: 80,
      offset: 0,
    });
    setLoading(false);
    if (!res.ok) {
      setErr(res.message);
      return;
    }
    setRows(res.rows);
    setTotal(res.total);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

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
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">사용자</h1>
        <p className="mt-1 text-sm text-gray-500">검색·필터 후 역할·계정 상태·채굴 차단을 변경합니다.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          검색
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이메일, 닉네임, 초대코드"
            className="w-56 rounded-lg border border-gray-700 bg-[#0f0f18] px-3 py-2 text-sm text-white placeholder-gray-600"
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
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          새로고침
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="text-xs text-gray-500">총 {total.toLocaleString()}명 · 표시 {rows.length}명</div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="bg-[#0f0f18] text-xs uppercase text-gray-500">
            <tr>
              <th className="border-b border-gray-800 px-3 py-3">이메일</th>
              <th className="border-b border-gray-800 px-3 py-3">닉네임</th>
              <th className="border-b border-gray-800 px-3 py-3">포인트</th>
              <th className="border-b border-gray-800 px-3 py-3">역할</th>
              <th className="border-b border-gray-800 px-3 py-3">상태</th>
              <th className="border-b border-gray-800 px-3 py-3">채굴</th>
              <th className="border-b border-gray-800 px-3 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  불러오는 중…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  결과 없음
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/80 hover:bg-white/[0.02]">
                  <td className="max-w-[200px] truncate px-3 py-2 text-gray-300">{u.email ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-300">{u.nickname ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums text-white">{Number(u.point).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <select
                      value={u.role ?? 'user'}
                      onChange={(e) =>
                        void apply('역할 변경됨', () =>
                          adminSetUserRole(u.id, e.target.value as 'user' | 'vip' | 'admin'),
                        )
                      }
                      className="rounded border border-gray-700 bg-[#12121c] px-2 py-1 text-xs text-white"
                    >
                      <option value="user">user</option>
                      <option value="vip">vip</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={u.account_status ?? 'active'}
                      onChange={(e) =>
                        void apply('계정 상태 변경됨', () =>
                          adminSetAccountStatus(
                            u.id,
                            e.target.value as 'active' | 'suspended' | 'deleted',
                          ),
                        )
                      }
                      className="rounded border border-gray-700 bg-[#12121c] px-2 py-1 text-xs text-white"
                    >
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                      <option value="deleted">deleted</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        void apply(u.mining_disabled ? '채굴 허용' : '채굴 차단', () =>
                          adminSetMiningDisabled(u.id, !u.mining_disabled),
                        )
                      }
                      className={
                        Boolean(u.mining_disabled)
                          ? 'rounded bg-amber-900/40 px-2 py-1 text-xs text-amber-200 hover:bg-amber-900/60'
                          : 'rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700'
                      }
                    >
                      {u.mining_disabled ? '차단됨' : '허용'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{u.id.slice(0, 8)}…</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
