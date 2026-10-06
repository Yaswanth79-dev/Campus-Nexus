# CAMPUS NEXUS — Authentication & Session Architecture (Phase 2)

This document describes the authentication flow, session handling, account provisioning, and test accounts for **Campus Nexus**.

---

## 1. Authentication Flow

Campus Nexus uses **Supabase Auth** exclusively for identity verification and credential management.

```
+-------------------------------------------------------------------+
| 1. User enters Email & Password on /login                         |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| 2. Supabase Auth validates credentials via signInWithPassword     |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| 3. Application queries public.profiles for user ID                |
+-------------------------------------------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
    [is_active = false]                         [is_active = true]
            |                                           |
            v                                           v
+-----------------------+               +-------------------------------+
| Sign out immediately  |               | Query students/faculty child  |
| Display deactivation  |               | Hydrate profile in AuthContext|
| notice to user        |               | Sync edge cookies             |
+-----------------------+               +-------------------------------+
                                                        |
                                                        v
                                        +-------------------------------+
                                        | Redirect to Role Dashboard:   |
                                        | - student: /student/dashboard |
                                        | - faculty: /faculty/dashboard |
                                        | - hod: /hod/dashboard         |
                                        +-------------------------------+
```

---

## 2. Role Determination & Agnostic Login

- **Zero Role Selectors**: The user does not select their role on the login page.
- **Database Authority**: The user's role is stored exclusively in `public.profiles.role` (set during account provisioning by the department administrator).
- **Anti-Tampering**: Ordinary users cannot alter their role through client requests; the database trigger `prevent_role_tampering` rejects non-HOD role modifications.

---

## 3. Account Provisioning Workflow

Campus Nexus is an internal college department portal without unrestricted public registration:

1. **Account Creation**: The Head of Department or authorized administrator creates an account in Supabase Dashboard (or via Admin API).
2. **Metadata Assignment**: When adding the user, the administrator includes initial metadata:
   ```json
   {
     "role": "student",
     "full_name": "Student Full Name",
     "roll_number": "21IT001",
     "department": "IT"
   }
   ```
3. **Automated Trigger**: The PostgreSQL trigger `handle_new_user()` creates the `public.profiles` row and the corresponding `public.students` or `public.faculty` row automatically.

---

## 4. Deactivated Accounts (`is_active = false`)

- If an account has `is_active = false` in `public.profiles`, the sign-in attempt is rejected.
- The session is terminated immediately, cookies are purged, and the user receives the message:
  > *"Your account has been deactivated. Please contact the department."*

---

## 5. Development Test Accounts

For local development and evaluation, create the following test accounts in your Supabase Dashboard (**Authentication -> Users -> Add User**):

### 5.1 Student Test Account
- **Email**: `student@example.com`
- **Password**: *(Set a secure password for your local testing)*
- **User Metadata (JSON)**:
  ```json
  {
    "role": "student",
    "full_name": "Alex Chen",
    "roll_number": "21IT042",
    "department": "IT"
  }
  ```

### 5.2 Faculty Test Account
- **Email**: `faculty@example.com`
- **Password**: *(Set a secure password for your local testing)*
- **User Metadata (JSON)**:
  ```json
  {
    "role": "faculty",
    "full_name": "Dr. Sarah Jenkins",
    "employee_id": "IT-FAC-014",
    "designation": "Associate Professor",
    "department": "IT"
  }
  ```

### 5.3 HOD Test Account
- **Email**: `hod@example.com`
- **Password**: *(Set a secure password for your local testing)*
- **User Metadata (JSON)**:
  ```json
  {
    "role": "hod",
    "full_name": "Prof. David Vance, Ph.D.",
    "department": "IT"
  }
  ```

---

## 6. Password Recovery

- The `/login` page includes a **Forgot Password** modal.
- Users input their institutional email address.
- `supabase.auth.resetPasswordForEmail()` sends recovery instructions with a secure redirect link to `/auth/callback?type=recovery`.
