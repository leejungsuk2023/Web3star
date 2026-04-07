-- 단일 기기(세션) 로그인: 동일 계정으로 다른 기기에서 로그인하면 이전 기기는 앱이 토큰 불일치를 감지해 로그아웃됩니다.
-- Supabase SQL Editor에서 한 번 실행하세요.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_session_token uuid;

COMMENT ON COLUMN public.users.auth_session_token IS '마지막 로그인(세션 클레임) 시 갱신; 클라이언트 로컬 값과 불일치 시 로그아웃';

-- 본인 행만 갱신. 새 UUID 발급 후 반환.
CREATE OR REPLACE FUNCTION public.claim_my_auth_session()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  tok uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  tok := gen_random_uuid();
  UPDATE public.users
  SET auth_session_token = tok
  WHERE id = uid;

  RETURN tok;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_my_auth_session() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_my_auth_session() TO authenticated;

-- 폴링용 경량 조회 (프로필 전체 대신 토큰만)
CREATE OR REPLACE FUNCTION public.get_my_auth_session_token()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth_session_token FROM public.users WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_auth_session_token() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_auth_session_token() TO authenticated;
