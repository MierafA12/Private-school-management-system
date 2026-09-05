import { useEffect, useState } from 'react';
import { CalendarDays, BookOpen, CreditCard, TrendingUp } from 'lucide-react';
import { studentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const statusColor = { Present: 'green', Late: 'yellow', Absent: 'red', Excused: 'blue' };

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function StudentDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const d = await studentApi.getDashboard();
      setData(d);
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

  const { student, enrollment, term, summary, recent_attendance, upcoming_exams } = data;

  const stats = [
    { icon: CalendarDays, label: 'Attendance',   value: summary.attendance_percentage != null ? `${summary.attendance_percentage}%` : '—', color: 'green',  sub: 'This semester'   },
    { icon: BookOpen,     label: 'Subjects',      value: summary.subject_count,                                                              color: 'blue',   sub: 'Enrolled'    },
    { icon: TrendingUp,   label: 'Semester',      value: term?.name || '—',                                                                  color: 'yellow', sub: 'Active semester' },
    { icon: CreditCard,   label: 'Fees Due',      value: summary.fee_outstanding > 0 ? `Birr ${summary.fee_outstanding.toLocaleString()}` : 'Cleared', color: summary.fee_outstanding > 0 ? 'red' : 'green', sub: 'Balance' },
  ];

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">
          Good {getGreeting()}, {student.first_name} 👋
        </h1>
        <p className="sp-page-sub">
          {enrollment
            ? `${enrollment.class_name} · Section ${enrollment.section_name} · ${enrollment.academic_year}`
            : 'No active enrollment found'}
        </p>
      </div>

      {/* Stats */}
      <div className="sp-stats-grid">
        {stats.map(({ icon: Icon, label, value, color, sub }) => (
          <div className="sp-stat-card" key={label}>
            <div className={`sp-stat-icon sp-stat-icon--${color}`}><Icon size={22} /></div>
            <div>
              <div className="sp-stat-value">{value}</div>
              <div className="sp-stat-label">{label} · {sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sp-two-col" style={{ marginBottom: '1rem' }}>
        {/* Upcoming Exams */}
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title">📅 Upcoming Exams</span>
            <span className="sp-badge sp-badge--blue">{upcoming_exams.length} scheduled</span>
          </div>
          {upcoming_exams.length === 0 ? (
            <div className="sp-empty"><div className="sp-empty-icon">📭</div>No upcoming exams</div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr><th>Subject</th><th>Date</th><th>Venue</th></tr>
                </thead>
                <tbody>
                  {upcoming_exams.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.subject_name}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtDate(e.exam_date)}</td>
                      <td style={{ fontSize: '0.8rem' }}>{e.venue || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title">✅ Recent Attendance</span>
            <span className="sp-badge sp-badge--green">Last 5 records</span>
          </div>
          {recent_attendance.length === 0 ? (
            <div className="sp-empty"><div className="sp-empty-icon">📭</div>No attendance records yet</div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recent_attendance.map((r) => (
                    <tr key={r.id}>
                      <td>{fmtDate(r.attendance_date)}</td>
                      <td>
                        <span className={`sp-badge sp-badge--${statusColor[r.attendance_status] || 'gray'}`}>
                          {r.attendance_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
