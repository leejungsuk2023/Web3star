import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminListAuditLog, type AuditLogRow } from '../../../lib/adminApi';

export default function AdminSystem() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminListAuditLog(200, 0);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    setRows(res.rows);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">시스템·감사</h1>
          <p className="mt-1 text-sm text-gray-500">
            관리자 조작(포인트·역할·환전 결정 등)은 <code className="text-cyan-600">admin_audit_log</code>에
            기록됩니다. 로그인·앱 에러는 별도 테이블/로깅 서비스 연동을 권장합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
        >
          새로고침
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[#0f0f18] text-xs uppercase text-gray-500">
            <tr>
              <th className="border-b border-gray-800 px-3 py-2">시간</th>
              <th className="border-b border-gray-800 px-3 py-2">액션</th>
              <th className="border-b border-gray-800 px-3 py-2">대상 사용자</th>
              <th className="border-b border-gray-800 px-3 py-2">payload</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                  불러오는 중…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                  기록 없음
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr key={a.id} className="border-b border-gray-800/80 align-top hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-400">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-cyan-200/90">{a.action}</td>
                  <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs text-gray-500">
                    {a.target_user_id ?? '—'}
                  </td>
                  <td className="max-w-[480px] px-3 py-2 font-mono text-xs text-gray-400 break-all">
                    {JSON.stringify(a.payload)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
