-- Supabase SQL Editor: "Forbidden ... users_protect_sensitive_columns" 나올 때만 실행.
-- 이유: 대시보드 실행 시 auth.uid() 가 NULL 이라 트리거가 막음 → JWT 없을 때는 허용(최초 관리자 지정).

CREATE OR REPLACE FUNCTION public.users_protect_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.account_status IS DISTINCT FROM OLD.account_status
     OR NEW.mining_disabled IS DISTINCT FROM OLD.mining_disabled THEN
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;
    SELECT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    INTO is_admin;
    IF NOT is_admin THEN
      RAISE EXCEPTION 'Forbidden: role/status/mining flags can only be changed by admins'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
