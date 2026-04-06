-- 클라이언트가 public.users 를 RLS로 못 읽을 때도 role 등 본인 행을 가져오기 (빈 탭에서 실행)
CREATE OR REPLACE FUNCTION public.get_my_user_row()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  j jsonb;
BEGIN
  IF uid IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT to_jsonb(u.*) INTO j FROM public.users u WHERE u.id = uid;
  RETURN j;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_user_row() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_user_row() TO authenticated;
