# Campus Nexus — College Student Development & Intelligence Portal

**Campus Nexus** is a centralized college platform connecting **Students**, **Faculty**, and the **Head of Department (HOD)** across all departments through a single, unified application.

> **Core Principle**: One application. One portal design. Data and permissions personalized by **Role + Department + User ID**.

---

## 1. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **Backend & Database** | PostgreSQL via Supabase |
| **Authentication** | Supabase Auth — Email & Password + Password Reset |
| **Authorization** | Role + Department RBAC + Supabase Row Level Security (RLS) |
| **Icons** | Lucide React |

---

## 2. How It Works

Campus Nexus does **not** create separate portals per department. Every user — regardless of department — enters through the same login and is routed by their profile.

```
           CAMPUS NEXUS
                │
              LOGIN
                │
        Authenticate User
                │
      Identify Role from Profile
                │
   ┌────────────┼────────────┐
   ↓            ↓            ↓
STUDENT      FACULTY        HOD
   │            │            │
   ↓            ↓            ↓
/student/    /faculty/    /hod/
dashboard    dashboard    dashboard
```

The **department** is never selected by the user at login — it is stored in their authenticated profile and automatically controls what data they see.

---

## 3. User Roles & Access

| Role | Lands At | What They Access |
| :--- | :--- | :--- |
| **Student** | `/student/dashboard` | Own profile, skills, projects, certifications, internships, career, Learning Hub, credits, feedback |
| **Faculty** | `/faculty/dashboard` | Own profile, assigned students (same dept), mentoring, project reviews, learning analytics, concerns |
| **HOD** | `/hod/dashboard` | All students & faculty in **their department only**, analytics, complaints, announcements |

### Access is controlled by Role + Department

```
HOD (IT Dept)                   HOD (CSE Dept)
─────────────                   ──────────────
IT Students    ✅               CSE Students  ✅
IT Faculty     ✅               CSE Faculty   ✅
IT Analytics   ✅               CSE Analytics ✅
CSE Students   ❌               IT Students   ❌
ECE Data       ❌               ECE Data      ❌
```

---

## 4. Key Features

### Student Portal
- **Profile** — Basic info, academic details (year, semester, CGPA, section), roll number, resume upload
- **Skills** — Programming languages, frameworks, tools, AI/ML, cloud, cybersecurity, UI/UX
- **Projects** — Add projects with GitHub links, tech stack, team members, status tracking
- **Certifications** — Log certifications with issuer, date, credential URL, document upload
- **Achievements** — Hackathons, competitions, awards, publications
- **Career** — Career goal, preferred domain, internship & placement status, higher studies
- **Learning Hub** — Coding practice, courses, tests, quizzes (see below)
- **Feedback & Grievances** — Submit concerns to faculty / HOD with response tracking

### Learning Hub & Credits System *(New)*
Students earn **Learning Credits** for completing approved activities:

| Activity | Credits |
| :--- | ---: |
| Complete beginner test | +10 |
| Complete intermediate test | +20 |
| Complete advanced test | +30 |
| Complete a course | +50 |
| Complete technical quiz | +10 |
| Complete practice activity | +5 |

Faculty and HODs can see per-student learning activity — not just *"knows Python"* but tests completed, average score, and credits earned per topic.

### Faculty Portal
- View and mentor assigned students (department-scoped)
- Review student projects and provide structured feedback
- Monitor learning credits and coding activity per student
- Respond to and escalate student concerns
- Post announcements to assigned students

### HOD Portal
- Department-wide dashboard (data is department-specific, not college-wide)
- View all students and faculty in their department
- Department analytics — CGPA, attendance, backlog statistics
- Student development overview — skills, projects, learning activity
- Complaints management with full audit trail
- Department announcements (scoped to own department only)

---

## 5. Project Structure

```
campus-nexus/
├── app/
│   ├── layout.tsx               # Root layout — AuthProvider + ToastProvider
│   ├── page.tsx                 # Landing page
│   ├── login/                   # Single login entry point (no role/dept selector)
│   ├── reset-password/          # Password reset page (after email link)
│   ├── auth/callback/           # Supabase PKCE + password recovery handler
│   ├── unauthorized/            # Cross-role access denied page
│   ├── student/                 # Student portal (15 routes)
│   ├── faculty/                 # Faculty portal (10 routes)
│   └── hod/                    # HOD portal (13 routes)
├── components/
│   ├── ui/                      # 16 reusable UI components
│   ├── layout/                  # DashboardLayout, Sidebar, Header, MobileNav
│   └── navigation/              # Role-aware nav items, RoleBadge
├── lib/
│   ├── supabase/                # Browser, Server, and Middleware Supabase clients
│   └── auth/                   # AuthContext, AuthProvider, RoleGuard
├── supabase/migrations/         # PostgreSQL schema, RLS policies, triggers
├── docs/
│   ├── WORKFLOW.md              # Complete project workflow & feature specification ← start here
│   ├── DATABASE.md              # Database schema reference
│   ├── AUTHENTICATION.md        # Auth flow & account provisioning
│   └── SECURITY.md             # RLS policies & security model
├── types/                       # TypeScript: database, auth, roles, navigation
├── hooks/                       # useAuth, useToast, useDisclosure
└── middleware.ts                # Edge middleware — role + dept route protection
```

---

## 6. Getting Started

### Prerequisites
- **Node.js** v18+ (tested on v22.18.0)
- **npm** v9+ (tested on v10.9.3)
- A [Supabase](https://supabase.com) project

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your real Supabase project URL and anon key
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **anon key** from Project Settings → API into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Run the migration in Supabase Dashboard → SQL Editor:
   - [`supabase/migrations/20260820000001_create_core_schema.sql`](supabase/migrations/20260820000001_create_core_schema.sql)
4. Create test users in Supabase Dashboard → Authentication → Users → Add User with metadata:
   ```json
   { "role": "student", "full_name": "Student Name", "roll_number": "21IT001", "department": "IT" }
   ```

### Dev Commands

```bash
npm run dev          # Start development server
npx tsc --noEmit     # TypeScript type check
npm run lint         # ESLint validation
npm run build        # Production build
```

---

## 7. Security Model

- **Edge Middleware** — Validates role cookies + Supabase session on every request. Blocks cross-role routes before the page renders.
- **RoleGuard Component** — Client-side second check. Redirects unauthorized users.
- **Supabase RLS** — All data isolation enforced at the database level:
  - Students read only their own rows
  - Faculty access scoped to same department + assigned students
  - HOD access scoped strictly to their own department
  - Department isolation prevents cross-department data leaks
- **Anti-Tampering Trigger** — `prevent_role_tampering()` blocks non-HOD users from modifying their role or account status via the database.

> Security is enforced at the **database level**, not just by hiding UI elements.

---

## 8. Documentation

| Document | Description |
| :--- | :--- |
| [`docs/WORKFLOW.md`](docs/WORKFLOW.md) | **Start here** — Complete project vision, all features, user journeys, and build phases |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Database tables, columns, triggers, and indexes |
| [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md) | Auth flow, session handling, and account provisioning |
| [`docs/SECURITY.md`](docs/SECURITY.md) | RLS policies and security rules matrix |
