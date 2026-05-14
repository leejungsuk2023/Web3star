-- Web3Star: Supabase Data API — public 코어 테이블 명시 GRANT
-- 배경: 2026-05-30 이후 신규 프로젝트·이후 기존 프로젝트에서 public 테이블이 PostgREST/ supabase-js 에
--       자동 노출되지 않을 수 있어, Data API로 쓰는 테이블에 역할별 GRANT 를 명시합니다.
--
-- Supabase Dashboard → SQL Editor 에서 이 파일 전체를 한 번 실행하세요.
-- (이미 동일 권한이 있어도 GRANT 는 멱등적으로 덮어씁니다.)
--
-- 앱(src)에서 supabase.from(...) 직접 사용: public.users, public.mining_logs
-- 리더보드는 비로그인 시 anon 키로 users SELECT 할 수 있어야 하므로 anon 에 SELECT 만 부여합니다.

-- ---------------------------------------------------------------------------
-- public.users
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON TABLE public.users TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;

GRANT ALL ON TABLE public.users TO service_role;

-- ---------------------------------------------------------------------------
-- public.mining_logs
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mining_logs TO authenticated;

GRANT ALL ON TABLE public.mining_logs TO service_role;

-- anon 은 클라이언트에서 mining_logs 를 쓰지 않음 — 부여하지 않습니다.

-- ---------------------------------------------------------------------------
-- (선택) 관리자 패널 SQL 로 만든 테이블 — 이미 있으면 Data API 클라이언트와 맞춤
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.withdrawal_requests') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.withdrawal_requests TO authenticated';
    EXECUTE 'GRANT ALL ON TABLE public.withdrawal_requests TO service_role';
  END IF;
  IF to_regclass('public.missions') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public.missions TO anon, authenticated';
    EXECUTE 'GRANT ALL ON TABLE public.missions TO service_role';
  END IF;
  IF to_regclass('public.events') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE public.events TO anon, authenticated';
    EXECUTE 'GRANT ALL ON TABLE public.events TO service_role';
  END IF;
  IF to_regclass('public.admin_audit_log') IS NOT NULL THEN
    -- 목록은 RPC(SECURITY DEFINER)만 사용. 클라이언트에 SELECT 를 열지 않습니다.
    EXECUTE 'GRANT SELECT ON TABLE public.admin_audit_log TO service_role';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 새 테이블 만들 때마다: CREATE 직후 위와 같은 GRANT + RLS 정책을 같은 마이그레이션에 넣으세요.
-- ---------------------------------------------------------------------------
