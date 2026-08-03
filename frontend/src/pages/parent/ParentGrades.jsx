import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import ChildSelector from './ChildSelector';

const gradeClass = (pct) => {
  if (pct == null) return '';
  if (pct >= 75) return 'pp-grade-score--pass';
  if (pct >= 50) return 'pp-grade-score--warn';
  return 'pp-grade-score--fail';
};

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  : '—';

export default function ParentGrades() {
  const [searchParams]  = useSearchParams();
  const [children,  setChildren]  = useState([]);
  const [activeId,  setActiveId]  = useState(searchParams.get('child') || null);
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    parentApi.getChildren().then((list) => {
      setChildren(list);
      if (!activeId && list.length) setActiveId(list[0].id);
    }).catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!activeId) return;
    const fetch = async () => {
      try {
        setLoading(true); setError(null);
        setData(await parentApi.getChildGrades(activeId));
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetch();
  }, [activeId]);

  const activeChild = children.find(c => c.id === activeId);

  // Group results by subject
  const bySubject = {};
  (data?.results || []).forEach(r => {
    if (!bySubject[r.subject_name]) bySubject[r.subject_name] = [];
    bySubject[r.subject_name].push(r);
  });

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Grades & Exam Results</h1>
        <p className="sp-page-sub">
          {activeChild ? `${activeChild.first_name} ${activeChild.last_name}` : 'Select a child'}
          {data?.term ? ` · ${data.term.name}` : ''}
        </p>
      </div>

      <ChildSelector children={children} activeId={activeId} onChange={setActiveId} />

      {loading ? <LoadingSpinner message="Loading grades…" /> : error ? <ErrorBanner message={error} onRetry={() => {}} /> : (
        <>
          {/* Subject grade cards */}
          {Object.keys(bySubject).length > 0 && (
            <>
              <div className="sp-card-header" style={{ padding: 0, marginBottom: '0.75rem' }}>
                <span className="sp-card-title">Results by Subject</span>
              </div>
              <div className="pp-grade-grid" style={{ marginBottom: '1.5rem' }}>
                {Object.entries(bySubject).map(([subject, exams]) => {
                  const best = exams.reduce((a, b) => (parseFloat(a.percentage) > parseFloat(b.percentage) ? a : b), exams[0]);
                  return (
                    <div className="pp-grade-card" key={subject}>
                      <div className="pp-grade-subject">{subject}</div>
                      <div className={`pp-grade-score ${gradeClass(parseFloat(best.percentage))}`}>
                        {best.is_absent ? 'ABS' : `${parseFloat(best.percentage).toFixed(0)}%`}
                      </div>
                      <div className="pp-grade-meta">
                        {best.marks_obtained}/{best.max_marks} · {best.title}
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <div className="sp-progress">
                          <div
                            className={`sp-progress-fill sp-progress-fill--${parseFloat(best.percentage)>=75?'green':parseFloat(best.percentage)>=50?'yellow':'red'}`}
                            style={{ width: `${best.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Full results table */}
          <div className="sp-card" style={{ marginBottom: '1.5rem' }}>
            <div className="sp-card-header">
              <span className="sp-card-title">All Exam Results</span>
              <span className="sp-badge sp-badge--blue">{data?.results?.length || 0} results</span>
            </div>
            {(data?.results || []).length === 0 ? (
              <div className="sp-empty"><div className="sp-empty-icon">📊</div>No published results yet</div>
            ) : (
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr><th>Subject</th><th>Exam</th><th>Date</th><th>Score</th><th>%</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.results.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.subject_name}</td>
                        <td style={{ fontSize: '0.8rem' }}>{r.title}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtDate(r.exam_date)}</td>
                        <td style={{ fontWeight: 700 }}>{r.is_absent ? '—' : `${r.marks_obtained}/${r.max_marks}`}</td>
                        <td>
                          <span className={`sp-badge ${parseFloat(r.percentage)>=75?'sp-badge--green':parseFloat(r.percentage)>=50?'sp-badge--yellow':'sp-badge--red'}`}>
                            {r.is_absent ? 'Absent' : `${parseFloat(r.percentage).toFixed(1)}%`}
                          </span>
                        </td>
                        <td><span className={`sp-badge ${r.is_absent?'sp-badge--gray':parseFloat(r.percentage)>=50?'sp-badge--green':'sp-badge--red'}`}>{r.is_absent ? 'Absent' : parseFloat(r.percentage)>=50 ? 'Pass' : 'Fail'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming exams */}
          <div className="sp-card">
            <div className="sp-card-header">
              <span className="sp-card-title">📅 Upcoming Exams</span>
              <span className="sp-badge sp-badge--yellow">{data?.upcoming?.length || 0} scheduled</span>
            </div>
            {(data?.upcoming || []).length === 0 ? (
              <div className="sp-empty"><div className="sp-empty-icon">📭</div>No upcoming exams</div>
            ) : (
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead><tr><th>Subject</th><th>Exam</th><th>Date</th><th>Time</th><th>Venue</th></tr></thead>
                  <tbody>
                    {data.upcoming.map((e) => (
                      <tr key={e.id}>
                        <td style={{ fontWeight: 600 }}>{e.subject_name}</td>
                        <td style={{ fontSize: '0.8rem' }}>{e.title}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtDate(e.exam_date)}</td>
                        <td style={{ fontSize: '0.8rem' }}>{e.start_time || '—'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{e.venue || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
