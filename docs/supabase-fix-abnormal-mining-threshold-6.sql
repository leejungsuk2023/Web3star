-- 비정상 채굴 의심: 최근 24h MINING 횟수 > 6 (4시간 쿨다운 기준 이론상 최대 6회/일)
-- Supabase SQL Editor에서 한 번 실행하면 admin_stats_summary()만 갱신됩니다.

CREATE OR REPLACE FUNCTION public.admin_stats_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  issued bigint;
  spent bigint;
  user_count_active bigint;
  user_count_suspended bigint;
  total_mining bigint;
  today_mining bigint;
  abnormal_users bigint;
BEGIN
  PERFORM public._admin_assert();

  SELECT coalesce(sum(amount), 0) INTO issued FROM public.mining_logs WHERE amount > 0;
  SELECT coalesce(sum(-amount), 0) INTO spent FROM public.mining_logs WHERE amount < 0;
  SELECT count(*) INTO user_count_active FROM public.users WHERE account_status = 'active';
  SELECT count(*) INTO user_count_suspended FROM public.users WHERE account_status = 'suspended';
  SELECT coalesce(sum(amount), 0) INTO total_mining FROM public.mining_logs WHERE type = 'MINING' AND amount > 0;
  SELECT coalesce(sum(amount), 0) INTO today_mining
  FROM public.mining_logs
  WHERE type = 'MINING' AND amount > 0 AND created_at >= date_trunc('day', now());

  SELECT count(*)::bigint INTO abnormal_users
  FROM (
    SELECT 1
    FROM public.mining_logs m
    WHERE m.type = 'MINING' AND m.created_at > now() - interval '24 hours'
    GROUP BY m.user_id
    HAVING count(*) > 6
  ) s;

  RETURN jsonb_build_object(
    'ok', true,
    'points_positive_sum', issued,
    'points_negative_abs_sum', spent,
    'active_users', user_count_active,
    'suspended_users', user_count_suspended,
    'total_mining_sum', total_mining,
    'today_mining_sum', today_mining,
    'abnormal_mining_users_24h', abnormal_users
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_stats_summary() TO authenticated;
