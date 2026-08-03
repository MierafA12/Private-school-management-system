import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, TrendingUp, FileText, CreditCard, MessageSquare } from 'lucide-react';
import { parentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

export default function ParentChildren() {
  const [children, setChildren] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const data = await parentApi.getChildren();
      setChildren(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading children…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  const QUICK_LINKS = (id) => [
    { to: `/parent/attendance?child=${id}`, icon: CalendarDays, label: 'Attendance', color: 'blue'   },
    { to: `/parent/grades?child=${id}`,     icon: TrendingUp,   label: 'Grades',     color: 'green'  },
    { to: `/parent/report-cards?child=${id}`, icon: FileText,   label: 'Reports',    color: 'yellow' },
    { to: `/parent/fees`,                   icon: CreditCard,   label: 'Fees',       color: 'red'    },
    { to: `/parent/messages`,               icon: MessageSquare,label: 'Messages',   color: 'blue'   },
  ];

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">My Children</h1>
        <p className="sp-page-sub">Overview of all linked students and quick access to their records</p>
      </div>

      {children.length === 0 ? (
        <div className="sp-empty">
          <div className="sp-empty-icon">👨‍👧</div>
          No children are linked to your account. Contact the registrar to link your child.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {children.map((child) => (
            <div key={child.id} className="sp-card">
              <div className="sp-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="pp-child-avatar" style={{ width: 52, height: 52, fontSize: '1.1rem' }}>
                    {child.first_name[0]}{child.last_name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                      {child.first_name} {child.last_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {child.class_name
                        ? `${child.class_name}${child.section_name ? ` · Section ${child.section_name}` : ''}${child.academic_year ? ` · ${child.academic_year}` : ''}`
                        : 'Not currently enrolled'}
                    </div>
                  </div>
                </div>
                {child.is_primary_contact && (
                  <span className="sp-badge sp-badge--yellow">Primary Contact</span>
                )}
              </div>

              <div className="sp-card-body">
                {/* Info row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Student Number', value: child.student_number || '—' },
                    { label: 'Roll Number',    value: child.roll_number    || '—' },
                    { label: 'Status',         value: child.current_status || '—' },
                    { label: 'Grade Level',    value: child.grade_level != null ? `Grade ${child.grade_level}` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--bg-color)', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.15rem' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Quick links */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {QUICK_LINKS(child.id).map(({ to, icon: Icon, label, color }) => (
                    <Link
                      key={label}
                      to={to}
                      className={`sp-badge sp-badge--${color}`}
                      style={{ textDecoration: 'none', padding: '0.4rem 0.8rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Icon size={13} /> {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
