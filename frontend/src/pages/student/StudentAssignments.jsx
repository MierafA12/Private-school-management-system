import { useEffect, useState } from 'react';
import { Send, Users, User, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { assignmentApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const isPast  = (iso) => iso && new Date(iso) < new Date();
const daysLeft = (iso) => {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { label: 'Overdue',         color: '#B91C1C', bg: '#FEF2F2' };
  if (diff === 0) return { label: 'Due today',       color: '#D97706', bg: '#FFFBEB' };
  if (diff <= 3)  return { label: `${diff}d left`,   color: '#D97706', bg: '#FFFBEB' };
  return             { label: `${diff} days left`,   color: '#15803D', bg: '#F0FDF4' };
};

function SubmitModal({ assignment, onClose, onDone }) {
  const [content, setContent] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const existing = assignment.my_submission;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await assignmentApi.submit(assignment.id, { content });
      onDone();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, margin: 0 }}>Submit Assignment</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{assignment.title}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {assignment.subject_name} · {assignment.teacher_name}
          {assignment.due_date && ` · Due ${fmtDate(assignment.due_date)}`}
        </p>

        {assignment.description && (
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
            <strong>Instructions:</strong><br />{assignment.description}
          </div>
        )}

        {existing?.status === 'GRADED' && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#15803D', marginBottom: '0.25rem' }}>
              ✓ Graded: {existing.marks_obtained != null ? `${existing.marks_obtained}${assignment.max_marks ? `/${assignment.max_marks}` : ''} marks` : 'Marked'}
            </div>
            {existing.teacher_feedback && <div style={{ fontSize: '0.82rem', color: '#166534' }}>Feedback: {existing.teacher_feedback}</div>}
          </div>
        )}

        {error && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{error}</p>}

        <form onSubmit={submit}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
            Your Answer / Work *
          </label>
          <textarea
            required
            rows={6}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your answer, solution, or notes here…"
            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 9, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.5 }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '0.25rem' }}>
            {existing?.status === 'SUBMITTED' ? 'You already submitted. Resubmitting will replace your previous answer.' : ''}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.6rem 1.1rem', border: '1px solid var(--border-color)', borderRadius: 8, fontWeight: 600, cursor: 'pointer', background: 'white' }}>Cancel</button>
            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', background: 'var(--primary)', color: 'white', borderRadius: 8, fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              <Send size={15} /> {saving ? 'Submitting…' : existing ? 'Resubmit' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [filter,      setFilter]      = useState('all'); // all | pending | submitted | graded

  const load = async () => {
    try { setLoading(true); setError(null); setAssignments(await assignmentApi.myAssignments()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = assignments.filter(a => {
    if (filter === 'pending')   return !a.my_submission;
    if (filter === 'submitted') return a.my_submission?.status === 'SUBMITTED';
    if (filter === 'graded')    return a.my_submission?.status === 'GRADED';
    return true;
  });

  const counts = {
    all:       assignments.length,
    pending:   assignments.filter(a => !a.my_submission).length,
    submitted: assignments.filter(a => a.my_submission?.status === 'SUBMITTED').length,
    graded:    assignments.filter(a => a.my_submission?.status === 'GRADED').length,
  };

  if (loading) return <LoadingSpinner message="Loading assignments…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Assignments</h1>
        <p className="sp-page-sub">Your assignments for this term</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: 0 }}>
        {[
          { key: 'all',       label: 'All',       count: counts.all       },
          { key: 'pending',   label: 'Pending',   count: counts.pending   },
          { key: 'submitted', label: 'Submitted', count: counts.submitted },
          { key: 'graded',    label: 'Graded',    count: counts.graded    },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.6rem 1rem', fontWeight: filter === key ? 700 : 500,
              fontSize: '0.875rem', color: filter === key ? 'var(--primary)' : 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: filter === key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-1px',
            }}>
            {label}
            <span style={{ fontSize: '0.72rem', background: filter === key ? 'var(--primary)' : '#E5E7EB', color: filter === key ? 'white' : 'var(--text-muted)', borderRadius: 999, padding: '0.1rem 0.4rem', fontWeight: 700 }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="sp-card"><EmptyState icon="📝" title="No assignments" subtitle={filter === 'all' ? 'Your teacher hasn\'t assigned any work yet.' : `No ${filter} assignments.`} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(a => {
            const dl     = daysLeft(a.due_date);
            const sub    = a.my_submission;
            const isGroup = a.type === 'GROUP';

            return (
              <div key={a.id} className="sp-card" style={{ padding: '1.1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.title}</span>
                      {isGroup && (
                        <span className="sp-badge sp-badge--blue" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Users size={10} /> Group
                        </span>
                      )}
                      {sub?.status === 'GRADED' && (
                        <span className="sp-badge sp-badge--green" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <CheckCircle size={10} /> Graded
                        </span>
                      )}
                      {sub?.status === 'SUBMITTED' && (
                        <span className="sp-badge sp-badge--blue" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={10} /> Submitted
                        </span>
                      )}
                      {!sub && (
                        <span className="sp-badge sp-badge--yellow" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <AlertCircle size={10} /> Pending
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      {a.subject_name} · {a.teacher_name}
                      {a.max_marks && ` · ${a.max_marks} marks`}
                    </div>

                    {/* Due date badge */}
                    {dl && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: dl.bg, color: dl.color }}>
                        <Clock size={11} /> {dl.label} · {fmtDate(a.due_date)}
                      </span>
                    )}

                    {/* My group */}
                    {isGroup && a.my_group && (
                      <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={12} /> Your group: <strong>{a.my_group.name}</strong>
                      </div>
                    )}

                    {/* Graded result */}
                    {sub?.status === 'GRADED' && (
                      <div style={{ marginTop: '0.5rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}>
                        <span style={{ fontWeight: 700, color: '#15803D' }}>
                          ✓ {sub.marks_obtained != null ? `${sub.marks_obtained}${a.max_marks ? `/${a.max_marks}` : ''} marks` : 'Marked'}
                        </span>
                        {sub.teacher_feedback && (
                          <div style={{ color: '#166534', marginTop: '0.2rem' }}>"{sub.teacher_feedback}"</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', flexShrink: 0 }}>
                    {a.status !== 'CLOSED' && sub?.status !== 'GRADED' && (
                      <button onClick={() => setSelected(a)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: sub ? 'white' : 'var(--primary)', color: sub ? 'var(--primary)' : 'white', border: sub ? '1px solid var(--primary)' : 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                        <Send size={13} /> {sub ? 'Resubmit' : 'Submit'}
                      </button>
                    )}
                    {a.status === 'CLOSED' && !sub && (
                      <span style={{ fontSize: '0.78rem', color: '#B91C1C', fontWeight: 600 }}>Closed</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <SubmitModal assignment={selected} onClose={() => setSelected(null)} onDone={load} />
      )}
    </div>
  );
}
