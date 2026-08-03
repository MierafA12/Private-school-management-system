import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Users, GraduationCap, BookOpen, UserCheck, Briefcase } from 'lucide-react';
import { registrarApi } from '../../api';
import { LoadingSpinner } from '../../components/shared/PageState';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['Student','Parent','Teacher','Registrar','Accountant','Principal'];
const ROLE_ICON = { Student: GraduationCap, Parent: UserCheck, Teacher: BookOpen, Registrar: Briefcase, Accountant: Briefcase, Principal: Briefcase };
const ROLE_COLOR = { Student: 'blue', Parent: 'green', Teacher: 'yellow', Registrar: 'red', Accountant: 'purple', Principal: 'red' };

export default function RegistrarDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const results = await Promise.all(
          ROLES.map(r => registrarApi.getUsers({ role: r, limit: 1, offset: 0 }).then(d => [r, d.total]))
        );
        setCounts(Object.fromEntries(results));
      } catch { /* counts are optional */ }
      finally { setLoading(false); }
    };
    fetchCounts();
  }, []);

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Welcome, {user?.full_name?.split(' ')[0] || 'Registrar'} 👋</h1>
        <p className="sp-page-sub">Manage user registrations and account access</p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <Link
          to="/registrar/register"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.7rem 1.25rem', background: 'var(--primary)',
            color: 'white', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
          }}
        >
          <UserPlus size={18} /> Register New User
        </Link>
        <Link
          to="/registrar/users"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.7rem 1.25rem', background: 'white', border: '1px solid var(--border-color)',
            color: 'var(--text-main)', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
          }}
        >
          <Users size={18} /> View All Users
        </Link>
      </div>

      {/* Stats */}
      {loading ? <LoadingSpinner message="Loading stats…" /> : (
        <div className="sp-stats-grid">
          {ROLES.map(role => {
            const Icon  = ROLE_ICON[role] || Users;
            const color = ROLE_COLOR[role] || 'blue';
            return (
              <Link to={`/registrar/users?role=${role}`} key={role} style={{ textDecoration: 'none' }}>
                <div className="sp-stat-card" style={{ cursor: 'pointer' }}>
                  <div className={`sp-stat-icon sp-stat-icon--${color}`}><Icon size={22} /></div>
                  <div>
                    <div className="sp-stat-value">{counts[role] ?? '—'}</div>
                    <div className="sp-stat-label">{role}s registered</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Info card */}
      <div className="sp-card" style={{ marginTop: '1.5rem' }}>
        <div className="sp-card-header">
          <span className="sp-card-title">ℹ️ Registration Notes</span>
        </div>
        <div className="sp-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            'Accounts are created instantly — users can log in right away.',
            'Student numbers (STU-YYYY-XXXX) and admission numbers are auto-generated.',
            'Teacher and staff employee numbers are auto-generated.',
            'Parents can be linked to a student at registration time using the student number.',
            'Passwords can be reset from the All Users page at any time.',
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
