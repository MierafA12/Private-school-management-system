import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import api from '../../api';
import { LoadingSpinner, ErrorState } from '../../components/shared/PageState';

export default function TeacherTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const { data } = await api.get('/teacher/timetable');
        setTimetable(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  // Group by day
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const grouped = days.map(day => ({
    day,
    periods: timetable.filter(t => t.day_of_week === day).sort((a, b) => a.period_number - b.period_number)
  })).filter(g => g.periods.length > 0);

  return (
    <div className="sp-page">
      <header className="sp-header">
        <div className="sp-header-titles">
          <h1 className="sp-title">My Timetable</h1>
          <p className="sp-subtitle">Weekly teaching schedule</p>
        </div>
      </header>

      {grouped.length === 0 ? (
        <div className="sp-card">
          <div className="sp-empty-state">
            <Calendar size={48} />
            <h3>No Schedule Found</h3>
            <p>You don't have any periods scheduled in the timetable.</p>
          </div>
        </div>
      ) : (
        <div className="sp-card" style={{ padding: '1.5rem' }}>
          <div className="tp-table-wrapper">
            <table className="tp-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Period</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g) => (
                  g.periods.map((p, i) => (
                    <tr key={p.id}>
                      {i === 0 && (
                        <td rowSpan={g.periods.length} style={{ verticalAlign: 'top', fontWeight: 600, background: 'var(--bg-color)' }}>
                          {g.day}
                        </td>
                      )}
                      <td>Period {p.period_number}</td>
                      <td>{p.class_name} ({p.section_name})</td>
                      <td>{p.subject_name}</td>
                      <td>{p.room_number || 'TBD'}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
