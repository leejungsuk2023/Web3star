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
--    (invite_code 는 id 기반으로 유니크하게 잡음 — 기존 앱 규칙과 다르면 닉네임/코드만 조정)
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
  lower('w3s' || substr(replace(au.id::text, '-', ''), 1, 12)) AS invite_code,
  NULL,
  NULL,
  '[]'::jsonb,
  timezone('utc', au.created_at)
FROM auth.users au
WHERE au.email ILIKE 'coolhumvee@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.users p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- invite_code 충돌 시(극히 드묾): 위 INSERT 가 실패하면 아래로 코드만 바꿔 재시도
-- invite_code 를 예: lower('w3s' || substr(md5(au.id::text), 1, 14)) 등으로 변경

-- 2) 관리자 지정 (SQL Editor 는 JWT 없음 → 트리거가 대시보드 실행은 허용하는 버전이어야 함)
UPDATE public.users
SET
  role = 'admin',
  account_status = 'active'
WHERE email ILIKE 'coolhumvee@gmail.com';

-- 3) 확인
-- SELECT id, email, role, account_status FROM public.users WHERE email ILIKE 'coolhumvee@gmail.com';

-- 4) 앱에서 "권한 다시 확인" 또는 로그아웃 후 재로그인
