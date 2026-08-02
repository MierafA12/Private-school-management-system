# Haile-Manas Academy — Project Build Status

**Branch:** `feat/student`
**Last Updated:** August 2, 2026
**Stack:** React 19 + Vite 8 · Node.js + Express 5 · PostgreSQL (Supabase) · JWT Auth

---

## Overall Progress

| Area | Status |
|---|---|
| Landing Page | Done |
| Authentication (Frontend + Backend) | Done |
| Database Schema | Done |
| Student Portal (Frontend) | Done |
| Registrar Portal (Frontend) | Done |
| Backend API — Auth | Done |
| Backend API — Student | Done |
| Backend API — Registrar | Done |
| Teacher Portal | Not started |
| Parent Portal | Not started |
| Principal Dashboard | Not started |
| Accountant Portal | Not started |
| Fee Payment Integration | Not started |
| Notifications / SMS | Not started |

---

## Frontend

### Pages & Routing

| Route | File | Status |
|---|---|---|
| `/` or `/landing` | `Landing.jsx` | Done |
| `/login` | `Login.jsx` | Done |
| `/register` | `Register.jsx` | Done |
| `/student/dashboard` | `StudentDashboard.jsx` | Done |
| `/student/attendance` | `StudentAttendance.jsx` | Done |
| `/student/timetable` | `StudentTimetable.jsx` | Done |
| `/student/subjects` | `StudentSubjects.jsx` | Done |
| `/student/exams` | `StudentExams.jsx` | Done |
| `/student/report-cards` | `StudentReportCard.jsx` | Done |
| `/student/fees` | `StudentFees.jsx` | Done |
| `/student/notices` | `StudentNotices.jsx` | Done |
| `/student/messages` | `StudentMessages.jsx` | Done |
| `/registrar/dashboard` | `RegistrarDashboard.jsx` | Done |
| `/registrar/users` | `UserList.jsx` | Done |
| `/registrar/register` | `RegisterPerson.jsx` | Done |
| Teacher Portal routes | — | Not started |
| Parent Portal routes | — | Not started |
| Principal routes | — | Not started |
| Accountant routes | — | Not started |

### Components

| Component | File | Purpose |
|---|---|---|
| Navbar | `layout/Navbar.jsx` | Landing page navigation |
| Footer | `layout/Footer.jsx` | Landing page footer |
| Hero | `landing/Hero.jsx` | Landing hero section |
| Features | `landing/Features.jsx` | 12 module cards + stats |
| Showcase | `landing/Showcase.jsx` | Portal UI previews + roles timeline |
| PricingFAQ | `landing/PricingFAQ.jsx` | Testimonials + FAQ accordion + CTA |
| StudentLayout | `student/StudentLayout.jsx` | Sidebar + topbar for student portal |
| RegistrarLayout | `registrar/RegistrarLayout.jsx` | Sidebar + topbar for registrar portal |
| PageState | `shared/PageState.jsx` | Reusable LoadingSpinner, ErrorBanner, EmptyState |

### State Management & API Layer

| File | Purpose |
|---|---|
| `context/AuthContext.jsx` | Global auth state, login/logout, role-based redirect |
| `api.js` | Centralized fetch wrapper with JWT injection, auto token refresh, proxy to backend |

### Auth Flow
- Login calls `POST /api/auth/login` on the backend (not Supabase Auth)
- JWT access token (15 min) + refresh token (7 days) stored in `localStorage`
- Auto token refresh on 401 responses
- Role-based redirect after login: `Student → /student/dashboard`, `Registrar/Admin → /registrar/dashboard`
- Vite dev proxy: `/api` → `http://localhost:5001`

### Styling
- `index.css` — Global CSS variables (Academic Crimson `#991B1B`, Prestige Gold `#D97706`, Inter font)
- `Auth.css` — Auth card, input groups, role selector, error/success banners
- `Landing.css` — Full landing page styles
- `student/student.css` — Student portal styles
- `registrar/registrar.css` — Registrar portal styles

---

## Backend

### Server
- **Entry:** `index.js` — Express 5, CORS, JSON middleware, route mounting, error handler
- **Port:** `5001`
- **Database:** `src/db.js` — PostgreSQL connection pool via `pg`, SSL enabled for Supabase

### API Routes

#### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Email/password login, returns JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (clears token) |
| POST | `/api/auth/change-password` | Change authenticated user's password |

#### Student — `/api/student` *(requires JWT)*
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/student/dashboard` | Dashboard summary stats |
| GET | `/api/student/profile` | Student profile |
| PATCH | `/api/student/profile` | Update profile fields |
| GET | `/api/student/attendance` | Attendance records (filter by year/month) |
| GET | `/api/student/timetable` | Class timetable |
| GET | `/api/student/subjects` | Enrolled subjects |
| GET | `/api/student/enrollment-history` | Past enrollments |
| GET | `/api/student/exams` | Upcoming/past exams |
| GET | `/api/student/report-cards` | All report cards |
| GET | `/api/student/report-cards/:id` | Single report card |
| GET | `/api/student/fees` | Fee records |
| GET | `/api/student/fees/:id` | Single fee invoice |
| GET | `/api/student/announcements` | School announcements |
| GET | `/api/student/announcements/:id` | Single announcement |

#### Registrar — `/api/registrar` *(requires JWT + Registrar/Admin role)*
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/registrar/students` | Register new student |
| POST | `/api/registrar/parents` | Register new parent |
| POST | `/api/registrar/teachers` | Register new teacher |
| POST | `/api/registrar/staff` | Register new staff member |
| GET | `/api/registrar/users` | List all users (with filters) |
| GET | `/api/registrar/users/:id` | Get single user |
| POST | `/api/registrar/users/:id/reset-password` | Reset user password |
| PATCH | `/api/registrar/users/:id/status` | Set user status (ACTIVE/LOCKED/etc.) |

### Middleware
| File | Purpose |
|---|---|
| `middleware/auth.js` | JWT verification, attaches `req.user` |
| `middleware/validate.js` | `express-validator` request validation helper |
| `middleware/errorHandler.js` | Centralized error response formatter |

### Services
| File | Purpose |
|---|---|
| `services/authService.js` | Login logic, token signing, password change, bcrypt hashing |
| `services/studentService.js` | All student data queries (dashboard, attendance, timetable, etc.) |
| `services/registrarService.js` | Registration logic for students, parents, teachers, staff |

### Scripts
| Script | Command | Purpose |
|---|---|---|
| `scripts/seed-admin.js` | `npm run seed:admin` | Creates Super Admin + Registrar accounts |
| `scripts/run-migration.js` | `npm run migrate:supabase` | Runs migration SQL against Supabase |

---

## Database

**Platform:** Supabase (PostgreSQL)
**Migration file:** `backend/supabase_migration.sql` — run once in Supabase SQL Editor

### Tables (20 total)

| # | Table | Description |
|---|---|---|
| 1 | `roles` | System roles (Super Admin, Principal, Registrar, Accountant, Teacher, Student, Parent) |
| 2 | `permissions` | Granular permission codes (user.create, attendance.take, etc.) |
| 3 | `role_permissions` | Many-to-many: roles ↔ permissions |
| 4 | `users` | All user accounts (email, password hash, role, status) |
| 5 | `students` | Student profiles (name, DOB, admission date, status) |
| 6 | `parents` | Parent/guardian profiles |
| 7 | `student_parents` | Many-to-many: students ↔ parents |
| 8 | `teachers` | Teacher profiles (qualification, specialization, hire date) |
| 9 | `staff` | Staff profiles (Principal, Registrar, Accountant, Admin) |
| 10 | `academic_years` | Academic year definitions (one active at a time) |
| 11 | `terms` | Terms per academic year |
| 12 | `classes` | Grade levels / class definitions |
| 13 | `sections` | Sections per class (e.g. Grade 10 - Section A) |
| 14 | `subjects` | Subject catalog |
| 15 | `curriculum_subjects` | Subjects assigned to classes per academic year |
| 16 | `class_advisors` | Teacher assigned as advisor per section per year |
| 17 | `enrollments` | Student enrollment per academic year (one per student per year) |
| 18 | `timetables` | Period-by-period schedule per section |
| 19 | `attendance_sessions` | Daily or per-period attendance sessions |
| 20 | `attendance_records` | Individual student attendance per session |

> Tables still needed: `exam_results`, `fee_invoices`, `fee_payments`, `announcements` (partial), `notifications`

---

## Environment Configuration

### `frontend/.env`
```
VITE_SUPABASE_URL=https://vxtbrfaxkqgcfzxgnpop.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

### `backend/.env`
```
PORT=5001
DATABASE_URL=postgresql://postgres.vxtbrfaxkqgcfzxgnpop:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.vxtbrfaxkqgcfzxgnpop:<password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://vxtbrfaxkqgcfzxgnpop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
CORS_ORIGIN=http://localhost:5173
```

---

## Running the Project

```bash
# Terminal 1 — Frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173

# Terminal 2 — Backend
cd backend
npm install
npm run dev
# → http://localhost:5001

# Seed initial admin accounts (run once after migration)
npm run seed:admin
```

**Default seed accounts:**
| Role | Email | Password |
|---|---|---|
| Super Admin | admin@school.com | Admin@1234 |
| Registrar | registrar@school.com | Reg@1234 |

---

## What to Build Next

1. **Fix seed/DB connection** — confirm `npm run seed:admin` succeeds
2. **Teacher Portal** — layout, gradebook, attendance entry, class roster
3. **Parent Portal** — child overview, attendance view, fee statements
4. **Principal Dashboard** — analytics, announcements, approvals
5. **Accountant Portal** — fee structures, invoices, payment records
6. **Exam Results table** — missing migration `1737000021000`
7. **Fee Invoices & Payments** — tables + backend routes + frontend pages
8. **Announcements** — backend routes + frontend (student notices page exists)
9. **Production deployment** — environment hardening, rate limiting review
