import { useEffect, useState } from 'react';
import { studentApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

const gradeFromPct = (pct) => {
  if (pct >= 90) return { label: 'A',  color: 'green'  };
  if (pct >= 80) return { label: 'B+', color: 'green'  };
  if (pct >= 70) return { label: 'B',  color: 'blue'   };
  if (pct >= 60) return { label: 'C+', color: 'yellow' };
  if (pct >= 50) return { label: 'C',  color: 'yellow' };
  return           { label: 'F',  color: 'red'    };
};

export default function StudentSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setSubjects(await studentApi.getSubjects());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading subjects…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">My Subjects</h1>
        <p className="sp-page-sub">Subjects enrolled for this academic year</p>
      </div>

      {subjects.length === 0 ? (
        <div className="sp-card"><EmptyState icon="📚" title="No subjects found" subtitle="Subjects will appear once your class schedule is set up." /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {subjects.map(s => {
            const passPct = s.pass_mark && s.max_mark ? Math.round((s.pass_mark / s.max_mark) * 100) : null;
            const grade   = passPct != null ? gradeFromPct(passPct) : null;

            return (
              <div className="sp-card" key={s.subject_id}>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{s.subject_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Code: {s.code}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {s.is_core
                        ? <span className="sp-badge sp-badge--red">Core</span>
                        : <span className="sp-badge sp-badge--gray">Elective</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teacher</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.teacher_name || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Periods/Week</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.weekly_periods ?? '—'}</div>
                    </div>
                    {s.pass_mark != null && (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pass Mark</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.pass_mark} / {s.max_mark}</div>
                      </div>
                    )}
                  </div>

                  {passPct != null && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pass threshold</span>
                        <span className={`sp-badge sp-badge--${grade.color}`}>{passPct}%</span>
                      </div>
                      <div className="sp-progress">
                        <div
                          className={`sp-progress-fill sp-progress-fill--${passPct >= 80 ? 'green' : passPct >= 60 ? 'yellow' : 'red'}`}
                          style={{ width: `${passPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
