# 🏫 Private School Management System — Backend API

A modular, production-ready REST API powering the Private School Management System. Built with **Node.js**, **Express 5**, and **PostgreSQL (Supabase)**, featuring strict Role-Based Access Control (RBAC), JWT authentication, automated background jobs, and a clean 3-tier architecture.

---

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Directory Structure](#-directory-structure)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup & Migrations](#database-setup--migrations)
  - [Running the Server](#running-the-server)
- [NPM Scripts Reference](#-npm-scripts-reference)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Security & Architecture Patterns](#-security--architecture-patterns)

---

## 🏛️ Architecture Overview

The backend is engineered with a strict **3-tier architecture** providing high maintainability, testability, and separation of concerns:

```
                  ┌──────────────────────┐
                  │      HTTP Client     │
                  │   (Frontend / Web)   │
                  └──────────┬───────────┘
                             │ HTTP / JSON
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Express Server (backend/index.js)                       │
│  ├─ Middleware: Helmet, CORS, Rate Limiters, Auth JWT   │
│  └─ Route Dispatchers (/api/*)                          │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Tier 1: Routes & Middleware (src/routes/)               │
│  ├─ URL path mapping & HTTP verb binding               │
│  ├─ Request validation rules (express-validator)        │
│  └─ Access guards (authorize(['TEACHER', 'PRINCIPAL'])) │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Tier 2: Controllers (src/controllers/)                  │
│  ├─ Request parsing (body, params, query)               │
│  ├─ Validation failure handling (400 Bad Request)       │
│  └─ HTTP response formatting & error delegation         │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Tier 3: Services & Data Access (src/services/ & src/db) │
│  ├─ Pure business logic & transactional coordination    │
│  ├─ Parameterized SQL queries via pg connection pool    │
│  └─ Database error handling & transformation            │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ PostgreSQL Database  │
                  │ (Supabase / Self-host│
                  └──────────────────────┘
```

---

## 📁 Directory Structure

```
backend/
├── index.js                           # Express entrypoint, middleware chain & route mounting
├── package.json                       # Scripts, dependencies & metadata
├── .env.example                       # Environment variable templates
├── migrations/                        # Database migration definitions
│   ├── 1737000000000_*.js             # Sequential node-pg-migrate JavaScript migrations
│   └── sql/                           # Raw SQL migration scripts
│       ├── supabase_migration.sql     # Core tables, extensions, RLS & triggers
│       ├── parent_portal_migration.sql# Parent-student relations, notifications, audit log
│       ├── accountant_migration.sql   # Fee structures, invoices, payment receipts
│       ├── notifications_migration.sql# Notification schemas & broadcast logs
│       └── chapa_migration.sql        # Chapa payment gateway integration schema
├── scripts/                           # Database & maintenance automation scripts
│   ├── run-migration.js               # Supabase direct SQL execution runner
│   ├── patch-missing-tables.js        # Validates & patches any missing tables/columns
│   └── seed-admin.js                  # Default superadmin and registrar account seeder
└── src/
    ├── db.js                          # Resilient PostgreSQL pool (pg) configuration
    ├── controllers/                   # HTTP request/response handlers
    │   ├── accountantController.js    # Invoices, fee structures, payments
    │   ├── authController.js          # Authentication, profile, password change
    │   ├── enrollmentController.js    # Admissions and enrollment workflows
    │   ├── examController.js          # Exam schedules, marksheets, report cards
    │   ├── notificationController.js  # Notifications and alerts
    │   ├── parentController.js        # Parent-linked children, attendance, notes
    │   ├── principalController.js     # School profile, analytics, announcements
    │   ├── registrarController.js     # Academic years, class sections, assignments
    │   ├── studentController.js       # Student profile, attendance, report cards
    │   └── teacherController.js       # Attendance taking, marks entry, class rosters
    ├── jobs/                          # Scheduled background cron jobs
    │   └── invoiceJob.js              # Daily cron identifying & flagging overdue invoices
    ├── middleware/                    # Express middleware pipeline
    │   ├── auth.js                    # JWT token extraction & verification
    │   ├── authorize.js               # Role-based access control (RBAC) guard
    │   ├── errorHandler.js            # Centralized error serialization
    │   ├── rateLimiter.js             # Brute-force & rate limiting configurations
    │   └── validate.js                # express-validator result inspector
    ├── routes/                        # Express routers matching controllers
    │   ├── accountantRoutes.js
    │   ├── authRoutes.js
    │   ├── enrollmentRoutes.js
    │   ├── examRoutes.js
    │   ├── notificationRoutes.js
    │   ├── parentRoutes.js
    │   ├── principalRoutes.js
    │   ├── registrarRoutes.js
    │   ├── studentRoutes.js
    │   └── teacherRoutes.js
    └── services/                      # Domain logic and database query execution
        ├── accountantService.js
        ├── authService.js
        ├── enrollmentService.js
        ├── examService.js
        ├── notificationService.js
        ├── parentService.js
        ├── principalService.js
        ├── registrarService.js
        ├── studentService.js
        └── teacherService.js
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **Node.js** (v18+) | JavaScript runtime |
| **Express 5** | High-performance Web & REST API framework |
| **PostgreSQL / pg (8.22)** | Relational database connection pool with SSL support |
| **Supabase Client** | Storage, realtime capabilities, and admin management |
| **JSON Web Token (JWT)** | Stateless authentication with access & refresh tokens |
| **Bcryptjs** | Salted cryptographic password hashing |
| **Helmet & CORS** | HTTP security headers and Cross-Origin Resource Sharing |
| **Express Rate Limit** | Rate limiting protection against DDoS & brute-force attacks |
| **Express Validator** | Declarative request payload validation and sanitization |
| **Node-Cron** | Automated recurring background jobs |
| **Node-PG-Migrate** | Programmatic database migrations |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or later)
- Access to a PostgreSQL database (e.g. [Supabase](https://supabase.com))

### Environment Configuration

1. In the `backend` directory, create a `.env` file from the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Update the environment variables in `.env`:
   ```env
   # Server
   PORT=5001

   # PostgreSQL Direct Connection String (from Supabase Database Settings)
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

   # Supabase Credentials
   SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

   # Security Secrets (generate 32+ character random strings)
   JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
   JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_32_characters

   # Frontend Origin
   CORS_ORIGIN=http://localhost:5173
   ```

### Database Setup & Migrations

Choose one of the following methods to prepare your database:

#### Method A: Automated Migration Runner
Run the Supabase SQL migration script using your service role key:
```bash
npm run migrate:supabase
```

#### Method B: Patch & Verify Schema
Ensure all tables, columns, constraints, and audit tables exist:
```bash
npm run patch:db
```

#### Method C: Run Node-PG-Migrate Migrations
Run the JavaScript migration files:
```bash
npm run migrate:up
```

#### Seed Default Administrator
Create the initial administrator and registrar accounts:
```bash
npm run seed:admin
```

### Running the Server

- **Development Mode** (with automatic restart via nodemon):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

Once started, the API is available at `http://localhost:5001`. A health-check endpoint is available at `http://localhost:5001/api/health`.

---

## 📜 NPM Scripts Reference

| Command | Action |
|---|---|
| `npm start` | Starts the Express server using standard Node.js |
| `npm run dev` | Starts the Express server with `nodemon` live-reload |
| `npm run migrate:supabase` | Runs `supabase_migration.sql` from `migrations/sql/` |
| `npm run patch:db` | Inspects database and adds any missing tables or columns |
| `npm run seed:admin` | Seeds initial default system administrator and registrar accounts |
| `npm run migrate:up` | Applies pending `node-pg-migrate` migrations |
| `npm run migrate:down` | Rolls back the latest `node-pg-migrate` migration batch |
| `npm run migrate:create <name>` | Scaffolds a new migration file in `migrations/` |

---

## 🌐 API Endpoints Reference

All routes are mounted under the `/api` prefix. Protected routes require an `Authorization: Bearer <token>` header.

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT tokens |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/refresh` | Public | Refresh expired access token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and role |
| `PUT` | `/api/auth/change-password` | Authenticated | Update user password |

### 2. Student Portal (`/api/student`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/student/dashboard` | Student | Overview of classes, attendance, and recent notices |
| `GET` | `/api/student/attendance` | Student | Daily attendance breakdown and percentage |
| `GET` | `/api/student/grades` | Student | Assessment marks, term grades, and GPA |
| `GET` | `/api/student/report-card` | Student | Official report card document data |
| `GET` | `/api/student/fees` | Student | Invoices, payment status, and receipts |

### 3. Parent Portal (`/api/parent`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/parent/children` | Parent | List all students linked to this parent |
| `GET` | `/api/parent/children/:id/attendance` | Parent | View child's attendance history |
| `GET` | `/api/parent/children/:id/grades` | Parent | View child's academic performance |
| `GET` | `/api/parent/invoices` | Parent | View outstanding fee invoices for linked children |
| `POST` | `/api/parent/messages` | Parent | Send communication to child's advisor/teacher |

### 4. Teacher Portal (`/api/teacher`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/teacher/classes` | Teacher | List classes and subjects assigned to teacher |
| `GET` | `/api/teacher/roster/:sectionId` | Teacher | Class roster with student records |
| `POST` | `/api/teacher/attendance` | Teacher | Submit daily attendance session and records |
| `POST` | `/api/teacher/marks` | Teacher | Submit assessment and examination marks |
| `GET` | `/api/teacher/advisory` | Teacher | Advisory class details and overview |

### 5. Registrar Portal (`/api/registrar`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/registrar/students` | Registrar | Search and view all enrolled student records |
| `POST` | `/api/registrar/admit` | Registrar | Process new student admission |
| `POST` | `/api/registrar/assign-section`| Registrar | Assign student to class grade and section |
| `POST` | `/api/registrar/promote` | Registrar | Bulk academic year progression & promotion |
| `GET` | `/api/registrar/calendar` | Registrar | Terms, academic calendar events, and schedules |

### 6. Accountant Portal (`/api/accountant`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/accountant/overview` | Accountant | Cashflow metrics, collected fees, outstanding balances |
| `GET` | `/api/accountant/fee-structures`| Accountant | View and configure grade-level fee templates |
| `POST` | `/api/accountant/invoices` | Accountant | Generate invoices for students/sections |
| `POST` | `/api/accountant/payments` | Accountant | Record manual bank/cash payment receipt |
| `GET` | `/api/accountant/reports` | Accountant | Financial collection reports |

### 7. Principal Portal (`/api/principal`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/principal/dashboard` | Principal | School-wide enrollment, attendance, and financial KPIs |
| `GET` | `/api/principal/school-profile`| Principal | School information, logo, contact, and settings |
| `PUT` | `/api/principal/school-profile`| Principal | Update school profile metadata |
| `POST` | `/api/principal/announcements` | Principal | Publish school-wide or portal-targeted announcement |
| `GET` | `/api/principal/staff` | Principal | Staff directory and workload overview |

### 8. Examinations & Schedules (`/api/exams`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/exams/schedules` | Authenticated | List scheduled exam dates, rooms, and subjects |
| `POST` | `/api/exams/schedules` | Registrar / Principal | Create or update exam schedule |
| `POST` | `/api/exams/marksheet` | Teacher | Submit bulk section marksheet for subject |
| `GET` | `/api/exams/report-card/:studentId` | Authenticated | Compile and fetch formal student report card |

### 9. Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | Retrieve in-app notifications for current user |
| `PATCH`| `/api/notifications/:id/read` | Authenticated | Mark notification as read |
| `POST` | `/api/notifications/broadcast` | Admin / Principal | Broadcast system notification |

---

## 🔒 Security & Architecture Patterns

1. **Role-Based Access Control (RBAC)**:
   Routes are guarded by `authorize(['ROLE1', 'ROLE2'])` middleware which validates the decoded JWT role before dispatching to the controller.
2. **Parameterized SQL Queries**:
   All database queries in `src/services/` use parameterized arguments (`$1`, `$2`, ...) with the `pg` pool to ensure total protection against SQL injection.
3. **Password Security**:
   User passwords are encrypted with `bcryptjs` using automatic salt generation before persisting to the database.
4. **Input Validation**:
   `express-validator` validates and sanitizes request parameters, body, and query schemas before invoking controller logic.
5. **Security Headers & Throttling**:
   - `helmet` sets secure HTTP headers (XSS filter, Content Security Policy, frameguard).
   - `express-rate-limit` prevents brute-force login attempts on `/api/auth` endpoints.
6. **Graceful Connection Handling**:
   PostgreSQL connection pool manages client lifecycle with automatic health checking and SSL support for hosted databases.
