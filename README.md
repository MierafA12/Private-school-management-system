# Private School Management System (EduFlow Portal) — SRS v2.0

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

An integrated, cloud-ready software platform for private primary and secondary schools. The system streamlines academic administration, student lifecycle management, attendance tracking, automated grading, parent-teacher communication, fee invoicing, and role-based analytical reporting.

---

## ⚡ Supabase Setup Guide

Follow these steps to connect your project to Supabase:

### Step 1: Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and sign in.
2. Click **New Project**, enter a project name, database password, and choose your preferred region.

### Step 2: Copy API Credentials
1. Go to **Project Settings** (gear icon) → **API**.
2. Copy your **Project URL** and **`anon` `public` API Key**.
3. In your project `frontend/` folder, create a `.env` file (copied from `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

### Step 3: Run Database Schema in Supabase
1. In the Supabase Dashboard, open **SQL Editor** from the side menu.
2. Click **New Query** and paste the **Database Schema** code below.
3. Click **Run** to execute the script and set up tables, roles, and profile triggers.

---

## 👥 Supported User Roles

The platform enforces strict **Role-Based Access Control (RBAC)** across the system:

1. 🎓 **Student**: View own academic schedule, attendance history, assignments, exam results, and report cards.
2. 👨‍👩‍👧 **Parent / Guardian**: Linked to child accounts to monitor attendance, track academic progress, view fee statements, make online payments, and direct-message teachers.
3. 👩‍🏫 **Teacher**: Manage class rosters, record daily student attendance, enter assessment marks, compile report cards, and communicate with parents.
4. 📋 **Registrar**: Manage student admissions, section/grade assignments, academic calendar configuration, and bulk student progression/promotion.
5. 💳 **Accountant**: Manage fee structures, issue invoices, record manual payments, process gateway receipts, and generate financial reports.
6. 🏫 **Principal**: Oversight, academic performance approvals, narrative remarks, and school-wide announcements.
7. 🛡️ **System Administrator**: Manage system configurations, audit logs, user permissions, and security settings.

---

## 🛢️ Database Schema & Profile Trigger (SQL)

Execute this script in your Supabase **SQL Editor**:

```sql
-- 1. Enable required UUID & Crypto Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define App Role ENUM
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM (
      'PRINCIPAL',
      'REGISTRAR',
      'TEACHER',
      'ACCOUNTANT',
      'PARENT',
      'STUDENT'
    );
  END IF;
END $$;

-- 3. Create public.profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role app_role DEFAULT 'STUDENT'::app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all users to select profiles" ON public.profiles;
CREATE POLICY "Allow all users to select profiles" 
ON public.profiles FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Allow all users to insert profile" ON public.profiles;
CREATE POLICY "Allow all users to insert profile" 
ON public.profiles FOR INSERT 
TO public 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all users to update profile" ON public.profiles;
CREATE POLICY "Allow all users to update profile" 
ON public.profiles FOR UPDATE 
TO public 
USING (true);

-- 5. Automatic User Profile Creation Function & Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role public.app_role;
  raw_role_str text;
BEGIN
  raw_role_str := COALESCE(new.raw_user_meta_data->>'role', 'STUDENT');
  
  BEGIN
    assigned_role := raw_role_str::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    assigned_role := 'STUDENT'::public.app_role;
  END;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate Trigger cleanly on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Populate Existing Auth Users into public.profiles Table
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  COALESCE((raw_user_meta_data->>'role')::app_role, 'STUDENT'::app_role)
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
```

---

## 🛠️ Local Setup

### 1. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
npm run dev
```
Open `http://localhost:5173`.

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```

---

## 🏗️ Architecture & Code Structure

The project adheres to a clean, modular multi-tier architecture with separation of concerns between presentation, routing, request orchestration, and data access.

```
Private-school-management-system/
├── backend/
│   ├── index.js                     # Central Express server entrypoint & route registration
│   ├── migrations/                  # Database migration scripts (node-pg-migrate)
│   │   └── sql/                     # Raw SQL migration scripts (Supabase, Chapa, portals)
│   ├── scripts/                     # Seeders and maintenance scripts
│   └── src/
│       ├── controllers/             # Request & response controllers
│       │   ├── accountantController.js
│       │   ├── authController.js
│       │   ├── enrollmentController.js
│       │   ├── examController.js
│       │   ├── notificationController.js
│       │   ├── parentController.js
│       │   ├── principalController.js
│       │   ├── registrarController.js
│       │   ├── studentController.js
│       │   └── teacherController.js
│       ├── db.js                    # PostgreSQL connection pool (pg)
│       ├── jobs/                    # Scheduled background jobs (e.g. overdue invoices)
│       ├── middleware/              # Auth JWT, RBAC authorize, validation, error handler
│       ├── routes/                  # HTTP route definitions & validation middleware
│       │   ├── accountantRoutes.js
│       │   ├── authRoutes.js
│       │   ├── examRoutes.js
│       │   ├── notificationRoutes.js
│       │   ├── parentRoutes.js
│       │   ├── principalRoutes.js
│       │   ├── registrarRoutes.js
│       │   ├── studentRoutes.js
│       │   └── teacherRoutes.js
│       └── services/                # Business logic & database operations
│           ├── accountantService.js
│           ├── authService.js
│           ├── enrollmentService.js
│           ├── examService.js
│           ├── feeService.js
│           ├── notificationService.js
│           ├── parentService.js
│           ├── paymentGatewayService.js
│           ├── principalService.js
│           ├── registrarService.js
│           ├── studentService.js
│           └── teacherService.js
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx                  # Main application router and role-based route guards
        ├── api.js                   # Unified API bridge (backward compatible)
        ├── api/                     # Modular domain-driven API client layer
        │   ├── client.js            # Core fetch wrapper, token handling, auto-refresh queue
        │   ├── auth.api.js
        │   ├── principal.api.js
        │   ├── registrar.api.js
        │   ├── enrollment.api.js
        │   ├── student.api.js
        │   ├── parent.api.js
        │   ├── accountant.api.js
        │   ├── teacher.api.js
        │   ├── notification.api.js
        │   ├── exam.api.js
        │   └── index.js             # Consolidated API exports
        ├── components/              # Reusable UI components & layouts
        ├── context/                 # React Contexts (AuthContext, NotificationContext)
        ├── pages/                   # Portal views grouped by user role
        │   ├── accountant/
        │   ├── auth/
        │   ├── landing/
        │   ├── parent/
        │   ├── principal/
        │   │   ├── ...
        │   │   └── SchoolProfile.jsx
        │   ├── registrar/
        │   ├── shared/
        │   ├── student/
        ├── styles/                  # Modular CSS Architecture
        │   ├── index.css            # Global design tokens, reset, buttons, badges, variables
        │   ├── components/          # Component stylesheets (e.g. notifications.css)
        │   ├── pages/               # Public page styles (Auth.css, Landing.css)
        │   └── portals/             # Portal-specific stylesheets
        │       ├── layout.css       # Core shared portal shell (.sl-*), cards (.sp-*), tables
        │       ├── accountant.css   # Accountant portal KPIs & invoice styles
        │       ├── parent.css       # Parent portal child cards & payment styles
        │       ├── principal.css    # Principal forms, modals, tables, trend charts
        │       ├── registrar.css    # Registrar enrollment & registration forms
        │       ├── student.css      # Student portal specific overrides
        │       └── teacher.css      # Teacher grade sheets & attendance styles
        └── utils/                   # Shared client utility functions
```

