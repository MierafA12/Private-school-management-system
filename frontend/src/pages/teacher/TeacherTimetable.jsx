import { useState, useEffect } from 'react';
import { teacherApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_BG = {
  Monday: '#FEF2F2', Tuesday: '#EFF6FF', Wednesday: '#F0FDF4',
  Thursday: '#FFFBEB', Friday: '#F5F3FF', Saturday: '#F9FAFB',
};
const DAY_BORDER = {
  Monday: '#DC2626', Tuesday: '#2563EB', Wednesday: '#16A34A',
  Thursday: '#D97706', Friday: '#7C3AED', Saturday: '#6B7280',
};

const TODAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m}${hr >= 12 ? 'PM' : 'AM'}`;
};

export default function TeacherTimetable() {
  const { user }          = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [view,      setView]      = useState('grid'); // 'grid' | 'list'

  const load = async () => {
    try { setLoading(true); setError(null); setTimetable(await teacherApi.getTimetable() || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading your timetable…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  // Compute active days + periods
  const activeDays  = DAYS.filter(d => timetable.some(t => t.day_of_week === d));
  const usedPeriods = [...new Set(timetable.map(t => t.period_number))].sort((a, b) => a - b);

  if (!timetable.length) {
    return (
      <div>
        <div className="sp-page-header">
          <h1 className="sp-page-title">My Timetable</h1>
        </div>
        <div className="sp-card">
          <EmptyState icon="📅" title="No schedule yet" subtitle="The principal hasn't assigned you any teaching periods for this term." />
        </div>
      </div>
    );
  }

  // Unique classes I teach
  const myClasses = [...new Map(
    timetable.map(t => [`${t.class_name}-${t.section_name}`, { class: t.class_name, section: t.section_name }])
  ).values()];

  // Build grid: day → period → slot
  const grid = {};
  timetable.forEach(s => {
    if (!grid[s.day_of_week]) grid[s.day_of_week] = {};
    grid[s.day_of_week][s.period_number] = s;
  });

  // Today's classes
  const todaySlots = timetable.filter(t => t.day_of_week === TODAY)
    .sort((a, b) => a.period_number - b.period_number);

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div>
          <h1 className="sp-page-title">My Timetable</h1>
          <p className="sp-page-sub">
            {user?.full_name} · {timetable[0]?.term_name || ''} ·{' '}
            {timetable.length} period{timetable.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
          {['grid', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '0.45rem 0.875rem', fontSize: '0.82rem', fontWeight: 600,
                background: view === v ? 'var(--primary)' : 'white',
                color: view === v ? 'white' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              }}>
              {v === 'grid' ? '🗓 Grid' : '📋 List'}
            </button>
          ))}
        </div>
      </div>

      {/* Today highlight */}
      {todaySlots.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)' }}>📍 Today ({TODAY}):</span>
          {todaySlots.map(t => (
            <span key={t.id} style={{ background: 'white', border: '1px solid #FECACA', borderRadius: 999, padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
              P{t.period_number} · {t.subject_name} · {t.class_name} {t.section_name}
              {t.room_number ? ` · ${t.room_number}` : ''}
            </span>
          ))}
        </div>
      )}

      {/* My classes summary */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'center' }}>My classes:</span>
        {myClasses.map(c => (
          <span key={`${c.class}-${c.section}`} className="sp-badge sp-badge--blue">
            {c.class} · Section {c.section}
          </span>
        ))}
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className="sp-card">
          <div className="sp-card-body" style={{ overflowX: 'auto', padding: '1rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `72px repeat(${activeDays.length}, 1fr)`,
              gap: 5,
              minWidth: activeDays.length * 150 + 72,
            }}>
              {/* Header */}
              <div style={{ padding: '0.5rem', background: '#F8FAFC', borderRadius: 8, textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                PERIOD
              </div>
              {activeDays.map(d => (
                <div key={d} style={{
                  padding: '0.5rem', borderRadius: 8, textAlign: 'center',
                  background: d === TODAY ? DAY_BG[d] : '#F8FAFC',
                  borderBottom: `2px solid ${d === TODAY ? DAY_BORDER[d] : 'var(--border-color)'}`,
                  fontSize: '0.78rem', fontWeight: 700,
                  color: d === TODAY ? DAY_BORDER[d] : 'var(--text-main)',
                }}>
                  {d} {d === TODAY && '📍'}
                </div>
              ))}

              {/* Rows */}
              {usedPeriods.map(p => (
                <>
                  <div key={`p${p}`} style={{
                    background: '#F8FAFC', borderRadius: 8, padding: '0.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)',
                    flexDirection: 'column', gap: '0.1rem',
                  }}>
                    <span>P{p}</span>
                    {/* show time from first slot of this period */}
                    {(() => {
                      const s = timetable.find(t => t.period_number === p);
                      return s?.start_time ? <span style={{ fontSize: '0.62rem', fontWeight: 400 }}>{fmtTime(s.start_time)}</span> : null;
                    })()}
                  </div>

                  {activeDays.map(d => {
                    const slot = grid[d]?.[p];
                    if (!slot) return (
                      <div key={d} style={{ borderRadius: 8, minHeight: 80, background: '#FAFAFA' }} />
                    );

                    return (
                      <div key={d} style={{
                        borderRadius: 8, padding: '0.65rem 0.75rem',
                        background: DAY_BG[d], borderLeft: `3px solid ${DAY_BORDER[d]}`,
                        minHeight: 80,
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {slot.subject_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '0.15rem', fontWeight: 600 }}>
                          {slot.class_name} · Section {slot.section_name}
                        </div>
                        {slot.room_number && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            🚪 {slot.room_number}
                          </div>
                        )}
                        {(slot.start_time || slot.end_time) && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            ⏰ {fmtTime(slot.start_time)}–{fmtTime(slot.end_time)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="sp-card">
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr><th>Day</th><th>Period</th><th>Time</th><th>Class</th><th>Subject</th><th>Room</th></tr>
              </thead>
              <tbody>
                {DAYS.filter(d => activeDays.includes(d)).flatMap(d =>
                  timetable
                    .filter(t => t.day_of_week === d)
                    .sort((a, b) => a.period_number - b.period_number)
                    .map((t, i) => (
                      <tr key={t.id} style={{ background: d === TODAY ? '#FEF9F9' : '' }}>
                        {i === 0 && (
                          <td rowSpan={timetable.filter(x => x.day_of_week === d).length}
                            style={{ fontWeight: 700, borderRight: `3px solid ${DAY_BORDER[d]}`, background: DAY_BG[d], verticalAlign: 'middle' }}>
                            {d === TODAY ? `${d} 📍` : d}
                          </td>
                        )}
                        <td style={{ fontWeight: 600 }}>P{t.period_number}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {t.start_time ? `${fmtTime(t.start_time)} – ${fmtTime(t.end_time)}` : '—'}
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.class_name} · Section {t.section_name}</td>
                        <td>{t.subject_name}</td>
                        <td style={{ fontSize: '0.82rem' }}>{t.room_number || '—'}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
