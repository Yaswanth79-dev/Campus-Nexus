# PRE-MERGE VALIDATION REPORT

**Project:** Campus Nexus / IT Nexus  
**Validation Stage:** Pre-Merge Security, Institutional Provisioning & Ledger Integrity Verification  
**Branch:** `fix/critical-production-security`  
**Base Release Checkpoint on `main`:** Commit `6a1a0ec` (Preserved intact & unmodified)  
**Current Commit:** `37745f5`  
**Audit & Validation Date:** October 14, 2026  
**Final Pre-Merge Status:** **NO-GO FOR PRODUCTION** (Code and migration remediations validated; isolated staging environment and Google OAuth staff credentials blocked pending institutional configuration)

---

## 1. Institutional Provisioning Architecture & Verification

### PostgreSQL Execution Behavior Analysis
In PostgreSQL, table triggers attached via `CREATE TRIGGER ... BEFORE UPDATE` execute unconditionally for **all database roles**, including `postgres` (superuser) and `service_role`. A connection utilizing the Supabase service-role key does not automatically bypass triggers unless the trigger function explicitly inspects session configuration parameters or caller context.

Furthermore, direct unmonitored `UPDATE public.profiles` calls via the service role key do not log administrative intent, audit justifications, or synchronize downstream child tables (`public.faculty` and `public.students`).

### Narrowly Authorized Provisioning Implementation
To resolve this gap, an authorized, audited server-side provisioning pipeline was established in migration [`supabase/migrations/20261014000001_critical_security_remediation.sql`](file:///d:/IT%20Nexus/supabase/migrations/20261014000001_critical_security_remediation.sql) and [`lib/supabase/admin.ts`](file:///d:/IT%20Nexus/lib/supabase/admin.ts):

1. **Trigger Modification ([`prevent_profile_tampering()`](file:///d:/IT%20Nexus/supabase/migrations/20261014000001_critical_security_remediation.sql#L42-L102)):**
   ```sql
   -- Allow service_role bypass or active institutional provisioning session
   IF current_setting('role', true) = 'service_role' OR current_setting('nexus.institutional_provisioning', true) = 'active' THEN
     RETURN NEW;
   END IF;
   ```
   If neither condition is met, strict anti-tampering rules execute:
   - Self-modification of `role`, `department`, or `is_active` is blocked for all users (including HODs).
   - HODs cannot appoint HODs, transfer users between departments, or manage users outside their own department.

2. **Immutable Institutional Audit Ledger ([`public.institutional_audit_logs`](file:///d:/IT%20Nexus/supabase/migrations/20261014000001_critical_security_remediation.sql#L107-L132)):**
   - Stores `id`, `performed_by`, `actor_role`, `target_user_id`, `action`, `old_values`, `new_values`, `reason`, and `created_at`.
   - RLS enabled; non-admin roles have all permissions revoked (`REVOKE ALL FROM PUBLIC, anon, authenticated`). Only `service_role` may insert and select.

3. **Narrowly Authorized RPC Function ([`public.institutional_provision_profile`](file:///d:/IT%20Nexus/supabase/migrations/20261014000001_critical_security_remediation.sql#L134-L245)):**
   - **Signature:** `(p_target_user_id UUID, p_new_role user_role, p_new_department TEXT, p_is_active BOOLEAN, p_reason TEXT)`
   - **PostgreSQL Privilege Boundary:** Execution revoked from all client roles:
     ```sql
     REVOKE ALL ON FUNCTION public.institutional_provision_profile(...) FROM PUBLIC, anon, authenticated;
     GRANT EXECUTE ON FUNCTION public.institutional_provision_profile(...) TO service_role;
     ```
   - **Internal Authorization Gate:** Verifies `current_setting('role', true) = 'service_role'` or `auth.jwt()->'app_metadata'->>'is_institutional_admin' = 'true'`.
   - **Execution Sequence:**
     1. Validates that `p_target_user_id` exists in `public.profiles`.
     2. Validates that `p_new_department` exists in `public.departments`.
     3. Temporarily sets `nexus.institutional_provisioning = 'active'` for the current transaction.
     4. Updates `public.profiles` (`role`, `department`, `is_active`).
     5. Synchronizes child tables: inserts/updates `public.faculty` if role is faculty/hod, or `public.students` if role is student.
     6. Records an immutable audit row into `public.institutional_audit_logs`.
     7. Resets `nexus.institutional_provisioning` to `inactive`.

4. **Server-Side Helper ([`lib/supabase/admin.ts`](file:///d:/IT%20Nexus/lib/supabase/admin.ts)):**
   - Uses `SUPABASE_SERVICE_ROLE_KEY` (kept server-side only; never exposed with `NEXT_PUBLIC_`).
   - Exposes `institutionalProvisionProfile()` for Next.js Server Components, Server Actions, and internal API routes.

### Institutional Provisioning Security Matrix
| Capability | Student Role | Faculty Role | HOD Role | Institutional Admin (`service_role` RPC) |
| :--- | :---: | :---: | :---: | :---: |
| **Self-promote role** | ❌ BLOCKED | ❌ BLOCKED | ❌ BLOCKED | N/A (Cannot self-promote via client) |
| **Self-modify department** | ❌ BLOCKED | ❌ BLOCKED | ❌ BLOCKED | N/A |
| **Self-activate account** | ❌ BLOCKED | ❌ BLOCKED | ❌ BLOCKED | N/A |
| **Promote user to Faculty / HOD** | ❌ BLOCKED | ❌ BLOCKED | ❌ BLOCKED | ✅ AUTHORIZED & AUDITED |
| **Transfer user department** | ❌ BLOCKED | ❌ BLOCKED | ❌ BLOCKED | ✅ AUTHORIZED & AUDITED |
| **Activate / Deactivate account** | ❌ BLOCKED | ❌ BLOCKED | ⚠️ Intra-dept only | ✅ AUTHORIZED & AUDITED (Institutional) |
| **Call `institutional_provision_profile`** | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN | ✅ 200 SUCCESS (Audit logged) |

---

## 2. Actual Staging Environment Status & Blockers

### Prior Test Run Clarification
The SQL test harness previously executed ran against the linked database instance inside an explicit transaction (`BEGIN; ... ROLLBACK;`). While mathematically proven not to commit data, **it was not an isolated staging database**. Per user instructions, experimental schema changes must not be rerun against production.

### Staging Infrastructure Audit
1. **Local Supabase with Docker:**
   * Checked `docker --version`:
     ```
     docker : The term 'docker' is not recognized as the name of a cmdlet, function, script file...
     ```
   * **Status:** **BLOCKED** — Docker Desktop is not installed or available on the host. Local Supabase CLI cannot run without Docker engine.

2. **Separate Staging Supabase Cloud Project:**
   * Queried Supabase Cloud API (`npx supabase projects list`):
     * Active Project 1: `ftemxhowpsnfkqxmebhc` ("IT-Nexus", linked production DB).
     * Active Project 2: `lmrgaduzrjytlmkewpjg` ("Portfolio").
     * Inactive Projects: `jghyysuuyvgqkwwrvbux`, `kobfgrsukrgtrrkwsrab`.
   * Attempted `npx supabase projects create`:
     ```
     ProjectsCreateUnexpectedStatusError: 400 - reached max allowed free projects (2/2)
     ```
   * User instruction constraint: *"Do not delete an existing Supabase project merely to free the quota without explicit approval."*
   * **Status:** **BLOCKED** — Supabase Cloud free-tier project quota is exhausted.

### Required Actions to Unblock Isolated Staging:
To provision an authentic, persistent staging Supabase project without compromising other projects:
* **Option A (Cloud):** The user can grant explicit approval to delete or pause the unlinked `Portfolio` project (`lmrgaduzrjytlmkewpjg`), or upgrade the organization to Supabase Pro, allowing `npx supabase projects create --name it-nexus-staging` to complete.
* **Option B (Local):** Install and start Docker Desktop with WSL2 on the Windows machine, enabling `npx supabase start`.

---

## 3. Ledger Integrity & Historical Duplicate Reconciliation Plan

### Live Ledger Audit (`public.student_learning_activities`)
A direct inspection of all rows in `public.student_learning_activities` on the database revealed:
1. `id = cc7d7e66-abba-4783-ade2-9ae7588cc4e7`:
   - Student: `d15053b3-d2cd-4cc8-b603-131614db1ef8`
   - Module ID: `8b03b0be-aa13-4f2b-8ac4-8b5e9a4020e2`
   - Title: "Data Structures in C++ (Arrays & Linked Lists)"
   - Score: 81, Credits: 15, Status: 'Completed' (2026-08-27 11:10:19)
2. `id = ee750cf0-14ab-46be-8c7b-0ecb58bcc52c`:
   - Student: `d15053b3-d2cd-4cc8-b603-131614db1ef8`
   - Module ID: `NULL`
   - Title: "Python Core Fundamentals Test"
   - Score: 100, Credits: 10, Status: 'Completed' (2026-08-27 11:10:01)
3. `id = 6e987320-4b3b-424a-a8aa-d0926b85e963`:
   - Student: `d15053b3-d2cd-4cc8-b603-131614db1ef8`
   - Module ID: `NULL`
   - Title: "Python Core Fundamentals Test"
   - Score: 100, Credits: 10, Status: 'Completed' (2026-08-27 11:19:11)

### Technical Analysis of Findings:
* **Confirmed Duplicate:** Rows 2 and 3 represent an identical test completed 9 minutes apart by the same student during initial testing on August 27, 2026, awarding an extra 10 credits (20 total).
* **Historical Null Integrity:** Both duplicate rows have `module_id = NULL` because they were created prior to normalized `learning_modules`.
* **Partial Index Non-Conflict:** The partial unique index:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS uq_student_completed_module
  ON public.student_learning_activities(student_id, module_id)
  WHERE module_id IS NOT NULL AND status = 'Completed';
  ```
  specifically targets `WHERE module_id IS NOT NULL`. Because rows with `module_id = NULL` are ignored by PostgreSQL partial indexing, **zero index conflicts exist in existing data**. The migration will apply cleanly without error.
* **No Automatic Deletion:** Neither row was altered or deleted.

### Reconciliation Plan
A formal, reviewable reconciliation script has been generated at [`docs/reconciliation_plan_duplicate_credits.sql`](file:///d:/IT%20Nexus/docs/reconciliation_plan_duplicate_credits.sql):
* **Option A (Soft Reconciliation — Recommended):** Update row `6e987320-4b3b-424a-a8aa-d0926b85e963` to `credits_earned = 0` and `status = 'Duplicate'` while preserving timestamps, score, and student submission evidence. Logs an institutional audit record in `public.institutional_audit_logs`.
* **Option B (Grandfathering):** Retain both records as legacy artifacts with an audit notation in the accreditation file.

### Ledger Protection & Concurrency Verification
* **Direct Write Prevention:** RLS policy `learning_activities_student_select` allows `SELECT` only. Direct client `INSERT`, `UPDATE`, and `DELETE` requests by students are blocked.
* **Advisory Lock Concurrency:** [`evaluate_quiz`](file:///d:/IT%20Nexus/supabase/migrations/20261014000001_critical_security_remediation.sql#L250-L360) invokes `pg_advisory_xact_lock(hashtext(v_student_id::text || p_module_id::text))` to serialize concurrent submissions.
* **Idempotent Insertion:** `evaluate_quiz` targets `ON CONFLICT (student_id, module_id) WHERE module_id IS NOT NULL AND status = 'Completed' DO NOTHING`.
* **Retry Support:** Failed quiz attempts log 0 credits and 0 ledger rows, permitting subsequent retries.

---

## 4. Final Verification Summary

| Gate / Requirement | Status | Evidence |
| :--- | :---: | :--- |
| **Academic Field Protection** | ✅ PASS | Verified trigger blocks self-modification of `cgpa`, `roll_number`, `branch`, `batch`, `year`, `semester`, etc. |
| **Profile Privilege Protection** | ✅ PASS | Verified trigger blocks user/HOD self-promotion, department change, and activation. |
| **Authorized Institutional Provisioning** | ✅ PASS | Implemented `institutional_provision_profile()` + `institutional_audit_logs` + `lib/supabase/admin.ts`. |
| **Ledger Integrity & Index Match** | ✅ PASS | Partial index predicate matches `evaluate_quiz` `ON CONFLICT` target. |
| **Historical Null Record Review** | ✅ PASS | Both `module_id = NULL` rows audited; non-destructive reconciliation plan documented in `docs/reconciliation_plan_duplicate_credits.sql`. |
| **TypeScript Static Check** | ✅ PASS | `npx tsc --noEmit` exited with code 0 (zero errors). |
| **Turbopack Production Build** | ✅ PASS | `npm run build` exited with code 0 (48/48 routes generated). |
| **Actual Staging Environment** | ⚠️ BLOCKED | Docker absent on host; Supabase cloud project quota exhausted (2/2 active). |
| **Authenticated Staff Acceptance QA** | ⚠️ BLOCKED | Google OAuth SSO enforced; no faculty/HOD Google credentials provisioned. |
| **Production Hosting Target** | ⚠️ BLOCKED | No hosting provider configuration (Vercel/Amplify) or production domain set. |

---

## 5. Release Gate Status & Decision

### Production Gate Status: **NO-GO**

**Reasoning:**
While code quality, TypeScript safety, Turbopack compilation, and database remediation logic are complete, release to production cannot proceed until:
1. An isolated staging Supabase environment is provisioned (via Docker or project quota resolution).
2. Institutional Google OAuth credentials for Faculty and HOD roles are configured to permit live authenticated browser walkthroughs.
3. Production hosting configuration and custom domain callbacks are established.

---

## 6. Single Most Important Next Action

> **Resolve the Supabase staging quota blocker (by approving the pause/deletion of the unlinked `Portfolio` project or installing Docker Desktop) so migration `20261014000001_critical_security_remediation.sql` can be applied to a persistent staging database for authenticated Student, Faculty, and HOD QA testing.**
