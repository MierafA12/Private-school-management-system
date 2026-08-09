import { useState, useEffect } from 'react';
import { teacherApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

export default function TeacherTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherApi.getTimetable();
      setTimetable(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  if (loading) return <LoadingSpinner message="Loading timetable schedule..." />;
  if (error) return <ErrorBanner message={error} onRetry={fetchTimetable} />;

  // Group by day
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const grouped = days.map(day => ({
    day,
    periods: timetable.filter(t => t.day_of_week === day).sort((a, b) => a.period_number - b.period_number)
  })).filter(g => g.periods.length > 0);

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">My Timetable</h1>
        <p className="sp-page-sub">Weekly teaching schedule across all assigned classes</p>
      </div>

      {grouped.length === 0 ? (
        <section className="sp-card">
          <div style={{ padding: '2.5rem' }}>
            <EmptyState
              icon="📅"
              title="No Schedule Found"
              subtitle="You do not have any teaching periods scheduled in the active timetable."
            />
          </div>
        </section>
      ) : (
        <section className="sp-card">
          <div className="sp-card-header">
            <h2 className="sp-card-title">Weekly Schedule</h2>
          </div>
          <div className="sp-card-body" style={{ padding: 0 }}>
            <div className="tp-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="tp-table">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>Day</th>
                    <th style={{ width: '120px' }}>Period</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((g) => (
                    g.periods.map((p, i) => (
                      <tr key={p.id || `${g.day}-${i}`}>
                        {i === 0 && (
                          <td
                            rowSpan={g.periods.length}
                            style={{
                              verticalAlign: 'top',
                              fontWeight: 700,
                              background: '#FAFAFA',
                              color: 'var(--text-main)',
                              borderRight: '1px solid var(--border-color)',
                            }}
                          >
                            {g.day}
                          </td>
                        )}
                        <td><strong>Period {p.period_number}</strong></td>
                        <td>{p.class_name} ({p.section_name})</td>
                        <td>{p.subject_name}</td>
                        <td>{p.room_number || p.room_id ? `Room ${p.room_number || p.room_id}` : 'TBD'}</td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
