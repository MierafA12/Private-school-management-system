import { useEffect, useState } from 'react';
import { Phone, Mail, UserCheck } from 'lucide-react';
import { studentApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

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

export default function StudentTimetable() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [view,    setView]    = useState('grid'); // 'grid' | 'list'

  const load = async () => {
    try { setLoading(true); setError(null); setData(await studentApi.getTimetable()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading timetable…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  const { timetable = [], grouped = {}, term, enrollment, advisor } = data || {};

  if (!timetable.length) {
    return (
      <div>
        <div className="sp-page-header"><h1 className="sp-page-title">Weekly Timetable</h1></div>
        <div className="sp-card">
          <EmptyState icon="📅" title="No timetable yet" subtitle="Your class schedule hasn't been published yet. Check back later." />
        </div>
      </div>
    );
  }

  const activeDays  = DAYS.filter(d => timetable.some(s => s.day_of_week === d));
  const usedPeriods = [...new Set(timetable.map(s => s.period_number))].sort((a, b) => a - b);

  // Build grid
  const grid = {};
  timetable.forEach(s => {
    if (!grid[s.day_of_week]) grid[s.day_of_week] = {};
    grid[s.day_of_week][s.period_number] = s;
  });

  // Today's classes
  const todaySlots = timetable
    .filter(t => t.day_of_week === TODAY)
    .sort((a, b) => a.period_number - b.period_number);

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Weekly Timetable</h1>
          <p className="sp-page-sub">
            {enrollment ? `${enrollment.class_name} · Section ${enrollment.section_name}` : ''}
            {term ? ` · ${term.name}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
          {['grid','list'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '0.45rem 0.875rem', fontSize: '0.82rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                background: view === v ? 'var(--primary)' : 'white',
                color: view === v ? 'white' : 'var(--text-muted)',
                textTransform: 'capitalize',
              }}>
              {v === 'grid' ? '🗓 Grid' : '📋 List'}
            </button>
          ))}
        </div>
      </div>

      {/* Class advisor banner */}
      {advisor && (
        <div style={{
          background: 'white', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)', padding: '0.75rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.875rem',
          marginBottom: '1rem', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: 'var(--primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem',
          }}>
            {`${advisor.first_name?.[0] || ''}${advisor.last_name?.[0] || ''}`.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{advisor.advisor_name}</span>
              <span className="sp-badge sp-badge--red" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <UserCheck size={10} /> Class Advisor
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.875rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
              {advisor.phone && (
                <a href={`tel:${advisor.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
                  <Phone size={12} /> {advisor.phone}
                </a>
              )}
              {advisor.email && (
                <a href={`mailto:${advisor.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
                  <Mail size={12} /> {advisor.email}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Today highlight */}
      {todaySlots.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '0.875rem 1.25rem', marginBottom: '1.25rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)' }}>📍 Today ({TODAY}):</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            {todaySlots.map(t => (
              <span key={t.id} style={{ background: 'white', border: '1px solid #FECACA', borderRadius: 999, padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
                P{t.period_number} · {t.subject_name}
                {t.room_number ? ` · ${t.room_number}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

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
              {/* Header row */}
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

              {/* Period rows */}
              {usedPeriods.map(p => (
                <>
                  <div key={`p${p}`} style={{
                    background: '#F8FAFC', borderRadius: 8, padding: '0.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)',
                    flexDirection: 'column', gap: '0.1rem',
                  }}>
                    <span>P{p}</span>
                    {(() => {
                      const s = timetable.find(t => t.period_number === p);
                      return s?.start_time
                        ? <span style={{ fontSize: '0.6rem', fontWeight: 400 }}>{fmtTime(s.start_time)}</span>
                        : null;
                    })()}
                  </div>

                  {activeDays.map(d => {
                    const slot = grid[d]?.[p];
                    if (!slot) return <div key={d} style={{ borderRadius: 8, minHeight: 90, background: '#FAFAFA' }} />;

                    return (
                      <div key={d} style={{
                        borderRadius: 8, padding: '0.65rem 0.75rem',
                        background: DAY_BG[d], borderLeft: `3px solid ${DAY_BORDER[d]}`,
                        minHeight: 90,
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {slot.subject_name}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: '#4B5563', marginTop: '0.15rem' }}>
                          👤 {slot.teacher_name}
                        </div>
                        {slot.room_number && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            🚪 {slot.room_number}
                          </div>
                        )}
                        {(slot.start_time || slot.end_time) && (
                          <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
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

      {/* List view — shows teacher + phone */}
      {view === 'list' && (
        <div className="sp-card">
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr><th>Day</th><th>P#</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th></tr>
              </thead>
              <tbody>
                {DAYS.filter(d => activeDays.includes(d)).flatMap(d => {
                  const daySlots = timetable
                    .filter(t => t.day_of_week === d)
                    .sort((a, b) => a.period_number - b.period_number);
                  return daySlots.map((t, i) => (
                    <tr key={t.id} style={{ background: d === TODAY ? '#FFF7F7' : '' }}>
                      {i === 0 && (
                        <td rowSpan={daySlots.length}
                          style={{ fontWeight: 700, borderRight: `3px solid ${DAY_BORDER[d]}`, background: DAY_BG[d], verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          {d === TODAY ? `${d} 📍` : d}
                        </td>
                      )}
                      <td style={{ fontWeight: 700 }}>P{t.period_number}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {t.start_time ? `${fmtTime(t.start_time)} – ${fmtTime(t.end_time)}` : '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{t.subject_name}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.teacher_name}</div>
                        {t.teacher_phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            <Phone size={11} /> {t.teacher_phone}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{t.room_number || '—'}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
