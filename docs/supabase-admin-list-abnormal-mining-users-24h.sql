-- 비정상 채굴 의심 상세: 최근 24시간 MINING 로그 건수 > 6 인 사용자 목록
-- 대시보드 카드와 동일 기준(admin_stats_summary 의 abnormal_mining_users_24h).
-- Supabase Dashboard → SQL Editor 에서 실행하세요.

CREATE OR REPLACE FUNCTION public.admin_list_abnormal_mining_users_24h(
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(greatest(coalesce(p_limit, 100), 1), 500);
  off int := greatest(coalesce(p_offset, 0), 0);
  total bigint;
  rows jsonb;
BEGIN
  PERFORM public._admin_assert();

  SELECT count(*)::bigint INTO total
  FROM (
    SELECT m.user_id
    FROM public.mining_logs m
    WHERE m.type = 'MINING'
      AND m.created_at > now() - interval '24 hours'
    GROUP BY m.user_id
    HAVING count(*) > 6
  ) s;

  SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.mining_count_24h DESC, x.user_id), '[]'::jsonb) INTO rows
  FROM (
    SELECT
      agg.user_id,
      agg.mining_count_24h,
      u.email,
      u.nickname
    FROM (
      SELECT m.user_id, count(*)::int AS mining_count_24h
      FROM public.mining_logs m
      WHERE m.type = 'MINING'
        AND m.created_at > now() - interval '24 hours'
      GROUP BY m.user_id
      HAVING count(*) > 6
    ) agg
    INNER JOIN public.users u ON u.id = agg.user_id
    ORDER BY agg.mining_count_24h DESC, agg.user_id
    LIMIT lim OFFSET off
  ) x;

  RETURN jsonb_build_object('ok', true, 'total', total, 'rows', rows);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_abnormal_mining_users_24h(int, int) TO authenticated;

-- 선택: 조회 속도 개선 (데이터량이 많을 때)
-- CREATE INDEX IF NOT EXISTS idx_mining_logs_mining_created
--   ON public.mining_logs (created_at DESC)
--   WHERE type = 'MINING';
