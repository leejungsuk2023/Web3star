-- =============================================================================
-- 접근 거부 화면에서 role / account_status 가 "—" 만 보일 때 (프로필 행 없음)
-- =============================================================================
-- 원인: Google 로그인은 auth.users 만 채우고, public.users 행이 없을 수 있습니다.
--       이 경우 `UPDATE public.users SET role = 'admin' WHERE email = '...'` 는
--       갱신할 행이 0건이라 아무 효과가 없습니다.
--
-- 아래를 Supabase → SQL Editor 에서 위에서 아래 순서로 실행하세요.
-- 이메일만 본인 것으로 바꿉니다.
-- =============================================================================

-- 0) 진단: auth 와 public 에 각각 있는지
-- SELECT id, email, created_at FROM auth.users WHERE email ILIKE 'coolhumvee@gmail.com';
-- SELECT id, email, role, account_status FROM public.users WHERE email ILIKE 'coolhumvee@gmail.com';

-- 1) public.users 에 행이 없으면 auth.users 기준으로 생성
--    invite_code 는 UUID 기반(기존 행과 충돌 거의 없음). 실행 후 "1 row" / RETURNING 행이 나와야 정상.
INSERT INTO public.users (
  id,
  email,
  nickname,
  point,
  invite_code,
  referred_by,
  last_mined_at,
  ad_slots_viewed,
  created_at
)
SELECT
  au.id,
  au.email,
  COALESCE(
    NULLIF(trim(au.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(trim(au.raw_user_meta_data ->> 'name'), ''),
    split_part(au.email, '@', 1),
    'user'
  ) AS nickname,
  0,
  lower(replace(gen_random_uuid()::text, '-', '')) AS invite_code,
  NULL,
  NULL,
  '[]'::jsonb,
  timezone('utc', au.created_at)
FROM auth.users au
WHERE au.email ILIKE 'coolhumvee@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.users p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING
RETURNING id, email, invite_code;

-- INSERT 가 "0 rows" 면: 이미 public.users 에 같은 id 가 있음 → 2번 UPDATE 만 필요
-- INSERT 가 에러면: 메시지를 그대로 복사해 확인 (NOT NULL 컬럼 더 있으면 아래 주석 참고)

-- 2) 관리자 지정 (SQL Editor 는 JWT 없음 → 트리거가 대시보드 실행은 허용하는 버전이어야 함)
UPDATE public.users
SET
  role = 'admin',
  account_status = 'active'
WHERE email ILIKE 'coolhumvee@gmail.com';

-- 3) 확인
-- SELECT id, email, role, account_status FROM public.users WHERE email ILIKE 'coolhumvee@gmail.com';

-- 4) 앱에서 "권한 다시 확인" 또는 로그아웃 후 재로그인
--
-- =============================================================================
-- 그래도 화면에 role 이 "—" 이면
-- =============================================================================
-- • 웹앱이 붙는 프로젝트와, 지금 SQL 을 돌리는 Supabase 프로젝트가 같은지 확인하세요.
--   (GitHub Actions 시크릿 / 로컬 .env 의 VITE_SUPABASE_URL 호스트가 대시보드 URL 과 동일한지)
-- • 브라우저 개발자도구(F12) → Console 에 [Auth] get_my_user_row failed 가 있는지 확인.
--   있으면 SQL Editor 에서 docs/supabase-auth-profile-rpc.sql 전체를 한 번 실행해 RPC 를 만드세요.
