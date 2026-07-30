import { useEffect, useState } from 'react';
import { studentApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Assign a colour based on subject name hash so the same subject is always the same colour
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
const subjectColor = (() => {
  const cache = {};
  let idx = 0;
  return (name) => {
    if (!cache[name]) { cache[name] = COLORS[idx % COLORS.length]; idx++; }
    return cache[name];
  };
})();

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const TODAY_NAME = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

export default function StudentTimetable() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await studentApi.getTimetable());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading timetable…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  const { timetable = [], grouped = {}, term, enrollment } = data || {};

  if (!timetable.length) {
    return (
      <div>
        <div className="sp-page-header">
          <h1 className="sp-page-title">Weekly Timetable</h1>
        </div>
        <div className="sp-card"><EmptyState icon="📅" title="No timetable yet" subtitle="Your class schedule hasn't been set up for this term." /></div>
      </div>
    );
  }

  // Build period numbers array
  const periods = [...new Set(timetable.map(s => s.period_number))].sort((a, b) => a - b);

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Weekly Timetable</h1>
        <p className="sp-page-sub">
          {enrollment ? `${enrollment.class_name} · Section ${enrollment.section_name}` : ''}{term ? ` · ${term.name}` : ''}
        </p>
      </div>

      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title">📅 Class Schedule</span>
          {term && <span className="sp-badge sp-badge--green">{term.name} Active</span>}
        </div>
        <div className="sp-card-body" style={{ overflowX: 'auto' }}>
          <div className="tt-grid">
            {/* Header row */}
            <div className="tt-header">Period</div>
            {DAYS.map(d => (
              <div
                key={d}
                className="tt-header"
                style={d === TODAY_NAME ? { background: '#FEF2F2', color: 'var(--primary)' } : {}}
              >
                {d}
                {d === TODAY_NAME && <div style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>Today</div>}
              </div>
            ))}

            {/* Period rows */}
            {periods.map(pNum => (
              <>
                <div key={`t${pNum}`} className="tt-time">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.72rem' }}>P{pNum}</div>
                    {/* show time from first slot of this period */}
                    {(() => {
                      const slot = timetable.find(s => s.period_number === pNum);
                      return slot?.start_time
                        ? <div style={{ fontSize: '0.62rem', marginTop: 2 }}>{fmtTime(slot.start_time)}</div>
                        : null;
                    })()}
                  </div>
                </div>

                {DAYS.map(day => {
                  const slot = (grouped[day] || []).find(s => s.period_number === pNum);
                  if (!slot) {
                    return <div key={day} className="tt-cell tt-cell--empty" />;
                  }
                  const color = subjectColor(slot.subject_name);
                  return (
                    <div key={day} className={`tt-cell tt-cell--${color}`}>
                      <div className="tt-subject">{slot.subject_name}</div>
                      <div className="tt-teacher">{slot.teacher_name}</div>
                      {slot.room_number && <div className="tt-room">{slot.room_number}</div>}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
