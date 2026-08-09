import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import api from '../../api';
import { LoadingSpinner, ErrorState } from '../../components/shared/PageState';

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await api.get('/teacher/classes');
        setClasses(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="sp-page">
      <header className="sp-header">
        <div className="sp-header-titles">
          <h1 className="sp-title">My Classes</h1>
          <p className="sp-subtitle">Classes and subjects assigned to you</p>
        </div>
      </header>

      <section className="sp-card">
        <div className="sp-card-body p-0">
          {classes.length === 0 ? (
            <div className="sp-empty-state">
              <BookOpen size={48} />
              <h3>No Classes Assigned</h3>
              <p>You have not been assigned any classes or subjects yet.</p>
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
                      <td>{c.class_name}</td>
                      <td>{c.section_name}</td>
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
