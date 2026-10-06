# CAMPUS NEXUS — Security Architecture & RLS Matrix (Phase 2)

This document details the security principles, authorization layers, and Row Level Security (RLS) policies implemented for **Campus Nexus**.

---

## 1. Security Architecture Principles

1. **Defense in Depth**:
   - **Layer 1 (Network / Edge)**: Next.js Edge Middleware intercepts unauthorized route access before rendering server components.
   - **Layer 2 (Application)**: React `<RoleGuard>` protects UI views and checks active user authorization states.
   - **Layer 3 (Database)**: PostgreSQL Row Level Security (RLS) ensures that all data read and write operations are strictly validated against `auth.uid()` and verified database roles.

2. **Zero Secrets in Frontend**:
   - Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are accessible to the browser.
   - Service-role keys are never included in client-side code.

3. **No Client Role Authority**:
   - Client requests cannot dictate or alter user roles.
   - User roles are stored in `public.profiles.role` and protected by the `prevent_role_tampering` trigger.

---

## 2. Row Level Security (RLS) Policy Matrix

| Table | Operation | Policy Name | Permitted Roles / Condition | Description |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | `SELECT` | `profiles_select_own` | `auth.uid() = id` | User can read only their own profile record. |
| `profiles` | `SELECT` | `profiles_select_hod` | `public.is_hod()` | HOD can read department profiles. |
| `profiles` | `UPDATE` | `profiles_update_own` | `auth.uid() = id` | User can update permitted fields on their own profile. |
| `profiles` | `UPDATE` | `profiles_update_hod` | `public.is_hod()` | HOD can update any profile. |
| `students` | `SELECT` | `students_select_own` | `auth.uid() = id` | Student can read their own academic record. |
| `students` | `SELECT` | `students_select_hod` | `public.is_hod()` | HOD can view all student records. |
| `students` | `UPDATE` | `students_update_own` | `auth.uid() = id` | Student can update their own academic record. |
| `students` | `UPDATE` | `students_update_hod` | `public.is_hod()` | HOD can update student records. |
| `faculty`  | `SELECT` | `faculty_select_own`  | `auth.uid() = id` | Faculty can read their own faculty record. |
| `faculty`  | `SELECT` | `faculty_select_hod`  | `public.is_hod()` | HOD can view all faculty records. |
| `faculty`  | `UPDATE` | `faculty_update_own`  | `auth.uid() = id` | Faculty can update their own faculty record. |
| `faculty`  | `UPDATE` | `faculty_update_hod`  | `public.is_hod()` | HOD can update faculty records. |

---

## 3. Privacy & Access Controls for Phase 2

- **Faculty Access to Students**:
  - In Phase 2, faculty do **not** have unrestricted access to all student records.
  - Faculty can view/edit only their own profile and faculty record.
  - When the `mentor_assignments` table is implemented in Phase 3, faculty access to student information will be scoped strictly to their assigned mentees.

- **Personal Data Protection**:
  - Personal contact data (`phone`, etc.) is protected by RLS; normal users cannot query arbitrary profiles.

---

## 4. Recursive RLS Prevention

To prevent infinite recursion when checking roles in RLS policies, role determination uses `SECURITY DEFINER` helper functions with explicit search paths:

```sql
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_hod()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'hod' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
```
