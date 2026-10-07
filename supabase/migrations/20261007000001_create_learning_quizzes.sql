-- Migration to support Learning Hub Quizzes

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.learning_quiz_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    explanation TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.learning_quiz_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.learning_quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS setup (secure by default)
ALTER TABLE public.learning_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_quiz_options ENABLE ROW LEVEL SECURITY;

-- 1.5 Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_quiz_questions_module_id ON public.learning_quiz_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_learning_quiz_options_question_id ON public.learning_quiz_options(question_id);

-- No direct SELECT policies for students on these tables to protect correct answers.
-- Data access will be handled via SECURITY DEFINER functions.

-- 2. Function to fetch quiz questions and options without correct answers/explanations
CREATE OR REPLACE FUNCTION public.get_quiz(p_module_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_result JSONB;
    v_student_id UUID;
BEGIN
    -- Ensure authenticated and active student
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = v_student_id) THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not a registered student';
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

REVOKE EXECUTE ON FUNCTION public.get_quiz(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quiz(UUID) TO authenticated;

-- 3. Function to securely evaluate quiz submission
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
    v_question RECORD;
    v_total_questions INT := 0;
    v_correct_answers INT := 0;
    v_score INT := 0;
    v_credits_reward INT := 0;
    v_module_title TEXT;
    v_module_category TEXT;
    v_module_topic TEXT;
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
    IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = v_student_id) THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not a registered student';
    END IF;

    -- Fetch module details
    SELECT credits_reward, title, category, topic 
    INTO v_credits_reward, v_module_title, v_module_category, v_module_topic
    FROM public.learning_modules
    WHERE id = p_module_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Module not found';
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
    v_passed := v_score >= 70; -- 70% passing threshold

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

REVOKE EXECUTE ON FUNCTION public.evaluate_quiz(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_quiz(UUID, JSONB) TO authenticated;
