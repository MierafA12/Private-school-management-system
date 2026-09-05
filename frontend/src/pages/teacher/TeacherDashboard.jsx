import { useState, useEffect } from 'react';
import { Users, Clock, BookOpen } from 'lucide-react';
import { teacherApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    try { setLoading(true); setError(null); setStats(await teacherApi.getDashboard()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  const today = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">
          Good {greeting()}, {user?.full_name?.split(' ')[0] || 'Teacher'} 👋
        </h1>
        <p className="sp-page-sub">Your teaching overview for {today}</p>
      </div>

      {/* Stats */}
      <div className="sp-stats-grid">
        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Today's Periods</span>
            <div className="sp-stat-icon"><Clock size={16} /></div>
          </div>
          <div className="sp-stat-value">{stats?.classesToday?.length || 0}</div>
          <div className="sp-stat-sub">Classes scheduled today</div>
        </div>
        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Sections</span>
            <div className="sp-stat-icon"><Users size={16} /></div>
          </div>
          <div className="sp-stat-value">{stats?.assignedClassCount || 0}</div>
          <div className="sp-stat-sub">Sections you teach</div>
        </div>
        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Subjects</span>
            <div className="sp-stat-icon"><BookOpen size={16} /></div>
          </div>
          <div className="sp-stat-value">{stats?.totalSubjects || 0}</div>
          <div className="sp-stat-sub">Subject assignments</div>
        </div>
      </div>

      {/* Today's schedule */}
      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title">📅 Today's Schedule — {today}</span>
          <span className="sp-badge sp-badge--blue">{stats?.classesToday?.length || 0} periods</span>
        </div>
        {!stats?.classesToday?.length ? (
          <EmptyState icon="😴" title="No classes today" subtitle="You have no teaching periods scheduled for today." />
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr><th>Period</th><th>Time</th><th>Class</th><th>Subject</th><th>Room</th></tr>
              </thead>
              <tbody>
                {stats.classesToday.map(c => (
                  <tr key={c.timetable_id}>
                    <td style={{ fontWeight: 700 }}>P{c.period_number}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {c.start_time?.slice(0,5) || '—'}{c.end_time ? ` – ${c.end_time.slice(0,5)}` : ''}
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.class_name} · Section {c.section_name}</td>
                    <td>{c.subject_name}</td>
                    <td style={{ fontSize: '0.82rem' }}>{c.room_number || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
