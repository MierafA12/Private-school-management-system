import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { teacherApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    try { setLoading(true); setError(null); setClasses(await teacherApi.getClasses() || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading classes…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  // Group by class + section
  const grouped = {};
  classes.forEach(c => {
    const key = `${c.class_id}-${c.section_id}`;
    if (!grouped[key]) grouped[key] = { class_name: c.class_name, section_name: c.section_name, subjects: [] };
    grouped[key].subjects.push({ name: c.subject_name, code: c.subject_code });
  });
  const sections = Object.values(grouped);

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">My Classes</h1>
        <p className="sp-page-sub">Classes and subjects assigned to you this term</p>
      </div>

      {sections.length === 0 ? (
        <div className="sp-card">
          <EmptyState icon="📖" title="No classes assigned"
            subtitle="You haven't been assigned to any class sections yet. The principal assigns teachers via the Timetable." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
          {sections.map((sec, i) => (
            <div key={i} className="sp-card" style={{ padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={18} color="#2563EB" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sec.class_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Section {sec.section_name}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {sec.subjects.map(s => (
                  <span key={s.code} className="sp-badge sp-badge--blue">{s.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
