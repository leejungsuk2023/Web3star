-- Web3Star 관리자 패널 v2 보강 (기존 admin-panel.sql 적용 후 이 파일만 추가 실행)
-- 대시보드 요약 확장, 사용자별 채굴 집계, 채굴 로그에 닉네임/이메일, 일별·상위 채굴 RPC
--
-- ⚠ Supabase SQL Editor: 새 쿼리 탭을 열고 이 파일 전체만 붙여넣은 뒤 Run 하세요.
--    다른 SQL 위에 이어 붙이거나, 앞 블록이 $$; 로 안 닫혀 있으면
--    "syntax error at or near CREATE" (admin_list_users 근처) 가 납니다.

-- ---------------------------------------------------------------------------
-- admin_list_users: total_mined(MINING 합), last_log_at(마지막 로그 시각)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(greatest(coalesce(p_limit, 50), 1), 200);
  off int := greatest(coalesce(p_offset, 0), 0);
  total bigint;
  rows jsonb;
BEGIN
  PERFORM public._admin_assert();

  SELECT count(*) INTO total
  FROM public.users u
  WHERE (p_search IS NULL OR p_search = '' OR u.email ILIKE '%' || p_search || '%' OR u.nickname ILIKE '%' || p_search || '%' OR u.invite_code ILIKE '%' || p_search || '%')
    AND (p_role IS NULL OR p_role = '' OR u.role = p_role)
    AND (p_status IS NULL OR p_status = '' OR u.account_status = p_status);

  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC), '[]'::jsonb) INTO rows
  FROM (
    SELECT u.id, u.email, u.nickname, u.point, u.role, u.account_status, u.mining_disabled,
           u.invite_code, u.created_at, u.last_mined_at,
           (SELECT COALESCE(SUM(m.amount), 0)::bigint FROM public.mining_logs m
            WHERE m.user_id = u.id AND m.type = 'MINING' AND m.amount > 0) AS total_mined,
           (SELECT MAX(m.created_at) FROM public.mining_logs m WHERE m.user_id = u.id) AS last_log_at
    FROM public.users u
    WHERE (p_search IS NULL OR p_search = '' OR u.email ILIKE '%' || p_search || '%' OR u.nickname ILIKE '%' || p_search || '%' OR u.invite_code ILIKE '%' || p_search || '%')
      AND (p_role IS NULL OR p_role = '' OR u.role = p_role)
      AND (p_status IS NULL OR p_status = '' OR u.account_status = p_status)
    ORDER BY u.created_at DESC
    LIMIT lim OFFSET off
  ) t;

  RETURN jsonb_build_object('ok', true, 'total', total, 'rows', rows);
END;
$$;

-- ---------------------------------------------------------------------------
-- admin_list_mining_logs: 사용자 이메일·닉네임 포함
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_mining_logs(
  p_user_id uuid DEFAULT NULL,
  p_type text DEFAULT NULL,
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

  SELECT count(*) INTO total
  FROM public.mining_logs m
  WHERE (p_user_id IS NULL OR m.user_id = p_user_id)
    AND (p_type IS NULL OR p_type = '' OR m.type = p_type);

  SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC), '[]'::jsonb) INTO rows
  FROM (
    SELECT m.id, m.user_id, m.amount, m.type, m.slot_number, m.created_at,
           u.email AS user_email, u.nickname AS user_nickname
    FROM public.mining_logs m
    LEFT JOIN public.users u ON u.id = m.user_id
    WHERE (p_user_id IS NULL OR m.user_id = p_user_id)
      AND (p_type IS NULL OR p_type = '' OR m.type = p_type)
    ORDER BY m.created_at DESC
    LIMIT lim OFFSET off
  ) x;

  RETURN jsonb_build_object('ok', true, 'total', total, 'rows', rows);
END;
$$;

-- ---------------------------------------------------------------------------
-- admin_stats_summary: 전체 채굴, 오늘 채굴, 정지 수, 비정상(24h 내 MINING 12회 초과 사용자 수)
-- ---------------------------------------------------------------------------
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
    HAVING count(*) > 12
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

-- ---------------------------------------------------------------------------
-- 일별 MINING 양(양수 합), 최근 N일
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_mining_daily_stats(p_days int DEFAULT 14)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d int := least(greatest(coalesce(p_days, 14), 1), 90);
  rows jsonb;
BEGIN
  PERFORM public._admin_assert();

  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.day ASC), '[]'::jsonb) INTO rows
  FROM (
    SELECT (date_trunc('day', m.created_at))::date AS day,
           coalesce(sum(m.amount), 0)::bigint AS total_mined
    FROM public.mining_logs m
    WHERE m.type = 'MINING' AND m.amount > 0
      AND m.created_at >= date_trunc('day', now()) - make_interval(days => (d - 1))
    GROUP BY 1
    ORDER BY 1
  ) t;

  RETURN jsonb_build_object('ok', true, 'rows', rows);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_mining_daily_stats(int) TO authenticated;

-- ---------------------------------------------------------------------------
-- 누적 채굴 상위 사용자 (MINING 양수 합)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_mining_top_miners(p_limit int DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(greatest(coalesce(p_limit, 10), 1), 50);
  rows jsonb;
BEGIN
  PERFORM public._admin_assert();

  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.total_mined DESC), '[]'::jsonb) INTO rows
  FROM (
    SELECT u.id, u.email, u.nickname,
           coalesce(sum(m.amount), 0)::bigint AS total_mined
    FROM public.users u
    INNER JOIN public.mining_logs m ON m.user_id = u.id AND m.type = 'MINING' AND m.amount > 0
    GROUP BY u.id, u.email, u.nickname
    ORDER BY total_mined DESC
    LIMIT lim
  ) t;

  RETURN jsonb_build_object('ok', true, 'rows', rows);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_mining_top_miners(int) TO authenticated;
