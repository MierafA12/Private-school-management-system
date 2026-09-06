import React, { useState, useEffect, useRef } from 'react';
import {
  Users, BookOpen, CreditCard, Bell, BarChart3, Calendar,
  Monitor, Smartphone, FileText, ClipboardList, Activity,
  GraduationCap, UserCheck, DollarSign, School, Layers,
} from 'lucide-react';

/* ── Animated counter ─────────────────────────────────────────────────────── */
function Counter({ target, suffix = '', prefix = '', decimals = 0, duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref          = useRef(null);
  const hasAnimated  = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;
      const t0 = performance.now();
      const tick = (now) => {
        const p  = Math.min((now - t0) / duration, 1);
        const e  = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setCount(e * target);
        if (p < 1) requestAnimationFrame(tick);
        else       setCount(target);
      };
      requestAnimationFrame(tick);
    };
    if (typeof IntersectionObserver !== 'undefined') {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { start(); obs.disconnect(); } },
        { threshold: 0.2 }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }
    start();
  }, [target, duration]);

  const fmt = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();
  return <span ref={ref} className="stat-counter">{prefix}{fmt}{suffix}</span>;
}

/* ── Solutions data ───────────────────────────────────────────────────────── */
const SOLUTIONS = [
  {
    icon: <GraduationCap size={28} strokeWidth={1.5} />,
    title: 'For Principals',
    subtitle: 'Academic Leadership',
    desc: 'Set up academic years, terms, class structures, grading scales, and fee schedules. Oversee timetables, approve report cards, and manage the full school calendar from one place.',
    pills: ['School Setup', 'Report Cards', 'Timetable', 'Fee Structures'],
  },
  {
    icon: <UserCheck size={28} strokeWidth={1.5} />,
    title: 'For Registrars',
    subtitle: 'Admissions & Enrolment',
    desc: 'Register students, parents, teachers, and staff. Manage enrolments, class promotions, and maintain the official student register across every scholastic term.',
    pills: ['Student Register', 'Enrolment', 'Promotions', 'User Accounts'],
  },
  {
    icon: <Monitor size={28} strokeWidth={1.5} />,
    title: 'For Teachers',
    subtitle: 'Classroom & Assessment',
    desc: "Mark attendance, enter exam marks, create and assign homework (individual or group), view your class timetable, and track every student's academic progress.",
    pills: ['Attendance', 'Grade Entry', 'Assignments', 'Timetable'],
  },
  {
    icon: <DollarSign size={28} strokeWidth={1.5} />,
    title: 'For Accountants',
    subtitle: 'Finance & Fee Collection',
    desc: 'Generate per-term fee invoices, record payments, track outstanding balances, and produce financial summaries for the bursar or principal.',
    pills: ['Invoicing', 'Payments', 'Arrears', 'Finance Reports'],
  },
  {
    icon: <Smartphone size={28} strokeWidth={1.5} />,
    title: 'For Parents',
    subtitle: 'Family Engagement',
    desc: "Stay informed on your child's attendance, academic results, and fees. Receive school announcements and communicate directly with teachers from any device.",
    pills: ['Report Cards', 'Attendance', 'Fee Status', 'Messaging'],
  },
  {
    icon: <School size={28} strokeWidth={1.5} />,
    title: 'For Students',
    subtitle: 'Scholar Dashboard',
    desc: 'Access your personalised timetable, assignments, exam schedules, and report cards. Submit assignments, track marks, and view fees — all in one secure portal.',
    pills: ['Timetable', 'Assignments', 'Exam Marks', 'Report Card'],
  },
];

/* ── Core modules ────────────────────────────────────────────────────────── */
const MODULES = [
  { icon: <ClipboardList />, title: 'Admissions',          desc: 'Manage applications, waiting lists and enrolment workflows.' },
  { icon: <Users />,         title: 'Student Management',  desc: 'Complete academic, medical, and behavioural records.' },
  { icon: <Monitor />,       title: 'Teacher Portal',      desc: 'Digital gradebooks, lesson planning, and attendance tools.' },
  { icon: <Smartphone />,    title: 'Parent Portal',        desc: 'Real-time updates and mobile access for families.' },
  { icon: <Activity />,      title: 'Attendance',          desc: 'Track daily attendance and auto-notify parents of absences.' },
  { icon: <FileText />,      title: 'Examinations',        desc: 'Schedule exams, manage grading scales and results entry.' },
  { icon: <BookOpen />,      title: 'Report Cards',        desc: 'Automate transcript generation and term-end grading.' },
  { icon: <CreditCard />,    title: 'Fee Management',      desc: 'Process payments, generate invoices, and manage arrears.' },
  { icon: <Bell />,          title: 'Communication',       desc: 'In-app notifications, announcements, and direct messaging.' },
  { icon: <Calendar />,      title: 'Academic Calendar',   desc: 'Schedule terms, holidays, and school-wide events.' },
  { icon: <Layers />,        title: 'Classes & Sections',  desc: 'Create class levels with inline sections and subject links.' },
  { icon: <BarChart3 />,     title: 'Analytics',           desc: 'Insights into enrolment trends and financial health.' },
];

/* ═════════════════════════════════════════════════════════════════════════ */
const Features = () => (
  <>
    {/* ── Tagline strip ────────────────────────────────────────────────── */}
    <section className="trusted-section container text-center">
      <h2 style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500, margin: 0, padding: '2rem 0', lineHeight: 1.6 }}>
        Elevating academic excellence and school operations through one unified digital campus.
      </h2>
    </section>

    {/* ── Stats ────────────────────────────────────────────────────────── */}
    <section className="stats-section container">
      <div className="stats-grid">
        <div className="stat-card">
          <h3><Counter target={850} suffix="+" duration={1600} /></h3>
          <p>Students Enrolled</p>
        </div>
        <div className="stat-card">
          <h3><Counter target={62} suffix="" duration={1400} /></h3>
          <p>Teaching Staff</p>
        </div>
        <div className="stat-card">
          <h3><Counter target={24} suffix="" duration={1400} /></h3>
          <p>Classes &amp; Sections</p>
        </div>
        <div className="stat-card">
          <h3><Counter target={18} suffix="" duration={1200} /></h3>
          <p>Years of Excellence</p>
        </div>
      </div>
    </section>

    {/* ── Role portals (was Solutions) ─────────────────────────────────── */}
    <section id="solutions" className="modules-section bg-white">
      <div className="container">
        <div className="section-header text-center">
          <h2>Built for Every Role</h2>
          <p>Role-based portals that give each person exactly what they need — nothing more, nothing less.</p>
        </div>
        <div className="solutions-grid">
          {SOLUTIONS.map(({ icon, title, subtitle, desc, pills }) => (
            <div className="solution-card" key={title}>
              <div className="solution-icon">{icon}</div>
              <div className="solution-meta">
                <span className="solution-subtitle">{subtitle}</span>
                <h4 className="solution-title">{title}</h4>
              </div>
              <p className="solution-desc">{desc}</p>
              <div className="solution-pills">
                {pills.map(p => <span className="solution-pill" key={p}>{p}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Core modules ─────────────────────────────────────────────────── */}
    <section id="product" className="modules-section">
      <div className="container">
        <div className="section-header text-center">
          <h2>Core Modules</h2>
          <p>Everything you need to run a modern educational institution.</p>
        </div>
        <div className="modules-grid">
          {MODULES.map(({ icon, title, desc }) => (
            <div className="module-card" key={title}>
              <div className="module-icon">{icon}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default Features;
