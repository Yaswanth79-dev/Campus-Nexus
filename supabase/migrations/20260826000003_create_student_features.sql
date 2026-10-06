-- ==============================================================================
-- CAMPUS NEXUS — Phase 2 & 3 Features Migration
-- ==============================================================================
-- Description: Creates all feature tables for Student Portal, Learning Hub,
--              Credits System, Feedback/Grievances, Opportunities, Innovation,
--              Resources, and Announcements with Row Level Security (RLS).
-- Run AFTER: 20260826000002_expand_profiles_schema.sql
-- ==============================================================================

-- 1. Student Skills Table
CREATE TABLE IF NOT EXISTS public.student_skills (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  skill_name    TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN (
    'Programming Languages', 'Web Development', 'App Development',
    'AI / ML', 'Cloud & DevOps', 'Cybersecurity', 'Data Science',
    'Database', 'UI/UX Design', 'Other'
  )),
  proficiency   TEXT NOT NULL CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  is_endorsed   BOOLEAN NOT NULL DEFAULT false,
  endorsed_by   UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Student Projects Table
CREATE TABLE IF NOT EXISTS public.student_projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  technologies     TEXT[] NOT NULL DEFAULT '{}',
  github_url       TEXT,
  demo_url         TEXT,
  team_members     TEXT,
  status           TEXT NOT NULL CHECK (status IN ('Planning', 'In Progress', 'Completed')) DEFAULT 'In Progress',
  faculty_feedback TEXT,
  is_reviewed      BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Student Certifications Table
CREATE TABLE IF NOT EXISTS public.student_certifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  issuing_organization  TEXT NOT NULL,
  issue_date            DATE,
  expiry_date           DATE,
  credential_id         TEXT,
  credential_url        TEXT,
  certificate_file_url  TEXT,
  is_verified           BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Student Achievements Table
CREATE TABLE IF NOT EXISTS public.student_achievements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  category          TEXT NOT NULL CHECK (category IN ('Hackathon', 'Competition', 'Award', 'Workshop', 'Publication', 'Other')),
  achievement_date  DATE,
  description       TEXT,
  proof_url         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Student Internships Table
CREATE TABLE IF NOT EXISTS public.student_internships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  company_name      TEXT NOT NULL,
  role_title        TEXT NOT NULL,
  internship_type   TEXT CHECK (internship_type IN ('Summer', 'Winter', 'Full-Semester', 'Virtual', 'Part-Time')),
  start_date        DATE,
  end_date          DATE,
  status            TEXT NOT NULL CHECK (status IN ('Applied', 'Interview', 'Offered', 'Active', 'Completed', 'Rejected')) DEFAULT 'Applied',
  stipend           TEXT,
  certificate_url   TEXT,
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Learning Catalog (Curated courses, tests, quizzes)
CREATE TABLE IF NOT EXISTS public.learning_modules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('Programming', 'Practice', 'Course', 'Quiz', 'Test')),
  topic           TEXT NOT NULL, -- e.g. 'Python', 'Java', 'DSA', 'SQL', 'Web Development', 'Cloud', 'AI/ML'
  difficulty      TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Beginner',
  credits_reward  INTEGER NOT NULL DEFAULT 10,
  external_url    TEXT,
  description     TEXT,
  estimated_time  TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Student Learning Activities & Credits Ledger
CREATE TABLE IF NOT EXISTS public.student_learning_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  module_id       UUID REFERENCES public.learning_modules(id) ON DELETE SET NULL,
  module_title    TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('Programming', 'Practice', 'Course', 'Quiz', 'Test')),
  topic           TEXT NOT NULL,
  score           INTEGER CHECK (score >= 0 AND score <= 100),
  credits_earned  INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL CHECK (status IN ('In Progress', 'Completed')) DEFAULT 'In Progress',
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Feedback & Grievance System
CREATE TABLE IF NOT EXISTS public.feedback_grievances (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  category            TEXT NOT NULL CHECK (category IN ('Suggestion', 'Complaint', 'Academic Concern', 'Department Concern', 'Mentoring', 'Infrastructure', 'Other')),
  target_role         TEXT NOT NULL CHECK (target_role IN ('faculty', 'hod', 'both')),
  target_faculty_id   UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  department          TEXT NOT NULL REFERENCES public.departments(code) ON UPDATE CASCADE,
  status              TEXT NOT NULL CHECK (status IN ('Submitted', 'Under Review', 'Resolved', 'Escalated')) DEFAULT 'Submitted',
  response            TEXT,
  responded_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  responded_at        TIMESTAMPTZ,
  is_private_to_hod   BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Department Announcements
CREATE TABLE IF NOT EXISTS public.department_announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department    TEXT NOT NULL REFERENCES public.departments(code) ON UPDATE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  author_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_roles  TEXT[] NOT NULL DEFAULT '{"student", "faculty"}',
  is_pinned     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Opportunities Hub (Internships, Hackathons, Research drives)
CREATE TABLE IF NOT EXISTS public.opportunities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department        TEXT REFERENCES public.departments(code) ON UPDATE CASCADE, -- null means open to all depts
  title             TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('Internship', 'Hackathon', 'Research', 'Scholarship', 'Workshop', 'Competition', 'Job')),
  company_or_org    TEXT NOT NULL,
  description       TEXT NOT NULL,
  link_url          TEXT,
  deadline          DATE,
  posted_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Innovation Hub (Student Ideas & Projects)
CREATE TABLE IF NOT EXISTS public.innovation_ideas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  domain            TEXT NOT NULL,
  description       TEXT NOT NULL,
  tech_stack        TEXT[] NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL CHECK (status IN ('Under Review', 'Approved', 'Needs Refinement', 'Rejected')) DEFAULT 'Under Review',
  faculty_mentor_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  faculty_feedback  TEXT,
  votes_count       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Department Learning & Academic Resources
CREATE TABLE IF NOT EXISTS public.department_resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department    TEXT NOT NULL REFERENCES public.departments(code) ON UPDATE CASCADE,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('Syllabus', 'Lecture Notes', 'Lab Manual', 'Reference Book', 'E-Learning', 'Past Papers', 'Other')),
  file_url      TEXT NOT NULL,
  description   TEXT,
  semester      INTEGER,
  subject       TEXT,
  uploaded_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('academic', 'mentoring', 'opportunity', 'feedback', 'system', 'learning')) DEFAULT 'system',
  link_url      TEXT,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all feature tables
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innovation_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- 1. Student Skills Policies
CREATE POLICY "skills_student_all" ON public.student_skills
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "skills_faculty_same_dept_select" ON public.student_skills
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod') AND public.is_same_department(student_id));

-- 2. Student Projects Policies
CREATE POLICY "projects_student_all" ON public.student_projects
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "projects_faculty_same_dept_select" ON public.student_projects
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod') AND public.is_same_department(student_id));

CREATE POLICY "projects_faculty_update_feedback" ON public.student_projects
  FOR UPDATE TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod') AND public.is_same_department(student_id));

-- 3. Student Certifications Policies
CREATE POLICY "certifications_student_all" ON public.student_certifications
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "certifications_faculty_same_dept_select" ON public.student_certifications
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod') AND public.is_same_department(student_id));

-- 4. Student Achievements Policies
CREATE POLICY "achievements_student_all" ON public.student_achievements
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "achievements_faculty_same_dept_select" ON public.student_achievements
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod') AND public.is_same_department(student_id));

-- 5. Student Internships Policies
CREATE POLICY "internships_student_all" ON public.student_internships
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "internships_faculty_same_dept_select" ON public.student_internships
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod') AND public.is_same_department(student_id));

-- 6. Learning Modules Policies (Public read for all authenticated users)
CREATE POLICY "learning_modules_select" ON public.learning_modules
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "learning_modules_manage_faculty" ON public.learning_modules
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod'))
  WITH CHECK (public.get_auth_role() IN ('faculty', 'hod'));

-- 7. Student Learning Activities Policies
CREATE POLICY "learning_activities_student_all" ON public.student_learning_activities
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "learning_activities_faculty_same_dept_select" ON public.student_learning_activities
  FOR SELECT TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod') AND public.is_same_department(student_id));

-- 8. Feedback / Grievances Policies
CREATE POLICY "feedback_student_all" ON public.feedback_grievances
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- HOD can see all grievances in their department
CREATE POLICY "feedback_hod_select" ON public.feedback_grievances
  FOR SELECT TO authenticated
  USING (public.is_hod() AND department = public.get_user_department());

CREATE POLICY "feedback_hod_update" ON public.feedback_grievances
  FOR UPDATE TO authenticated
  USING (public.is_hod() AND department = public.get_user_department());

-- Faculty can see grievances targeted to faculty/both in same dept, UNLESS private to HOD or against them
CREATE POLICY "feedback_faculty_select" ON public.feedback_grievances
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role() = 'faculty'
    AND department = public.get_user_department()
    AND is_private_to_hod = false
    AND (target_role IN ('faculty', 'both') OR target_faculty_id = auth.uid())
  );

CREATE POLICY "feedback_faculty_update" ON public.feedback_grievances
  FOR UPDATE TO authenticated
  USING (
    public.get_auth_role() = 'faculty'
    AND department = public.get_user_department()
    AND is_private_to_hod = false
    AND (target_role IN ('faculty', 'both') OR target_faculty_id = auth.uid())
  );

-- 9. Department Announcements Policies
CREATE POLICY "announcements_select_same_dept" ON public.department_announcements
  FOR SELECT TO authenticated
  USING (department = public.get_user_department());

CREATE POLICY "announcements_manage_faculty" ON public.department_announcements
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod') AND department = public.get_user_department())
  WITH CHECK (public.get_auth_role() IN ('faculty', 'hod') AND department = public.get_user_department());

-- 10. Opportunities Policies
CREATE POLICY "opportunities_select" ON public.opportunities
  FOR SELECT TO authenticated
  USING (is_active = true AND (department IS NULL OR department = public.get_user_department()));

CREATE POLICY "opportunities_manage_faculty" ON public.opportunities
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod'))
  WITH CHECK (public.get_auth_role() IN ('faculty', 'hod'));

-- 11. Innovation Ideas Policies
CREATE POLICY "innovation_select_same_dept" ON public.innovation_ideas
  FOR SELECT TO authenticated
  USING (public.is_same_department(student_id));

CREATE POLICY "innovation_student_manage" ON public.innovation_ideas
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "innovation_faculty_review" ON public.innovation_ideas
  FOR UPDATE TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod') AND public.is_same_department(student_id));

-- 12. Department Resources Policies
CREATE POLICY "resources_select_same_dept" ON public.department_resources
  FOR SELECT TO authenticated
  USING (department = public.get_user_department());

CREATE POLICY "resources_manage_faculty" ON public.department_resources
  FOR ALL TO authenticated
  USING (public.get_auth_role() IN ('faculty', 'hod') AND department = public.get_user_department())
  WITH CHECK (public.get_auth_role() IN ('faculty', 'hod') AND department = public.get_user_department());

-- 13. User Notifications Policies
CREATE POLICY "notifications_user_all" ON public.user_notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- SEED INITIAL LEARNING CATALOG
-- ==============================================================================
INSERT INTO public.learning_modules (title, category, topic, difficulty, credits_reward, external_url, description, estimated_time) VALUES
  ('Python Core Fundamentals Test', 'Test', 'Python', 'Beginner', 10, 'https://leetcode.com/problemset/all/?topicSlugs=python', 'Test your knowledge on Python syntax, data types, loops, and OOP concepts.', '30 mins'),
  ('Data Structures in C++ (Arrays & Linked Lists)', 'Practice', 'DSA', 'Beginner', 15, 'https://leetcode.com/tag/array/', 'Hands-on practice problems implementing linear data structures in C++.', '45 mins'),
  ('Intermediate Python & Algorithms Assessment', 'Test', 'Python', 'Intermediate', 20, 'https://leetcode.com/tag/dynamic-programming/', 'Assessment on recursion, generators, time complexity, and sorting algorithms.', '60 mins'),
  ('Full-Stack React & Next.js Masterclass', 'Course', 'Web Development', 'Intermediate', 50, 'https://nextjs.org/learn', 'End-to-end development of modern web applications using Next.js App Router and PostgreSQL.', '4 hours'),
  ('SQL & Database Schema Design Quiz', 'Quiz', 'SQL', 'Beginner', 10, 'https://sqlzoo.net', 'Interactive quiz on SELECT queries, JOIN operations, GROUP BY, and indexing.', '20 mins'),
  ('Advanced Trees, Graphs & Dynamic Programming', 'Test', 'DSA', 'Advanced', 30, 'https://leetcode.com/tag/graph/', 'Complex algorithmic problem-solving for coding interviews and competitive programming.', '90 mins'),
  ('Cloud Foundations with AWS', 'Course', 'Cloud', 'Beginner', 50, 'https://aws.amazon.com/training/', 'Introduction to EC2, S3, IAM, VPC, and serverless architectures.', '3 hours'),
  ('REST API & Backend Architecture in Node.js', 'Course', 'Web Development', 'Intermediate', 50, 'https://nodejs.org/docs', 'Design robust RESTful APIs with authentication, middleware, and database connections.', '3.5 hours'),
  ('AI & Machine Learning Foundations in Python', 'Course', 'AI/ML', 'Intermediate', 50, 'https://scikit-learn.org', 'Regression, classification, neural networks, and model evaluation techniques.', '5 hours'),
  ('Java Object-Oriented Programming Assessment', 'Test', 'Java', 'Beginner', 10, 'https://dev.java/learn/', 'Comprehensive test covering inheritance, polymorphism, interfaces, and exception handling.', '40 mins')
ON CONFLICT DO NOTHING;
