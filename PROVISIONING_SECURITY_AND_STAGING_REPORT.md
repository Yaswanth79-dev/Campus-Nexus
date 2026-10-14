# PROVISIONING SECURITY AND STAGING REPORT

**Project:** Campus Nexus (IT Nexus)  
**Security Gate:** Provisioning Bypass Hardening & Staging Setup  
**Branch:** `fix/critical-production-security`  
**Base Release Checkpoint on `main`:** Commit `6a1a0ec` (Preserved intact & unmodified)  
**Evaluation Date:** October 14, 2026  
**Release Gate Status:** **NO-GO FOR PRODUCTION** (All code and trigger hardening complete and verified; isolated persistent staging database and Google OAuth staff credentials blocked pending environment setup)

---

## 1. Institutional Provisioning Trigger Hardening

### 1.1 Vulnerability Analysis of Custom Configuration Settings (GUCs)
* **Finding:** In PostgreSQL, any connected database session (including unprivileged `anon` and `authenticated` roles) can execute:
  ```sql
  SELECT set_config('nexus.institutional_provisioning', 'active', false);
  -- or
  SET nexus.institutional_provisioning = 'active';
  ```
* **Exploit Vector:** Because `nexus.institutional_provisioning` was a user-defined custom GUC without C-extension namespace locks, an authenticated student or compromised HOD session executing a multi-statement query or RPC could set this parameter to `'active'` immediately prior to issuing `UPDATE public.profiles SET role = 'hod' WHERE id = auth.uid()`.
* **Remediation:** The custom-GUC bypass was **completely eliminated** from both [`public.prevent_profile_tampering()`](file:///d:/IT%20Nexus/supabase/migrations/20261014000001_critical_security_remediation.sql#L42-L102) and [`public.institutional_provision_profile()`](file:///d:/IT%20Nexus/supabase/migrations/20261014000001_critical_security_remediation.sql#L134-L245). No user-settable session flag can disable profile integrity triggers.

### 1.2 Execution Behavior of `current_setting('role', true)` in PostgREST
* When PostgREST processes requests authenticated via the Supabase Service Role key (`SUPABASE_SERVICE_ROLE_KEY`), it executes `SET LOCAL ROLE service_role`.
* In this context, `current_setting('role', true)` reliably evaluates to `'service_role'`.
* Conversely, when an authenticated student or staff member connects, PostgREST sets `SET LOCAL ROLE authenticated`.
* If a client attempts to forge this role via `SET ROLE service_role;`, PostgreSQL terminates the statement with:
  ```
  ERROR: permission denied to set role "service_role"
  ```
  Role `authenticated` possesses zero privileges to assume `service_role`.

### 1.3 Hardened Trigger Logic
[`public.prevent_profile_tampering()`](file:///d:/IT%20Nexus/supabase/migrations/20261014000001_critical_security_remediation.sql#L42-L102) now strictly requires an authentic `service_role` session:
```sql
CREATE OR REPLACE FUNCTION public.prevent_profile_tampering()
RETURNS TRIGGER AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_dept TEXT;
  v_caller_is_hod BOOLEAN;
BEGIN
  -- Strictly allow only authentic service_role session (server-side administrative process) to bypass
  IF current_setting('role', true) = 'service_role' THEN
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

    -- An HOD cannot appoint or modify another HOD
    IF (NEW.role = 'hod' OR OLD.role = 'hod') THEN
      RAISE EXCEPTION 'Unauthorized: HOD appointments and status modifications require institutional administrative provisioning.';
    END IF;

    -- An HOD cannot reassign departments
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
```

### 1.4 Hardened Server-Side Admin Helper ([`lib/supabase/admin.ts`](file:///d:/IT%20Nexus/lib/supabase/admin.ts))
Two explicit security barriers were introduced into [`lib/supabase/admin.ts`](file:///d:/IT%20Nexus/lib/supabase/admin.ts):
1. **Client-Side Import Barrier:**
   ```ts
   if (typeof window !== 'undefined') {
     throw new Error(
       '[Campus Nexus Security] admin.ts cannot be imported or executed in client components. It must remain strictly server-side.'
     );
   }
   ```
   Prevents leaking server keys or administrative functions into the browser bundle.
2. **Requester Authorization Pre-Check:**
   [`assertInstitutionalAdmin()`](file:///d:/IT%20Nexus/lib/supabase/admin.ts#L48-L86) validates the caller's active user session via [`createServerSupabaseClient()`](file:///d:/IT%20Nexus/lib/supabase/server.ts) and verifies that `user.app_metadata.is_institutional_admin === true` before initializing or invoking the service-role client.

---

## 2. Staging Infrastructure Status & Portfolio Backup Audit

### 2.1 Docker Desktop & WSL2 Evaluation
* **WSL2 Check:** `wsl --status` returned:
  ```
  The Windows Subsystem for Linux is not installed. You can install by running 'wsl.exe --install'.
  ```
* **Docker Check:** `docker --version` returned:
  ```
  docker : The term 'docker' is not recognized as the name of a cmdlet, function, script file...
  ```
* **Verdict:** Local Supabase via Docker is **UNAVAILABLE** on this host.

### 2.2 Cloud Project Quota & Portfolio Dependency Review
* **Active Projects:** Supabase organization `kptycrkdnrspoqswpqdb` is capped at the free-tier maximum of 2 active projects:
  1. `ftemxhowpsnfkqxmebhc` ("IT-Nexus", linked production database).
  2. `lmrgaduzrjytlmkewpjg` ("Portfolio", active).
* **Investigation of `Portfolio` Database (`lmrgaduzrjytlmkewpjg`):**
  * Queried table catalog: Contains 11 portfolio tables (`portfolio_content`, `portfolio_projects`, `portfolio_experience`, `portfolio_skills`, `portfolio_certificates`, `portfolio_education`, `portfolio_involvement`, `portfolio_honors`, `portfolio_revisions`, `portfolio_published_view`, `authorized_admins`).
  * Queried live data: Found 7 projects (including "Auto Irrigation System" and "ParkShare India"), 1 experience record, 12 content sections, and custom certificates for **Paridala Yaswanth Kumar**.
  * **Critical Protection:** `Portfolio` is **NOT** an unused placeholder; it is the user's live personal developer profile and portfolio.
* **Non-Destructive Data Preservation:**
  * Extracted full JSON schema and row data backup across all 11 tables.
  * Preserved persistently at [`docs/portfolio_backup_raw.json`](file:///d:/IT%20Nexus/docs/portfolio_backup_raw.json).
  * In strict compliance with instructions (*"Do not delete existing projects or reset production"*), the project was **NOT deleted**.
* **Supabase Project Pausing Limitation:**
  * Supabase CLI (`npx supabase projects`) does not expose a `pause` subcommand (only `list`, `create`, `api-keys`, and `delete`).
  * Pausing a project non-destructively requires a manual click in the Supabase Cloud Console (`Project Settings -> General -> Pause Project`) or an authorized Supabase Management API token.

---

## 3. Comprehensive Security Gate Test Results

All 12 security verification gates were evaluated against the hardened schema logic:

| # | Test Name | Role Under Test | Status | Concrete Execution Evidence / Output |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Student CGPA Tampering** | Student (`TEST_IT`) | **PASS** | `UPDATE public.students SET cgpa = 9.99` rejected: `Unauthorized: Self-modification of official academic records is strictly prohibited.` |
| **2** | **Student Department Tampering** | Student (`TEST_IT`) | **PASS** | `UPDATE public.profiles SET department = 'TEST_CSE'` rejected: `Unauthorized: Self-modification of department, role, or account status is strictly prohibited.` |
| **3** | **Student Self-Promotion to HOD** | Student (`TEST_IT`) | **PASS** | `UPDATE public.profiles SET role = 'hod'` rejected: `Unauthorized: Self-modification of department, role, or account status is strictly prohibited.` |
| **4** | **HOD Self-Department Modification** | HOD (`TEST_IT`) | **PASS** | `UPDATE public.profiles SET department = 'TEST_CSE'` rejected: `Unauthorized: Self-modification of department, role, or account status is strictly prohibited.` |
| **5** | **Cross-Department HOD Access & Isolation** | HOD (`TEST_IT`) | **PASS** | IT HOD attempted to view/update CSE Student: `SELECT count(*)` returned `0`; `UPDATE` returned `ROW_COUNT = 0`. Cross-department access strictly prevented by RLS. |
| **6** | **Direct Ledger Mutation by Student** | Student (`TEST_IT`) | **PASS** | Direct client `INSERT INTO student_learning_activities` rejected: `new row violates row-level security policy for table "student_learning_activities"`. |
| **7** | **Quiz Concurrency & Idempotency** | Student (`TEST_IT`) | **PASS** | Initial pass awarded `25` credits. Immediate retake awarded `0` credits with `already_completed: true`. Ledger row count strictly equals 1. |
| **8** | **Failed Quiz Retry Capability** | Student (`TEST_CSE`) | **PASS** | Failed quiz (0%) logged 0 credits and 0 ledger records. Subsequent passing retry correctly awarded `25` credits and logged 1 ledger record. |
| **9** | **Allowed Personal Profile Updates** | Student (`TEST_IT`) | **PASS** | Legitimate non-academic mutations (`full_name`, `phone`, `bio`, `github_url`) succeeded cleanly without trigger interference. |
| **10** | **Authorized Institutional Provisioning** | Institutional Admin (`service_role`) | **PASS** | Promoted user to faculty, reassigned department, activated account, synchronized `public.faculty`, and generated immutable row in `public.institutional_audit_logs`. |
| **11** | **Unauthorized Provisioning RPC Invocation** | Student (`TEST_CSE`) | **PASS** | Invoking `institutional_provision_profile` rejected by PostgreSQL grant barrier: `permission denied for function institutional_provision_profile`. |
| **12** | **Forged GUC Provisioning Flag Rejection** | Student (`TEST_IT`) | **PASS** | Student executed `SET nexus.institutional_provisioning = 'active'` followed by `UPDATE profiles SET role = 'hod'`. Tampering strictly rejected: `Unauthorized: Self-modification of department, role, or account status is strictly prohibited.` |

---

## 4. Codebase Quality & Type Safety

* **TypeScript Compilation:** `npx tsc --noEmit` -> **PASS** (Exit code `0`, zero errors).
* **Turbopack Production Build:** `npm run build` -> **PASS** (Exit code `0`, compiled all 48 routes in 5.7s + 6.5s).

---

## 5. Release Gate Decision

### Final Status: **NO-GO FOR PRODUCTION**

**Blocker Summary:**
1. **Isolated Persistent Staging Database:** Blocked due to absence of Docker/WSL2 on the host and the 2/2 Supabase Cloud active project limit. The Portfolio project was preserved with a full data backup and not deleted.
2. **Staff Authenticated Acceptance Testing:** Production strictly enforces Google OAuth SSO; no faculty or HOD Google OAuth test identities are provisioned in Google Cloud Console.
3. **Hosting Target Unconfigured:** No production hosting deployment (Vercel, AWS, or Docker container) is linked to the repository.

---

## 6. Single Most Important Next Action

> **In the Supabase Cloud Web Dashboard, temporarily pause the `Portfolio` project (`lmrgaduzrjytlmkewpjg`) — which has been fully backed up to [`docs/portfolio_backup_raw.json`](file:///d:/IT%20Nexus/docs/portfolio_backup_raw.json) — so that a dedicated, persistent staging Supabase project can be created via `npx supabase projects create --name it-nexus-staging` to execute persistent staging migrations and authenticated multi-role QA.**
