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

-- 3. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role app_role DEFAULT 'STUDENT'::app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- 5. Automatic User Profile Creation Trigger
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
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
