-- ==============================================================================
-- CAMPUS NEXUS — Critical Security Remediation Migration
-- Migration: 20261014000001_critical_security_remediation.sql
-- Description:
--   1. Protects profiles against unauthorized department, role, status, and email tampering.
--   2. Protects students against unauthorized mutation of academic/official fields (CGPA, roll_number, branch, year, semester, section, batch, attendance, backlogs).
--   3. Enforces strict department isolation on all HOD policies across profiles, students, and faculty.
--   4. Revokes direct client INSERT/UPDATE/DELETE permissions on student_learning_activities (credits ledger).
--   5. Implements unique database partial index and transactional advisory locking in evaluate_quiz to prevent duplicate credits.
-- ==============================================================================

-- ==============================================================================
-- 1. SECURITY DEFINER HELPER FUNCTIONS HARDENING
-- ==============================================================================

-- 1.1 Harden is_hod() to verify both role and active account status
CREATE OR REPLACE FUNCTION public.is_hod()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'hod' AND is_active = true 
     FROM public.profiles 
     WHERE id = auth.uid()), 
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 1.2 Department-scoped HOD validator
CREATE OR REPLACE FUNCTION public.is_hod_of_department(target_dept TEXT)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'hod' AND is_active = true AND department = target_dept
     FROM public.profiles 
     WHERE id = auth.uid()), 
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 2. PROFILE INTEGRITY TRIGGER (PREVENT DEPARTMENT, ROLE & STATUS TAMPERING)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_tampering()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_dept TEXT;
  v_caller_is_hod BOOLEAN;
BEGIN
  -- Allow service_role bypass or active institutional provisioning session
  IF current_setting('role', true) = 'service_role' OR current_setting('nexus.institutional_provisioning', true) = 'active' THEN
    RETURN NEW;
  END IF;

  -- Disallow modifying immutable primary key
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Unauthorized: User identifier is immutable.';
  END IF;

  -- Disallow modifying institutional email (tied to Google SSO)
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Unauthorized: Institutional email cannot be modified.';
  END IF;

  -- Restrict changes to role, department, or active status
  IF (NEW.department IS DISTINCT FROM OLD.department OR 
      NEW.role IS DISTINCT FROM OLD.role OR 
      NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
    
    -- Disallow any user (including HODs) from modifying their own role, department, or active status
    IF OLD.id = auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: Self-modification of department, role, or account status is strictly prohibited.';
    END IF;

    SELECT role, department, (role = 'hod' AND is_active = true)
    INTO v_caller_role, v_caller_dept, v_caller_is_hod
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT COALESCE(v_caller_is_hod, false) THEN
      RAISE EXCEPTION 'Unauthorized: Only active department administrators can modify user department, role, or account status.';
    END IF;

    -- An HOD cannot appoint or modify another HOD (requires institutional administrative provisioning)
    IF (NEW.role = 'hod' OR OLD.role = 'hod') THEN
      RAISE EXCEPTION 'Unauthorized: HOD appointments and status modifications require institutional administrative provisioning.';
    END IF;

    -- An HOD cannot reassign departments (requires institutional administrative provisioning)
    IF NEW.department IS DISTINCT FROM OLD.department THEN
      RAISE EXCEPTION 'Unauthorized: Inter-departmental user transfers require institutional administrative provisioning.';
    END IF;

    -- An HOD can only manage users within their own department
    IF OLD.department IS DISTINCT FROM v_caller_dept THEN
      RAISE EXCEPTION 'Unauthorized: Department administrators can only manage users within their own department.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop legacy trigger and attach comprehensive profile integrity trigger
DROP TRIGGER IF EXISTS enforce_role_integrity ON public.profiles;
DROP TRIGGER IF EXISTS enforce_profile_integrity ON public.profiles;
CREATE TRIGGER enforce_profile_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_tampering();

-- ==============================================================================
-- 2B. INSTITUTIONAL ADMINISTRATIVE PROVISIONING (AUTHORIZED & AUDITED PATH)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.institutional_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by UUID, -- auth.uid() or NULL if service_role
  actor_role TEXT NOT NULL DEFAULT 'service_role',
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'PROVISION_USER', 'PROMOTE_ROLE', 'TRANSFER_DEPARTMENT', 'ACTIVATE_ACCOUNT', 'DEACTIVATE_ACCOUNT'
  old_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.institutional_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_service_role_all" ON public.institutional_audit_logs;
CREATE POLICY "audit_logs_service_role_all" ON public.institutional_audit_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Revoke insert/update/delete from non-admins
REVOKE ALL ON public.institutional_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.institutional_audit_logs TO service_role;

CREATE OR REPLACE FUNCTION public.institutional_provision_profile(
  p_target_user_id UUID,
  p_new_role public.user_role DEFAULT NULL,
  p_new_department TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_reason TEXT DEFAULT 'Institutional administrative provisioning'
)
RETURNS JSONB AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_uid UUID;
  v_old_profile RECORD;
  v_final_role public.user_role;
  v_final_dept TEXT;
  v_final_active BOOLEAN;
  v_audit_id UUID;
  v_action TEXT := 'ADMIN_UPDATE';
BEGIN
  v_caller_role := current_setting('role', true);
  v_caller_uid := auth.uid();

  -- Strict Authorization Gate:
  -- Only service_role OR callers with institutional admin claim in app_metadata can execute
  IF v_caller_role != 'service_role' AND COALESCE(auth.jwt()->'app_metadata'->>'is_institutional_admin', 'false') != 'true' THEN
    RAISE EXCEPTION 'Unauthorized: Only institutional administrators via authorized server-side service role can execute institutional provisioning.';
  END IF;

  -- Verify target profile exists
  SELECT id, full_name, email, role, department, is_active
  INTO v_old_profile
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found for id: %', p_target_user_id;
  END IF;

  -- Validate department if provided
  IF p_new_department IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.departments WHERE code = p_new_department) THEN
      RAISE EXCEPTION 'Invalid department code: %', p_new_department;
    END IF;
  END IF;

  v_final_role := COALESCE(p_new_role, v_old_profile.role);
  v_final_dept := COALESCE(p_new_department, v_old_profile.department);
  v_final_active := COALESCE(p_is_active, v_old_profile.is_active);

  -- Determine specific action
  IF p_new_role IS NOT NULL AND p_new_role != v_old_profile.role THEN
    v_action := 'PROMOTE_ROLE';
  ELSIF p_new_department IS NOT NULL AND p_new_department != v_old_profile.department THEN
    v_action := 'TRANSFER_DEPARTMENT';
  ELSIF p_is_active IS NOT NULL AND p_is_active != v_old_profile.is_active THEN
    IF p_is_active THEN
      v_action := 'ACTIVATE_ACCOUNT';
    ELSE
      v_action := 'DEACTIVATE_ACCOUNT';
    END IF;
  END IF;

  -- Authorize trigger execution via transaction-local setting
  PERFORM set_config('nexus.institutional_provisioning', 'active', true);

  -- Update profiles table
  UPDATE public.profiles
  SET role = v_final_role,
      department = v_final_dept,
      is_active = v_final_active,
      updated_at = now()
  WHERE id = p_target_user_id;

  -- Synchronize child role records
  IF v_final_role = 'faculty' OR v_final_role = 'hod' THEN
    INSERT INTO public.faculty (id, department)
    VALUES (p_target_user_id, v_final_dept)
    ON CONFLICT (id) DO UPDATE SET department = EXCLUDED.department;
  ELSIF v_final_role = 'student' THEN
    INSERT INTO public.students (id, branch)
    VALUES (p_target_user_id, v_final_dept)
    ON CONFLICT (id) DO UPDATE SET branch = EXCLUDED.branch;
  END IF;

  -- Insert immutable audit record
  INSERT INTO public.institutional_audit_logs (
    performed_by,
    actor_role,
    target_user_id,
    action,
    old_values,
    new_values,
    reason
  ) VALUES (
    v_caller_uid,
    COALESCE(v_caller_role, 'service_role'),
    p_target_user_id,
    v_action,
    jsonb_build_object('role', v_old_profile.role, 'department', v_old_profile.department, 'is_active', v_old_profile.is_active),
    jsonb_build_object('role', v_final_role, 'department', v_final_dept, 'is_active', v_final_active),
    p_reason
  ) RETURNING id INTO v_audit_id;

  -- Reset transaction-local setting
  PERFORM set_config('nexus.institutional_provisioning', 'inactive', true);

  RETURN jsonb_build_object(
    'success', true,
    'audit_log_id', v_audit_id,
    'action', v_action,
    'target_user_id', p_target_user_id,
    'role', v_final_role,
    'department', v_final_dept,
    'is_active', v_final_active
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke from ordinary users, grant only to service_role
REVOKE ALL ON FUNCTION public.institutional_provision_profile(UUID, public.user_role, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.institutional_provision_profile(UUID, public.user_role, TEXT, BOOLEAN, TEXT) TO service_role;

-- ==============================================================================
-- 3. STUDENT ACADEMIC INTEGRITY TRIGGER (PREVENT CGPA & ENROLLMENT TAMPERING)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.protect_student_academic_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_dept TEXT;
  v_caller_is_hod BOOLEAN;
  v_student_dept TEXT;
BEGIN
  -- Allow service_role bypass for administrative system workers
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Check if any academic or institutional enrollment field is being changed
  IF (NEW.roll_number IS DISTINCT FROM OLD.roll_number OR
      NEW.year IS DISTINCT FROM OLD.year OR
      NEW.semester IS DISTINCT FROM OLD.semester OR
      NEW.section IS DISTINCT FROM OLD.section OR
      NEW.branch IS DISTINCT FROM OLD.branch OR
      NEW.batch IS DISTINCT FROM OLD.batch OR
      NEW.admission_year IS DISTINCT FROM OLD.admission_year OR
      NEW.cgpa IS DISTINCT FROM OLD.cgpa OR
      NEW.attendance_pct IS DISTINCT FROM OLD.attendance_pct OR
      NEW.backlog_count IS DISTINCT FROM OLD.backlog_count) THEN

    -- Disallow any student or staff from self-modifying their own official academic records
    IF OLD.id = auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: Self-modification of official academic records is strictly prohibited.';
    END IF;

    SELECT department, (role = 'hod' AND is_active = true)
    INTO v_caller_dept, v_caller_is_hod
    FROM public.profiles
    WHERE id = auth.uid();

    SELECT department INTO v_student_dept
    FROM public.profiles
    WHERE id = OLD.id;

    -- Only active HOD of the student's own department can modify official academic records
    IF NOT (COALESCE(v_caller_is_hod, false) AND v_caller_dept = v_student_dept) THEN
      RAISE EXCEPTION 'Unauthorized: Academic records (CGPA, roll number, branch, year, semester, section, batch, attendance, backlogs) are official records and can only be modified by department administration.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_student_academic_integrity ON public.students;
CREATE TRIGGER enforce_student_academic_integrity
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.protect_student_academic_integrity();

-- ==============================================================================
-- 4. HOD DEPARTMENT ISOLATION ON PROFILES, STUDENTS, AND FACULTY
-- ==============================================================================

-- 4.1 Profiles Table HOD Policies
DROP POLICY IF EXISTS "profiles_select_hod" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_hod" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_hod_same_dept" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_hod_same_dept" ON public.profiles;

CREATE POLICY "profiles_select_hod_same_dept"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.get_auth_role() = 'hod'
    AND department = public.get_user_department()
  );

CREATE POLICY "profiles_update_hod_same_dept"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.get_auth_role() = 'hod'
    AND department = public.get_user_department()
  )
  WITH CHECK (
    public.get_auth_role() = 'hod'
    AND department = public.get_user_department()
  );

-- 4.2 Students Table HOD Policies
DROP POLICY IF EXISTS "students_select_hod" ON public.students;
DROP POLICY IF EXISTS "students_update_hod" ON public.students;
DROP POLICY IF EXISTS "students_select_hod_same_dept" ON public.students;
DROP POLICY IF EXISTS "students_update_hod_same_dept" ON public.students;

CREATE POLICY "students_select_hod_same_dept"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    public.get_auth_role() = 'hod'
    AND public.is_same_department(id)
  );

CREATE POLICY "students_update_hod_same_dept"
  ON public.students FOR UPDATE
  TO authenticated
  USING (
    public.get_auth_role() = 'hod'
    AND public.is_same_department(id)
  )
  WITH CHECK (
    public.get_auth_role() = 'hod'
    AND public.is_same_department(id)
  );

-- 4.3 Faculty Table HOD Policies
DROP POLICY IF EXISTS "faculty_select_hod" ON public.faculty;
DROP POLICY IF EXISTS "faculty_update_hod" ON public.faculty;
DROP POLICY IF EXISTS "faculty_select_hod_same_dept" ON public.faculty;
DROP POLICY IF EXISTS "faculty_update_hod_same_dept" ON public.faculty;

CREATE POLICY "faculty_select_hod_same_dept"
  ON public.faculty FOR SELECT
  TO authenticated
  USING (
    public.get_auth_role() = 'hod'
    AND public.is_same_department(id)
  );

CREATE POLICY "faculty_update_hod_same_dept"
  ON public.faculty FOR UPDATE
  TO authenticated
  USING (
    public.get_auth_role() = 'hod'
    AND public.is_same_department(id)
  )
  WITH CHECK (
    public.get_auth_role() = 'hod'
    AND public.is_same_department(id)
  );

-- ==============================================================================
-- 5. LEARNING CREDITS LEDGER PROTECTION (REVOKE DIRECT STUDENT WRITES)
-- ==============================================================================

-- Drop the over-permissive ALL policy
DROP POLICY IF EXISTS "learning_activities_student_all" ON public.student_learning_activities;
DROP POLICY IF EXISTS "learning_activities_student_select" ON public.student_learning_activities;

-- Students can ONLY SELECT their own learning activity records
CREATE POLICY "learning_activities_student_select"
  ON public.student_learning_activities FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- ==============================================================================
-- 6. QUIZ IDEMPOTENCY & CONCURRENCY-SAFE EVALUATION
-- ==============================================================================

-- 6.1 Database unique constraint on (student_id, module_id) for completed modules
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_completed_module
  ON public.student_learning_activities (student_id, module_id)
  WHERE module_id IS NOT NULL AND status = 'Completed';

-- 6.2 Atomic, Idempotent evaluate_quiz RPC with Advisory Locking
CREATE OR REPLACE FUNCTION public.evaluate_quiz(
    p_module_id UUID,
    p_answers JSONB -- { "question_id": "option_id" }
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_student_id UUID;
    v_department VARCHAR;
    v_question RECORD;
    v_total_questions INT := 0;
    v_correct_answers INT := 0;
    v_score INT := 0;
    v_credits_reward INT := 0;
    v_module_title TEXT;
    v_module_category TEXT;
    v_module_topic TEXT;
    v_module_active BOOLEAN;
    v_module_dept VARCHAR;
    v_passing_score INT;
    v_passed BOOLEAN;
    v_existing_activity UUID;
    v_feedback JSONB := '[]'::JSONB;
    v_q_correct_option_id UUID;
    v_is_correct BOOLEAN;
    v_credits_awarded INT := 0;
BEGIN
    -- 1. Ensure authenticated
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Verify caller is an active registered student
    SELECT department INTO v_department
    FROM public.profiles 
    WHERE id = v_student_id AND role = 'student' AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not an active registered student';
    END IF;

    -- 3. Concurrency Lock: Serialize concurrent evaluations for this (student, module) pair
    PERFORM pg_advisory_xact_lock(hashtext(v_student_id::text || p_module_id::text));

    -- 4. Fetch module details and verify accessibility
    SELECT credits_reward, title, category, topic, is_active, department, COALESCE(passing_score, 70)
    INTO v_credits_reward, v_module_title, v_module_category, v_module_topic, v_module_active, v_module_dept, v_passing_score
    FROM public.learning_modules
    WHERE id = p_module_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Module not found';
    END IF;

    IF NOT v_module_active THEN
        RAISE EXCEPTION 'Module is not active';
    END IF;

    IF v_module_dept IS NOT NULL AND v_module_dept != v_department THEN
        RAISE EXCEPTION 'Unauthorized: Module belongs to a different department';
    END IF;

    -- 5. Evaluate each question
    FOR v_question IN 
        SELECT id, explanation FROM public.learning_quiz_questions WHERE module_id = p_module_id
    LOOP
        v_total_questions := v_total_questions + 1;
        
        -- Get the correct option for this question
        SELECT id INTO v_q_correct_option_id 
        FROM public.learning_quiz_options 
        WHERE question_id = v_question.id AND is_correct = true 
        LIMIT 1;
        
        v_is_correct := false;
        
        -- Check if student answered and if it matches the correct option
        IF p_answers ? v_question.id::TEXT THEN
            IF (p_answers->>v_question.id::TEXT)::UUID = v_q_correct_option_id THEN
                v_correct_answers := v_correct_answers + 1;
                v_is_correct := true;
            END IF;
        END IF;

        -- Build feedback array (explanations and correct answers only revealed post-submission)
        v_feedback := v_feedback || jsonb_build_object(
            'question_id', v_question.id,
            'is_correct', v_is_correct,
            'correct_option_id', v_q_correct_option_id,
            'explanation', v_question.explanation
        );
    END LOOP;

    IF v_total_questions = 0 THEN
        RAISE EXCEPTION 'No questions found for this module';
    END IF;

    -- 6. Calculate score & passing state
    v_score := ROUND((v_correct_answers::NUMERIC / v_total_questions::NUMERIC) * 100);
    v_passed := v_score >= v_passing_score;

    -- 7. Persist successful attempt atomically if not already recorded
    IF v_passed THEN
        SELECT id INTO v_existing_activity 
        FROM public.student_learning_activities
        WHERE student_id = v_student_id AND module_id = p_module_id AND status = 'Completed';
        
        IF v_existing_activity IS NULL THEN
            INSERT INTO public.student_learning_activities (
                student_id, module_id, module_title, category, topic, score, credits_earned, status, completed_at
            ) VALUES (
                v_student_id, p_module_id, v_module_title, v_module_category, v_module_topic, v_score, v_credits_reward, 'Completed', now()
            )
            ON CONFLICT (student_id, module_id) WHERE module_id IS NOT NULL AND status = 'Completed'
            DO NOTHING
            RETURNING credits_earned INTO v_credits_awarded;
        END IF;
    END IF;

    -- 8. Return result object
    RETURN jsonb_build_object(
        'score', v_score,
        'passed', v_passed,
        'passing_score', v_passing_score,
        'credits_awarded', COALESCE(v_credits_awarded, 0),
        'already_completed', (v_existing_activity IS NOT NULL),
        'total', v_total_questions,
        'correct', v_correct_answers,
        'feedback', v_feedback
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.evaluate_quiz(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_quiz(UUID, JSONB) TO authenticated;
