import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Users, GraduationCap, BookOpen, UserCheck, Briefcase, ShieldCheck } from 'lucide-react';
import { registrarApi } from '../../api';
import { LoadingSpinner } from '../../components/shared/PageState';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  { role: 'Student',    label: 'Students',   icon: GraduationCap, color: '#3B82F6' },
  { role: 'Parent',     label: 'Parents',    icon: UserCheck,     color: '#10B981' },
  { role: 'Teacher',    label: 'Teachers',   icon: BookOpen,      color: '#F59E0B' },
  { role: 'Registrar',  label: 'Registrars', icon: Briefcase,     color: '#991B1B' },
  { role: 'Accountant', label: 'Finance',    icon: Briefcase,     color: '#8B5CF6' },
  { role: 'Principal',  label: 'Leadership', icon: ShieldCheck,   color: '#E11D48' },
];

export default function RegistrarDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const results = await Promise.all(
          ROLES.map(({ role }) =>
            registrarApi.getUsers({ role, limit: 1, offset: 0 }).then(d => [role, d.total || 0])
          )
        );
        setCounts(Object.fromEntries(results));
      } catch {
        /* counts are optional */
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Admin Overview</h1>
        <p className="sp-page-sub">Manage user accounts and directory access</p>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link
          to="/registrar/register"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
        >
          <UserPlus size={16} /> Register New User
        </Link>
        <Link
          to="/registrar/users"
          className="btn btn-secondary-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
        >
          <Users size={16} /> Directory & All Users
        </Link>
      </div>

      {/* Modern Stats Grid */}
      {loading ? (
        <LoadingSpinner message="Loading directory statistics…" />
      ) : (
        <div className="sp-stats-grid">
          {ROLES.map(({ role, label, icon: Icon }) => (
            <Link
              to={`/registrar/users?role=${role}`}
              key={role}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="sp-stat-card">
                <div className="sp-stat-header">
                  <span className="sp-stat-label">{label}</span>
                  <div className="sp-stat-icon">
                    <Icon size={16} />
                  </div>
                </div>
                <div className="sp-stat-value">{counts[role] ?? 0}</div>
                <div className="sp-stat-sub">Active registered accounts</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
