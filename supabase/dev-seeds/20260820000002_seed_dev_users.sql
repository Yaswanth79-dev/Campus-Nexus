-- ==============================================================================
-- CAMPUS NEXUS - Development Seed Migration
-- ==============================================================================
-- Description: Instructions and helper statements for provisioning local/dev test
--              accounts for Student, Faculty, and HOD roles.
-- Note: In production Supabase, users should be created via Supabase Auth Admin
--       API or Supabase Dashboard (Authentication -> Users -> Add User).
-- ==============================================================================

-- ==============================================================================
-- METHOD A: CREATE USERS VIA SUPABASE DASHBOARD (RECOMMENDED)
-- ==============================================================================
-- 1. Open Supabase Dashboard -> Authentication -> Users.
-- 2. Click "Add User" -> "Create User".
-- 3. Enter Email & Password:
--    a. student@example.com
--       User Metadata JSON:
--       {
--         "role": "student",
--         "full_name": "Alex Chen",
--         "roll_number": "21IT042",
--         "department": "IT"
--       }
--
--    b. faculty@example.com
--       User Metadata JSON:
--       {
--         "role": "faculty",
--         "full_name": "Dr. Sarah Jenkins",
--         "employee_id": "IT-FAC-014",
--         "designation": "Associate Professor",
--         "department": "IT"
--       }
--
--    c. hod@example.com
--       User Metadata JSON:
--       {
--         "role": "hod",
--         "full_name": "Prof. David Vance, Ph.D.",
--         "department": "IT"
--       }
--
-- 4. The `on_auth_user_created` trigger will automatically insert the user into `public.profiles`
--    and the appropriate child table (`public.students` or `public.faculty`).
-- ==============================================================================

-- ==============================================================================
-- METHOD B: DIRECT SQL SEED (FOR LOCAL SUPABASE CLI ENVIRONMENTS)
-- ==============================================================================
-- Note: Only execute this block if running Supabase CLI locally where pgcrypto
--       and auth.users table writes are permitted in local migrations.

DO $$
BEGIN
  -- Check if auth.users exists (standard Supabase environment)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    
    -- Ensure pgcrypto extension is available for password hashing
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

  END IF;
END $$;
