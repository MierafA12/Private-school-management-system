import { useEffect, useState } from 'react';
import { studentApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtTime = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const daysUntil = (dateStr) => {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0)   return 'Passed';
  return `In ${diff} days`;
};

const urgencyBadge = (dateStr) => {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff <= 1)  return 'red';
  if (diff <= 7)  return 'yellow';
  return 'blue';
};

export default function StudentExams() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await studentApi.getExams());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading exam schedule…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  const upcoming = data?.upcoming || [];

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Exam Schedule</h1>
        <p className="sp-page-sub">Upcoming published exam dates for your class</p>
      </div>

      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title">📅 Upcoming Exams</span>
          <span className="sp-badge sp-badge--blue">{upcoming.length} scheduled</span>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState icon="📅" title="No upcoming exams" subtitle="Exam schedules will appear here once published by your school." />
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th>Countdown</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.title}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{e.subject_name}</td>
                    <td style={{ fontWeight: 500 }}>{fmtDate(e.exam_date)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {fmtTime(e.start_time)}{e.end_time ? ` – ${fmtTime(e.end_time)}` : ''}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{e.venue || '—'}</td>
                    <td>
                      <span className={`sp-badge sp-badge--${urgencyBadge(e.exam_date)}`}>
                        {daysUntil(e.exam_date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exam notes tip */}
      {upcoming.some(e => e.notes) && (
        <div style={{ marginTop: '1rem' }}>
          <div className="sp-card-title" style={{ marginBottom: '0.75rem', paddingLeft: '0.25rem' }}>📋 Exam Notes</div>
          {upcoming.filter(e => e.notes).map(e => (
            <div key={e.id} className="notice-item notice-item--info" style={{ marginBottom: '0.5rem' }}>
              <div className="notice-title">{e.title} — {e.subject_name}</div>
              <div className="notice-body">{e.notes}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
