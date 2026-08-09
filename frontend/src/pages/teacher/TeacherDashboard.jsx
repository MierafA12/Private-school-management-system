import { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../../api';
import { LoadingSpinner, ErrorState } from '../../components/shared/PageState';

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/teacher/dashboard');
        setStats(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="sp-page">
      <header className="sp-header">
        <div className="sp-header-titles">
          <h1 className="sp-title">Teacher Dashboard</h1>
          <p className="sp-subtitle">Overview of your classes and schedule today</p>
        </div>
      </header>

      {/* KPI Stats */}
      <div className="tp-kpi-grid">
        <div className="tp-kpi tp-kpi--indigo">
          <div className="tp-kpi-label">Today's Classes</div>
          <div className="tp-kpi-value">{stats?.classesToday?.length || 0}</div>
          <div className="tp-kpi-sub">Periods scheduled today</div>
          <Clock className="tp-kpi-icon" size={48} />
        </div>
        
        <div className="tp-kpi tp-kpi--green">
          <div className="tp-kpi-label">Assigned Classes</div>
          <div className="tp-kpi-value">{stats?.assignedClassCount || 0}</div>
          <div className="tp-kpi-sub">Total distinct classes</div>
          <Users className="tp-kpi-icon" size={48} />
        </div>
        
        <div className="tp-kpi tp-kpi--gold">
          <div className="tp-kpi-label">Pending Tasks</div>
          <div className="tp-kpi-value">2</div>
          <div className="tp-kpi-sub">Attendance & Grading</div>
          <CheckCircle className="tp-kpi-icon" size={48} />
        </div>
      </div>

      {/* Today's Schedule */}
      <section className="sp-card">
        <div className="sp-card-header">
          <h2 className="sp-card-title">Today's Schedule</h2>
        </div>
        <div className="sp-card-body p-0">
          {stats?.classesToday?.length === 0 ? (
            <div className="sp-empty-state">
              <BookOpen size={48} />
              <h3>No Classes Today</h3>
              <p>You have a free schedule today.</p>
            </div>
          ) : (
            <div className="tp-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Class (Section)</th>
                    <th>Subject</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.classesToday?.map((c) => (
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
