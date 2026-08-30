import { useState, useEffect } from 'react';
import { teacherApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherApi.getClasses();
      setClasses(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  if (loading) return <LoadingSpinner message="Loading assigned classes..." />;
  if (error) return <ErrorBanner message={error} onRetry={fetchClasses} />;

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">My Classes</h1>
        <p className="sp-page-sub">Classes and subjects assigned to your teaching roster</p>
      </div>

      <section className="sp-card">
        <div className="sp-card-header">
          <h2 className="sp-card-title">Assigned Classes & Subjects</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total: <strong>{classes.length}</strong>
          </span>
        </div>
        <div className="sp-card-body" style={{ padding: 0 }}>
          {classes.length === 0 ? (
            <div style={{ padding: '2.5rem' }}>
              <EmptyState
                icon="📖"
                title="No Classes Assigned"
                subtitle="You have not been assigned to any class sections or subjects yet."
              />
            </div>
          ) : (
            <div className="tp-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Subject</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.class_name}</strong></td>
                      <td>Section {c.section_name}</td>
                      <td>{c.subject_name}</td>
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
