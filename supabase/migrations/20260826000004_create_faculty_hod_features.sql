-- ==============================================================================
-- CAMPUS NEXUS — Phase 4 & 5 Faculty & HOD Features Migration
-- ==============================================================================
-- Description: Creates tables for mentoring sessions, mentor assignments,
--              department audit logs, and HOD accreditation reports with RLS.
-- Run AFTER: 20260826000003_create_student_features.sql
-- ==============================================================================

-- 1. Faculty Mentor Assignments Table
CREATE TABLE IF NOT EXISTS public.faculty_mentor_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id   UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  department   TEXT NOT NULL REFERENCES public.departments(code) ON UPDATE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(faculty_id, student_id)
);

-- 2. Mentoring Sessions Table
CREATE TABLE IF NOT EXISTS public.mentoring_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id    UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_date  TIMESTAMPTZ NOT NULL DEFAULT now(),
  topic         TEXT NOT NULL,
  meeting_mode  TEXT NOT NULL CHECK (meeting_mode IN ('In-Person', 'Online (Google Meet)', 'Phone / Call')) DEFAULT 'In-Person',
  status        TEXT NOT NULL CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Action Needed')) DEFAULT 'Scheduled',
  notes         TEXT,
  action_items  TEXT,
  department    TEXT NOT NULL REFERENCES public.departments(code) ON UPDATE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Department Accreditation & Governance Reports Table (for HOD)
CREATE TABLE IF NOT EXISTS public.department_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department    TEXT NOT NULL REFERENCES public.departments(code) ON UPDATE CASCADE,
  title         TEXT NOT NULL,
  report_type   TEXT NOT NULL CHECK (report_type IN ('NAAC / NBA Accreditation', 'Semester Academic Audit', 'Placement & Internship Report', 'Faculty Workload', 'Grievance Redressal Audit')),
  academic_year TEXT NOT NULL, -- e.g. '2025-2026'
  summary_json  JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.faculty_mentor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_reports ENABLE ROW LEVEL SECURITY;

-- Faculty Mentor Assignments Policies
CREATE POLICY "mentor_assignments_select" ON public.faculty_mentor_assignments
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR faculty_id = auth.uid()
    OR (public.is_hod() AND department = public.get_user_department())
  );

CREATE POLICY "mentor_assignments_manage_hod" ON public.faculty_mentor_assignments
  FOR ALL TO authenticated
  USING (public.is_hod() AND department = public.get_user_department())
  WITH CHECK (public.is_hod() AND department = public.get_user_department());

-- Mentoring Sessions Policies
CREATE POLICY "mentoring_sessions_select" ON public.mentoring_sessions
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR faculty_id = auth.uid()
    OR (public.is_hod() AND department = public.get_user_department())
  );

CREATE POLICY "mentoring_sessions_faculty_manage" ON public.mentoring_sessions
  FOR ALL TO authenticated
  USING (faculty_id = auth.uid() AND department = public.get_user_department())
  WITH CHECK (faculty_id = auth.uid() AND department = public.get_user_department());

-- Department Reports Policies (HOD only)
CREATE POLICY "reports_hod_all" ON public.department_reports
  FOR ALL TO authenticated
  USING (public.is_hod() AND department = public.get_user_department())
  WITH CHECK (public.is_hod() AND department = public.get_user_department());
