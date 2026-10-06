# Campus Nexus — Complete Project Workflow Reference

> **Last updated:** August 2026
> **Status:** Active Reference — update whenever the workflow changes
> **Purpose:** Single source of truth for the entire project vision, architecture, and feature scope

---

## Table of Contents

1. [Core Concept](#1-core-concept)
2. [The Golden Rule](#2-the-golden-rule)
3. [Login Workflow](#3-login-workflow)
4. [User Profile Structure](#4-user-profile-structure)
5. [Role + Department Security Model](#5-role--department-security-model)
6. [Department Isolation](#6-department-isolation)
7. [Student Portal](#7-student-portal)
8. [Faculty Portal](#8-faculty-portal)
9. [HOD Portal](#9-hod-portal)
10. [Learning Hub & Credits System](#10-learning-hub--credits-system)
11. [Cross-Role Visibility Rules](#11-cross-role-visibility-rules)
12. [Feedback & Grievance Workflow](#12-feedback--grievance-workflow)
13. [Complete User Journeys](#13-complete-user-journeys)
14. [Phased Build Plan](#14-phased-build-plan)
15. [Key Technical Decisions](#15-key-technical-decisions)

---

## 1. Core Concept

**Campus Nexus** is a centralized college platform connecting Students, Faculty, and HODs across all departments through role-specific portals.

### The Architectural Principle

> **One application. One portal design. Data and permissions personalized by Role + Department + User ID.**

The system does NOT create separate portals per department:

```
WRONG APPROACH              CORRECT APPROACH
──────────────              ────────────────
IT Portal                          CAMPUS NEXUS
CSE Portal                              │
ECE Portal              ┌───────────────┼───────────────┐
                        ↓               ↓               ↓
                     STUDENT         FACULTY           HOD
                        │               │               │
                        └───────────────┼───────────────┘
                                        │
                                   USER PROFILE
                                        │
                               ┌────────┴────────┐
                               ↓                 ↓
                             ROLE            DEPARTMENT
```

A user never selects their department at login. The department is stored in their authenticated profile and automatically determines what data they see.

---

## 2. The Golden Rule

```
The portal UI is common.
The data and permissions are personalized by:

  Role  +  Department  +  User ID
```

If tomorrow the college adds a new department (e.g., MECH), no new portal is built.
The department is added to the database — the application handles it automatically.

---

## 3. Login Workflow

Everyone enters through the same Campus Nexus login page.
There is no role selector or department selector at login.

```
            CAMPUS NEXUS
                 │
               LOGIN
         (single entry point)
                 │
         Authenticate User
                 │
      Fetch role from user profile
                 │
     ┌───────────┼───────────┐
     ↓           ↓           ↓
  STUDENT     FACULTY       HOD
     │           │           │
     ↓           ↓           ↓
/student/    /faculty/    /hod/
dashboard    dashboard    dashboard
```

### Forgot Password Flow

```
Login Page → "Forgot Password" link
      │
      ↓
Enter institutional email
      │
      ↓
Supabase sends reset link to email
      │
      ↓
User clicks link → /reset-password page
      │
      ↓
Enter new password → Confirm
      │
      ↓
Redirected to /login → Login with new password
```

---

## 4. User Profile Structure

Every authenticated user has a profile with at minimum:

| Field          | Description                                  |
| :------------- | :------------------------------------------- |
| User ID        | Unique identifier (Supabase UUID)            |
| Full Name      | Display name                                 |
| Email          | Institutional email                          |
| Role           | student / faculty / hod                      |
| Department     | IT / CSE / ECE / EEE / MECH / CIVIL / etc.  |
| Profile Photo  | Avatar URL                                   |
| Account Status | active / inactive                            |

### Profile Examples

```
Yashwanth Kumar       Dr. Rahul Kumar       Dr. Priya Sharma
Role: Student         Role: Faculty         Role: HOD
Dept: IT              Dept: CSE             Dept: ECE
```

The role + department combination controls everything the user can access.

---

## 5. Role + Department Security Model

```
AUTHENTICATED USER
       │
       ↓
   [ ROLE CHECK ]
       │
 ┌─────┼─────┐
 ↓     ↓     ↓
STU   FAC   HOD
       │
       ↓
[ DEPARTMENT CHECK ]
       │
       ↓
  DATA ACCESS


Student (IT, ID=X)
  → Own private data only
  → Permitted public faculty/HOD info
  → IT-relevant announcements

Faculty (IT)
  → Own profile
  → IT students within assigned scope
  → Mentoring data
  → IT department info

HOD (IT)
  → All IT students
  → All IT faculty
  → IT analytics
  → IT complaints + management
```

> IMPORTANT: Security enforcement must happen at the database level via
> Supabase Row Level Security (RLS), not just by hiding buttons in the UI.

---

## 6. Department Isolation

This is a critical security requirement for all three roles.

### HOD Isolation

```
IT HOD CAN SEE:             IT HOD CANNOT SEE:
────────────────            ──────────────────
IT Students    ✅           CSE Students   ❌
IT Faculty     ✅           ECE Students   ❌
IT Projects    ✅           EEE Faculty    ❌
IT Analytics   ✅           MECH Data      ❌

CSE HOD CAN SEE:
────────────────
CSE Students   ✅
CSE Faculty    ✅
CSE Analytics  ✅
IT data        ❌
ECE data       ❌
```

### Faculty Isolation

```
Faculty (IT Dept)
       ↓
IT Students / Assigned Students    ✅
CSE Students                       ❌
ECE Students                       ❌
```

### Student Isolation

```
Yashwanth (Student, IT)
       ↓
Yashwanth's own data               ✅
Permitted public faculty info       ✅
Rahul's private profile            ❌
Another student's marks            ❌
```

---

## 7. Student Portal

### 7.1 First Login / Profile Setup

When a student first logs in, they complete their profile.

**Basic Information**
- Full Name
- Roll Number
- College Email
- Phone Number
- Date of Birth
- Gender
- Profile Photo

**Academic Information**
- Department ← determines department association
- Year (1 / 2 / 3 / 4)
- Semester (1–8)
- Section
- Batch
- Admission Year
- CGPA
- Academic Performance records

### 7.2 Student Dashboard

```
CAMPUS NEXUS — Student Dashboard

Welcome, Yashwanth

Profile Completion     90%
CGPA                   8.4
Skills                   8
Projects                 3
Certifications           5
Learning Credits       240

────────────────────────────────

My Academic Progress      →
My Projects               →
My Skills                 →
My Certifications         →
My Learning               →
My Internships            →
My Placement              →
My Tasks                  →
Announcements             →
Notifications             →
Feedback & Grievances     →
```

### 7.3 Student Profile Sections

**Skills**
- Programming Languages
- Web Development
- App Development
- AI / ML
- Cloud
- Cybersecurity
- Data Science
- UI/UX Design
- Other Skills

**Projects**
- Project Name
- Description
- Technologies Used
- GitHub Link
- Demo / Live Link
- Team Members
- Status (Planning / In Progress / Completed)

**Certifications**
- Certification Name
- Issuing Organization
- Issue Date
- Certificate Document (upload)
- Credential ID / URL

**Achievements**
- Hackathons
- Competitions
- Awards
- Workshops
- Publications
- Other achievements

**Career**
- Career Goal
- Interested Domain
- Preferred Job Role
- Internship Status
- Placement Status
- Higher Studies Interest
- Resume (upload and maintain)

### 7.4 Student Privacy Rules

```
A student can access ONLY their own private data:

MY PROFILE         ✅
MY MARKS           ✅
MY ATTENDANCE      ✅
MY PROJECTS        ✅
MY CERTIFICATES    ✅
MY INTERNSHIPS     ✅
MY PLACEMENT       ✅
MY LEARNING        ✅
MY CREDITS         ✅
MY FEEDBACK        ✅
MY GRIEVANCES      ✅

Another student's private profile  ❌
Another student's marks            ❌
```

---

## 8. Faculty Portal

### 8.1 Faculty Profile

| Field            | Description                      |
| :--------------- | :------------------------------- |
| Name             | Full name                        |
| Faculty ID       | Institutional employee ID        |
| Email            | College email                    |
| Phone            | Contact number                   |
| Department       | e.g., IT / CSE                   |
| Designation      | e.g., Associate Professor        |
| Qualification    | e.g., Ph.D., M.Tech              |
| Experience       | Years of experience              |
| Specialization   | Domain expertise                 |
| Teaching Subjects| List of subjects taught          |
| Skills           | Technical / research skills      |
| Profile Photo    | Avatar                           |

### 8.2 Faculty Dashboard

```
CAMPUS NEXUS — Faculty Dashboard

Welcome, Dr. Arun

Department: IT

Assigned Students       20
Pending Reviews          4
Student Projects         8
Open Requests            2

────────────────────────────────

My Students           →
Student Progress      →
Projects              →
Mentoring             →
Learning Activity     →
Feedback              →
Announcements         →
Notifications         →
```

### 8.3 Faculty Access Rules

Faculty can see only students within their permitted scope (same department + assigned):

```
Faculty (IT Dept)
       ↓
IT Students / Assigned Students    ✅
CSE Students                       ❌
ECE Students                       ❌
```

### 8.4 Faculty View of Student Development

For each permitted student, faculty can see:

```
Student: Yashwanth

Academic:
  CGPA: 8.4          Semester Performance    Attendance

Skills:
  TypeScript (Advanced)   Python (Advanced)   Cloud (Intermediate)

Learning Activity:
  Python
    Tests Completed:   8
    Average Score:    84%

  DSA
    Problems Solved:  65
    Tests Completed:   4
    Average Score:    76%

  Web Development
    Course Progress:  72%

  Total Learning Credits: 240
```

### 8.5 Faculty Capabilities

| Capability         | Details                                                        |
| :----------------- | :------------------------------------------------------------- |
| Mentoring          | Review progress, provide feedback, set tasks, recommend resources |
| Project Review     | View → Review → Feedback → Request Changes → Mark Reviewed    |
| Learning Monitor   | Track student learning credits and activity per topic          |
| Feedback Response  | Respond to student concerns, escalate to HOD                   |
| Announcements      | Post to assigned students                                      |

---

## 9. HOD Portal

### 9.1 HOD Dashboard (Department-Specific)

The interface is identical for all HODs. The data changes based on department.

```
CAMPUS NEXUS — HOD Dashboard

Department: IT     ← comes from HOD's profile, never from URL

Students             420
Faculty               32
Projects              96
Internships           74
Placement Offers      61
Open Complaints        4

────────────────────────────────

IT ACADEMIC OVERVIEW
  Average CGPA         →
  Attendance           →
  Backlog Statistics   →
  Semester Performance →

IT STUDENT DEVELOPMENT
  Skills               →
  Projects             →
  Certifications       →
  Learning Credits     →
  Coding Activity      →
  Internships          →
  Placements           →

IT FACULTY
  Faculty Members      →
  Teaching Subjects    →
  Mentor Assignments   →

IT ALERTS
  Pending Requests     →
  Complaints           →
  Approvals            →
  Notifications        →
```

A CSE HOD sees the exact same layout but with CSE data.

### 9.2 HOD → Student Access

```
IT HOD → IT STUDENTS

  1. Yashwanth Kumar
  2. Rahul Kumar
  3. Priya Sharma
  ...

Per student HOD can view:
  Academic performance   ✅
  Attendance             ✅
  Skills                 ✅
  Projects               ✅
  Certifications         ✅
  Internships            ✅
  Placement status       ✅
  Learning activity      ✅
  Learning Credits       ✅
  Relevant feedback      ✅
```

### 9.3 HOD → Faculty Access

```
IT FACULTY

Dr. Arun Kumar
  Experience: 8 yrs
  Subjects: DSA, Algorithms

Dr. Priya Rao
  Experience: 12 yrs
  Subjects: DBMS, SQL

Per faculty HOD can view:
  Department             ✅
  Designation            ✅
  Experience             ✅
  Subjects Taught        ✅
  Assigned Students      ✅
  Mentoring Activity     ✅
  Student Dev Summary    ✅
```

### 9.4 HOD → Learning Analytics

```
IT LEARNING ANALYTICS

Total Active Learners      362

Python Activities        1,240
Java Activities            820
DSA Problems             2,140
Coding Tests               480
Courses Completed          210

Average Learning Credits   184

Identify: Top learners / students needing encouragement
```

### 9.5 HOD → Complaints Management

```
IT Complaints

Open:           4
Under Review:   3
Resolved:      18
Escalated:      2

HOD can: Review → Respond → Assign → Escalate → Resolve → Close

All original submissions are preserved for auditing.
```

### 9.6 HOD → Announcements

```
IT HOD → Announcement → All IT Students + All IT Faculty

Does NOT reach CSE or ECE automatically.
```

---

## 10. Learning Hub & Credits System

### 10.1 Learning Hub Structure

```
LEARNING HUB

Programming
 ├── C
 ├── C++
 ├── Java
 ├── Python
 ├── JavaScript
 └── SQL

Practice
 ├── Basic Problems
 ├── Intermediate Problems
 ├── Advanced Problems
 └── Coding Tests

Courses
 ├── Web Development
 ├── Data Structures & Algorithms
 ├── AI / ML
 ├── Database Design
 └── Cloud Computing

Quizzes
 ├── Technical Quizzes
 └── Aptitude Practice
```

Content can be:
- Links to approved external platforms (LeetCode, Coursera, HackerRank, etc.)
- Activities hosted inside Campus Nexus

### 10.2 Learning Credits

Students earn Credits for completing approved activities:

| Activity                    | Credits |
| :-------------------------- | ------: |
| Complete beginner test       |    +10 |
| Complete intermediate test   |    +20 |
| Complete advanced test       |    +30 |
| Complete a course            |    +50 |
| Complete technical quiz      |    +10 |
| Complete practice activity   |     +5 |

*(Exact values are configurable. The recording system is the core requirement.)*

### 10.3 What Gets Recorded Per Activity

| Field             | Description              |
| :---------------- | :----------------------- |
| Student           | Who completed it         |
| Activity          | What was completed       |
| Completion Status | Completed / In Progress  |
| Score             | Percentage score         |
| Credits Earned    | Credits awarded          |
| Date              | When completed           |

### 10.4 Example Student Learning Record

```
Yashwanth Kumar — Learning Activity

Python Fundamentals
  Status: Completed
  Score:  86%
  Credits: +30

Data Structures Practice
  Status: Completed
  Score:  78%
  Credits: +20

Total Credits: 240
```

### 10.5 Why Learning Credits Matter

Faculty and HODs gain a much richer view of student development.

```
Instead of: "Student knows Python"

Faculty can see:
  Python
    Practice Activities:  18
    Tests Completed:       6
    Average Score:        82%
    Learning Credits:    140
```

This reveals:
- How actively the student is learning
- Which technical areas they practice
- Their consistency and strengths
- Areas needing improvement

> Credits are an activity record, not an automatic academic grade.

---

## 11. Cross-Role Visibility Rules

### Student → Faculty

```
CAN SEE                       CANNOT SEE
───────────────               ─────────────────────────
Name                          Personal phone number
Department                    Personal email
Designation                   Private documents
Experience                    Salary
Qualification                 Administrative information
Teaching Subjects             Private notes
Specialization                Other restricted data
```

### Student → HOD

```
CAN SEE
───────────────
HOD Name
Department
Designation
Experience
Qualification
Specialization
```

### Faculty → Student

Only for students in their permitted scope (same dept + assigned):

```
CAN SEE                       CANNOT SEE
───────────────               ──────────────────────────────
CGPA                          Students from other departments
Semester performance          Unassigned students
Skills                        Grievances filed against faculty
Projects                        (those route directly to HOD)
Certifications
Learning activity
Learning credits
```

### HOD → Everyone

```
CAN SEE                       CANNOT SEE
───────────────               ──────────────────────────
Own-dept students             Students from other depts
Own-dept faculty              Faculty from other depts
Dept analytics                Other dept analytics
Dept complaints               Complaints for other depts
```

---

## 12. Feedback & Grievance Workflow

### Student Submission Types

- Suggestion
- Complaint
- Feedback
- Academic Concern
- Department Concern

### Routing Rules

```
Student submits → Routes to:
  ├── Faculty
  ├── HOD
  └── Both

Complaint AGAINST a faculty:
  → Goes directly to HOD
  → The accused faculty does NOT see it
```

### Status Lifecycle

```
Submitted
    │
    ↓
Under Review
    │
    ├── Resolved (by Faculty or HOD)
    │
    └── Escalated to HOD (by Faculty)
            │
            ↓
          Resolved / Closed by HOD
```

All original submissions are preserved for auditing.

---

## 13. Complete User Journeys

### Student Journey

```
LOGIN → Student Portal (role identified from profile)
  ↓
Complete Profile (first login)
  ↓
Dashboard — personal overview
  ↓
Academic Information — CGPA, semester, attendance
  ↓
Skills — add, categorize, update proficiencies
  ↓
Projects — add, link GitHub, track progress
  ↓
Certifications — upload, log credentials
  ↓
Internships / Placements — log status and outcomes
  ↓
Learning Hub — coding, courses, practice problems
  ↓
Earn Learning Credits — auto-recorded on completion
  ↓
Faculty monitors development progress
  ↓
View permitted faculty/HOD public info
  ↓
Submit Feedback / Grievance → Track response
```

### Faculty Journey

```
LOGIN → Faculty Portal (role + dept identified from profile)
  ↓
Complete Faculty Profile
  ↓
Dashboard — dept + assigned student overview
  ↓
View permitted students (same dept / assigned)
  ↓
Mentor Students — sessions, feedback, tasks
  ↓
Review Projects — provide feedback, mark reviewed
  ↓
View Learning Activity — credits, test scores per student
  ↓
Monitor Learning Credits across assigned students
  ↓
Respond to Student Requests / Concerns
  ↓
Escalate issues to HOD when needed
  ↓
Post Announcements to assigned students
```

### HOD Journey

```
LOGIN → HOD Portal (role + dept identified from profile)
  ↓
Department-specific dashboard auto-loaded (e.g., IT data)
  ↓
View all IT Students — academic + development overview
  ↓
View all IT Faculty — assignments, mentoring activity
  ↓
View Academic Analytics — CGPA, attendance, backlogs
  ↓
View Student Development — skills, projects, certifications
  ↓
View Coding/Learning Activity — credits, top learners
  ↓
View Internships / Placements
  ↓
Manage Department Announcements
  ↓
Handle Complaints / Escalations
  ↓
Monitor Faculty responsibilities
  ↓
Department-level decisions and approvals
```

---

## 14. Phased Build Plan

| Phase     | Focus                  | Key Deliverables                                                                 |
| :-------- | :--------------------- | :------------------------------------------------------------------------------- |
| Phase 1   | Auth & Profiles        | Login, forgot password, reset password, role routing, user profiles, department  |
| Phase 2   | Student Portal         | Dashboard, profile editor, skills, projects, certifications, achievements, career, resume |
| Phase 3   | Learning Hub           | Learning Hub UI, coding resources, practice, tests, quizzes, credits system     |
| Phase 4   | Faculty Portal         | Faculty profile, permitted student views, mentoring, project review, learning analytics |
| Phase 5   | HOD Portal             | Dept dashboard, student management, faculty management, analytics, complaints, announcements |
| Phase 6   | Security (RLS)         | Supabase RLS for role + dept isolation, student self-only, faculty scoped, HOD dept-only |
| Phase 7   | Feedback & Comms       | Grievance workflow, routing rules, notifications, announcements, approval workflows |
| Phase 8   | Polish                 | Dashboard charts, activity history, performance tuning, mobile optimization     |

---

## 15. Key Technical Decisions

| Decision               | Choice                        | Reason                                              |
| :--------------------- | :---------------------------- | :-------------------------------------------------- |
| Framework              | Next.js 16 App Router         | SSR + Edge Middleware for RBAC                      |
| Database               | Supabase (PostgreSQL)         | RLS for row-level department + role security        |
| Auth                   | Supabase Auth                 | Email/password + password reset built in            |
| Department control     | Stored in profiles.department | Never selected by user at login                     |
| Security enforcement   | Supabase RLS policies         | Database-level, not just frontend filtering         |
| Multi-department       | Single app, data filtered     | Scalable — adding a dept = adding a DB row only     |
| Project Name           | Campus Nexus                  | College-wide platform, not department-specific      |

---

*This document is the authoritative project workflow reference for Campus Nexus.*
*Update it whenever the workflow evolves.*
