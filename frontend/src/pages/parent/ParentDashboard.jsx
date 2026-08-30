import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CreditCard, Bell, TrendingUp } from 'lucide-react';
import { parentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import { useAuth } from '../../context/AuthContext';

const fmtCurrency = (n) =>
  n > 0 ? `KES ${parseFloat(n).toLocaleString()}` : 'Cleared';

const priorityClass = { URGENT: 'urgent', HIGH: 'high', NORMAL: 'normal', LOW: 'low' };

export default function ParentDashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const d = await parentApi.getDashboard();
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

  const { parent, children, term, recent_announcements } = data;

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">
          Good {greeting()}, {parent?.first_name || user?.full_name} 👋
        </h1>
        <p className="sp-page-sub">
          {term ? `Active term: ${term.name}` : 'Welcome to the Parent Portal'}
        </p>
      </div>

      {/* Children cards */}
      <div className="sp-card-header" style={{ marginBottom: '0.75rem', padding: 0 }}>
        <span className="sp-card-title">Your Children</span>
        <Link to="/parent/children" style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
          View all →
        </Link>
      </div>

      {children.length === 0 ? (
        <div className="sp-empty">
          <div className="sp-empty-icon">👨‍👧</div>
          No children linked to your account yet. Contact the registrar.
        </div>
      ) : (
        <div className="pp-child-grid" style={{ marginBottom: '1.5rem' }}>
          {children.map((child) => (
            <div className="pp-child-card" key={child.id}>
              <div className="pp-child-header">
                <div className="pp-child-avatar">
                  {child.first_name[0]}{child.last_name[0]}
                </div>
                <div>
                  <div className="pp-child-name">{child.first_name} {child.last_name}</div>
                  <div className="pp-child-grade">
                    {child.class_name
                      ? `${child.class_name}${child.section_name ? ` · Section ${child.section_name}` : ''}`
                      : 'Not enrolled'}
                  </div>
                </div>
              </div>
              <div className="pp-child-stats">
                <div className="pp-child-stat">
                  <div className="pp-child-stat-val" style={{ color: child.attendance_pct >= 75 ? '#16A34A' : 'var(--primary)' }}>
                    {child.attendance_pct != null ? `${child.attendance_pct}%` : '—'}
                  </div>
                  <div className="pp-child-stat-lbl">Attendance</div>
                </div>
                <div className="pp-child-stat">
                  <div className="pp-child-stat-val" style={{ color: child.fee_balance > 0 ? 'var(--primary)' : '#16A34A' }}>
                    {fmtCurrency(child.fee_balance)}
                  </div>
                  <div className="pp-child-stat-lbl">Fee Balance</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <Link
                  to={`/parent/attendance?child=${child.id}`}
                  className="sp-badge sp-badge--blue"
                  style={{ textDecoration: 'none' }}
                >
                  <CalendarDays size={12} style={{ marginRight: 3 }} /> Attendance
                </Link>
                <Link
                  to={`/parent/grades?child=${child.id}`}
                  className="sp-badge sp-badge--green"
                  style={{ textDecoration: 'none' }}
                >
                  <TrendingUp size={12} style={{ marginRight: 3 }} /> Grades
                </Link>
                <Link
                  to={`/parent/fees`}
                  className="sp-badge sp-badge--yellow"
                  style={{ textDecoration: 'none' }}
                >
                  <CreditCard size={12} style={{ marginRight: 3 }} /> Fees
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Announcements */}
      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title"><Bell size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Recent Notices</span>
          <Link to="/parent/notices" style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
            View all →
          </Link>
        </div>
        {recent_announcements.length === 0 ? (
          <div className="sp-empty"><div className="sp-empty-icon">📭</div>No announcements</div>
        ) : (
          <div style={{ padding: '0.75rem 1.25rem' }} className="pp-notice-list">
            {recent_announcements.map((a) => (
              <div key={a.id} className={`pp-notice pp-notice--${priorityClass[a.priority] || 'normal'}`}>
                <div className="pp-notice-title">{a.title}</div>
                <div className="pp-notice-body">{a.body?.slice(0, 120)}{a.body?.length > 120 ? '…' : ''}</div>
                <div className="pp-notice-footer">
                  <span className="pp-notice-date">
                    {new Date(a.publish_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className={`sp-badge sp-badge--${a.priority === 'URGENT' ? 'red' : a.priority === 'HIGH' ? 'yellow' : 'blue'}`}>
                    {a.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
