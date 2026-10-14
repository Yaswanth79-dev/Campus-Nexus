-- ==============================================================================
-- IT NEXUS — STAGING SECURITY VALIDATION TEST HARNESS
-- Executes in an isolated transaction ending in ROLLBACK.
-- ==============================================================================

BEGIN;

-- Create in-memory test results table
CREATE TEMP TABLE test_results (
  test_num INT,
  test_name TEXT,
  status TEXT,
  details TEXT
);
GRANT ALL ON test_results TO authenticated;

-- ------------------------------------------------------------------------------
-- 1. APPLY REMEDIATION FUNCTIONS AND TRIGGERS IN TRANSACTION
-- ------------------------------------------------------------------------------

-- 1.1 Helper functions
CREATE OR REPLACE FUNCTION public.is_hod()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'hod' AND is_active = true 
     FROM public.profiles 
     WHERE id = auth.uid()), 
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_same_department(target_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT (p.department = public.get_user_department())
     FROM public.profiles p WHERE p.id = target_id),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 1.2 Profile integrity trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_tampering()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_dept TEXT;
  v_caller_is_hod BOOLEAN;
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id THEN RAISE EXCEPTION 'Unauthorized: User identifier is immutable.'; END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN RAISE EXCEPTION 'Unauthorized: Institutional email cannot be modified.'; END IF;

  IF (NEW.department IS DISTINCT FROM OLD.department OR 
      NEW.role IS DISTINCT FROM OLD.role OR 
      NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
    
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

    IF (NEW.role = 'hod' OR OLD.role = 'hod') THEN
      RAISE EXCEPTION 'Unauthorized: HOD appointments and status modifications require institutional administrative provisioning.';
    END IF;

    IF NEW.department IS DISTINCT FROM OLD.department THEN
      RAISE EXCEPTION 'Unauthorized: Inter-departmental user transfers require institutional administrative provisioning.';
    END IF;

    IF OLD.department IS DISTINCT FROM v_caller_dept THEN
      RAISE EXCEPTION 'Unauthorized: Department administrators can only manage users within their own department.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_role_integrity ON public.profiles;
DROP TRIGGER IF EXISTS enforce_profile_integrity ON public.profiles;
CREATE TRIGGER enforce_profile_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_tampering();

-- 1.2B Institutional administrative provisioning and audit logs
CREATE TABLE IF NOT EXISTS public.institutional_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by UUID,
  actor_role TEXT NOT NULL DEFAULT 'service_role',
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.institutional_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_service_role_all" ON public.institutional_audit_logs;
CREATE POLICY "audit_logs_service_role_all" ON public.institutional_audit_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

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

  IF v_caller_role != 'service_role' AND COALESCE(auth.jwt()->'app_metadata'->>'is_institutional_admin', 'false') != 'true' THEN
    RAISE EXCEPTION 'Unauthorized: Only institutional administrators via authorized server-side service role can execute institutional provisioning.';
  END IF;

  SELECT id, full_name, email, role, department, is_active
  INTO v_old_profile
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found for id: %', p_target_user_id;
  END IF;

  IF p_new_department IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.departments WHERE code = p_new_department) THEN
      RAISE EXCEPTION 'Invalid department code: %', p_new_department;
    END IF;
  END IF;

  v_final_role := COALESCE(p_new_role, v_old_profile.role);
  v_final_dept := COALESCE(p_new_department, v_old_profile.department);
  v_final_active := COALESCE(p_is_active, v_old_profile.is_active);

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

  -- Update profiles table (allowed because caller is authenticated as service_role)
  UPDATE public.profiles
  SET role = v_final_role,
      department = v_final_dept,
      is_active = v_final_active,
      updated_at = now()
  WHERE id = p_target_user_id;

  IF v_final_role = 'faculty' OR v_final_role = 'hod' THEN
    INSERT INTO public.faculty (id, department)
    VALUES (p_target_user_id, v_final_dept)
    ON CONFLICT (id) DO UPDATE SET department = EXCLUDED.department;
  ELSIF v_final_role = 'student' THEN
    INSERT INTO public.students (id, branch)
    VALUES (p_target_user_id, v_final_dept)
    ON CONFLICT (id) DO UPDATE SET branch = EXCLUDED.branch;
  END IF;

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

REVOKE ALL ON FUNCTION public.institutional_provision_profile(UUID, public.user_role, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.institutional_provision_profile(UUID, public.user_role, TEXT, BOOLEAN, TEXT) TO service_role;

-- 1.3 Student academic integrity trigger
CREATE OR REPLACE FUNCTION public.protect_student_academic_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_dept TEXT;
  v_caller_is_hod BOOLEAN;
  v_student_dept TEXT;
BEGIN
  IF current_setting('role', true) = 'service_role' THEN RETURN NEW; END IF;

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

    IF NOT (COALESCE(v_caller_is_hod, false) AND v_caller_dept = v_student_dept) THEN
      RAISE EXCEPTION 'Unauthorized: Academic records are official records and can only be modified by department administration.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_student_academic_integrity ON public.students;
CREATE TRIGGER enforce_student_academic_integrity
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.protect_student_academic_integrity();

-- 1.4 Hardened RLS policies
DROP POLICY IF EXISTS "profiles_select_hod" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_hod" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_hod_same_dept" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_hod_same_dept" ON public.profiles;

CREATE POLICY "profiles_select_hod_same_dept" ON public.profiles FOR SELECT TO authenticated
  USING (public.get_auth_role() = 'hod' AND department = public.get_user_department());

CREATE POLICY "profiles_update_hod_same_dept" ON public.profiles FOR UPDATE TO authenticated
  USING (public.get_auth_role() = 'hod' AND department = public.get_user_department())
  WITH CHECK (public.get_auth_role() = 'hod' AND department = public.get_user_department());

DROP POLICY IF EXISTS "students_select_hod" ON public.students;
DROP POLICY IF EXISTS "students_update_hod" ON public.students;
DROP POLICY IF EXISTS "students_select_hod_same_dept" ON public.students;
DROP POLICY IF EXISTS "students_update_hod_same_dept" ON public.students;

CREATE POLICY "students_select_hod_same_dept" ON public.students FOR SELECT TO authenticated
  USING (public.get_auth_role() = 'hod' AND public.is_same_department(id));

CREATE POLICY "students_update_hod_same_dept" ON public.students FOR UPDATE TO authenticated
  USING (public.get_auth_role() = 'hod' AND public.is_same_department(id))
  WITH CHECK (public.get_auth_role() = 'hod' AND public.is_same_department(id));

DROP POLICY IF EXISTS "learning_activities_student_all" ON public.student_learning_activities;
DROP POLICY IF EXISTS "learning_activities_student_select" ON public.student_learning_activities;
CREATE POLICY "learning_activities_student_select" ON public.student_learning_activities FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_completed_module
  ON public.student_learning_activities (student_id, module_id)
  WHERE module_id IS NOT NULL AND status = 'Completed';

-- 1.5 Atomic, Idempotent evaluate_quiz RPC with Advisory Locking
CREATE OR REPLACE FUNCTION public.evaluate_quiz(
    p_module_id UUID,
    p_answers JSONB
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
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT department INTO v_department
    FROM public.profiles 
    WHERE id = v_student_id AND role = 'student' AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not an active registered student';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext(v_student_id::text || p_module_id::text));

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

    FOR v_question IN 
        SELECT id, explanation FROM public.learning_quiz_questions WHERE module_id = p_module_id
    LOOP
        v_total_questions := v_total_questions + 1;
        
        SELECT id INTO v_q_correct_option_id 
        FROM public.learning_quiz_options 
        WHERE question_id = v_question.id AND is_correct = true 
        LIMIT 1;
        
        v_is_correct := false;
        
        IF p_answers ? v_question.id::TEXT THEN
            IF (p_answers->>v_question.id::TEXT)::UUID = v_q_correct_option_id THEN
                v_correct_answers := v_correct_answers + 1;
                v_is_correct := true;
            END IF;
        END IF;

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

    v_score := ROUND((v_correct_answers::NUMERIC / v_total_questions::NUMERIC) * 100);
    v_passed := v_score >= v_passing_score;

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

-- ------------------------------------------------------------------------------
-- 2. CREATE SYNTHETIC TEST FIXTURES (WILL ROLL BACK)
-- ------------------------------------------------------------------------------

-- Ensure test departments exist
INSERT INTO public.departments (code, name) VALUES ('TEST_IT', 'Test IT Dept'), ('TEST_CSE', 'Test CSE Dept') ON CONFLICT DO NOTHING;

-- Synthetic user IDs
DO $$
DECLARE
  v_stu_it UUID := '11111111-1111-1111-1111-111111111111';
  v_stu_cse UUID := '22222222-2222-2222-2222-222222222222';
  v_hod_it UUID := '33333333-3333-3333-3333-333333333333';
  v_hod_cse UUID := '44444444-4444-4444-4444-444444444444';
  v_mod_id UUID := '55555555-5555-5555-5555-555555555555';
  v_q1 UUID := '66666666-6666-6666-6666-666666666661';
  v_q2 UUID := '66666666-6666-6666-6666-666666666662';
  v_opt1_correct UUID := '77777777-7777-7777-7777-777777777771';
  v_opt1_wrong UUID := '77777777-7777-7777-7777-777777777772';
  v_opt2_correct UUID := '77777777-7777-7777-7777-777777777773';
  v_opt2_wrong UUID := '77777777-7777-7777-7777-777777777774';
  
  v_err_msg TEXT;
  v_count INT;
  v_rows_updated INT;
  v_quiz_res JSONB;
  v_prov_res JSONB;
BEGIN
  -- Insert into auth.users to satisfy foreign key constraints
  INSERT INTO auth.users (id, email, aud, role, is_sso_user, is_anonymous) VALUES
    (v_stu_it, 'stu_it@test.local', 'authenticated', 'authenticated', false, false),
    (v_stu_cse, 'stu_cse@test.local', 'authenticated', 'authenticated', false, false),
    (v_hod_it, 'hod_it@test.local', 'authenticated', 'authenticated', false, false),
    (v_hod_cse, 'hod_cse@test.local', 'authenticated', 'authenticated', false, false);

  -- Set role to service_role to configure synthetic profiles and test fixtures
  PERFORM set_config('role', 'service_role', true);

  -- Update profiles with specific test roles, departments and active status
  UPDATE public.profiles SET full_name = 'Synthetic IT Student', department = 'TEST_IT', is_active = true WHERE id = v_stu_it;
  UPDATE public.profiles SET full_name = 'Synthetic CSE Student', department = 'TEST_CSE', is_active = true WHERE id = v_stu_cse;
  UPDATE public.profiles SET full_name = 'Synthetic IT HOD', department = 'TEST_IT', role = 'hod', is_active = true WHERE id = v_hod_it;
  UPDATE public.profiles SET full_name = 'Synthetic CSE HOD', department = 'TEST_CSE', role = 'hod', is_active = true WHERE id = v_hod_cse;

  -- Ensure student rows exist with initial data
  INSERT INTO public.students (id, roll_number, branch, year, semester, section, batch, cgpa) VALUES
    (v_stu_it, 'ROLL_IT_001', 'TEST_IT', 3, 5, 'A', '2023-2027', 8.20),
    (v_stu_cse, 'ROLL_CSE_001', 'TEST_CSE', 3, 5, 'A', '2023-2027', 8.50)
  ON CONFLICT (id) DO UPDATE SET
    roll_number = EXCLUDED.roll_number,
    branch = EXCLUDED.branch,
    year = EXCLUDED.year,
    semester = EXCLUDED.semester,
    section = EXCLUDED.section,
    batch = EXCLUDED.batch,
    cgpa = EXCLUDED.cgpa;

  -- Insert synthetic module & quiz
  INSERT INTO public.learning_modules (id, title, category, topic, difficulty, credits_reward, department, is_active, passing_score) VALUES
    (v_mod_id, 'Synthetic Test Module', 'Quiz', 'DSA', 'Beginner', 25, 'TEST_IT', true, 70);

  INSERT INTO public.learning_quiz_questions (id, module_id, question_text, explanation, display_order) VALUES
    (v_q1, v_mod_id, 'Question 1 text', 'Explanation 1', 1),
    (v_q2, v_mod_id, 'Question 2 text', 'Explanation 2', 2);

  INSERT INTO public.learning_quiz_options (id, question_id, option_text, is_correct, display_order) VALUES
    (v_opt1_correct, v_q1, 'Option 1 Correct', true, 1),
    (v_opt1_wrong, v_q1, 'Option 1 Wrong', false, 2),
    (v_opt2_correct, v_q2, 'Option 2 Correct', true, 1),
    (v_opt2_wrong, v_q2, 'Option 2 Wrong', false, 2);

  -- ============================================================================
  -- TEST 1: Student Academic Tampering via Direct Request
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_stu_it::text, true);
  BEGIN
    UPDATE public.students SET cgpa = 9.99 WHERE id = v_stu_it;
    INSERT INTO test_results VALUES (1, 'Student CGPA Tampering', 'FAIL', 'Student was unexpectedly able to update CGPA');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO test_results VALUES (1, 'Student CGPA Tampering', 'PASS', 'Direct CGPA mutation rejected: ' || SQLERRM);
  END;

  -- ============================================================================
  -- TEST 2: Student Department Tampering
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_stu_it::text, true);
  BEGIN
    UPDATE public.profiles SET department = 'TEST_CSE' WHERE id = v_stu_it;
    INSERT INTO test_results VALUES (2, 'Student Department Tampering', 'FAIL', 'Student was unexpectedly able to change department');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO test_results VALUES (2, 'Student Department Tampering', 'PASS', 'Department tampering rejected: ' || SQLERRM);
  END;

  -- ============================================================================
  -- TEST 3: Student Self-Promotion & Activation
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_stu_it::text, true);
  BEGIN
    UPDATE public.profiles SET role = 'hod' WHERE id = v_stu_it;
    INSERT INTO test_results VALUES (3, 'Student Self-Promotion to HOD', 'FAIL', 'Student was unexpectedly able to change role to hod');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO test_results VALUES (3, 'Student Self-Promotion to HOD', 'PASS', 'Role promotion rejected: ' || SQLERRM);
  END;

  -- ============================================================================
  -- TEST 4: HOD Self-Modification of Department or Role
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_hod_it::text, true);
  BEGIN
    UPDATE public.profiles SET department = 'TEST_CSE' WHERE id = v_hod_it;
    INSERT INTO test_results VALUES (4, 'HOD Self-Department Modification', 'FAIL', 'HOD was unexpectedly able to modify own department');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO test_results VALUES (4, 'HOD Self-Department Modification', 'PASS', 'HOD self-department change rejected: ' || SQLERRM);
  END;

  -- ============================================================================
  -- TEST 5: Cross-Department HOD Access
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_hod_it::text, true);

  -- 5a. Cross-department SELECT check (IT HOD selecting CSE student)
  SELECT count(*) INTO v_count FROM public.students WHERE id = v_stu_cse;

  -- 5b. Cross-department UPDATE check (IT HOD updating CSE student)
  UPDATE public.students SET cgpa = 9.5 WHERE id = v_stu_cse;
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_count = 0 AND v_rows_updated = 0 THEN
    INSERT INTO test_results VALUES (5, 'Cross-Department HOD Access', 'PASS', 'IT HOD cannot read (0 rows visible) or mutate (0 rows modified) CSE student due to department RLS');
  ELSE
    INSERT INTO test_results VALUES (5, 'Cross-Department HOD Access', 'FAIL', 'Cross-dept leak detected: visible=' || v_count || ', modified=' || v_rows_updated);
  END IF;

  -- ============================================================================
  -- TEST 6: Unauthorized Direct Ledger Mutation
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_stu_it::text, true);
  BEGIN
    INSERT INTO public.student_learning_activities (student_id, module_title, category, topic, score, credits_earned, status)
    VALUES (v_stu_it, 'Hacked Activity', 'Quiz', 'DSA', 100, 5000, 'Completed');
    INSERT INTO test_results VALUES (6, 'Direct Ledger Insert by Student', 'FAIL', 'Student was unexpectedly able to insert directly into ledger');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO test_results VALUES (6, 'Direct Ledger Insert by Student', 'PASS', 'Direct insert rejected: ' || SQLERRM);
  END;

  -- ============================================================================
  -- TEST 7: Idempotent Quiz Evaluation & Concurrent Protection
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_stu_it::text, true);

  -- First evaluation: Passing (100%)
  SELECT public.evaluate_quiz(
    v_mod_id, 
    jsonb_build_object(v_q1::text, v_opt1_correct::text, v_q2::text, v_opt2_correct::text)
  ) INTO v_quiz_res;

  IF (v_quiz_res->>'passed')::boolean = true AND (v_quiz_res->>'credits_awarded')::int = 25 THEN
    -- Second evaluation: Same module, passing again
    SELECT public.evaluate_quiz(
      v_mod_id, 
      jsonb_build_object(v_q1::text, v_opt1_correct::text, v_q2::text, v_opt2_correct::text)
    ) INTO v_quiz_res;

    SELECT count(*) INTO v_count FROM public.student_learning_activities WHERE student_id = v_stu_it AND module_id = v_mod_id;

    IF (v_quiz_res->>'already_completed')::boolean = true AND (v_quiz_res->>'credits_awarded')::int = 0 AND v_count = 1 THEN
      INSERT INTO test_results VALUES (7, 'Quiz Evaluation Idempotency', 'PASS', 'Awarded 25 credits on first pass; 0 credits on retake; exactly 1 ledger row exists');
    ELSE
      INSERT INTO test_results VALUES (7, 'Quiz Evaluation Idempotency', 'FAIL', 'Duplicate prevention failed: count=' || v_count || ', res=' || v_quiz_res::text);
    END IF;
  ELSE
    INSERT INTO test_results VALUES (7, 'Quiz Evaluation Idempotency', 'FAIL', 'First pass evaluation failed: ' || v_quiz_res::text);
  END IF;

  -- ============================================================================
  -- TEST 8: Failed Quiz Retry Support
  -- ============================================================================
  PERFORM set_config('role', 'service_role', true);
  UPDATE public.learning_modules SET department = NULL WHERE id = v_mod_id;
  
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_stu_cse::text, true);

  -- Fail attempt (0%)
  SELECT public.evaluate_quiz(
    v_mod_id, 
    jsonb_build_object(v_q1::text, v_opt1_wrong::text, v_q2::text, v_opt2_wrong::text)
  ) INTO v_quiz_res;

  SELECT count(*) INTO v_count FROM public.student_learning_activities WHERE student_id = v_stu_cse AND module_id = v_mod_id;

  IF (v_quiz_res->>'passed')::boolean = false AND v_count = 0 THEN
    -- Now pass on retry
    SELECT public.evaluate_quiz(
      v_mod_id, 
      jsonb_build_object(v_q1::text, v_opt1_correct::text, v_q2::text, v_opt2_correct::text)
    ) INTO v_quiz_res;

    SELECT count(*) INTO v_count FROM public.student_learning_activities WHERE student_id = v_stu_cse AND module_id = v_mod_id;

    IF (v_quiz_res->>'passed')::boolean = true AND (v_quiz_res->>'credits_awarded')::int = 25 AND v_count = 1 THEN
      INSERT INTO test_results VALUES (8, 'Failed Quiz Retry Support', 'PASS', 'Failed attempt logged 0 credits/records; subsequent retry passed and awarded credits normally');
    ELSE
      INSERT INTO test_results VALUES (8, 'Failed Quiz Retry Support', 'FAIL', 'Retry failed: ' || v_quiz_res::text);
    END IF;
  ELSE
    INSERT INTO test_results VALUES (8, 'Failed Quiz Retry Support', 'FAIL', 'Failed attempt logged records unexpectedly: ' || v_quiz_res::text);
  END IF;

  -- ============================================================================
  -- TEST 9: Allowed Personal Profile Fields Updating
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_stu_it::text, true);
  BEGIN
    UPDATE public.profiles SET full_name = 'Yashwanth Kumar Verified', phone = '+91 99999 88888' WHERE id = v_stu_it;
    UPDATE public.students SET bio = 'Updated bio', github_url = 'https://github.com/test' WHERE id = v_stu_it;
    INSERT INTO test_results VALUES (9, 'Allowed Personal Profile Updates', 'PASS', 'Legitimate personal profile and bio updates succeeded without error');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO test_results VALUES (9, 'Allowed Personal Profile Updates', 'FAIL', 'Legitimate update failed: ' || SQLERRM);
  END;

  -- ============================================================================
  -- TEST 10: Authorized Institutional Administrator Provisioning
  -- ============================================================================
  PERFORM set_config('role', 'service_role', true);
  BEGIN
    SELECT public.institutional_provision_profile(
      v_stu_it,
      'faculty'::public.user_role,
      'TEST_CSE',
      true,
      'Institutional academic board appointment to CSE faculty'
    ) INTO v_prov_res;

    -- Verify profile updated
    SELECT count(*) INTO v_count
    FROM public.profiles
    WHERE id = v_stu_it AND role = 'faculty' AND department = 'TEST_CSE' AND is_active = true;

    -- Verify audit log written
    IF v_count = 1 AND (v_prov_res->>'success')::boolean = true AND (SELECT count(*) FROM public.institutional_audit_logs WHERE target_user_id = v_stu_it AND action = 'PROMOTE_ROLE') = 1 THEN
      INSERT INTO test_results VALUES (10, 'Authorized Institutional Provisioning', 'PASS', 'Institutional admin successfully promoted user to faculty, changed dept, and generated immutable audit log');
    ELSE
      INSERT INTO test_results VALUES (10, 'Authorized Institutional Provisioning', 'FAIL', 'Institutional provisioning failed verification: count=' || v_count || ', res=' || v_prov_res::text);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO test_results VALUES (10, 'Authorized Institutional Provisioning', 'FAIL', 'Institutional provisioning threw unexpected error: ' || SQLERRM);
  END;

  -- ============================================================================
  -- TEST 11: Unauthorized Invocation of Institutional Provisioning
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_stu_cse::text, true);
  BEGIN
    SELECT public.institutional_provision_profile(
      v_stu_cse,
      'hod'::public.user_role,
      'TEST_IT',
      true,
      'Unauthorized student self-elevation attempt'
    ) INTO v_prov_res;
    INSERT INTO test_results VALUES (11, 'Unauthorized Provisioning Call', 'FAIL', 'Student was unexpectedly able to execute institutional provisioning RPC');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO test_results VALUES (11, 'Unauthorized Provisioning Call', 'PASS', 'Unauthorized caller rejected by permission gate: ' || SQLERRM);
  END;

  -- ============================================================================
  -- TEST 12: Rejection of Forged Provisioning Configuration Flag
  -- ============================================================================
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_stu_it::text, true);
  BEGIN
    -- Malicious actor attempts to forge custom GUC flag
    PERFORM set_config('nexus.institutional_provisioning', 'active', true);
    UPDATE public.profiles SET role = 'hod' WHERE id = v_stu_it;
    INSERT INTO test_results VALUES (12, 'Forged Provisioning Flag Rejection', 'FAIL', 'Student bypassed trigger by setting forged GUC flag');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO test_results VALUES (12, 'Forged Provisioning Flag Rejection', 'PASS', 'Forged GUC flag ignored; tampering strictly rejected: ' || SQLERRM);
  END;

END $$;

-- Return results of test harness
SELECT test_num, test_name, status, details FROM test_results ORDER BY test_num;

-- ALWAYS ROLL BACK: No data or schema is permanently modified in production
ROLLBACK;
