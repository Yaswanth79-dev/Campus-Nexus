-- ==============================================================================
-- CAMPUS NEXUS — Phase 1 Extension Migration
-- ==============================================================================
-- Description: Expands student and faculty profiles with all required fields.
--              Adds departments reference table, profile completion tracking,
--              and department-scoped RLS policies.
-- Run AFTER: 20260820000001_create_core_schema.sql
-- ==============================================================================

-- 1. Departments Reference Table
-- Allows adding new departments without schema changes
CREATE TABLE IF NOT EXISTS public.departments (
  code        TEXT PRIMARY KEY,               -- e.g. 'IT', 'CSE', 'ECE'
  name        TEXT NOT NULL,                  -- e.g. 'Information Technology'
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default departments
INSERT INTO public.departments (code, name) VALUES
  ('IT',    'Information Technology'),
  ('CSE',   'Computer Science & Engineering'),
  ('ECE',   'Electronics & Communication Engineering'),
  ('EEE',   'Electrical & Electronics Engineering'),
  ('MECH',  'Mechanical Engineering'),
  ('CIVIL', 'Civil Engineering')
ON CONFLICT (code) DO NOTHING;

-- 2. Add FK constraint on profiles.department → departments.code
-- Note: existing profiles default to 'IT' which is now a valid dept code
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_department_fkey
  FOREIGN KEY (department) REFERENCES public.departments(code)
  ON UPDATE CASCADE;

-- 3. Expand public.students with additional profile fields
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS date_of_birth     DATE,
  ADD COLUMN IF NOT EXISTS gender            TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  ADD COLUMN IF NOT EXISTS batch             TEXT,            -- e.g. '2021-2025'
  ADD COLUMN IF NOT EXISTS admission_year    INTEGER,
  ADD COLUMN IF NOT EXISTS attendance_pct    NUMERIC(5,2),   -- percentage
  ADD COLUMN IF NOT EXISTS backlog_count     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS career_goal_title TEXT,           -- e.g. 'Full Stack Engineer'
  ADD COLUMN IF NOT EXISTS career_domain     TEXT,           -- e.g. 'Cloud / DevOps'
  ADD COLUMN IF NOT EXISTS preferred_role    TEXT,           -- e.g. 'Backend Developer'
  ADD COLUMN IF NOT EXISTS internship_status TEXT CHECK (internship_status IN (
    'Not Started', 'Searching', 'Applied', 'Interview', 'Secured', 'Completed'
  )) DEFAULT 'Not Started',
  ADD COLUMN IF NOT EXISTS placement_status  TEXT CHECK (placement_status IN (
    'Not Eligible', 'Eligible', 'Applied', 'Offer Received', 'Placed', 'Higher Studies'
  )) DEFAULT 'Not Eligible',
  ADD COLUMN IF NOT EXISTS higher_studies    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resume_url        TEXT,
  ADD COLUMN IF NOT EXISTS bio               TEXT;

-- 4. Expand public.faculty with additional profile fields
ALTER TABLE public.faculty
  ADD COLUMN IF NOT EXISTS qualification         TEXT,            -- e.g. 'Ph.D. (Computer Science)'
  ADD COLUMN IF NOT EXISTS experience_years      INTEGER,
  ADD COLUMN IF NOT EXISTS teaching_subjects     TEXT[],          -- array of subject names
  ADD COLUMN IF NOT EXISTS skills                TEXT[],          -- array of skills
  ADD COLUMN IF NOT EXISTS profile_bio           TEXT,
  ADD COLUMN IF NOT EXISTS office_location       TEXT,
  ADD COLUMN IF NOT EXISTS office_hours          TEXT;            -- e.g. 'Mon-Wed 2PM-4PM'

-- 5. Profile completion score (computed-style — updated by trigger)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completion INTEGER NOT NULL DEFAULT 0;

-- 6. Trigger: Update profile_completion for students
CREATE OR REPLACE FUNCTION public.update_student_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  score INTEGER := 0;
  prof  public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO prof FROM public.profiles WHERE id = NEW.id;

  -- Base profile fields (from profiles table)
  IF prof.full_name IS NOT NULL AND prof.full_name != '' THEN score := score + 10; END IF;
  IF prof.phone IS NOT NULL THEN score := score + 5; END IF;
  IF prof.avatar_url IS NOT NULL THEN score := score + 5; END IF;

  -- Student-specific fields
  IF NEW.roll_number IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.year IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.semester IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.section IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.batch IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.cgpa IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.date_of_birth IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.gender IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.github_url IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.linkedin_url IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.career_goal_title IS NOT NULL THEN score := score + 5; END IF;
  IF NEW.resume_url IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN score := score + 5; END IF;
  IF NEW.portfolio_url IS NOT NULL THEN score := score + 5; END IF;

  -- Cap at 100
  score := LEAST(score, 100);

  UPDATE public.profiles SET profile_completion = score WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_student_completion
  AFTER INSERT OR UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_student_profile_completion();

-- 7. Security Helper: get_user_department()
-- Returns the authenticated user's department without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_department()
RETURNS TEXT AS $$
  SELECT department FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 8. Security Helper: is_same_department(target_user_id)
-- Returns true if the target user is in the same department as the caller
CREATE OR REPLACE FUNCTION public.is_same_department(target_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT (p.department = public.get_user_department())
     FROM public.profiles p WHERE p.id = target_id),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 9. Security Helper: get_auth_role() — already exists, no change needed

-- ==============================================================================
-- 10. DEPARTMENTS TABLE — RLS
-- ==============================================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Everyone can read departments (needed for profile forms)
CREATE POLICY "departments_select_all"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

-- Only HOD can manage departments
CREATE POLICY "departments_manage_hod"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.is_hod())
  WITH CHECK (public.is_hod());

-- ==============================================================================
-- 11. UPDATED RLS — profiles (add department isolation for faculty reads)
-- ==============================================================================

-- Faculty can read profiles of students in their own department
-- (Used when faculty views student list)
CREATE POLICY "profiles_select_faculty_same_dept"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.get_auth_role() = 'faculty'
    AND role = 'student'
    AND department = public.get_user_department()
  );

-- ==============================================================================
-- 12. UPDATED RLS — students (add department isolation)
-- ==============================================================================

-- Faculty can read student records of students in their department
CREATE POLICY "students_select_faculty_same_dept"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    public.get_auth_role() = 'faculty'
    AND public.is_same_department(id)
  );

-- ==============================================================================
-- 13. UPDATED RLS — faculty (add department isolation for cross-role reads)
-- ==============================================================================

-- Students can read faculty profiles in their own department (public info only)
-- This is handled via a separate view in Phase 4, but the base policy is:
CREATE POLICY "faculty_select_same_dept_students"
  ON public.faculty FOR SELECT
  TO authenticated
  USING (
    public.get_auth_role() = 'student'
    AND public.is_same_department(id)
  );

-- HOD can also view faculty in their department (already covered by is_hod but adding explicit)
-- No change needed — existing is_hod() policy covers it.

-- ==============================================================================
-- 14. Indexes for new fields
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch);
CREATE INDEX IF NOT EXISTS idx_students_year_section ON public.students(year, section);
CREATE INDEX IF NOT EXISTS idx_faculty_department ON public.faculty(id);  -- via profiles join
