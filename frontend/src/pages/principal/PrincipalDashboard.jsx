import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, Layers, CalendarDays, TrendingUp, UserCheck,
  Megaphone, Clock, School, BarChart3,
} from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import './principal.css';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';

export default function PrincipalDashboard() {
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

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
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
      sub: 'Enrolled across all grades',
    },
    {
      icon: BookOpen,
      label: 'Faculty Members',
      value: stats.active_teachers ?? stats.totalTeachers ?? '0',
      sub: 'Teaching assigned courses',
    },
    {
      icon: UserCheck,
      label: 'Administrative Staff',
      value: stats.active_staff ?? stats.totalStaff ?? '0',
      sub: 'Operations & support',
    },
    {
      icon: Layers,
      label: 'Active Classes',
      value: stats.total_classes ?? '0',
      sub: 'Configured grade levels',
    },
    {
      icon: CalendarDays,
      label: 'Current Enrollments',
      value: stats.current_enrollments ?? '0',
      sub: 'Active term registrants',
    },
    {
      icon: TrendingUp,
      label: "Today's Attendance",
      value: (stats.today_attendance_pct ?? stats.todayAttendancePct) != null
        ? `${stats.today_attendance_pct ?? stats.todayAttendancePct}%`
        : '—',
      sub: (stats.today_attendance_pct ?? stats.todayAttendancePct) >= 90 ? 'High attendance rate'
         : 'Requires review',
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
    <div>
      {/* ── Standard Clean Page Header ── */}
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Dashboard</h1>
          <p className="sp-page-sub">
            {todayStr} · Overview of school operations, student enrollment, and attendance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/principal/announcements" className="btn-ghost">
            <Megaphone size={14} />
            <span>Broadcast Notice</span>
          </Link>
          <Link to="/principal/timetable" className="btn-ghost">
            <Clock size={14} />
            <span>Weekly Schedule</span>
          </Link>
        </div>
      </div>

      {/* ── Key Metrics Grid ── */}
      <div className="sp-stats-grid">
        {statCards.map(({ icon: Icon, label, value, sub }) => (
          <div className="sp-stat-card" key={label}>
            <div className="sp-stat-header">
              <span className="sp-stat-label">{label}</span>
              <span className="sp-stat-icon">
                <Icon size={15} />
              </span>
            </div>
            <div className="sp-stat-value">{value}</div>
            {sub && <div className="sp-stat-sub">{sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Operational Panels ── */}
      <div className="sp-two-col">
        {/* Attendance trend */}
        <div className="sp-card">
          <div className="sp-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <BarChart3 size={16} style={{ color: '#475569' }} />
              <span className="sp-card-title">Attendance Trend — Last 14 Days</span>
            </div>
          </div>
          <div className="sp-card-body">
            {attendance_trend.length === 0 ? (
              <div className="sp-empty">
                No attendance sessions recorded yet for this period.
              </div>
            ) : (
              attendance_trend.map(r => {
                const color = r.pct >= 90 ? '#10B981' : r.pct >= 70 ? '#F59E0B' : '#EF4444';
                return (
                  <div className="trend-row" key={r.date}>
                    <span className="trend-label">{fmtDate(r.date)}</span>
                    <div className="trend-bar-wrap">
                      <div
                        className="trend-bar-fill"
                        style={{ width: `${r.pct}%`, background: color }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <School size={16} style={{ color: '#475569' }} />
              <span className="sp-card-title">Enrollment by Class</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
              {totalEnrolledCount} Students Total
            </span>
          </div>
          {sortedClasses.length === 0 ? (
            <div className="sp-empty">
              No active class enrollments recorded yet.
            </div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Section</th>
                    <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Students</th>
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
                              fontWeight: 600,
                              verticalAlign: 'top',
                              color: '#0F172A',
                            }}
                          >
                            {className}
                          </td>
                        )}
                        <td>
                          <span className="sp-badge sp-badge--gray">
                            Section {s.section_name}
                          </span>
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            textAlign: 'right',
                            paddingRight: '1.25rem',
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
