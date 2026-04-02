import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminListEvents, adminListMissions, type EventRow, type MissionRow } from '../../../lib/adminApi';

export default function AdminContent() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [m, e] = await Promise.all([adminListMissions(true), adminListEvents(true)]);
      if (cancelled) return;
      setLoading(false);
      if (!m.ok) toast.error(m.message);
      else setMissions(m.rows);
      if (!e.ok) toast.error(e.message);
      else setEvents(e.rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-white">미션·이벤트</h1>
        <p className="mt-1 text-sm text-gray-500">
          등록된 미션·이벤트 목록입니다. 생성·수정은 Supabase에서{' '}
          <code className="text-cyan-600">admin_upsert_mission</code> /{' '}
          <code className="text-cyan-600">admin_upsert_event</code> RPC를 호출하거나 추후 이 화면에 폼을 붙이면 됩니다.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">미션</h2>
        {loading ? (
          <p className="text-sm text-gray-500">불러오는 중…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#0f0f18] text-xs uppercase text-gray-500">
                <tr>
                  <th className="border-b border-gray-800 px-3 py-2">제목</th>
                  <th className="border-b border-gray-800 px-3 py-2">보상</th>
                  <th className="border-b border-gray-800 px-3 py-2">활성</th>
                </tr>
              </thead>
              <tbody>
                {missions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                      없음
                    </td>
                  </tr>
                ) : (
                  missions.map((x) => (
                    <tr key={x.id} className="border-b border-gray-800/80">
                      <td className="px-3 py-2 text-white">{x.title}</td>
                      <td className="px-3 py-2 tabular-nums">{x.reward_points}</td>
                      <td className="px-3 py-2">{x.active ? '예' : '아니오'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">이벤트</h2>
        {loading ? null : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#0f0f18] text-xs uppercase text-gray-500">
                <tr>
                  <th className="border-b border-gray-800 px-3 py-2">제목</th>
                  <th className="border-b border-gray-800 px-3 py-2">보상</th>
                  <th className="border-b border-gray-800 px-3 py-2">기간</th>
                  <th className="border-b border-gray-800 px-3 py-2">활성</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                      없음
                    </td>
                  </tr>
                ) : (
                  events.map((x) => (
                    <tr key={x.id} className="border-b border-gray-800/80">
                      <td className="px-3 py-2 text-white">{x.title}</td>
                      <td className="px-3 py-2 tabular-nums">{x.reward_points}</td>
                      <td className="px-3 py-2 text-xs text-gray-400">
                        {x.starts_at ? new Date(x.starts_at).toLocaleDateString() : '—'} ~{' '}
                        {x.ends_at ? new Date(x.ends_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-2">{x.active ? '예' : '아니오'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
