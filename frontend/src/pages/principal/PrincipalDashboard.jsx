import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, Layers, CalendarDays, TrendingUp, UserCheck,
  Megaphone, Clock, Sparkles, School, BarChart3,
} from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import { useAuth } from '../../context/AuthContext';
import './principal.css';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

export default function PrincipalDashboard() {
  const { user }  = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await principalApi.getDashboard());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading executive dashboard…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;
  if (!data)   return null;

  // Support both field naming conventions from the service
  const stats               = data.stats || data;
  const enrollment_overview = data.enrollment_overview || [];
  const attendance_trend    = data.attendance_trend    || [];

  const statCards = [
    {
      icon: Users,
      label: 'Active Students',
      value: stats.active_students ?? stats.totalStudents ?? '0',
      color: 'blue',
      sub: 'Enrolled across all grades',
    },
    {
      icon: BookOpen,
      label: 'Faculty Members',
      value: stats.active_teachers ?? stats.totalTeachers ?? '0',
      color: 'green',
      sub: 'Teaching assigned courses',
    },
    {
      icon: UserCheck,
      label: 'Administrative Staff',
      value: stats.active_staff ?? stats.totalStaff ?? '0',
      color: 'yellow',
      sub: 'Operations & support',
    },
    {
      icon: Layers,
      label: 'Active Classes',
      value: stats.total_classes ?? '0',
      color: 'purple',
      sub: 'Configured grade levels',
    },
    {
      icon: CalendarDays,
      label: 'Current Enrollments',
      value: stats.current_enrollments ?? '0',
      color: 'blue',
      sub: 'Active term registrants',
    },
    {
      icon: TrendingUp,
      label: "Today's Attendance",
      value: (stats.today_attendance_pct ?? stats.todayAttendancePct) != null
        ? `${stats.today_attendance_pct ?? stats.todayAttendancePct}%`
        : '—',
      color: (stats.today_attendance_pct ?? stats.todayAttendancePct) >= 90 ? 'green'
           : (stats.today_attendance_pct ?? stats.todayAttendancePct) >= 70 ? 'yellow' : 'red',
      sub: (stats.today_attendance_pct ?? stats.todayAttendancePct) >= 90 ? 'Strong attendance rate'
         : 'Requires follow-up',
    },
  ];

  // Group enrollment by class
  const byClass = {};
  let totalEnrolledCount = 0;
  enrollment_overview.forEach(r => {
    if (!byClass[r.class_name]) byClass[r.class_name] = { grade_level: r.grade_level, sections: [] };
    byClass[r.class_name].sections.push(r);
    totalEnrolledCount += parseInt(r.enrolled || 0, 10);
  });
  const sortedClasses = Object.entries(byClass).sort((a, b) => a[1].grade_level - b[1].grade_level);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* ── Executive Hero Banner ── */}
      <div className="principal-hero">
        <div className="principal-hero-content">
          <div className="principal-hero-badge">
            <Sparkles size={13} />
            <span>Academic Command Center</span>
          </div>
          <h1 className="principal-hero-title">
            Good {greeting()}, {user?.full_name?.split(' ')[0] || 'Principal'} 👋
          </h1>
          <p className="principal-hero-sub">
            {todayStr} · Overview of school operations, student engagement, and faculty workload.
          </p>
        </div>
        <div className="principal-hero-actions">
          <Link to="/principal/announcements" className="hero-btn-light">
            <Megaphone size={16} />
            <span>Broadcast Notice</span>
          </Link>
          <Link to="/principal/timetable" className="hero-btn-glass">
            <Clock size={16} />
            <span>Weekly Schedule</span>
          </Link>
        </div>
      </div>

      {/* ── Quick Action Shortcuts ── */}
      <div className="principal-quick-actions">
        <Link to="/principal/announcements" className="quick-action-card">
          <div className="quick-action-icon">
            <Megaphone size={20} />
          </div>
          <div>
            <div className="quick-action-title">Announcements</div>
            <div className="quick-action-sub">Broadcast to portals</div>
          </div>
        </Link>
        <Link to="/principal/timetable" className="quick-action-card">
          <div className="quick-action-icon">
            <Clock size={20} />
          </div>
          <div>
            <div className="quick-action-title">Timetable Builder</div>
            <div className="quick-action-sub">Manage class slots</div>
          </div>
        </Link>
        <Link to="/principal/classes" className="quick-action-card">
          <div className="quick-action-icon">
            <Layers size={20} />
          </div>
          <div>
            <div className="quick-action-title">Classes & Sections</div>
            <div className="quick-action-sub">Capacity & rooms</div>
          </div>
        </Link>
        <Link to="/principal/school-profile" className="quick-action-card">
          <div className="quick-action-icon">
            <School size={20} />
          </div>
          <div>
            <div className="quick-action-title">School Profile</div>
            <div className="quick-action-sub">Accreditation & info</div>
          </div>
        </Link>
      </div>

      {/* ── Key Metrics Grid ── */}
      <div className="sp-stats-grid">
        {statCards.map(({ icon: Icon, label, value, color, sub }) => (
          <div className="sp-stat-card" key={label}>
            <div className={`sp-stat-icon sp-stat-icon--${color}`}>
              <Icon size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="sp-stat-value">{value}</div>
              <div className="sp-stat-label">{label}</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                {sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-Column Operational Panels ── */}
      <div className="sp-two-col">
        {/* Attendance trend */}
        <div className="sp-card">
          <div className="sp-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} style={{ color: 'var(--primary, #991B1B)' }} />
              <span className="sp-card-title">Attendance Trend — Last 14 Days</span>
            </div>
            <span className="sp-badge sp-badge--green" style={{ fontSize: '0.72rem' }}>
              Real-time
            </span>
          </div>
          <div className="sp-card-body">
            {attendance_trend.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon">📊</div>
                No attendance sessions recorded yet for this period.
              </div>
            ) : (
              attendance_trend.map(r => {
                const color = r.pct >= 90 ? '#16A34A' : r.pct >= 70 ? '#D97706' : '#DC2626';
                const bgGradient = r.pct >= 90
                  ? 'linear-gradient(90deg, #16A34A 0%, #22C55E 100%)'
                  : r.pct >= 70
                  ? 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)'
                  : 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)';
                return (
                  <div className="trend-row" key={r.date}>
                    <span className="trend-label">{fmtDate(r.date)}</span>
                    <div className="trend-bar-wrap">
                      <div
                        className="trend-bar-fill"
                        style={{ width: `${r.pct}%`, background: bgGradient }}
                      />
                    </div>
                    <span className="trend-pct" style={{ color }}>
                      {r.pct}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Enrollment by class */}
        <div className="sp-card">
          <div className="sp-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <School size={18} style={{ color: 'var(--primary, #991B1B)' }} />
              <span className="sp-card-title">Enrollment by Class</span>
            </div>
            <span className="sp-badge sp-badge--blue">
              {totalEnrolledCount} Students Total
            </span>
          </div>
          {sortedClasses.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon">📋</div>
              No active class enrollments recorded yet.
            </div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Section</th>
                    <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClasses.flatMap(([className, { sections }]) =>
                    sections.map((s, i) => (
                      <tr key={`${className}-${s.section_name}`}>
                        {i === 0 && (
                          <td
                            rowSpan={sections.length}
                            style={{
                              fontWeight: 800,
                              verticalAlign: 'top',
                              paddingTop: '0.9rem',
                              color: 'var(--primary, #991B1B)',
                            }}
                          >
                            {className}
                          </td>
                        )}
                        <td>
                          <span
                            className="sp-badge sp-badge--gray"
                            style={{ fontWeight: 600 }}
                          >
                            Section {s.section_name}
                          </span>
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            textAlign: 'right',
                            paddingRight: '1.5rem',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {s.enrolled}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
