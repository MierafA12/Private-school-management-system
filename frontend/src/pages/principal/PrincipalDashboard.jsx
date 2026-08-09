import { useEffect, useState } from 'react';
import { Users, GraduationCap, UserCheck, TrendingUp, Bell } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

export default function PrincipalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await principalApi.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading school analytics…" />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div className="principal-dashboard">
      <div className="sp-page-header">
        <h1 className="sp-page-title">School Analytics</h1>
        <p className="sp-page-sub">High-level overview of Haile-Manas Academy</p>
      </div>

      <div className="principal-stats-grid">
        <div className="principal-stat-card">
          <div className="stat-icon-wrapper blue">
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-val">{data.totalStudents || 0}</div>
            <div className="stat-lbl">Active Students</div>
          </div>
        </div>

        <div className="principal-stat-card">
          <div className="stat-icon-wrapper green">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-val">{data.totalTeachers || 0}</div>
            <div className="stat-lbl">Total Teachers</div>
          </div>
        </div>

        <div className="principal-stat-card">
          <div className="stat-icon-wrapper purple">
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-val">{data.totalStaff || 0}</div>
            <div className="stat-lbl">Support Staff</div>
          </div>
        </div>

        <div className="principal-stat-card">
          <div className="stat-icon-wrapper yellow">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-val">{data.todayAttendancePct != null ? `${data.todayAttendancePct}%` : '—'}</div>
            <div className="stat-lbl">Today's Attendance</div>
          </div>
        </div>
      </div>
      
      <div className="sp-card" style={{ marginTop: '2rem' }}>
        <div className="sp-card-header">
          <span className="sp-card-title"><Bell size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Quick Actions</span>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem', width: '100%' }}>
            Welcome to the Principal Dashboard. This is your central hub for school-wide oversight. 
            More actionable insights, approval workflows, and teacher management tools will be added here.
          </p>
        </div>
      </div>
    </div>
  );
}
