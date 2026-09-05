import { useEffect, useState } from 'react';
import { CalendarDays, BookOpen, CreditCard, TrendingUp, Phone, Mail, UserCheck } from 'lucide-react';
import { studentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const statusColor = { Present: 'green', Late: 'yellow', Absent: 'red', Excused: 'blue' };

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

function AdvisorCard({ advisor }) {
  if (!advisor) return null;
  const initials = `${advisor.first_name?.[0] || ''}${advisor.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div style={{
      background: 'white', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Avatar */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--primary)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '1rem', flexShrink: 0,
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{advisor.advisor_name}</span>
          <span className="sp-badge sp-badge--red" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <UserCheck size={10} /> Class Advisor
          </span>
        </div>
        {advisor.qualification && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {advisor.qualification}{advisor.specialization ? ` · ${advisor.specialization}` : ''}
          </div>
        )}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
          {advisor.phone && (
            <a href={`tel:${advisor.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
              <Phone size={13} /> {advisor.phone}
            </a>
          )}
          {advisor.email && (
            <a href={`mailto:${advisor.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
              <Mail size={13} /> {advisor.email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    try { setLoading(true); setError(null); setData(await studentApi.getDashboard()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;
  if (!data)   return null;

  const { student, enrollment, term, summary, advisor, recent_attendance, upcoming_exams } = data;

  const stats = [
    { icon: CalendarDays, label: 'Attendance',  value: summary.attendance_percentage != null ? `${summary.attendance_percentage}%` : '—', color: 'green',  sub: 'This term' },
    { icon: BookOpen,     label: 'Subjects',     value: summary.subject_count,                                                               color: 'blue',   sub: 'Enrolled'  },
    { icon: TrendingUp,   label: 'Term',         value: term?.name || '—',                                                                   color: 'yellow', sub: 'Active'    },
    { icon: CreditCard,   label: 'Fees Due',     value: summary.fee_outstanding > 0 ? `KES ${summary.fee_outstanding.toLocaleString()}` : 'Cleared',
      color: summary.fee_outstanding > 0 ? 'red' : 'green', sub: 'Balance' },
  ];

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Good {getGreeting()}, {student.first_name} 👋</h1>
        <p className="sp-page-sub">
          {enrollment
            ? `${enrollment.class_name} · Section ${enrollment.section_name} · ${enrollment.academic_year}`
            : 'No active enrollment found'}
        </p>
      </div>

      {/* Class advisor banner */}
      <AdvisorCard advisor={advisor} />

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
                <thead><tr><th>Subject</th><th>Date</th><th>Venue</th></tr></thead>
                <tbody>
                  {upcoming_exams.map(e => (
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
            <div className="sp-empty"><div className="sp-empty-icon">📭</div>No records yet</div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead><tr><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {recent_attendance.map(r => (
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
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
