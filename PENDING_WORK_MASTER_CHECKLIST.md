# IT NEXUS — PENDING WORK MASTER CHECKLIST & AUDIT REPORT

**Audit Date:** October 14, 2026  
**Evaluated Branch:** `main`  
**Evaluated Commit:** `6a1a0ec71f39b80e7a03aa26cfccde6faa0f993c`  
**Release Status:** **NO-GO** (Mandatory acceptance tests, hosting configuration, and security controls remain unverified or defective)

---

## 1. Executive Summary & Verification Findings

This audit independently verified the live codebase, git remotes, and remote PostgreSQL database (`ftemxhowpsnfkqxmebhc`) without modifying records, altering RLS, or applying migrations.

### Key Infrastructure State:
1. **Branch & Git Status:**
   - Active branch: `main` at commit `6a1a0ec`.
   - `main` is ahead of `origin/main` by 1 commit (`6a1a0ec`).
   - Preview branch `preview/release-candidate` exists locally at `6a1a0ec` but has **not been pushed** to `origin`.
   - Working tree contains 1 untracked audit artifact (`FINAL_GO_NO_GO.md`) and no uncommitted code diffs.
2. **Hosting & Staging:**
   - **Staging Supabase Project:** Does not exist. Codebase points directly to the primary database `ftemxhowpsnfkqxmebhc`.
   - **Vercel / Production Deployment:** Does not exist (`vercel.json`, `.vercel`, and CI/CD workflows are completely absent).
   - `NEXT_PUBLIC_APP_URL` in `.env.local` remains set to `http://localhost:3000`.
3. **Database Migration Synchronization:**
   - Synchronized: All 9 local migrations up to `20261007000003_create_career_tracks.sql` are 100% matched with the remote database. Zero pending migrations.

---

## 2. Completed & Independently Verified Items

The following items have been fully implemented, compiled, and verified against schema and type checks:

- [x] **Strict TypeScript & Build Compilation:** `npx tsc --noEmit` passes with 0 errors; `npm run build` succeeds across all 48 static and dynamic Next.js routes.
- [x] **Premium Editorial UI Redesign:** Unified glassmorphism, responsive mobile headers, sidebar active states, and dark/light contrast cards across Student, Faculty, and HOD dashboards.
- [x] **Career Tracks & Skills Seed:** Database holds 4 active career tracks and 28 categorized skills in `public.career_tracks` and `public.career_track_skills`. Dynamic alphabetical rendering verified.
- [x] **Global Career Milestones:** 6 benchmark milestones present in `public.career_milestones`.
- [x] **Edge Authentication Middleware:** `middleware.ts` enforces session validation, active status verification (`is_active = true`), and role-based route guard redirects (`/student/*`, `/faculty/*`, `/hod/*`).
- [x] **Zero-Leakage Quiz Question Delivery (RPC Level):** `public.get_quiz` returns questions and options while hiding `is_correct` and `explanation` from unprivileged student inspection.
- [x] **Strict `search_path` on SECURITY DEFINER Functions:** All helper functions enforce `SET search_path = public` or `SET search_path = ''` to prevent search-path hijacking attacks.

---

## 3. Confirmed Defects (With Evidence)

The audit identified critical security vulnerabilities, data integrity gaps, and broken features:

### Defect 1: Student Self-Mutation of Academic Fields
- **Severity:** CRITICAL (Data Integrity / Privilege Escalation)
- **Evidence:**
  - In `supabase/migrations/20260820000001_create_core_schema.sql` (lines 220–225), the RLS policy `students_update_own` allows `UPDATE` with only `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`. There are no column restrictions or trigger validations on academic fields.
  - In `app/student/profile/page.tsx` (lines 219–230), the profile form directly upserts `cgpa`, `roll_number`, `branch`, `batch`, `year`, `semester`, and `section`.
- **Impact:** Any authenticated student can set their own CGPA to `10.0`, change their roll number, or alter their graduation batch directly from the UI or via standard Supabase client calls.

### Defect 2: Student Can Alter Department on User Profile
- **Severity:** CRITICAL (Cross-Department Security Bypass)
- **Evidence:**
  - In `supabase/migrations/20260820000001_create_core_schema.sql` (lines 153–167), trigger `prevent_role_tampering()` only raises exceptions when `NEW.role` or `NEW.is_active` are altered by non-HOD users. It **fails to validate `NEW.department`**.
  - In `app/student/profile/page.tsx` (lines 199–208), the client updates `public.profiles` with `department: selectedDept`.
- **Impact:** A student can switch their department (e.g., from `IT` to `CSE`), bypassing department isolation and viewing cross-department data.

### Defect 3: HOD Security Policies Lack Department Scoping
- **Severity:** HIGH (Privacy & Isolation Violation)
- **Evidence:**
  - In `supabase/migrations/20260820000001_create_core_schema.sql` (lines 87–90 & 187–204), helper function `public.is_hod()` returns `true` for any user with `role = 'hod'`, regardless of department.
  - Policies `profiles_select_hod`, `profiles_update_hod`, `students_select_hod`, and `students_update_hod` use `USING (public.is_hod())` without checking `department = public.get_user_department()`.
- **Impact:** An IT HOD has full SELECT and UPDATE permissions over CSE, ECE, MECH, and CIVIL students and faculty profiles, directly violating Section 6 of `docs/WORKFLOW.md`.

### Defect 4: Client Can Directly Mutate Learning Activities Ledger
- **Severity:** HIGH (Academic Fraud / Ledger Bypass)
- **Evidence:**
  - In `supabase/migrations/20260826000003_create_student_features.sql` (lines 287–290), policy `learning_activities_student_all` grants `FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid())`.
- **Impact:** Even though `evaluate_quiz` runs server-side, a student can call `supabase.from('student_learning_activities').insert(...)` to write arbitrary scores and award themselves thousands of credits without taking quizzes.

### Defect 5: TOCTOU Concurrency Race in `evaluate_quiz`
- **Severity:** HIGH (Concurrency / Credit Duplication)
- **Evidence:**
  - In `supabase/migrations/20261007000002_add_learning_module_management.sql` (lines 345–357), `evaluate_quiz` checks `SELECT id INTO v_existing_activity FROM public.student_learning_activities WHERE student_id = v_student_id AND module_id = p_module_id AND status = 'Completed'` without row-level locking (`FOR UPDATE`), without an advisory lock, and without a unique database constraint on `(student_id, module_id)`.
  - In the live database, `public.student_learning_activities` already contains two identical completed records for "Python Core Fundamentals Test" awarded to the same student (`student@itnexus.edu`): row `ee750cf0-14ab-46be-8c7b-0ecb58bcc52c` and row `6e987320-4b3b-424a-a8aa-d0926b85e963`.
- **Impact:** Concurrent submissions award duplicate credits on the same module.

### Defect 6: Zero Quiz Questions in Live Database (Broken Assessment Modal)
- **Severity:** MEDIUM (Feature Non-Functional)
- **Evidence:**
  - Live database query returned: `public.learning_quiz_questions` count = **0**, `public.learning_quiz_options` count = **0**.
  - In `app/student/learning/page.tsx` (line 149), `handleSubmitAssessment` aborts if `activeQuestions.length === 0`.
- **Impact:** No student can take or complete quizzes on any module (including the 9 catalog modules and the debug module).

### Defect 7: Unmanaged File Storage & Base64 Data URI Bloat
- **Severity:** MEDIUM (Storage Security & DB Performance)
- **Evidence:**
  - Zero Supabase Storage buckets or storage RLS policies exist in migrations.
  - In `app/student/profile/page.tsx` (lines 146–166), PDF resumes up to 10MB are converted to Base64 data URIs via `FileReader.readAsDataURL` and written directly into `public.students.resume_url`.
- **Impact:** Severe database bloat, slow profile queries, and lack of MIME/virus scanning on file attachments.

### Defect 8: Mock Data in HOD Accreditation Reports
- **Severity:** LOW (Incomplete Reporting Implementation)
- **Evidence:**
  - In `app/hod/reports/page.tsx` (lines 81–87), report generation inserts hardcoded summary JSON (`complianceScore: '94.2%'`, `totalCriteriaAudited: 12`, `status: 'Approved for SSR Submission'`) regardless of actual department statistics.

---

## 4. Unverified Acceptance Tests

Due to strict production Google SSO enforcement, absent staging infrastructure, and zero provisioned Google credentials for Faculty and HOD roles, the following workflows have **not been tested with real authenticated sessions**:

1. **Student End-to-End Workflow:**
   - First-time Google OAuth onboarding and default inactive provisioning.
   - Profile completion and milestone toggling persistence.
   - Skill addition, project creation, and certification logging.
   - Grievance submission and student notification reception.
2. **Faculty End-to-End Workflow:**
   - Google OAuth login with Faculty profile routing.
   - Department student roster viewing (ensuring other departments are hidden).
   - Mentoring session scheduling and mentee assignment.
   - Grievance response and escalation to HOD.
3. **HOD End-to-End Workflow:**
   - Google OAuth login with HOD profile routing.
   - Department Command Center KPI card verification against live data.
   - Grievance review, status update, and department announcement broadcasts.
   - Learning module creation and quiz question authoring.
4. **Cross-Department Security Verification:**
   - Attempting to query CSE records using an IT session token at the HTTP API level.

---

## 5. Temporary Production Records Audit

A read-only inspection of remote tables revealed the following:

| Table | Record / Identifier | Details | Action Required Prior to Launch |
| :--- | :--- | :--- | :--- |
| `public.profiles` | `pyaswanth2005@gmail.com` (`7e705903-...`) | **Real Student Profile (Paridala Yaswanth Kumar)** | **PROTECT:** Do not delete or overwrite. |
| `public.profiles` | `student@itnexus.edu` (`d15053b3-...`) | Real student development profile | **PROTECT:** Preserves learning records. |
| `public.profiles` | `student@example.com`, `faculty@example.com`, `hod@example.com` | Legacy development accounts | Purge prior to campus launch. |
| `public.profiles` | `faculty_mech10@test.com`, `student_mechf2@test.com`, `faculty_mechf1@test.com` | Inactive QA test accounts (`is_active = false`) | Purge prior to campus launch. |
| `public.profiles` | `saisrija949@gmail.com` (`1f8f7ce9-...`) | Registered student (`is_active = false`) | Retain or activate per institutional policy. |
| `public.learning_modules` | `859c8e01-7044-4768-8494-ed48fa522a7b` | `"Debug Module"` (topic: Testing, dept: IT) | Remove debug module before launch. |
| `public.student_learning_activities` | IDs: `cc7d7e66-...`, `ee750cf0-...`, `6e987320-...` | 3 activities completed by `Paridala Yaswanth Kumar` | **EXPLICITLY PROTECTED.** Do not delete. |

---

## 6. Exact Blockers & Required Account Actions

The project cannot proceed to production deployment until the following blockers are cleared:

1. **Provision Real Institutional Google Accounts for Staff:**
   - Currently, no Google accounts exist for Faculty and HOD testing.
   - **Action Required:** Designate or create two institutional Google accounts (e.g., `faculty.test@gmail.com` and `hod.test@gmail.com`). Sign in once, then administratively link their `auth.users.id` in `public.profiles` with `role = 'faculty'` and `role = 'hod'` respectively.
2. **Assign Production Hosting Target:**
   - **Action Required:** Link the repository to Vercel (or AWS Amplify / Docker host), configure production environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and production `NEXT_PUBLIC_APP_URL`).
3. **Register Google Cloud & Supabase OAuth Callbacks:**
   - **Action Required:** Add `https://<production-domain>/auth/callback` to Google Cloud Console Authorized Redirect URIs and to Supabase Auth URL Configuration.

---

## 7. Recommended Order of Remediation

To reach release readiness without breaking existing functionality, proceed in this exact sequence:

1. **Step 1: Database Security Patch (RLS & Triggers)**
   - Update `prevent_role_tampering()` trigger to prevent non-HOD users from changing `department`.
   - Add a trigger on `public.students` restricting updates on `cgpa`, `roll_number`, `branch`, `batch`, `year`, `semester`, and `section` to HOD or academic administrators.
   - Scope HOD RLS policies on `profiles` and `students` to matching `department = public.get_user_department()`.
   - Restrict `public.student_learning_activities` so students have `SELECT` permission only; all insertions/updates must flow exclusively through `evaluate_quiz`.
   - Add a `UNIQUE (student_id, module_id)` constraint on `public.student_learning_activities` and add advisory locking inside `evaluate_quiz`.
2. **Step 2: Seed Quiz Questions & Options**
   - Insert questions and multiple-choice options for the 9 active learning catalog modules in `public.learning_quiz_questions` and `public.learning_quiz_options`.
3. **Step 3: Storage Bucket Provisioning**
   - Create private Supabase storage buckets (`resumes`, `certificates`, `grievances`) with authenticated RLS policies, replacing raw Base64 data URI storage.
4. **Step 4: Push Preview Branch & Set Up Preview Deployment**
   - Push `preview/release-candidate` to `origin`.
   - Connect repository to Vercel for preview deployments.
5. **Step 5: Provision Staff Test Identities & Conduct Authenticated QA**
   - Provision Google accounts for Faculty and HOD.
   - Run the 4 acceptance tests in `qa_quiz_acceptance_report.md` on the preview deployment.
6. **Step 6: Purge Temporary Records & Cut Production Release**
   - Purge inactive test users and the `"Debug Module"` (while protecting real student activity records).
   - Fast-forward merge `main` and tag the release.

---

## 8. Go-Live Criteria

The release decision will remain **NO-GO** until every item below is checked:

- [ ] All 6 security defects (academic tampering, department switching, HOD cross-dept access, ledger direct writes, quiz race condition, Base64 storage) are resolved via migration.
- [ ] At least 1 quiz question set is populated per active learning module.
- [ ] Preview deployment is live on Vercel with HTTPS and production domain configured.
- [ ] Google OAuth redirect URI is registered and functional on the live domain.
- [ ] Authenticated manual verification checklist passes for Student, Faculty, and HOD roles.
- [ ] Inactive test users are pruned without impacting real student learning records.
