-- 레퍼럴 상세 모달 로그에 수동 포인트 조정(ADMIN_ADJUST) 포함
-- Supabase SQL Editor에서 한 번 실행하세요. (이미 referrals.sql 전체를 적용했다면 생략 가능)

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

REVOKE ALL ON FUNCTION public.admin_list_referral_program_logs(uuid, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_referral_program_logs(uuid, int, int) TO authenticated;
