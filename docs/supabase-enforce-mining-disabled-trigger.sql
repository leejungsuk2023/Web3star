-- 채굴 차단(mining_disabled) 계정이 REST로 users.point / last_mined_at / ad_slots_viewed 를 직접 바꾸는 것을 DB에서 거부합니다.
-- 관리자가 다른 사용자 행을 수정하는 RPC(auth.uid() ≠ 행 주인)는 그대로 허용됩니다.
-- Supabase SQL Editor에서 한 번 실행하세요.

CREATE OR REPLACE FUNCTION public.users_enforce_mining_disabled_on_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF NOT COALESCE(OLD.mining_disabled, false) THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS DISTINCT FROM OLD.id THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.point IS DISTINCT FROM OLD.point
     OR NEW.last_mined_at IS DISTINCT FROM OLD.last_mined_at
     OR NEW.ad_slots_viewed IS DISTINCT FROM OLD.ad_slots_viewed
  THEN
    RAISE EXCEPTION 'Mining and ad rewards are disabled for this account.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_users_enforce_mining_disabled ON public.users;
CREATE TRIGGER tr_users_enforce_mining_disabled
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.users_enforce_mining_disabled_on_self_update();
