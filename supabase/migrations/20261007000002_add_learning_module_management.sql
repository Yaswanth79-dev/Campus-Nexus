-- 20261007000002_add_learning_module_management.sql
-- Adds department scope, ownership, and configurable passing scores to learning modules.

-- 1. Add schema columns
ALTER TABLE public.learning_modules 
ADD COLUMN IF NOT EXISTS department VARCHAR,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70;

-- 2. Constraints
ALTER TABLE public.learning_modules
ADD CONSTRAINT check_passing_score CHECK (passing_score >= 0 AND passing_score <= 100);

-- 3. Update Learning Modules RLS
DROP POLICY IF EXISTS "learning_modules_select" ON public.learning_modules;
DROP POLICY IF EXISTS "learning_modules_manage_faculty" ON public.learning_modules;

CREATE POLICY "learning_modules_student_select" ON public.learning_modules
  FOR SELECT TO authenticated
  USING (
    is_active = true 
    AND (department IS NULL OR department = public.get_user_department())
  );

CREATE POLICY "learning_modules_staff_select" ON public.learning_modules
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() IN ('faculty', 'hod')
    AND (department IS NULL OR department = public.get_user_department())
  );

CREATE POLICY "learning_modules_staff_insert" ON public.learning_modules
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_auth_role() IN ('faculty', 'hod')
    AND department = public.get_user_department()
    AND created_by = auth.uid()
  );

CREATE POLICY "learning_modules_staff_update" ON public.learning_modules
  FOR UPDATE TO authenticated
  USING (
    public.get_auth_role() IN ('faculty', 'hod')
    AND department = public.get_user_department()
  )
  WITH CHECK (
    public.get_auth_role() IN ('faculty', 'hod')
    AND department = public.get_user_department()
  );

CREATE POLICY "learning_modules_staff_delete" ON public.learning_modules
  FOR DELETE TO authenticated
  USING (
    public.get_auth_role() IN ('faculty', 'hod')
    AND department = public.get_user_department()
  );

-- 4. Quiz Questions RLS (Staff Management)
CREATE POLICY "quiz_questions_staff_select" ON public.learning_quiz_questions
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() IN ('faculty', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.learning_modules m 
        WHERE m.id = learning_quiz_questions.module_id 
        AND m.department = public.get_user_department()
    )
  );

CREATE POLICY "quiz_questions_staff_insert" ON public.learning_quiz_questions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_auth_role() IN ('faculty', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.learning_modules m 
        WHERE m.id = module_id 
        AND m.department = public.get_user_department()
    )
  );

CREATE POLICY "quiz_questions_staff_update" ON public.learning_quiz_questions
  FOR UPDATE TO authenticated
  USING (
    public.get_auth_role() IN ('faculty', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.learning_modules m 
        WHERE m.id = learning_quiz_questions.module_id 
        AND m.department = public.get_user_department()
    )
  )
  WITH CHECK (
    public.get_auth_role() IN ('faculty', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.learning_modules m 
        WHERE m.id = module_id 
        AND m.department = public.get_user_department()
    )
  );

CREATE POLICY "quiz_questions_staff_delete" ON public.learning_quiz_questions
  FOR DELETE TO authenticated
  USING (
    public.get_auth_role() IN ('faculty', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.learning_modules m 
        WHERE m.id = learning_quiz_questions.module_id 
        AND m.department = public.get_user_department()
    )
  );


-- 5. Quiz Options RLS (Staff Management)
CREATE POLICY "quiz_options_staff_select" ON public.learning_quiz_options
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() IN ('faculty', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.learning_quiz_questions q
        JOIN public.learning_modules m ON m.id = q.module_id
        WHERE q.id = learning_quiz_options.question_id 
        AND m.department = public.get_user_department()
    )
  );

CREATE POLICY "quiz_options_staff_insert" ON public.learning_quiz_options
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_auth_role() IN ('faculty', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.learning_quiz_questions q
        JOIN public.learning_modules m ON m.id = q.module_id
        WHERE q.id = question_id 
        AND m.department = public.get_user_department()
    )
  );

CREATE POLICY "quiz_options_staff_update" ON public.learning_quiz_options
  FOR UPDATE TO authenticated
  USING (
    public.get_auth_role() IN ('faculty', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.learning_quiz_questions q
        JOIN public.learning_modules m ON m.id = q.module_id
        WHERE q.id = learning_quiz_options.question_id 
        AND m.department = public.get_user_department()
    )
  )
  WITH CHECK (
    public.get_auth_role() IN ('faculty', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.learning_quiz_questions q
        JOIN public.learning_modules m ON m.id = q.module_id
        WHERE q.id = question_id 
        AND m.department = public.get_user_department()
    )
  );

CREATE POLICY "quiz_options_staff_delete" ON public.learning_quiz_options
  FOR DELETE TO authenticated
  USING (
    public.get_auth_role() IN ('faculty', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.learning_quiz_questions q
        JOIN public.learning_modules m ON m.id = q.module_id
        WHERE q.id = learning_quiz_options.question_id 
        AND m.department = public.get_user_department()
    )
  );

-- 6. Secure get_quiz RPC modifications
CREATE OR REPLACE FUNCTION public.get_quiz(p_module_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_result JSONB;
    v_student_id UUID;
    v_department VARCHAR;
    v_module_active BOOLEAN;
    v_module_dept VARCHAR;
BEGIN
    -- Ensure authenticated and active student
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT department INTO v_department
    FROM public.profiles 
    WHERE id = v_student_id AND role = 'student' AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not a registered student';
    END IF;

    -- Verify module accessibility
    SELECT is_active, department INTO v_module_active, v_module_dept
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

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', q.id,
            'question_text', q.question_text,
            'display_order', q.display_order,
            'options', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', o.id,
                        'option_text', o.option_text,
                        'display_order', o.display_order
                    ) ORDER BY o.display_order
                )
                FROM public.learning_quiz_options o
                WHERE o.question_id = q.id
            )
        ) ORDER BY q.display_order
    )
    INTO v_result
    FROM public.learning_quiz_questions q
    WHERE q.module_id = p_module_id;

    RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;


-- 7. Secure evaluate_quiz RPC modifications
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
BEGIN
    -- Ensure authenticated
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify caller is an active student
    SELECT department INTO v_department
    FROM public.profiles 
    WHERE id = v_student_id AND role = 'student' AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not a registered student';
    END IF;

    -- Fetch module details and verify accessibility
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

    -- Evaluate each question
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

    -- Calculate score
    v_score := ROUND((v_correct_answers::NUMERIC / v_total_questions::NUMERIC) * 100);
    v_passed := v_score >= v_passing_score;

    -- Persist successful attempt if not already recorded
    IF v_passed THEN
        SELECT id INTO v_existing_activity 
        FROM public.student_learning_activities
        WHERE student_id = v_student_id AND module_id = p_module_id AND status = 'Completed';
        
        IF v_existing_activity IS NULL THEN
            INSERT INTO public.student_learning_activities (
                student_id, module_id, module_title, category, topic, score, credits_earned, status, completed_at
            ) VALUES (
                v_student_id, p_module_id, v_module_title, v_module_category, v_module_topic, v_score, v_credits_reward, 'Completed', now()
            );
        END IF;
    END IF;

    -- Return full result object
    RETURN jsonb_build_object(
        'score', v_score,
        'passed', v_passed,
        'total', v_total_questions,
        'correct', v_correct_answers,
        'feedback', v_feedback
    );
END;
$$;
