import { useEffect, useState } from 'react';
import { Users, BookOpen, Layers, CalendarDays, TrendingUp, UserCheck } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import { useAuth } from '../../context/AuthContext';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

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
      setLoading(true); setError(null);
      setData(await principalApi.getDashboard());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;
  if (!data)   return null;

  // Support both field naming conventions from the service
  const stats              = data.stats || data;
  const enrollment_overview = data.enrollment_overview || [];
  const attendance_trend    = data.attendance_trend    || [];

  const statCards = [
    { icon: Users,       label: 'Active Students',   value: stats.active_students   ?? stats.totalStudents    ?? '—', color: 'blue'   },
    { icon: BookOpen,    label: 'Active Teachers',    value: stats.active_teachers   ?? stats.totalTeachers    ?? '—', color: 'green'  },
    { icon: UserCheck,   label: 'Staff',              value: stats.active_staff      ?? stats.totalStaff       ?? '—', color: 'yellow' },
    { icon: Layers,      label: 'Classes',            value: stats.total_classes     ?? '—',                           color: 'purple' },
    { icon: CalendarDays,label: 'Enrolled (Current)', value: stats.current_enrollments ?? '—',                        color: 'blue'   },
    {
      icon: TrendingUp, label: "Today's Attendance",
      value: (stats.today_attendance_pct ?? stats.todayAttendancePct) != null
        ? `${stats.today_attendance_pct ?? stats.todayAttendancePct}%` : '—',
      color: (stats.today_attendance_pct ?? stats.todayAttendancePct) >= 90 ? 'green'
           : (stats.today_attendance_pct ?? stats.todayAttendancePct) >= 70 ? 'yellow' : 'red',
    },
  ];

  // Group enrollment by class
  const byClass = {};
  enrollment_overview.forEach(r => {
    if (!byClass[r.class_name]) byClass[r.class_name] = { grade_level: r.grade_level, sections: [] };
    byClass[r.class_name].sections.push(r);
  });
  const sortedClasses = Object.entries(byClass).sort((a, b) => a[1].grade_level - b[1].grade_level);

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">
          Good {greeting()}, {user?.full_name?.split(' ')[0] || 'Principal'} 👋
        </h1>
        <p className="sp-page-sub">School overview — current academic year</p>
      </div>

      <div className="sp-stats-grid">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div className="sp-stat-card" key={label}>
            <div className={`sp-stat-icon sp-stat-icon--${color}`}><Icon size={22} /></div>
            <div>
              <div className="sp-stat-value">{value}</div>
              <div className="sp-stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sp-two-col">
        {/* Attendance trend */}
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title">📈 Attendance — Last 14 Days</span>
          </div>
          <div className="sp-card-body">
            {attendance_trend.length === 0 ? (
              <div className="sp-empty"><div className="sp-empty-icon">📊</div>No attendance data yet</div>
            ) : attendance_trend.map(r => (
              <div className="trend-row" key={r.date}>
                <span className="trend-label">{fmtDate(r.date)}</span>
                <div className="trend-bar-wrap">
                  <div className="trend-bar-fill" style={{
                    width: `${r.pct}%`,
                    background: r.pct >= 90 ? '#16A34A' : r.pct >= 70 ? '#D97706' : '#DC2626',
                  }} />
                </div>
                <span className="trend-pct">{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enrollment by class */}
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title">🏫 Enrollment by Class</span>
            <span className="sp-badge sp-badge--blue">Current Year</span>
          </div>
          {sortedClasses.length === 0 ? (
            <div className="sp-empty"><div className="sp-empty-icon">📋</div>No enrollment data yet</div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead><tr><th>Class</th><th>Section</th><th>Students</th></tr></thead>
                <tbody>
                  {sortedClasses.flatMap(([className, { sections }]) =>
                    sections.map((s, i) => (
                      <tr key={`${className}-${s.section_name}`}>
                        {i === 0 && (
                          <td rowSpan={sections.length} style={{ fontWeight: 700, verticalAlign: 'top', paddingTop: '0.9rem' }}>
                            {className}
                          </td>
                        )}
                        <td style={{ color: 'var(--text-muted)' }}>Section {s.section_name}</td>
                        <td style={{ fontWeight: 600 }}>{s.enrolled}</td>
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
