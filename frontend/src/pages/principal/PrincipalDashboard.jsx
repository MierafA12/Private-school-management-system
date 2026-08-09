import { useEffect, useState } from 'react';
import { Users, GraduationCap, UserCheck, TrendingUp, ShieldCheck } from 'lucide-react';
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

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading school analytics…" />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Executive Analytics</h1>
        <p className="sp-page-sub">High-level institutional oversight and student metrics</p>
      </div>

      {/* Modern Metric Cards */}
      <div className="sp-stats-grid">
        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Active Students</span>
            <div className="sp-stat-icon">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="sp-stat-value">{data.totalStudents || 0}</div>
          <div className="sp-stat-sub">Enrolled students</div>
        </div>

        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Faculty & Teachers</span>
            <div className="sp-stat-icon">
              <Users size={16} />
            </div>
          </div>
          <div className="sp-stat-value">{data.totalTeachers || 0}</div>
          <div className="sp-stat-sub">Active teaching staff</div>
        </div>

        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Support Staff</span>
            <div className="sp-stat-icon">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="sp-stat-value">{data.totalStaff || 0}</div>
          <div className="sp-stat-sub">Admin & operations staff</div>
        </div>

        <div className="sp-stat-card">
          <div className="sp-stat-header">
            <span className="sp-stat-label">Today's Attendance</span>
            <div className="sp-stat-icon">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="sp-stat-value">
            {data.todayAttendancePct != null ? `${data.todayAttendancePct}%` : '—'}
          </div>
          <div className="sp-stat-sub">School-wide presence rate</div>
        </div>
      </div>
    </div>
  );
}
