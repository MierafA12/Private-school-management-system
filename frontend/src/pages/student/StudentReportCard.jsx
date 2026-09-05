import { useEffect, useState } from 'react';
import { Download, ChevronLeft } from 'lucide-react';
import { studentApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

const gradeColor = (g = '') => {
  if (g.startsWith('A')) return 'green';
  if (g.startsWith('B')) return 'blue';
  if (g.startsWith('C')) return 'yellow';
  return 'red';
};

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function StudentReportCard() {
  const [cards,    setCards]    = useState(null);   // list view
  const [detail,   setDetail]   = useState(null);   // single card view
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = async () => {
    try {
      setLoading(true);
      setError(null);
      setDetail(null);
      setCards(await studentApi.getReportCards());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    try {
      setDetailLoading(true);
      setError(null);
      setDetail(await studentApi.getReportCardById(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { loadList(); }, []);

  if (loading) return <LoadingSpinner message="Loading report cards…" />;
  if (error && !detail) return <ErrorBanner message={error} onRetry={loadList} />;

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (detail) {
    const { subjects = [] } = detail;
    return (
      <div>
        <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
          <div>
            <button onClick={() => setDetail(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              <ChevronLeft size={16} /> Back to list
            </button>
            <h1 className="sp-page-title">Report Card</h1>
            <p className="sp-page-sub">{detail.term_name} · {detail.academic_year}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.6rem 1.1rem', display: 'flex', gap: '0.4rem', alignItems: 'center', cursor: 'pointer' }}
          >
            <Download size={16} /> Print / Save PDF
          </button>
        </div>

        <div className="sp-card">
          {/* School header */}
          <div style={{ background: 'var(--primary)', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '0.02em' }}>Haile-Manas Academy</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.25rem' }}>Academic Report Card — {detail.term_name} · {detail.academic_year}</div>
          </div>

          {/* Summary row */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '1.25rem', background: 'var(--bg-muted, #F8FAFC)', borderBottom: '1px solid var(--border-color)' }}>
            {[
              ['Overall Score',   detail.total_percentage != null ? `${detail.total_percentage}%` : '—'],
              ['Overall Grade',   detail.overall_grade || '—'],
              ['Class Rank',      detail.class_rank ? `#${detail.class_rank}` : '—'],
              ['Status',          detail.is_promoted === true ? 'PROMOTED' : detail.is_promoted === false ? 'REPEAT' : '—'],
              ['Published',       fmtDate(detail.published_at)],
            ].map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Subject table */}
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Marks</th>
                  <th>%</th>
                  <th>Grade</th>
                  <th>Passed</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No subject details</td></tr>
                ) : subjects.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.subject_name}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.teacher_name || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{s.total_marks ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>{s.percentage != null ? `${s.percentage}%` : '—'}</td>
                    <td>
                      {s.letter_grade
                        ? <span className={`sp-badge sp-badge--${gradeColor(s.letter_grade)}`}>{s.letter_grade}</span>
                        : '—'}
                    </td>
                    <td>
                      {s.is_passed === true
                        ? <span className="sp-badge sp-badge--green">Yes</span>
                        : s.is_passed === false
                        ? <span className="sp-badge sp-badge--red">No</span>
                        : '—'}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.teacher_remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Advisor remarks */}
          {detail.advisor_remarks && (
            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Class Advisor Remarks</div>
              <div style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                &ldquo;{detail.advisor_remarks}&rdquo;
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Report Cards</h1>
        <p className="sp-page-sub">Published academic report cards</p>
      </div>

      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title">📋 Published Reports</span>
          <span className="sp-badge sp-badge--blue">{(cards || []).length} available</span>
        </div>

        {(cards || []).length === 0 ? (
          <EmptyState icon="📋" title="No report cards yet" subtitle="Report cards will appear here once published by your school." />
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Academic Year</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Rank</th>
                  <th>Published</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cards.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.term_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.academic_year}</td>
                    <td style={{ fontWeight: 600 }}>{c.total_percentage != null ? `${c.total_percentage}%` : '—'}</td>
                    <td>
                      {c.overall_grade
                        ? <span className={`sp-badge sp-badge--${gradeColor(c.overall_grade)}`}>{c.overall_grade}</span>
                        : '—'}
                    </td>
                    <td>{c.class_rank ? `#${c.class_rank}` : '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtDate(c.published_at)}</td>
                    <td>
                      <button
                        onClick={() => loadDetail(c.id)}
                        disabled={detailLoading}
                        style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem' }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
