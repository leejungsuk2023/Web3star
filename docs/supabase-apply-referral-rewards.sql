-- Web3Star: 추천인·피추천인 각 100pt + 마일스톤 (RLS와 무관하게 한 트랜잭션에서 처리)
-- Supabase Dashboard → SQL Editor 에서 한 번 실행하세요.
--
-- 필수: 클라이언트 RLS는 "타인 users 행 수정"이 막혀 있어, 이 RPC가 없으면 가입자만 +100 되고
-- 코드 제공자(추천인)에게는 포인트가 안 들어갈 수 있습니다. 반드시 배포 후 동작을 확인하세요.

CREATE OR REPLACE FUNCTION public.apply_referral_rewards(p_invite_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  code text := nullif(trim(coalesce(p_invite_code, '')), '');
  rid uuid;
  rpoint bigint;
  ric text;
  self_point bigint;
  self_rb text;
  ref_pt bigint;
  total_ref int;
  ms_bonus int := 0;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated');
  END IF;

  IF code IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true);
  END IF;

  SELECT id, coalesce(point, 0), invite_code
  INTO rid, rpoint, ric
  FROM public.users
  WHERE invite_code = code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid referral code.');
  END IF;

  IF rid = uid THEN
    RETURN jsonb_build_object('ok', false, 'message', 'You cannot use your own referral code.');
  END IF;

  SELECT coalesce(point, 0), referred_by::text
  INTO self_point, self_rb
  FROM public.users
  WHERE id = uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', 'Profile is not ready yet. Please try again in a moment.'
    );
  END IF;

  IF self_rb IS NOT NULL AND btrim(self_rb) <> '' THEN
    IF btrim(self_rb) <> code AND btrim(self_rb) <> rid::text THEN
      RETURN jsonb_build_object(
        'ok', false,
        'message', 'A different referral is already registered on your account.'
      );
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.mining_logs
    WHERE user_id = uid AND type = 'REFERRAL'
    LIMIT 1
  ) THEN
    UPDATE public.users
    SET referred_by = rid::text
    WHERE id = uid
      AND (referred_by IS NULL OR btrim(referred_by::text) <> rid::text);
    RETURN jsonb_build_object('ok', true, 'skipped', true);
  END IF;

  UPDATE public.users
  SET
    point = self_point + 100,
    referred_by = rid::text
  WHERE id = uid;

  INSERT INTO public.mining_logs (user_id, amount, type)
  VALUES (uid, 100, 'REFERRAL');

  SELECT coalesce(point, 0) INTO ref_pt FROM public.users WHERE id = rid FOR UPDATE;

  UPDATE public.users
  SET point = ref_pt + 100
  WHERE id = rid;

  INSERT INTO public.mining_logs (user_id, amount, type)
  VALUES (rid, 100, 'REFERRAL');

  SELECT count(*)::int INTO total_ref
  FROM public.users u
  WHERE u.id <> rid
    AND (
      btrim(u.referred_by::text) = rid::text
      OR (
        ric IS NOT NULL
        AND btrim(ric) <> ''
        AND btrim(u.referred_by::text) = btrim(ric)
      )
    );

  ms_bonus := CASE total_ref
    WHEN 5 THEN 100
    WHEN 10 THEN 200
    WHEN 20 THEN 500
    WHEN 50 THEN 1250
    WHEN 100 THEN 2500
    WHEN 200 THEN 5000
    WHEN 500 THEN 12500
    WHEN 1000 THEN 25000
    WHEN 2000 THEN 50000
    ELSE 0
  END;

  IF ms_bonus > 0 THEN
    SELECT coalesce(point, 0) INTO ref_pt FROM public.users WHERE id = rid FOR UPDATE;
    UPDATE public.users SET point = ref_pt + ms_bonus WHERE id = rid;
    INSERT INTO public.mining_logs (user_id, amount, type)
    VALUES (rid, ms_bonus, 'BONUS');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_referral_rewards(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_referral_rewards(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_rewards(text) TO service_role;

COMMENT ON FUNCTION public.apply_referral_rewards(text) IS
  'Referral: +100 to new user and +100 to referrer (+ milestone bonus). Uses auth.uid() as new user.';
