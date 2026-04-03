-- v2 이후 추가: 감사 로그에 관리자·대상 사용자 닉네임/이메일 조인 (빈 탭에만 실행)
CREATE OR REPLACE FUNCTION public.admin_list_audit_log(p_limit int DEFAULT 100, p_offset int DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim int := least(greatest(coalesce(p_limit, 100), 1), 500);
  off int := greatest(coalesce(p_offset, 0), 0);
  rows jsonb;
BEGIN
  PERFORM public._admin_assert();

  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC), '[]'::jsonb) INTO rows
  FROM (
    SELECT
      a.id,
      a.admin_id,
      a.action,
      a.target_user_id,
      a.payload,
      a.created_at,
      adm.email AS admin_email,
      adm.nickname AS admin_nickname,
      tgt.email AS target_email,
      tgt.nickname AS target_nickname
    FROM public.admin_audit_log a
    LEFT JOIN public.users adm ON adm.id = a.admin_id
    LEFT JOIN public.users tgt ON tgt.id = a.target_user_id
    ORDER BY a.created_at DESC
    LIMIT lim OFFSET off
  ) t;

  RETURN jsonb_build_object('ok', true, 'rows', rows);
END;
$$;
