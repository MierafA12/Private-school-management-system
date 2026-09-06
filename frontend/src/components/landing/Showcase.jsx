import React from 'react';

/* ── Tiny reusable primitives ─────────────────────────────────────────────── */
const Bar  = ({ w = '100%', h = 10, r = 5, color = 'var(--sk-muted)' }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: color, flexShrink: 0 }} />
);
const Pill = ({ label, color }) => (
  <span style={{
    display: 'inline-block', padding: '2px 8px', borderRadius: 9999,
    fontSize: 10, fontWeight: 700, background: color + '22', color,
  }}>{label}</span>
);
const Avatar = ({ initials, color = '#6366F1', size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: color + '22', color, fontSize: size * 0.35,
    fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>{initials}</div>
);
const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--sk-card)', border: '1px solid var(--sk-border)',
    borderRadius: 10, padding: '12px 14px', ...style,
  }}>{children}</div>
);

/* ── Student Management mockup ───────────────────────────────────────────── */
const StudentMockup = () => (
  <div className="sk-window">
    <div className="sk-titlebar">
      <div className="sk-dots"><span /><span /><span /></div>
      <Bar w="120px" h={8} color="var(--sk-muted)" />
    </div>
    <div className="sk-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Bar w="100px" h={10} color="var(--sk-text)" />
        <Pill label="850 Students" color="#6366F1" />
      </div>
      {/* Student rows */}
      {[
        { init: 'AB', name: 'Abebe Bekele',   grade: 'Grade 9A', status: 'Active',   sc: '#22C55E' },
        { init: 'TH', name: 'Tigist Haile',   grade: 'Grade 7B', status: 'Active',   sc: '#22C55E' },
        { init: 'DG', name: 'Dawit Girma',    grade: 'Grade 11',  status: 'Enrolled', sc: '#3B82F6' },
        { init: 'SM', name: 'Sara Mulugeta',  grade: 'Grade 8A', status: 'Active',   sc: '#22C55E' },
      ].map(({ init, name, grade, status, sc }) => (
        <Card key={init} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={init} color="#6366F1" size={30} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Bar w="90px" h={8} color="var(--sk-text)" />
            <Bar w="60px" h={6} color="var(--sk-muted)" />
          </div>
          <Pill label={grade}  color="#6366F1" />
          <Pill label={status} color={sc} />
        </Card>
      ))}
    </div>
  </div>
);

/* ── Teacher Portal mockup ───────────────────────────────────────────────── */
const TeacherMockup = () => (
  <div className="sk-window">
    <div className="sk-titlebar">
      <div className="sk-dots"><span /><span /><span /></div>
      <Bar w="130px" h={8} color="var(--sk-muted)" />
    </div>
    <div className="sk-body">
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Classes',     val: '4',   color: '#F97316' },
          { label: 'Students',    val: '138', color: '#6366F1' },
          { label: 'Assignments', val: '12',  color: '#22C55E' },
        ].map(({ label, val, color }) => (
          <Card key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 9, color: 'var(--sk-muted)', marginTop: 3 }}>{label}</div>
          </Card>
        ))}
      </div>
      {/* Grade table */}
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--sk-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
        Recent Marks Entry
      </div>
      {[
        { name: 'Abebe B.', marks: '87',  grade: 'A',  gc: '#22C55E' },
        { name: 'Tigist H.', marks: '74', grade: 'B+', gc: '#3B82F6' },
        { name: 'Dawit G.',  marks: '91', grade: 'A+', gc: '#22C55E' },
      ].map(({ name, marks, grade, gc }) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--sk-border)' }}>
          <Avatar initials={name.slice(0,2)} color="#F97316" size={24} />
          <div style={{ flex: 1 }}><Bar w="70px" h={7} color="var(--sk-text)" /></div>
          <span style={{ fontSize: 10, color: 'var(--sk-muted)', fontWeight: 600 }}>{marks}/100</span>
          <Pill label={grade} color={gc} />
        </div>
      ))}
    </div>
  </div>
);

/* ── Parent Portal mockup (mobile) ────────────────────────────────────────── */
const ParentMockup = () => (
  <div className="sk-phone">
    <div className="sk-phone-notch" />
    {/* Status bar */}
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px 0', marginTop: 10 }}>
      <Bar w="40px" h={6} color="var(--sk-muted)" />
      <Bar w="30px" h={6} color="var(--sk-muted)" />
    </div>
    {/* Header */}
    <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar initials="FT" color="#EC4899" size={28} />
      <div style={{ flex: 1 }}>
        <Bar w="80px" h={7} color="var(--sk-text)" />
        <div style={{ marginTop: 3 }}><Bar w="50px" h={5} color="var(--sk-muted)" /></div>
      </div>
      <Pill label="Parent" color="#EC4899" />
    </div>
    {/* Child card */}
    <div style={{ margin: '4px 10px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginBottom: 4 }}>MY CHILD</div>
      <div style={{ fontSize: 12, color: '#fff', fontWeight: 800, marginBottom: 2 }}>Tigist Haile</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>Grade 7B &nbsp;·&nbsp; Term 1 2026</div>
    </div>
    {/* Quick stats */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, padding: '8px 10px' }}>
      {[
        { label: 'Attendance', val: '96%',   color: '#22C55E' },
        { label: 'Avg. Score', val: '83/100', color: '#F97316' },
        { label: 'Fees Due',   val: 'ETB 0',  color: '#22C55E' },
        { label: 'Notices',    val: '3 New',  color: '#EF4444' },
      ].map(({ label, val, color }) => (
        <div key={label} style={{
          background: 'var(--sk-card)', border: '1px solid var(--sk-border)',
          borderRadius: 8, padding: '7px 8px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color }}>{val}</div>
          <div style={{ fontSize: 8, color: 'var(--sk-muted)', marginTop: 2 }}>{label}</div>
        </div>
      ))}
    </div>
    {/* Notice */}
    <div style={{ margin: '0 10px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '7px 10px', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12 }}>📢</span>
      <div>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#EF4444', marginBottom: 2 }}>NEW NOTICE</div>
        <Bar w="110px" h={6} color="var(--sk-text)" />
        <div style={{ marginTop: 3 }}><Bar w="80px" h={5} color="var(--sk-muted)" /></div>
      </div>
    </div>
  </div>
);

/* ── Principal / Dashboard mockup ────────────────────────────────────────── */
const PrincipalMockup = () => (
  <div className="sk-window">
    <div className="sk-titlebar">
      <div className="sk-dots"><span /><span /><span /></div>
      <Bar w="140px" h={8} color="var(--sk-muted)" />
    </div>
    <div className="sk-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[
          { label: 'Students', val: '850', icon: '🎓', color: '#6366F1' },
          { label: 'Teachers', val: '62',  icon: '👩‍🏫', color: '#F97316' },
          { label: 'Classes',  val: '24',  icon: '🏫', color: '#22C55E' },
          { label: 'Revenue',  val: '98%', icon: '💰', color: '#EAB308' },
        ].map(({ label, val, icon, color }) => (
          <Card key={label} style={{ textAlign: 'center', padding: '10px 8px' }}>
            <div style={{ fontSize: 16 }}>{icon}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1, marginTop: 4 }}>{val}</div>
            <div style={{ fontSize: 8, color: 'var(--sk-muted)', marginTop: 2 }}>{label}</div>
          </Card>
        ))}
      </div>
      {/* Chart mockup */}
      <Card>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--sk-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Term Attendance Trend</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 50 }}>
          {[65, 80, 55, 90, 75, 95, 85, 70].map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0',
              background: i === 5 ? '#6366F1' : 'var(--sk-accent)',
              transition: 'height 0.3s',
            }} />
          ))}
        </div>
      </Card>
      {/* Recent actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          { text: 'Report cards published — Term 1', color: '#22C55E', time: '2h ago' },
          { text: 'Timetable updated — Grade 9',     color: '#6366F1', time: '5h ago' },
          { text: 'Fee structure set for 2026/27',   color: '#F97316', time: '1d ago' },
        ].map(({ text, color, time }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <Bar w="140px" h={7} color="var(--sk-text)" />
            <span style={{ fontSize: 9, color: 'var(--sk-muted)', marginLeft: 'auto', flexShrink: 0 }}>{time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── SHOWCASE DATA ────────────────────────────────────────────────────────── */
const ROWS = [
  {
    title:   'Student Management',
    desc:    'Maintain complete records for every enrolled student — grades, attendance, fees, enrolment history, and parent contacts — all in one centralised view.',
    bullets: ['Enrolment history', 'Attendance record', 'Fee status', 'Parent link'],
    accent:  '#6366F1',
    visual:  <StudentMockup />,
    reverse: false,
  },
  {
    title:   'Teacher Portal',
    desc:    "Empower educators with digital gradebooks, class timetables, assignment management, and one-click attendance marking — all from a single, intuitive portal.",
    bullets: ['Grade entry', 'Assignment creator', 'Attendance', 'Class timetable'],
    accent:  '#F97316',
    visual:  <TeacherMockup />,
    reverse: true,
  },
  {
    title:   'Parent Portal',
    desc:    "Keep every parent informed in real time. Fee balances, attendance rates, academic results, school notices, and direct teacher messaging — all on their phone.",
    bullets: ['Live attendance', 'Report cards', 'Fee payments', 'School notices'],
    accent:  '#EC4899',
    visual:  <ParentMockup />,
    reverse: false,
  },
  {
    title:   'Principal Dashboard',
    desc:    'A full operational overview at a glance. Manage academic years, approve report cards, set fee structures, build timetables, and monitor school-wide KPIs.',
    bullets: ['School setup', 'Timetable builder', 'Report cards', 'Analytics'],
    accent:  '#22C55E',
    visual:  <PrincipalMockup />,
    reverse: true,
  },
];

/* ═════════════════════════════════════════════════════════════════════════ */
const Showcase = () => (
  <>
    {/* ── Showcase rows ────────────────────────────────────────────────── */}
    <section className="showcase-section container">
      {ROWS.map(({ title, desc, bullets, accent, visual, reverse }) => (
        <div className={`sc-row${reverse ? ' sc-row--reverse' : ''}`} key={title}>
          {/* Content side */}
          <div className="sc-content">
            <h2 className="sc-title">{title}</h2>
            <p className="sc-desc">{desc}</p>
            <ul className="sc-bullets">
              {bullets.map(b => (
                <li key={b}>
                  <span className="sc-bullet-dot" style={{ background: accent }} />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          {/* Visual side */}
          <div className="sc-visual">
            {visual}
          </div>
        </div>
      ))}
    </section>

    {/* ── Role cards ───────────────────────────────────────────────────── */}
    <section className="roles-section bg-white">
      <div className="container">
        <div className="section-header text-center">
          <h2>Role-Based Dashboards</h2>
          <p>Tailored interfaces ensuring every user sees exactly what they need.</p>
        </div>
        <div className="roles-grid-cards">
          {[
            { role: 'Principal',  icon: '🏫', color: '#22C55E', items: ['School Setup', 'Report Cards', 'Analytics'] },
            { role: 'Registrar',  icon: '📋', color: '#6366F1', items: ['Enrolments', 'User Accounts', 'Promotions'] },
            { role: 'Teacher',    icon: '👩‍🏫', color: '#F97316', items: ['Grades', 'Attendance', 'Assignments'] },
            { role: 'Accountant', icon: '💰', color: '#EAB308', items: ['Invoices', 'Payments', 'Reports'] },
            { role: 'Parent',     icon: '👨‍👩‍👧', color: '#EC4899', items: ['Child Progress', 'Fees', 'Notices'] },
            { role: 'Student',    icon: '🎓', color: '#3B82F6', items: ['Timetable', 'Assignments', 'Report Card'] },
          ].map(({ role, icon, color, items }) => (
            <div className="role-ui-card" key={role}>
              <div className="role-card-header">
                <span className="role-card-icon" style={{ background: color + '18' }}>{icon}</span>
                <h4>{role}</h4>
              </div>
              <ul className="role-card-items">
                {items.map(item => (
                  <li key={item}>
                    <span className="role-item-dot" style={{ background: color }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Timeline ─────────────────────────────────────────────────────── */}
    <section className="timeline-section container">
      <div className="section-header text-center">
        <h2>School Operations Flow</h2>
        <p>Everything connected through one platform — from day one to graduation.</p>
      </div>
      <div className="timeline-grid">
        {[
          { step: 'Admission',    icon: '📝', color: '#6366F1' },
          { step: 'Enrolment',    icon: '📋', color: '#F97316' },
          { step: 'Attendance',   icon: '✅', color: '#22C55E' },
          { step: 'Assessment',   icon: '📊', color: '#EAB308' },
          { step: 'Report Cards', icon: '🎓', color: '#EC4899' },
        ].map(({ step, icon, color }) => (
          <div className="timeline-item" key={step}>
            <div className="timeline-dot" style={{ borderColor: color }} />
            <div className="timeline-icon-wrap" style={{ background: color + '18' }}>{icon}</div>
            <h4>{step}</h4>
          </div>
        ))}
      </div>
    </section>
  </>
);

export default Showcase;
