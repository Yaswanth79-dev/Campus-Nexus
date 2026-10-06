-- ==============================================================================
-- CAMPUS NEXUS — Phase 7 & 8: Seed Demo Data & Comms Automation
-- ==============================================================================
-- Description: Seeds initial learning catalog, sample departmental announcements,
--              opportunity drives, academic syllabus resources, and an automated
--              trigger for broadcasting in-app notifications.
-- ==============================================================================

-- 1. SEED LEARNING MODULES CATALOG
INSERT INTO public.learning_modules (title, category, topic, difficulty, credits_reward, description, estimated_time, is_active)
VALUES
  ('Python Core: Data Structures & Algorithms', 'Programming', 'Python', 'Intermediate', 50, 'Master lists, dictionaries, sets, binary search trees, and graph algorithms in Python 3.', '45 mins', true),
  ('Full-Stack Web Development with React & Next.js', 'Course', 'Web Development', 'Intermediate', 30, 'Production architectures, App Router patterns, Server Components, and SSR.', '60 mins', true),
  ('SQL Query Optimization & Database Indexing', 'Quiz', 'SQL / Database', 'Advanced', 20, 'Index types, EXPLAIN query plans, B-Tree vs Hash indexing, and multi-table joins.', '25 mins', true),
  ('Cloud Architecture on AWS / Azure', 'Course', 'Cloud & DevOps', 'Beginner', 30, 'Virtual networks, IAM security policies, serverless lambdas, and container orchestration.', '40 mins', true),
  ('Machine Learning Foundations: Regression & Classification', 'Test', 'AI / Machine Learning', 'Advanced', 50, 'Model evaluation metrics, precision-recall tradeoffs, regularization, and gradient descent.', '50 mins', true),
  ('Data Structures: Dynamic Programming Challenge', 'Practice', 'DSA', 'Advanced', 50, 'Knapsack problems, longest common subsequences, memoization, and tabulations.', '45 mins', true)
ON CONFLICT DO NOTHING;

-- 2. SEED SAMPLE DEPARTMENT ANNOUNCEMENTS (Across IT, CSE, ECE)
INSERT INTO public.department_announcements (department, title, content, target_roles, is_pinned)
VALUES
  ('IT', 'Official Notice: Capstone Project Phase-2 Review Schedule', 'All 4th-year B.Tech IT students must submit their Phase-2 system architecture documents and code repositories to their assigned faculty mentors before Friday.', ARRAY['student', 'faculty'], true),
  ('IT', 'Campus Placement Drive: Top Tier-1 Tech Companies Registration', 'Online registration is now open for students with CGPA >= 7.5 and 0 active backlogs. Verify your profile links and resume on Campus Nexus.', ARRAY['student'], false),
  ('CSE', 'CSE Department Workshop: Distributed Systems & Microservices', 'Hands-on lab session scheduled this Saturday at Computer Lab 3 on Kubernetes container orchestration.', ARRAY['student', 'faculty'], true),
  ('ECE', 'VLSI Design & Embedded IoT Systems Guest Lecture', 'Distinguished industry session on FPGA verification protocols in Semiconductor Block Auditorium.', ARRAY['student', 'faculty'], true)
ON CONFLICT DO NOTHING;

-- 3. SEED SAMPLE OPPORTUNITIES & INTERNSHIP DRIVES
INSERT INTO public.opportunities (department, title, type, company_or_org, description, deadline, is_active)
VALUES
  ('IT', 'Summer 2026 AI Research Fellowship', 'Research', 'Microsoft Research India', 'Paid 3-month research internship in natural language processing and computer vision. CGPA >= 8.0 required.', (now() + interval '30 days')::date::text, true),
  ('IT', 'National Smart India Hackathon 2026', 'Hackathon', 'Ministry of Education & AICTE', 'Build innovative software and hardware solutions for real-world government problem statements.', (now() + interval '20 days')::date::text, true),
  (NULL, 'Global Cloud Engineering Internship Program', 'Internship', 'Amazon Web Services (AWS)', 'Full-stack cloud engineering and distributed infrastructure engineering roles open for 3rd and 4th year students.', (now() + interval '45 days')::date::text, true),
  ('CSE', 'Google Summer of Code Mentorship', 'Competition', 'Open Source Community', 'Contribute to open source production codebases under global senior engineer mentorship.', (now() + interval '15 days')::date::text, true)
ON CONFLICT DO NOTHING;

-- 4. SEED SAMPLE DEPARTMENT ACADEMIC RESOURCES
INSERT INTO public.department_resources (department, title, category, subject, semester, file_url, description)
VALUES
  ('IT', 'B.Tech IT Scheme of Instruction & Full Curriculum', 'Syllabus', 'Core Curriculum', 6, 'https://drive.google.com/file/d/sample-syllabus/view', 'Complete autonomous syllabus, course outcomes (COs), and program outcomes (POs) mapping for IT.'),
  ('IT', 'Unit 3: Distributed System Consensus Protocols (Raft & Paxos)', 'Lecture Notes', 'Distributed Systems', 6, 'https://drive.google.com/file/d/sample-lecture-notes/view', 'Detailed lecture notes on distributed state machines, leader elections, and fault-tolerant log replication.'),
  ('IT', 'Web Development & Cloud Computing Lab Manual', 'Lab Manual', 'Cloud & Web Lab', 6, 'https://drive.google.com/file/d/sample-lab-manual/view', 'Laboratory exercises covering Next.js, RESTful APIs, Supabase Auth, and container deployments.'),
  ('CSE', 'Advanced Computer Architecture Notes', 'Lecture Notes', 'Computer Architecture', 5, 'https://drive.google.com/file/d/sample-cse-notes/view', 'Pipelining, hazard resolution, and memory hierarchy.'),
  ('ECE', 'Digital Signal Processing Reference Manual', 'Reference Book', 'DSP', 5, 'https://drive.google.com/file/d/sample-ece-notes/view', 'Fourier transforms, FFT algorithms, and FIR/IIR filter design.')
ON CONFLICT DO NOTHING;
