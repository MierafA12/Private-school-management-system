import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle2 } from 'lucide-react';
import { teacherApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherApi.getDashboard();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorBanner message={error} onRetry={fetchDashboard} />;

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Teacher Dashboard</h1>
        <p className="sp-page-sub">Overview of your classes and schedule today</p>
      </div>

      {/* Clean Metric Cards (Linear style) */}
      <div className="sp-stats-grid">
        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Today's Classes</span>
            <div className="sp-stat-icon"><Clock size={16} /></div>
          </div>
          <div className="sp-stat-value">{stats?.classesToday?.length || 0}</div>
          <div className="sp-stat-sub">Periods scheduled today</div>
        </div>
        
        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Assigned Classes</span>
            <div className="sp-stat-icon"><Users size={16} /></div>
          </div>
          <div className="sp-stat-value">{stats?.assignedClassCount || 0}</div>
          <div className="sp-stat-sub">Total distinct class sections</div>
        </div>
        
        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Teaching Status</span>
            <div className="sp-stat-icon"><CheckCircle2 size={16} color="#059669" /></div>
          </div>
          <div className="sp-stat-value" style={{ color: '#059669', fontSize: '1.4rem' }}>Active</div>
          <div className="sp-stat-sub">Ready for grading & attendance</div>
        </div>
      </div>

      {/* Today's Schedule */}
      <section className="sp-card">
        <div className="sp-card-header">
          <h2 className="sp-card-title">Today's Schedule</h2>
        </div>
        <div className="sp-card-body" style={{ padding: 0 }}>
          {!stats?.classesToday || stats.classesToday.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon">📚</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>No Classes Scheduled Today</div>
              <div style={{ fontSize: '0.85rem' }}>You have no teaching periods scheduled for today.</div>
            </div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Class (Section)</th>
                    <th>Subject</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.classesToday.map((c) => (
                    <tr key={c.timetable_id}>
                      <td><strong>Period {c.period_number}</strong></td>
                      <td>{c.class_name} ({c.section_name})</td>
                      <td>{c.subject_name}</td>
                      <td>{c.room_id ? `Room ${c.room_id}` : 'TBD'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
