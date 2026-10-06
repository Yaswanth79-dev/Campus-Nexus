-- ==============================================================================
-- CAMPUS NEXUS - Core Database Schema Migration
-- ==============================================================================
-- Description: Establishes user_role enum, profiles, students, faculty tables,
--              automated triggers, security functions, and Row Level Security (RLS).
-- ==============================================================================

-- 1. Create PostgreSQL Role Enum
CREATE TYPE public.user_role AS ENUM ('student', 'faculty', 'hod');

-- 2. Create Core Profiles Table (Application-level user details)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  phone TEXT,
  department TEXT NOT NULL DEFAULT 'IT',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Student Profile Extension Table
CREATE TABLE public.students (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE,
  year INTEGER,
  section TEXT,
  branch TEXT NOT NULL DEFAULT 'IT',
  semester INTEGER,
  cgpa NUMERIC(4,2),
  career_goal TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Faculty Profile Extension Table
CREATE TABLE public.faculty (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  designation TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Indexes for Performance & Scalability
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_students_roll_number ON public.students(roll_number);
CREATE INDEX idx_faculty_employee_id ON public.faculty(employee_id);

-- 6. Trigger Function: updated_at auto-refresh
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_faculty_updated_at
  BEFORE UPDATE ON public.faculty
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Security Definer Helper Functions (Avoids RLS infinite recursion)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_hod()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'hod' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 8. Trigger Function: Auto-create Profile & Conditional Child Record on User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role public.user_role;
  user_full_name TEXT;
  user_dept TEXT;
BEGIN
  -- Extract role from metadata (default to 'student' if missing or invalid)
  BEGIN
    assigned_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'student'::public.user_role
    );
  EXCEPTION WHEN OTHERS THEN
    assigned_role := 'student'::public.user_role;
  END;

  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  user_dept := COALESCE(
    NEW.raw_user_meta_data->>'department',
    'IT'
  );

  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email, role, department, is_active)
  VALUES (NEW.id, user_full_name, NEW.email, assigned_role, user_dept, true)
  ON CONFLICT (id) DO NOTHING;

  -- Conditionally insert child extension record based strictly on assigned role
  IF assigned_role = 'student' THEN
    INSERT INTO public.students (id, roll_number, branch)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'roll_number',
      user_dept
    )
    ON CONFLICT (id) DO NOTHING;
  ELSIF assigned_role = 'faculty' THEN
    INSERT INTO public.faculty (id, employee_id, designation, specialization)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'employee_id',
      NEW.raw_user_meta_data->>'designation',
      NEW.raw_user_meta_data->>'specialization'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Trigger Function: Prevent Non-HOD Role & Status Tampering
CREATE OR REPLACE FUNCTION public.prevent_role_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
    IF NOT public.is_hod() THEN
      RAISE EXCEPTION 'Unauthorized: Only department administrators can modify user role or account status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_role_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_tampering();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS: public.profiles
-- ------------------------------------------------------------------------------
-- SELECT: Users can read their own profile; HOD can view department profiles
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_hod"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_hod());

-- UPDATE: Users can update their own profile; HOD can update any profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_hod"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_hod())
  WITH CHECK (public.is_hod());

-- ------------------------------------------------------------------------------
-- RLS: public.students
-- ------------------------------------------------------------------------------
-- SELECT: Students can read their own record; HOD can view all student records
CREATE POLICY "students_select_own"
  ON public.students FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "students_select_hod"
  ON public.students FOR SELECT
  TO authenticated
  USING (public.is_hod());

-- UPDATE: Students can update their own record; HOD can update any student record
CREATE POLICY "students_update_own"
  ON public.students FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "students_update_hod"
  ON public.students FOR UPDATE
  TO authenticated
  USING (public.is_hod())
  WITH CHECK (public.is_hod());

-- ------------------------------------------------------------------------------
-- RLS: public.faculty
-- ------------------------------------------------------------------------------
-- SELECT: Faculty can read their own record; HOD can view all faculty records
CREATE POLICY "faculty_select_own"
  ON public.faculty FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "faculty_select_hod"
  ON public.faculty FOR SELECT
  TO authenticated
  USING (public.is_hod());

-- UPDATE: Faculty can update their own record; HOD can update any faculty record
CREATE POLICY "faculty_update_own"
  ON public.faculty FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "faculty_update_hod"
  ON public.faculty FOR UPDATE
  TO authenticated
  USING (public.is_hod())
  WITH CHECK (public.is_hod());
