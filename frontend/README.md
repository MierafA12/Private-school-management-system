# 🎨 Private School Management System — Frontend Application

A responsive Single Page Application (SPA) providing dedicated, role-tailored portals for **Students**, **Parents**, **Teachers**, **Registrars**, **Accountants**, and **Principals**. Built with **React 19**, **Vite 8**, **React Router v7**, **Lucide Icons**, and a modular **Vanilla CSS Design System**.

---

## 📑 Table of Contents

- [Key Features & Role Portals](#-key-features--role-portals)
- [Directory Structure](#-directory-structure)
- [Architecture & Design System](#-architecture--design-system)
  - [Role-Guarded Routing](#role-guarded-routing)
  - [Domain-Driven API Client Layer](#domain-driven-api-client-layer)
  - [Modular CSS Architecture](#modular-css-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Development Server](#development-server)
  - [Production Build & Preview](#production-build--preview)
- [Available Scripts](#-available-scripts)
- [Code Conventions](#-code-conventions)

---

## 🌟 Key Features & Role Portals

The frontend automatically redirects authenticated users to their corresponding portal layout upon sign-in based on their assigned role:

### 1. 🎓 Student Portal (`/student/*`)
- **Dashboard**: Upcoming classes, timetable, attendance summary, and latest announcements.
- **Attendance**: Interactive calendar view of present, absent, late, and excused records.
- **Grades & Marks**: Breakdown of continuous assessments, quizzes, midterms, and finals per subject.
- **Report Card**: Official terminal performance document with teacher remarks and GPA.
- **Fee Invoices**: Statement of tuition fees, paid receipts, and balance due.

### 2. 👨‍👩‍👧 Parent Portal (`/parent/*`)
- **Multi-Child Switcher**: Easily toggle views across multiple children enrolled in the school.
- **Academic Progress**: Monitor real-time grades, exam results, and subject rankings.
- **Attendance Monitor**: Immediate visibility into absence or tardiness logs.
- **Fee Payments**: View issued tuition invoices and initiate online payment receipts.
- **Direct Messaging**: Communicate directly with classroom teachers and advisors.

### 3. 👩‍🏫 Teacher Portal (`/teacher/*`)
- **Assigned Classes**: Overview of assigned subjects, schedules, and student counts.
- **Daily Attendance Marking**: Fast attendance logging with bulk present/absent toggles.
- **Grade & Marksheet Entry**: Spreadsheet-style mark entry for continuous assessments and term exams.
- **Class Rosters**: Detailed student profiles, emergency contacts, and academic history.
- **Advisory Classroom**: Dedicated tools for assigned homeroom advisory duties.

### 4. 📋 Registrar Portal (`/registrar/*`)
- **Admissions Workflow**: Student registration, document verification, and ID generation.
- **Class & Section Allotment**: Section capacity planning and student assignments.
- **Academic Calendar**: Term dates, holidays, examination periods, and events.
- **Bulk Promotion**: End-of-year batch progression of students to next grade levels.

### 5. 💳 Accountant Portal (`/accountant/*`)
- **Financial Dashboard**: Overview of fees collected, outstanding invoices, and collection ratios.
- **Fee Structures**: Configure tuition, transport, lab, and activity fees per grade level.
- **Invoice Generation**: Bulk or individual invoice dispatch for academic terms.
- **Payment Collection**: Record manual cash/bank transfers and verify online payments.
- **Receipts & Reports**: Downloadable payment receipts and revenue statements.

### 6. 🏫 Principal Portal (`/principal/*`)
- **Executive Analytics**: School-wide KPIs on enrollment, attendance rates, and financial health.
- **School Profile**: School metadata, branding, address, and accreditation management.
- **Staff Oversight**: Teacher directory, subject allocations, and workload balancing.
- **Announcements**: Publish broadcast bulletins to targeted portals or the entire school.

---

## 📁 Directory Structure

```
frontend/
├── index.html                         # HTML5 template entrypoint
├── package.json                       # Dependencies, Vite plugins & scripts
├── vite.config.js                     # Vite build configuration & API reverse proxy
├── .env.example                       # Frontend environment variable template
└── src/
    ├── App.jsx                        # Route table, role guards & portal routing
    ├── main.jsx                       # React 19 root mounting with AuthProvider
    ├── api.js                         # Backward-compatible API facade re-export
    ├── api/                           # Domain-driven modular API client layer
    │   ├── client.js                  # Central fetch client with token injection & error parsing
    │   ├── auth.api.js                # Login, register, session verification
    │   ├── student.api.js             # Student dashboard, attendance, marks, fees
    │   ├── parent.api.js              # Parent children, reports, messaging
    │   ├── teacher.api.js             # Teacher classes, attendance, marksheets
    │   ├── registrar.api.js           # Admissions, promotions, section allotments
    │   ├── accountant.api.js          # Invoicing, fee structures, payments
    │   ├── principal.api.js           # KPIs, school profile, announcements
    │   ├── enrollment.api.js          # Enrollment applications
    │   ├── exam.api.js                # Schedules, bulk marksheet, report cards
    │   ├── notification.api.js        # Realtime alerts & notices
    │   └── index.js                   # Unified barrel export of all domain APIs
    ├── context/
    │   └── AuthContext.jsx            # User authentication state, role claims & tokens
    ├── components/
    │   ├── ComingSoon.jsx             # Placeholder screen for upcoming modules
    │   └── ProtectedRoute.jsx         # Access controller checking authentication & roles
    ├── pages/                         # Portal views organized by domain role
    │   ├── auth/                      # Login, register, password recovery
    │   ├── student/                   # Student portal layouts and feature pages
    │   ├── parent/                    # Parent portal views & child selectors
    │   ├── teacher/                   # Attendance, marks, class rosters
    │   ├── registrar/                 # Admissions, section assignments, calendar
    │   ├── accountant/                # Invoices, fee structures, receipts
    │   └── principal/                 # Executive dashboard, school profile
    └── styles/
        ├── index.css                  # Global tokens, typography, CSS variables, CSS reset
        └── portals/                   # Scoped portal layouts & styles
            ├── layout.css             # Shared portal shell (sidebar, topbar, user badge)
            ├── student.css            # Student portal specific views
            └── principal.css          # Principal KPIs and metric cards
```

---

## 🏛️ Architecture & Design System

### Role-Guarded Routing

All application routes are managed declaratively in `src/App.jsx` and wrapped with `ProtectedRoute`:

```jsx
<Route
  path="/teacher/*"
  element={
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <TeacherLayout />
    </ProtectedRoute>
  }
/>
```

- Unauthenticated visitors attempting to access protected routes are automatically redirected to `/login`.
- Authenticated users attempting to access routes outside their assigned role are redirected to their designated dashboard.

### Domain-Driven API Client Layer

Network requests are decoupled into modular services in `src/api/`:

1. **`client.js`**:
   - Prepends the configured `VITE_API_URL`.
   - Automatically attaches the JWT `Authorization: Bearer <token>` header from `localStorage`.
   - Normalizes JSON responses and throws structured error objects with server messages.
   - Dispatches a custom `auth:unauthorized` event on HTTP 401 to clear expired sessions.

2. **Domain Modules**:
   Every portal communicates with its dedicated API module (e.g. `teacherApi.submitAttendance()`, `accountantApi.createInvoice()`).

3. **Backward Compatibility**:
   `src/api.js` maintains a re-export bridge so legacy components importing from `'../../api'` continue to work seamlessly without refactoring.

### Modular CSS Architecture

Styles are designed for high visual polish, responsiveness, and separation of concerns:

- **`styles/index.css`**:
  - System font stack (Inter / system sans-serif).
  - Centralized CSS custom properties (`--primary`, `--bg`, `--text`, `--border`, `--radius`).
  - CSS reset and base element styling.
- **`styles/portals/layout.css`**:
  - Responsive multi-device sidebar navigation with collapsible toggle.
  - Sticky portal top navigation bar with breadcrumbs and user profile indicator.
  - Unified notification bell badge and quick action buttons.
- **Role-Specific Styles**:
  - `styles/portals/student.css`: Timetable cards, attendance indicators, grade progress bars.
  - `styles/portals/principal.css`: Metric highlight cards, trend indicators, KPI grids.

---

## 🛠️ Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | `^19.2.7` | UI component library with modern Hooks |
| **Vite** | `^8.1.1` | Next-generation fast frontend tooling and dev server |
| **React Router DOM** | `^7.18.1` | Declarative client-side routing & nested routes |
| **Lucide React** | `^1.25.0` | Comprehensive, consistent icon library |
| **Oxlint** | `^1.71.0` | Ultra-fast linter for code correctness |
| **Vanilla CSS** | Standard CSS3 | Maintainable, zero-runtime overhead styling system |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or later)
- Running [Backend API](../backend/README.md) instance (defaults to port `5001`)

### Environment Configuration

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Default configuration for local development:
```env
# Points to your running backend through the Vite dev proxy
VITE_API_URL=/api
```

> **Note on Proxying:** During local development, `vite.config.js` automatically proxies any request starting with `/api` to `http://localhost:5001`. In production, set `VITE_API_URL` to your full API domain (e.g. `https://api.yourdomain.com/api`).

### Development Server

Start the Vite development server:
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:5173
```

### Production Build & Preview

1. Compile the production bundle:
   ```bash
   npm run build
   ```
2. Locally preview the production build:
   ```bash
   npm run preview
   ```

---

## 📜 Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Launches local development server with Hot Module Replacement (HMR) |
| `npm run build` | Compiles and optimizes assets into the `dist/` directory |
| `npm run preview` | Runs a local static server to test the production `dist/` output |
| `npm run lint` | Runs `oxlint` across all files to catch syntax and logic errors |

---

## 💡 Code Conventions

1. **Components**:
   - Keep page components under their corresponding role folder in `src/pages/<role>/`.
   - Shared layout components should import from `src/styles/portals/layout.css`.
2. **API Interactions**:
   - Always import domain APIs from `src/api` (e.g. `import { studentApi } from '../../api';`).
   - Catch and display structured errors using the returned `err.message`.
3. **Icons**:
   - Use `lucide-react` icons for consistent sizing (`size={18}` or `size={20}`) across topbars, navbars, and buttons.
