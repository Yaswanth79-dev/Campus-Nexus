-- 20261005000000_fix_new_user_provisioning.sql
-- Fix handle_new_user trigger and default values for institution provisioning policy

-- 1. Secure DB-level default for new rows (affecting ONLY new inserts)
ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT false;

-- 2. Secure new user creation (ignore metadata for privileged fields)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role public.user_role;
  user_full_name TEXT;
  user_dept TEXT;
BEGIN
  -- Always default new users to 'student' role pending institution assignment
  assigned_role := 'student'::public.user_role;

  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Default to 'IT', do not trust user input for department assignment
  user_dept := 'IT';

  -- Insert profile with is_active = false (Institution policy: must be provisioned)
  INSERT INTO public.profiles (id, full_name, email, role, department, is_active)
  VALUES (NEW.id, user_full_name, NEW.email, assigned_role, user_dept, false)
  ON CONFLICT (id) DO NOTHING;

  -- Conditionally insert child extension record based securely on assigned role
  IF assigned_role = 'student' THEN
    INSERT INTO public.students (id, branch)
    VALUES (
      NEW.id,
      user_dept
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
