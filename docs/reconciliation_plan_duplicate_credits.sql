-- ==============================================================================
-- CAMPUS NEXUS / IT NEXUS — HISTORICAL DUPLICATE CREDITS RECONCILIATION PLAN
-- ==============================================================================
-- Document: docs/reconciliation_plan_duplicate_credits.sql
-- Status: PENDING INSTITUTIONAL REGISTRAR & ACADEMIC COMMITTEE REVIEW
-- Principle: STRICTLY NON-DESTRUCTIVE — NO AUTOMATIC DELETION OF DATA
-- ==============================================================================

/*
EXECUTIVE SUMMARY:
During the October 14, 2026 security audit of `public.student_learning_activities`,
a duplicate credit award was identified for student `d15053b3-d2cd-4cc8-b603-131614db1ef8`:

1. Record 1 (Original valid completion):
   - ID: ee750cf0-14ab-46be-8c7b-0ecb58bcc52c
   - Student ID: d15053b3-d2cd-4cc8-b603-131614db1ef8
   - Module ID: NULL (Legacy pre-normalization record)
   - Module Title: 'Python Core Fundamentals Test'
   - Score: 100
   - Credits Earned: 10
   - Status: 'Completed'
   - Completed At: 2026-08-27 11:10:01.566+00

2. Record 2 (Duplicate submission 9 minutes later):
   - ID: 6e987320-4b3b-424a-a8aa-d0926b85e963
   - Student ID: d15053b3-d2cd-4cc8-b603-131614db1ef8
   - Module ID: NULL (Legacy pre-normalization record)
   - Module Title: 'Python Core Fundamentals Test'
   - Score: 100
   - Credits Earned: 10
   - Status: 'Completed'
   - Completed At: 2026-08-27 11:19:11.508+00

ROOT CAUSE:
Prior to migration 20261014000001, the system lacked:
- A unique index on (student_id, module_id);
- Concurrency locking in evaluate_quiz;
- Client-side submit debouncing.

PARTIAL INDEX COMPATIBILITY:
The proposed partial unique index:
  CREATE UNIQUE INDEX uq_student_completed_module
  ON public.student_learning_activities(student_id, module_id)
  WHERE module_id IS NOT NULL AND status = 'Completed';
does NOT conflict with these rows because `module_id IS NULL` is filtered out by the partial index predicate.
Therefore, zero rows in production violate the index.

RECONCILIATION OPTIONS FOR REGISTRAR APPROVAL:

--------------------------------------------------------------------------------
OPTION A: SOFT RECONCILIATION (RECOMMENDED)
Adjust the duplicate entry's credits to 0 and update status to 'Duplicate'.
Preserves the full historical attempt, submission timestamp, and score for academic transcripts.
--------------------------------------------------------------------------------

BEGIN;

-- 1. Ensure 'Duplicate' is an allowed status or add audit notation
-- In public.student_learning_activities, check existing status values:
UPDATE public.student_learning_activities
SET credits_earned = 0,
    status = 'Duplicate'
WHERE id = '6e987320-4b3b-424a-a8aa-d0926b85e963'
  AND student_id = 'd15053b3-d2cd-4cc8-b603-131614db1ef8'
  AND credits_earned = 10;

-- 2. Audit log entry in public.institutional_audit_logs
INSERT INTO public.institutional_audit_logs (
  performed_by,
  actor_role,
  target_user_id,
  action,
  old_values,
  new_values,
  reason
) VALUES (
  NULL,
  'institutional_registrar',
  'd15053b3-d2cd-4cc8-b603-131614db1ef8',
  'RECONCILE_DUPLICATE_CREDIT',
  jsonb_build_object('activity_id', '6e987320-4b3b-424a-a8aa-d0926b85e963', 'credits_earned', 10, 'status', 'Completed'),
  jsonb_build_object('activity_id', '6e987320-4b3b-424a-a8aa-d0926b85e963', 'credits_earned', 0, 'status', 'Duplicate'),
  'Reconciliation of legacy duplicate quiz completion (Python Core Fundamentals Test submitted at 11:19:11)'
);

-- Review changes before commit:
SELECT id, student_id, module_title, score, credits_earned, status, completed_at
FROM public.student_learning_activities
WHERE student_id = 'd15053b3-d2cd-4cc8-b603-131614db1ef8'
ORDER BY completed_at;

-- COMMIT; or ROLLBACK;

--------------------------------------------------------------------------------
OPTION B: GRANDFATHERED ANOMALY RETENTION
Retain the historical record and credit award without mutation, documenting the
10-credit variance in institutional accreditation notes.
--------------------------------------------------------------------------------
-- No SQL modification required. Log record in institutional audit log noting grandfathered status.
*/
