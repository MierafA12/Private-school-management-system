# Haile-Manas Academy — Private School Management System
## Full System Documentation

---

## 1. Project Overview

**Haile-Manas Academy Management System** is a full-stack, role-based school management platform built for a private school in Debre Berhan, Amhara Region, Ethiopia. It replaces paper-based and spreadsheet-driven administration with a unified digital campus covering every aspect of school operations — from student enrolment through to fee collection and academic reporting.

The system is accessible via a public-facing website and five protected role portals, each tailored to a specific user type.

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.7 | UI framework — component-based SPA |
| **React Router DOM** | 7.18.1 | Client-side routing, protected routes, nested layouts |
| **Vite** | 8.1.1 | Build tool and dev server with HMR |
| **Lucide React** | 1.25.0 | Icon library (consistent SVG icons across all portals) |
| **OXLint** | 1.71.0 | Fast Rust-based linter |
| **CSS (custom)** | — | All styling hand-written with CSS variables for theming |

No CSS framework (no Tailwind, no Bootstrap). Pure custom CSS with a consistent design system using CSS custom properties (`--primary`, `--bg-color`, `--card-bg`, `--border-color`, `--text-main`, `--text-muted`, etc.) enabling light/dark mode support across the entire application.

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | ≥18 | JavaScript runtime |
| **Express** | 5.2.1 | HTTP server and routing framework |
| **pg (node-postgres)** | 8.22.0 | PostgreSQL client — all SQL written by hand |
| **bcryptjs** | 3.0.3 | Password hashing (salted bcrypt) |
| **jsonwebtoken** | 9.0.3 | JWT authentication (access + refresh tokens) |
| **express-validator** | 7.3.2 | Request body/query/param validation |
| **express-rate-limit** | 8.6.0 | Rate limiting on auth and public endpoints |
| **helmet** | 8.3.0 | HTTP security headers |
| **cors** | 2.8.6 | Cross-origin resource sharing |
| **node-cron** | 4.6.0 | Scheduled jobs (invoice overdue marking, etc.) |
| **node-pg-migrate** | 9.0.0 | Database migrations |
| **dotenv** | 17.4.2 | Environment variable management |
| **@supabase/supabase-js** | 2.110.8 | Supabase client (storage and optional auth layer) |
| **nodemon** | 3.1.14 | Dev hot-reload |

### Database
| Technology | Purpose |
|---|---|
| **PostgreSQL** (via Supabase) | Primary relational database — all data persistence |
| **Supabase** | Hosted PostgreSQL + connection pooling + storage |

All queries are raw SQL written with parameterised statements (`$1, $2, ...`) — no ORM is used. This gives full query control, predictable performance, and no abstraction overhead.

### Architecture Pattern
- **REST API** — stateless JSON API on port 5001
- **SPA + API** — Vite dev proxy (`/api → localhost:5001`) in development; CORS-configured for production
- **Role-based access control (RBAC)** — JWT middleware checks user role on every protected route
- **Layered backend** — Routes → Controllers → Services → DB (raw SQL via `pg.Pool`)

---

## 3. Actors / User Roles

| Role | Portal Route | Description |
|---|---|---|
| **Super Admin** | `/principal/*` | Full system access — same as Principal |
| **Principal** | `/principal/*` | School setup, academic oversight, report card approval |
| **Registrar** | `/registrar/*` | Student/staff registration, enrolments, promotions |
| **Teacher** | `/teacher/*` | Attendance, grades, assignments, timetable view |
| **Accountant** | `/accountant/*` | Fee invoicing, payment recording, financial reports |
| **Parent** | `/parent/*` | Child progress, fees, announcements, messaging |
| **Student** | `/student/*` | Timetable, grades, assignments, fees, notices |
| **Public** | `/landing`, `/about`, `/events`, `/jobs`, `/contact` | Unauthenticated public pages |

---

## 4. Features by Portal

---

### 4.1 Principal Portal (`/principal`)

Responsible for all academic and operational school setup.

| Feature | Details |
|---|---|
| **School Profile** | Edit school name, logo, address, motto, currency, contact details |
| **Academic Years** | Create/manage academic years, set current year, define year structure |
| **Terms** | Create terms per academic year, set start/end dates, mark current term |
| **Classes & Sections** | Create grade levels with at least one section each; inline section creation |
| **Subjects** | Preset Ethiopian subject list (Amharic, English, Maths, Geez, Chemistry, Biology, Physics, etc.) + custom entry + bulk add |
| **Curriculum Subjects** | Assign subjects to specific classes/sections for a given academic year |
| **Grading Scales** | Define letter grade bands (A+, A, B+, … F) with min/max percentage and pass/fail flag |
| **Fee Structures** | Create fee items per academic year, class, and term with amounts in ETB |
| **Class Advisors** | Assign a teacher as homeroom/class advisor for each class-section |
| **Timetable Builder** | 3-step: select class/section → build time slots with teacher + subject → publish/broadcast to students |
| **Report Cards** | Generate term report cards, add principal remarks, publish to student and parent portals |
| **Announcements** | Create school-wide or class-targeted announcements with priority levels |

---

### 4.2 Registrar Portal (`/registrar`)

Handles all people management and enrolment.

| Feature | Details |
|---|---|
| **Register Student** | Create student account with personal details, auto-generate student number |
| **Register Parent** | Create parent account and link to one or more students |
| **Register Teacher** | Create teacher account with subject specialisation |
| **Register Staff** | Create non-teaching staff accounts |
| **User List** | View all users; filter by role; toggle active/inactive status; reset passwords |
| **Enrolments** | Enrol students into class/section for a given academic year; update enrolment; promote students to next grade |

---

### 4.3 Teacher Portal (`/teacher`)

Classroom management and academic operations.

| Feature | Details |
|---|---|
| **Dashboard** | Overview of assigned classes, upcoming assignments, recent marks activity |
| **My Classes** | View all assigned classes and sections with student lists |
| **Timetable** | View own published timetable showing day, time, class, room |
| **Attendance** | Mark daily attendance per class (present/absent/late/excused); view history |
| **Grade Entry** | Enter marks per exam schedule and mark component; system calculates percentage and letter grade |
| **Assignments** | Create individual or group assignments; define groups manually; set due date and max marks; publish to students |

---

### 4.4 Accountant Portal (`/accountant`)

Full financial management for the school.

| Feature | Details |
|---|---|
| **Dashboard** | Total billed, collected, outstanding; overdue count; recent payments; 6-month trend chart |
| **Fee Structures** | View/create/edit/archive fee line items per academic year, term, and class |
| **Generate Invoices** | Bulk-generate per-term invoices for an entire class from a fee structure |
| **Invoice List** | View all invoices; filter by term, class, status; search by student name or invoice number |
| **Invoice Detail** | Full invoice with payment history and installment plans |
| **Record Payment** | Record manual cash/bank/mobile payments against an invoice; auto-generates receipt number |
| **Payment List** | View all payments; filter by method and date range; search |
| **Receipt** | Retrieve payment receipt with full invoice and student details |
| **Collections Report** | Payments by day and by method for a date range; summary totals |
| **Arrears Report** | All unpaid/partial/overdue invoices with student details and outstanding balance |
| **Revenue Report** | Revenue grouped by fee category across academic year or term |

**Payment Gateway:** Chapa integration — `initializeTransaction` generates checkout URL; webhook endpoint `/api/accountant/webhooks/payment-gateway` processes confirmed payments with HMAC-SHA256 signature verification; idempotency guard prevents duplicate processing.

---

### 4.5 Parent Portal (`/parent`)

Read-only view of children's academic and financial status.

| Feature | Details |
|---|---|
| **Dashboard** | Summary cards for all children — attendance rate, average score, fee balance, unread notices |
| **My Children** | List of linked children with current class/section and enrolment details |
| **Attendance** | View each child's attendance record by term with daily breakdown |
| **Academics / Grades** | Subject-by-subject marks and grades per term |
| **Report Cards** | Published report cards with all subject scores, class rank, advisor remarks |
| **Fee Payments** | Invoice list with balances; Chapa online payment initiation |
| **Messages** | Direct messaging with teachers (conversation-based) |
| **Announcements** | School-wide and class-targeted notices |

---

### 4.6 Student Portal (`/student`)

Student self-service access to their own academic data.

| Feature | Details |
|---|---|
| **Dashboard** | Quick stats — attendance %, upcoming exams, pending assignments, fee balance |
| **Timetable** | Published weekly timetable for own class/section (teacher, subject, room, time) |
| **Attendance** | Own attendance record by term with daily status |
| **Subjects** | List of enrolled curriculum subjects with teacher name |
| **Exams** | Published exam schedule with date, time, venue per subject |
| **Report Card** | Published term report card with marks, grades, rank, remarks |
| **Assignments** | View individual and group assignments; see group members; submit (content/file link); view marks and feedback |
| **Fees** | Invoice list, payment history, fee balance |
| **Messages** | In-app messaging |
| **Notices** | School announcements |

---

### 4.7 Public Pages (unauthenticated)

| Page | Route | Content |
|---|---|---|
| **Landing** | `/landing` | Hero (video background), stats, role-based solution cards, core module grid, showcase mockups, pricing tiers, FAQ, testimonials |
| **About Us** | `/about` | School story, mission/vision, core values, milestone timeline, leadership team, location |
| **Events** | `/events` | School events listing (empty state when no events are scheduled) |
| **Jobs / Careers** | `/jobs` | Open positions or "no positions" empty state; how-to-apply guide; why-work-here section |
| **Contact** | `/contact` | Contact info cards (address: Debre Berhan), message form with department dropdown, map link, quick links sidebar |

---

## 5. Database Schema (Tables)

All tables live in PostgreSQL (Supabase). Created via `node-pg-migrate` migrations + `patch-missing-tables.js` script.

### Core Identity
| Table | Purpose |
|---|---|
| `roles` | Role definitions (Principal, Registrar, Teacher, etc.) |
| `permissions` | Permission names |
| `role_permissions` | Many-to-many: roles ↔ permissions |
| `users` | All users — email, password hash, role, status |

### People
| Table | Purpose |
|---|---|
| `students` | Student records (name, DOB, student number, profile) |
| `parents` | Parent records linked to users |
| `student_parents` | Many-to-many: students ↔ parents |
| `teachers` | Teacher records (subjects, hire date) |
| `staff` | Non-teaching staff records |

### Academic Structure
| Table | Purpose |
|---|---|
| `academic_years` | Year definitions with start/end dates and current flag |
| `terms` | Terms within an academic year (3 per year) |
| `classes` | Grade levels (Grade 1 – Grade 12) |
| `sections` | Sections within a class (A, B, C, etc.) |
| `subjects` | Subject catalogue |
| `curriculum_subjects` | Subjects assigned to class/section for a given academic year |
| `class_advisors` | Teacher assigned as homeroom advisor per class-section |
| `enrollments` | Student enrolments per class/section/academic year |

### Timetable & Attendance
| Table | Purpose |
|---|---|
| `timetables` | Published timetable entries (day, period, teacher, subject, section) |
| `attendance_sessions` | Attendance session per class per day |
| `attendance_records` | Individual student attendance status per session |

### Examinations & Grades
| Table | Purpose |
|---|---|
| `exam_schedules` | Exam entry per term/class/section/subject |
| `mark_components` | Assessment components per exam (e.g. Assignment 10%, Final 80%) |
| `student_marks` | Marks per component per student |
| `grading_scales` | Letter grade bands with percentage ranges |
| `report_cards` | Term report card header per student |
| `report_card_items` | Subject-level mark/grade per report card |

### Finance
| Table | Purpose |
|---|---|
| `fee_structures` | Fee items with amount, category, term, class |
| `fee_invoices` | Per-student per-term invoices with balance tracking |
| `fee_payments` | Individual payment transactions with receipt number |

### Assignments
| Table | Purpose |
|---|---|
| `assignments` | Assignment definitions (individual or group) |
| `assignment_groups` | Named groups for a group assignment |
| `assignment_group_members` | Students in each group |
| `assignment_submissions` | Student submissions with marks and feedback |

### Communication
| Table | Purpose |
|---|---|
| `announcements` | School-wide or class-targeted announcements |
| `conversations` | Message thread container |
| `conversation_participants` | Users in a conversation |
| `messages` | Individual messages within a conversation |
| `notifications` | In-app notification items per user |
| `notification_preferences` | Per-user notification settings |
| `notification_delivery_log` | Log of notification delivery attempts |

### School Config
| Table | Purpose |
|---|---|
| `school_profile` | Single-row school settings (name, logo, address, currency) |
| `events` | School calendar events |

---

## 6. Authentication & Security

| Mechanism | Implementation |
|---|---|
| **Password hashing** | bcryptjs with salt rounds (10) |
| **Authentication** | JWT access token (short-lived) + refresh token (long-lived, stored server-side concept) |
| **Route protection** | `authenticate` middleware on all private routes; `authorize(...roles)` middleware for role checks |
| **Rate limiting** | express-rate-limit on `/api/auth/login` (prevent brute-force) and all public endpoints |
| **Security headers** | Helmet middleware (CSP, HSTS, X-Frame-Options, etc.) |
| **Input validation** | express-validator on every POST/PATCH body + query/param |
| **SQL injection** | Parameterised queries only — no string concatenation in SQL |
| **Webhook security** | Chapa webhook verified with HMAC-SHA256 signature before processing |
| **CORS** | Configured for specific frontend origin only |

---

## 7. Key Implementation Techniques

### Frontend
- **Protected routes** — `PrivateRoute` wrapper checks auth state and role before rendering; redirects unauthenticated users to `/login`
- **Auth context** — `AuthContext` (React Context + `useContext`) provides `user`, `login`, `logout` globally
- **Notification context** — `NotificationContext` polls for unread count and drives the `NotificationBell` component
- **Nested layouts** — Each portal has its own `Layout` component using React Router `<Outlet>` for nested child routes
- **Dark mode** — CSS `data-theme="dark"` attribute toggled on `<html>` by `ThemeToggle` component; all colour values use CSS variables
- **Animated counters** — `IntersectionObserver` triggers count-up animation when stats scroll into view
- **CSS mockups** — Landing page showcase uses pure CSS components that visually represent each portal without real screenshots
- **Responsive** — All layouts use CSS Grid/Flexbox with `@media` breakpoints; mobile sidebar uses overlay + toggle pattern

### Backend
- **Layered architecture** — `routes/` only wire HTTP verbs to controller functions; `controllers/` handle request/response; `services/` contain all business logic and SQL
- **Database migrations** — `node-pg-migrate` for version-controlled schema; `patch-missing-tables.js` for additive column patches safe to re-run
- **Parameterised SQL** — All DB calls use `pool.query(sql, [params])` — never string interpolation
- **Transaction management** — Multi-step operations (invoice generation, payment recording) wrapped in `BEGIN / COMMIT / ROLLBACK` using a dedicated `client` from the pool
- **Idempotent invoice generation** — Checks for existing invoice before inserting to prevent duplicates
- **Chapa payment gateway** — Full integration: `initializeTransaction` → Chapa checkout → webhook callback → `processSuccessfulPayment` with idempotency guard
- **Non-blocking notifications** — All notification dispatches are fire-and-forget (`.catch(() => {})`) so a notification failure never breaks a financial transaction
- **Scheduled jobs** — `node-cron` for periodic tasks (e.g. marking overdue invoices)

---

## 8. Project Structure

```
Private-school-management-system/
├── backend/
│   ├── index.js                    # Express app entry point
│   ├── .env                        # Environment variables
│   ├── migrations/                 # node-pg-migrate SQL migrations
│   ├── scripts/
│   │   ├── patch-missing-tables.js # Additive DB column patches
│   │   ├── seed-admin.js           # Seeds Super Admin + Registrar accounts
│   │   └── seed-invoice.js         # Test data seeder
│   └── src/
│       ├── db.js                   # pg.Pool singleton
│       ├── middleware/
│       │   ├── auth.js             # authenticate + authorize middleware
│       │   └── validate.js         # express-validator error handler
│       ├── routes/                 # Express routers per portal
│       ├── controllers/            # Thin HTTP handlers
│       └── services/               # Business logic + raw SQL
│           ├── authService.js
│           ├── studentService.js
│           ├── teacherService.js
│           ├── registrarService.js
│           ├── enrollmentService.js
│           ├── principalService.js
│           ├── assignmentService.js
│           ├── feeService.js
│           ├── reportService.js
│           ├── notificationService.js
│           └── paymentGatewayService.js
│
└── frontend/
    ├── public/
    │   ├── logo.svg
    │   └── videos/                 # Hero background video
    └── src/
        ├── App.jsx                 # Root router + route definitions
        ├── context/
        │   ├── AuthContext.jsx
        │   └── NotificationContext.jsx
        ├── components/
        │   ├── layout/             # Navbar, Footer
        │   ├── landing/            # Hero, Features, Showcase, PricingFAQ
        │   └── shared/             # NotificationBell, ThemeToggle, PageState, etc.
        ├── pages/
        │   ├── landing/            # Landing, About, Events, Jobs, Contact
        │   ├── auth/               # Login
        │   ├── shared/             # MyProfile (used by all portals)
        │   ├── principal/          # Principal portal pages
        │   ├── registrar/          # Registrar portal pages
        │   ├── teacher/            # Teacher portal pages
        │   ├── accountant/         # Accountant portal pages
        │   ├── parent/             # Parent portal pages
        │   └── student/            # Student portal pages
        ├── styles/
        │   ├── index.css           # Global reset + CSS variables
        │   ├── portals/
        │   │   └── student.css     # Shared portal layout (sl-*) used by all portals
        │   └── pages/
        │       ├── Landing.css     # Landing page styles
        │       └── PublicPages.css # About, Events, Jobs, Contact styles
        └── utils/
            └── roleHomePath.js     # Maps user role → home route after login
```

---

## 9. Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=          # Supabase direct connection string (PostgreSQL)
JWT_SECRET=            # Secret for signing access tokens
JWT_REFRESH_SECRET=    # Secret for signing refresh tokens
PORT=5001              # API port (5000 reserved by Windows)
CHAPA_SECRET_KEY=      # Chapa payment gateway API key
CHAPA_WEBHOOK_SECRET=  # HMAC secret for verifying Chapa webhooks
CHAPA_BASE_URL=        # https://api.chapa.co/v1
APP_URL=               # Frontend base URL (e.g. http://localhost:5173)
NODE_ENV=              # development | production
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=          # Backend API base (proxied to /api in dev via vite.config)
VITE_DEMO_MODE=false   # Must be false — real login required
```

---

## 10. Running the Project

### Prerequisites
- Node.js ≥ 18
- PostgreSQL database (Supabase recommended)
- `.env` file configured in `backend/`

### Setup
```bash
# 1. Install dependencies
cd backend  && npm install
cd frontend && npm install

# 2. Run migrations
cd backend && npm run migrate:up

# 3. Patch additional columns
cd backend && npm run patch:db

# 4. Seed initial admin accounts
cd backend && npm run seed:admin
# Creates:
#   Super Admin  → admin@school.com     / Admin@1234
#   Registrar    → registrar@school.com / Reg@1234

# 5. Start backend (port 5001)
cd backend && npm run dev

# 6. Start frontend (port 5173)
cd frontend && npm run dev
```

### Default Accounts
| Role | Email | Password |
|---|---|---|
| Super Admin (Principal) | `admin@school.com` | `Admin@1234` |
| Registrar | `registrar@school.com` | `Reg@1234` |

All other accounts are created by the Registrar through the registration portal.

---

## 11. Deployment Notes

- Backend must run on a non-5000 port on Windows (port 5000 is reserved by AirPlay/Windows processes) — configured to **5001**
- Vite proxy in `vite.config.js` maps `/api` → `http://localhost:5001` in development
- For production: set `CORS_ORIGIN` to the exact frontend domain; switch `NODE_ENV=production`; deploy backend to Railway / Render / EC2; frontend to Vercel / Netlify
- Chapa webhook URL must be registered in the Chapa dashboard pointing to `https://your-domain/api/accountant/webhooks/payment-gateway`
- `npm run patch:db` is safe to re-run at any time — all statements use `IF NOT EXISTS` / `IF NOT EXISTS` guards

---

*Document generated: September 2026 — Haile-Manas Academy, Debre Berhan*
