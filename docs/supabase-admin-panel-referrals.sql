-- Web3Star: 관리자 패널 — 레퍼럴(추천인) 요약·초대 목록·추천 관련 채굴 로그
-- 선행: docs/supabase-admin-panel.sql (및 v2 업데이트) 적용되어 _admin_assert() 가 있어야 합니다.
--
-- Supabase Dashboard → SQL Editor 에서 이 파일 전체만 실행하세요.

-- ---------------------------------------------------------------------------
-- 사용자별: 초대한 회원 수, 추천 프로그램으로 적립된 로그 합(REFERRAL + BONUS)
-- counting 규칙은 apply_referral_rewards 와 동일 (referred_by = 추천인 UUID 또는 초대코드)
-- BONUS 는 마일스톤 등 추천 RPC에서 쓰이는 타입을 포함합니다. 그 외 BONUS 가 생기면 합계에 포함됩니다.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_referral_summaries(
  p_search text DEFAULT NULL,
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

  -- 한 번만 집계한 뒤 조인합니다. (행마다 상관 서브쿼리면 users·mining_logs 풀스캔이 반복되어 statement timeout 납니다.)
  WITH children AS (
    SELECT c.id AS child_id, btrim(c.referred_by::text) AS ref_text
    FROM public.users c
    WHERE c.referred_by IS NOT NULL AND btrim(c.referred_by::text) <> ''
  ),
  referral_pairs AS (
    SELECT ch.child_id, u.id AS referrer_id
    FROM children ch
    INNER JOIN public.users u ON ch.child_id <> u.id
      AND (
        ch.ref_text = u.id::text
        OR (
          u.invite_code IS NOT NULL
          AND btrim(u.invite_code) <> ''
          AND ch.ref_text = btrim(u.invite_code)
        )
      )
  ),
  referral_counts AS (
    SELECT referrer_id, count(*)::int AS referral_count
    FROM referral_pairs
    GROUP BY referrer_id
  ),
  log_sums AS (
    SELECT m.user_id, coalesce(sum(m.amount), 0)::bigint AS referral_points_from_logs
    FROM public.mining_logs m
    WHERE m.type IN ('REFERRAL', 'BONUS')
    GROUP BY m.user_id
  ),
  filtered AS (
    SELECT
      u.id,
      u.email,
      u.nickname,
      u.point,
      u.invite_code,
      u.created_at,
      coalesce(rc.referral_count, 0) AS referral_count,
      coalesce(ls.referral_points_from_logs, 0)::bigint AS referral_points_from_logs
    FROM public.users u
    LEFT JOIN referral_counts rc ON rc.referrer_id = u.id
    LEFT JOIN log_sums ls ON ls.user_id = u.id
    WHERE (
      p_search IS NULL OR p_search = ''
      OR u.email ILIKE '%' || p_search || '%'
      OR u.nickname ILIKE '%' || p_search || '%'
      OR u.invite_code ILIKE '%' || p_search || '%'
      OR u.id::text ILIKE '%' || btrim(p_search) || '%'
    )
  )
  -- CTE(filtered)는 단일 SELECT 문 안에서만 유효합니다. 두 번째 SELECT로 나누면 relation "filtered" does not exist 가 납니다.
  SELECT
    (SELECT count(*)::bigint FROM filtered),
    (
      SELECT coalesce(
        jsonb_agg(to_jsonb(page) ORDER BY page.referral_count DESC, page.created_at DESC),
        '[]'::jsonb
      )
      FROM (
        SELECT f.*
        FROM filtered f
        ORDER BY f.referral_count DESC, f.created_at DESC
        LIMIT lim OFFSET off
      ) page
    )
  INTO total, rows;

  RETURN jsonb_build_object('ok', true, 'total', total, 'rows', rows);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_referral_summaries(text, int, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- 특정 추천인이 초대한 회원 목록
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_invited_users(
  p_referrer_id uuid,
  p_limit int DEFAULT 80,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(greatest(coalesce(p_limit, 80), 1), 200);
  off int := greatest(coalesce(p_offset, 0), 0);
  total bigint;
  rows jsonb;
  ric text;
BEGIN
  PERFORM public._admin_assert();

  SELECT nullif(btrim(coalesce(invite_code, '')), '') INTO ric
  FROM public.users
  WHERE id = p_referrer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Referrer not found');
  END IF;

  SELECT count(*) INTO total
  FROM public.users c
  WHERE c.id <> p_referrer_id
    AND (
      btrim(c.referred_by::text) = p_referrer_id::text
      OR (
        ric IS NOT NULL
        AND btrim(c.referred_by::text) = ric
      )
    );

  SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC), '[]'::jsonb) INTO rows
  FROM (
    SELECT c.id, c.email, c.nickname, c.created_at, c.point, c.referred_by::text AS referred_by
    FROM public.users c
    WHERE c.id <> p_referrer_id
      AND (
        btrim(c.referred_by::text) = p_referrer_id::text
        OR (
          ric IS NOT NULL
          AND btrim(c.referred_by::text) = ric
        )
      )
    ORDER BY c.created_at DESC
    LIMIT lim OFFSET off
  ) x;

  RETURN jsonb_build_object('ok', true, 'total', total, 'rows', rows);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_invited_users(uuid, int, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- 해당 사용자 계정에 기록된 추천·보정 관련 mining_logs
-- REFERRAL, BONUS + 레퍼럴 화면에서 한 수동 조정(admin_adjust_points → ADMIN_ADJUST)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_referral_program_logs(
  p_user_id uuid,
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
  WHERE m.user_id = p_user_id
    AND m.type IN ('REFERRAL', 'BONUS', 'ADMIN_ADJUST');

  SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC), '[]'::jsonb) INTO rows
  FROM (
    SELECT m.id, m.user_id, m.amount, m.type, m.slot_number, m.created_at
    FROM public.mining_logs m
    WHERE m.user_id = p_user_id
      AND m.type IN ('REFERRAL', 'BONUS', 'ADMIN_ADJUST')
    ORDER BY m.created_at DESC
    LIMIT lim OFFSET off
  ) x;

  RETURN jsonb_build_object('ok', true, 'total', total, 'rows', rows);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_referral_program_logs(uuid, int, int) TO authenticated;
