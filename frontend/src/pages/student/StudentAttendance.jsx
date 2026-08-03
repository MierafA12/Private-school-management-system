import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { studentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLOR = { Present: 'present', Absent: 'absent', Late: 'late', Excused: 'excused', Sick: 'excused', Permission: 'excused' };
const BADGE_COLOR  = { Present: 'green',   Absent: 'red',    Late: 'yellow', Excused: 'blue', Sick: 'blue', Permission: 'blue' };
const EMOJI        = { Present: '✅', Absent: '❌', Late: '⏰', Excused: '📝', Sick: '🤒', Permission: '📋' };

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function StudentAttendance() {
  const now = new Date();
  const [year,    setYear]    = useState(now.getFullYear());
  const [month,   setMonth]   = useState(now.getMonth() + 1); // 1-based
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const d = await studentApi.getAttendance(year, month);
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay    = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  // Map date -> status
  const attendanceMap = {};
  (data?.monthly_records || []).forEach(r => {
    const d = new Date(r.attendance_date).getDate();
    attendanceMap[d] = r.attendance_status;
  });

  // Summary counts from term_summary
  const summaryMap = {};
  (data?.term_summary || []).forEach(r => { summaryMap[r.attendance_status] = parseInt(r.count); });

  const summaryItems = [
    { label: 'Present', key: 'Present', color: 'green'  },
    { label: 'Absent',  key: 'Absent',  color: 'red'    },
    { label: 'Late',    key: 'Late',    color: 'yellow'  },
    { label: 'Excused', key: 'Excused', color: 'blue'   },
  ];

  const today = new Date();

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Attendance</h1>
        <p className="sp-page-sub">Track your daily attendance record and history</p>
      </div>

      {/* Term summary cards */}
      <div className="sp-stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '1.5rem' }}>
        {summaryItems.map(s => (
          <div className="sp-stat-card" key={s.label}>
            <div className={`sp-stat-icon sp-stat-icon--${s.color}`}>
              <span style={{ fontSize: '1.2rem' }}>{EMOJI[s.key] || '📋'}</span>
            </div>
            <div>
              <div className="sp-stat-value">{summaryMap[s.key] ?? 0}</div>
              <div className="sp-stat-label">{s.label} · This term</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sp-two-col">
        {/* Calendar */}
        <div className="sp-card">
          <div className="sp-card-header">
            <button onClick={prevMonth} style={{ color: 'var(--text-muted)' }}><ChevronLeft size={18} /></button>
            <span className="sp-card-title">{MONTH_NAMES[month - 1]} {year}</span>
            <button onClick={nextMonth} style={{ color: 'var(--text-muted)' }}><ChevronRight size={18} /></button>
          </div>
          <div className="sp-card-body">
            {loading ? <LoadingSpinner message="" /> : error ? <ErrorBanner message={error} onRetry={load} /> : (
              <>
                <div className="att-calendar">
                  {DAYS.map(d => <div className="att-day-label" key={d}>{d}</div>)}
                  {cells.map((day, i) => {
                    if (!day) return <div key={`e${i}`} className="att-day att-day--empty" />;
                    const status    = attendanceMap[day];
                    const cls       = STATUS_COLOR[status] || 'empty';
                    const isToday   = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
                    return (
                      <div
                        key={day}
                        className={`att-day att-day--${cls}${isToday ? ' att-day--today' : ''}`}
                        title={status || 'No record'}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                  {[['present','Present'],['absent','Absent'],['late','Late'],['excused','Excused']].map(([cls, label]) => (
                    <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div className={`att-day att-day--${cls}`} style={{ width: 18, height: 18, borderRadius: 4, aspectRatio: 'unset', fontSize: 0 }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Monthly history */}
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title">📈 Monthly Summary</span>
          </div>
          {loading ? <LoadingSpinner message="" /> : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr><th>Month</th><th>Present / Total</th><th>Rate</th></tr>
                </thead>
                <tbody>
                  {(data?.yearly_summary || []).length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data yet</td></tr>
                  ) : (
                    (data.yearly_summary).map(m => (
                      <tr key={m.month}>
                        <td style={{ fontWeight: 600 }}>{m.month}</td>
                        <td>{m.present} / {m.total}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="sp-progress" style={{ width: 80 }}>
                              <div
                                className={`sp-progress-fill sp-progress-fill--${m.pct >= 90 ? 'green' : m.pct >= 75 ? 'yellow' : 'red'}`}
                                style={{ width: `${m.pct}%` }}
                              />
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{m.pct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
