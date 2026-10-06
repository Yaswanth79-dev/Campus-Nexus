# CAMPUS NEXUS — Database Architecture (Phase 2)

This document describes the PostgreSQL database schema, tables, triggers, indexes, and Row Level Security (RLS) policies implemented for **Campus Nexus**.

---

## 1. Schema Overview

Phase 2 establishes the core authentication, profile, and role infrastructure.

```
                  +-------------------------+
                  |       auth.users        |
                  +-------------------------+
                               |
                               | (1:1 ON DELETE CASCADE)
                               v
                  +-------------------------+
                  |     public.profiles     |
                  +-------------------------+
                               |
             +-----------------+-----------------+
             | (1:1 if role='student')          | (1:1 if role='faculty')
             v                                   v
+-------------------------+         +-------------------------+
|     public.students     |         |     public.faculty      |
+-------------------------+         +-------------------------+
```

---

## 2. PostgreSQL Enums

### `public.user_role`
Canonical role enumeration for Campus Nexus users:
- `'student'`: IT Department students.
- `'faculty'`: Faculty members and academic mentors.
- `'hod'`: Head of Department and administrative governance.

---

## 3. Core Database Tables

### 3.1 `public.profiles`
Stores application-level user details associated with `auth.users`.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Supabase Auth user ID |
| `full_name` | `TEXT` | `NOT NULL` | User's full display name |
| `email` | `TEXT` | `NOT NULL` | Institutional email address |
| `role` | `public.user_role` | `NOT NULL`, `DEFAULT 'student'` | Assigned user role |
| `avatar_url` | `TEXT` | `NULLABLE` | Optional profile image URL |
| `phone` | `TEXT` | `NULLABLE` | Contact phone number |
| `department` | `TEXT` | `NOT NULL`, `DEFAULT 'IT'` | Department name |
| `is_active` | `BOOLEAN` | `NOT NULL`, `DEFAULT true` | Account active flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Record last update timestamp |

### 3.2 `public.students`
Extends `public.profiles` for student-specific academic information.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `REFERENCES public.profiles(id) ON DELETE CASCADE` | Profile ID |
| `roll_number` | `TEXT` | `UNIQUE`, `NULLABLE` | Student registration / roll number |
| `year` | `INTEGER` | `NULLABLE` | Current study year (1 to 4) |
| `section` | `TEXT` | `NULLABLE` | Class section (e.g., 'A', 'B') |
| `branch` | `TEXT` | `NOT NULL`, `DEFAULT 'IT'` | Academic branch |
| `semester` | `INTEGER` | `NULLABLE` | Current semester (1 to 8) |
| `cgpa` | `NUMERIC(4,2)` | `NULLABLE` | Cumulative grade point average |
| `career_goal` | `TEXT` | `NULLABLE` | Target industry role or aspiration |
| `github_url` | `TEXT` | `NULLABLE` | Public GitHub profile URL |
| `linkedin_url` | `TEXT` | `NULLABLE` | LinkedIn profile URL |
| `portfolio_url`| `TEXT` | `NULLABLE` | Portfolio website URL |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Record last update timestamp |

### 3.3 `public.faculty`
Extends `public.profiles` for faculty-specific academic information.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `REFERENCES public.profiles(id) ON DELETE CASCADE` | Profile ID |
| `employee_id` | `TEXT` | `UNIQUE`, `NULLABLE` | Institutional employee ID |
| `designation` | `TEXT` | `NULLABLE` | Academic designation (e.g., 'Associate Professor') |
| `specialization`| `TEXT`| `NULLABLE` | Domain specialization (e.g., 'Cloud Computing') |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Record last update timestamp |

---

## 4. Performance Indexes

- `idx_profiles_role`: Accelerates role-based queries (`public.profiles.role`).
- `idx_profiles_email`: Speeds up email lookups (`public.profiles.email`).
- `idx_profiles_is_active`: Optimizes account status verification (`public.profiles.is_active`).
- `idx_students_roll_number`: Ensures rapid student roll number lookups.
- `idx_faculty_employee_id`: Ensures rapid faculty employee ID lookups.

---

## 5. Security & Trigger Functions

### 5.1 `public.handle_updated_at()`
Automatically updates the `updated_at` column to `now()` on every row modification for `profiles`, `students`, and `faculty`.

### 5.2 `public.get_auth_role()`
A `SECURITY DEFINER` function with `SET search_path = public` that safely retrieves the current user's role from `public.profiles`. Prevents infinite recursion when used inside RLS policies.

### 5.3 `public.is_hod()`
A `SECURITY DEFINER` function that returns `true` if the currently authenticated user has `role = 'hod'`.

### 5.4 `public.handle_new_user()`
Trigger on `auth.users` insert that:
1. Extracts `full_name`, `department`, and `role` from `raw_user_meta_data`.
2. Inserts a row into `public.profiles`.
3. **Conditionally** creates a child record:
   - If `role = 'student'`, inserts a stub into `public.students`.
   - If `role = 'faculty'`, inserts a stub into `public.faculty`.
   - If `role = 'hod'`, creates no child record.

### 5.5 `public.prevent_role_tampering()`
Trigger on `public.profiles` before UPDATE that rejects any attempt by a non-HOD user to alter `role` or `is_active`.

---

## 6. Row Level Security (RLS) Policies

All core tables have Row Level Security enabled (`ENABLE ROW LEVEL SECURITY`).

### `public.profiles`
- **`profiles_select_own`**: `auth.uid() = id` (User reads own profile).
- **`profiles_select_hod`**: `public.is_hod()` (HOD reads all department profiles).
- **`profiles_update_own`**: `auth.uid() = id` (User updates own profile details).
- **`profiles_update_hod`**: `public.is_hod()` (HOD updates any profile).

### `public.students`
- **`students_select_own`**: `auth.uid() = id` (Student reads own academic record).
- **`students_select_hod`**: `public.is_hod()` (HOD reads all student records).
- **`students_update_own`**: `auth.uid() = id` (Student updates own academic record).
- **`students_update_hod`**: `public.is_hod()` (HOD updates student records).

### `public.faculty`
- **`faculty_select_own`**: `auth.uid() = id` (Faculty reads own faculty record).
- **`faculty_select_hod`**: `public.is_hod()` (HOD reads all faculty records).
- **`faculty_update_own`**: `auth.uid() = id` (Faculty updates own faculty record).
- **`faculty_update_hod`**: `public.is_hod()` (HOD updates faculty records).

---

## 7. Migration Execution Guide

To apply migrations to your Supabase project:
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to **SQL Editor**.
3. Copy and run the contents of [`supabase/migrations/20260820000001_create_core_schema.sql`](file:///d:/IT%20Nexus/supabase/migrations/20260820000001_create_core_schema.sql).
