import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Users, User, Eye, CheckCircle,
  ChevronDown, ChevronRight, X,
} from 'lucide-react';
import { assignmentApi, teacherApi, principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) +
         ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};
const isPast = (iso) => iso && new Date(iso) < new Date();

const inputSt = {
  padding: '0.55rem 0.875rem', border: '1px solid var(--border-color)',
  borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit',
  color: 'var(--text-main)', background: 'white', width: '100%', outline: 'none',
};

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: wide ? 680 : 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Create / Edit Assignment Form ────────────────────────────────────────────
function AssignmentForm({ initial = {}, classes, terms, onSave, onClose, saving }) {
  const [classId,     setClassId]     = useState(initial.class_id || '');
  const [sectionId,   setSectionId]   = useState(initial.section_id || '');
  const [subjectId,   setSubjectId]   = useState(initial.curriculum_subject_id || '');
  const [termId,      setTermId]      = useState(initial.term_id || (terms[0]?.id || ''));
  const [title,       setTitle]       = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [type,        setType]        = useState(initial.type || 'INDIVIDUAL');
  const [dueDate,     setDueDate]     = useState(initial.due_date?.slice(0,16) || '');
  const [maxMarks,    setMaxMarks]    = useState(initial.max_marks || '');
  const [status,      setStatus]      = useState(initial.status || 'ACTIVE');

  const [sections, setSections] = useState([]);
  const [curSubs,  setCurSubs]  = useState([]);
  const [yearId,   setYearId]   = useState('');

  useEffect(() => {
    if (!classId) { setSections([]); return; }
    principalApi.getClassById(classId).then(c => setSections(c?.sections || [])).catch(() => {});
    // Get year from term
    if (termId) {
      const t = terms.find(t => t.id === termId);
      if (t?.academic_year_id) setYearId(t.academic_year_id);
    }
  }, [classId, termId, terms]);

  useEffect(() => {
    if (!yearId || !classId) return;
    principalApi.getCurriculum(yearId, classId).then(setCurSubs).catch(() => {});
  }, [yearId, classId]);

  const submit = (e) => {
    e.preventDefault();
    onSave({ curriculum_subject_id: subjectId, class_id: classId, section_id: sectionId,
             term_id: termId, title, description: description || undefined, type,
             due_date: dueDate || undefined, max_marks: maxMarks ? parseFloat(maxMarks) : undefined,
             status });
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Term *</label>
          <select style={inputSt} value={termId} onChange={e => setTermId(e.target.value)} required>
            <option value="">— Select —</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Class *</label>
          <select style={inputSt} value={classId} onChange={e => { setClassId(e.target.value); setSectionId(''); setSubjectId(''); }} required>
            <option value="">— Select —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Section *</label>
          <select style={inputSt} value={sectionId} onChange={e => setSectionId(e.target.value)} required disabled={!classId}>
            <option value="">— Select —</option>
            {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Subject *</label>
          <select style={inputSt} value={subjectId} onChange={e => setSubjectId(e.target.value)} required disabled={!classId}>
            <option value="">— Select —</option>
            {curSubs.map(cs => <option key={cs.id} value={cs.id}>{cs.subject_name}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Title *</label>
          <input style={inputSt} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 3 Exercise" required />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Instructions</label>
          <textarea style={{ ...inputSt, resize: 'vertical' }} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the assignment…" />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Type</label>
          <select style={inputSt} value={type} onChange={e => setType(e.target.value)}>
            <option value="INDIVIDUAL">Individual</option>
            <option value="GROUP">Group</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Status</label>
          <select style={inputSt} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active (visible to students)</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Due Date & Time</label>
          <input type="datetime-local" style={inputSt} value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Max Marks</label>
          <input type="number" style={inputSt} value={maxMarks} onChange={e => setMaxMarks(e.target.value)} placeholder="e.g. 20" min={0} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
        <button type="button" onClick={onClose} style={{ ...inputSt, width: 'auto', background: 'none', cursor: 'pointer' }}>Cancel</button>
        <button type="submit" disabled={saving} style={{ padding: '0.6rem 1.25rem', background: 'var(--primary)', color: 'white', borderRadius: 8, fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : initial.id ? 'Save Changes' : 'Create Assignment'}
        </button>
      </div>
    </form>
  );
}

// ─── Detail view with submissions + group management ─────────────────────────
function AssignmentDetail({ assignmentId, onClose, onRefresh }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [gradingId, setGradingId] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  // Group management
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupName,    setGroupName]    = useState('');
  const [students,     setStudents]     = useState([]);
  const [selectedStus, setSelectedStus] = useState([]);
  const [addingGroup,  setAddingGroup]  = useState(false);

  const load = () => {
    setLoading(true);
    assignmentApi.getById(assignmentId)
      .then(d => { setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Load students in section for group creation
    if (data?.class_id && data?.section_id) {
      teacherApi.getClasses()
        .then(cls => {
          const sec = cls.find(c => c.section_id === data.section_id);
          if (sec) {
            const { default: pool } = require('../../api');
            // Use teacherApi to get students in section
          }
        }).catch(() => {});
    }
  }, [assignmentId]); // eslint-disable-line

  useEffect(() => {
    if (data?.class_id && data?.section_id) {
      // Fetch students via teacher API
      fetch(`/api/teacher/students?classId=${data.class_id}&sectionId=${data.section_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      }).then(r => r.json()).then(j => setStudents(j.data || [])).catch(() => {});
    }
  }, [data?.class_id, data?.section_id]);

  const saveGrade = async (subId) => {
    setGrading(true);
    try {
      await assignmentApi.grade(subId, { marks_obtained: gradeMarks ? parseFloat(gradeMarks) : null, teacher_feedback: gradeFeedback });
      setGradingId(null); load(); onRefresh();
    } catch (err) { alert(err.message); }
    finally { setGrading(false); }
  };

  const addGroup = async () => {
    if (!groupName) { alert('Enter a group name.'); return; }
    setAddingGroup(true);
    try {
      await assignmentApi.addGroup(assignmentId, { name: groupName, student_ids: selectedStus });
      setGroupName(''); setSelectedStus([]); setShowAddGroup(false); load();
    } catch (err) { alert(err.message); }
    finally { setAddingGroup(false); }
  };

  const delGroup = async (gid) => {
    if (!confirm('Delete this group?')) return;
    await assignmentApi.deleteGroup(gid).then(load).catch(e => alert(e.message));
  };

  if (loading) return <div style={{ padding: '2rem' }}><LoadingSpinner /></div>;
  if (error)   return <div style={{ padding: '1rem' }}><ErrorBanner message={error} /></div>;
  if (!data)   return null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{data.title}</span>
          <span className={`sp-badge sp-badge--${data.type === 'GROUP' ? 'blue' : 'green'}`}>
            {data.type === 'GROUP' ? <><Users size={11} /> Group</> : <><User size={11} /> Individual</>}
          </span>
          <span className={`sp-badge sp-badge--${data.status === 'ACTIVE' ? 'green' : data.status === 'CLOSED' ? 'red' : 'gray'}`}>{data.status}</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {data.subject_name} · {data.class_name} Section {data.section_name} · {data.term_name}
          {data.due_date && ` · Due: ${fmtDate(data.due_date)}`}
          {data.max_marks && ` · Max: ${data.max_marks} marks`}
        </div>
        {data.description && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.5, background: '#F8FAFC', padding: '0.75rem', borderRadius: 8 }}>
            {data.description}
          </p>
        )}
      </div>

      {/* Groups (if GROUP type) */}
      {data.type === 'GROUP' && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Groups ({data.groups?.length || 0})</span>
            <button onClick={() => setShowAddGroup(!showAddGroup)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', background: 'var(--primary)', color: 'white', borderRadius: 7, fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              <Plus size={13} /> Add Group
            </button>
          </div>

          {showAddGroup && (
            <div style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
              <input style={{ ...inputSt, marginBottom: '0.5rem' }} placeholder="Group name (e.g. Group 1)" value={groupName} onChange={e => setGroupName(e.target.value)} />
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8, marginBottom: '0.5rem' }}>
                {students.map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedStus.includes(s.id)}
                      onChange={e => setSelectedStus(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id))} />
                    <span style={{ fontSize: '0.85rem' }}>{s.first_name} {s.last_name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.student_number}</span>
                  </label>
                ))}
                {students.length === 0 && <div style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No students loaded.</div>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setShowAddGroup(false)} style={{ padding: '0.4rem 0.875rem', borderRadius: 7, border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
                <button onClick={addGroup} disabled={addingGroup} style={{ padding: '0.4rem 0.875rem', borderRadius: 7, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  {addingGroup ? 'Adding…' : `Add Group (${selectedStus.length} students)`}
                </button>
              </div>
            </div>
          )}

          {(data.groups || []).map(g => (
            <div key={g.id} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 9, padding: '0.75rem 1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{g.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
                  {(g.members || []).filter(m => m.student_id).map(m => (
                    <span key={m.student_id} style={{ background: 'white', border: '1px solid #BFDBFE', borderRadius: 999, padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}>
                      {m.first_name} {m.last_name}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => delGroup(g.id)} style={{ color: '#B91C1C', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Submissions */}
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Submissions ({data.submissions?.length || 0})
        </div>
        {!data.submissions?.length ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', background: '#F9FAFB', borderRadius: 8 }}>No submissions yet.</div>
        ) : (
          <table className="sp-table">
            <thead>
              <tr><th>Student / Group</th><th>Content</th><th>Submitted</th><th>Marks</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {data.submissions.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 600 }}>
                    {sub.group_name || `${sub.first_name} ${sub.last_name}`}
                  </td>
                  <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>
                    {sub.content ? sub.content.slice(0, 80) + (sub.content.length > 80 ? '…' : '') : '—'}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td>
                    {gradingId === sub.id ? (
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        <input type="number" style={{ ...inputSt, width: 64, padding: '0.3rem 0.5rem' }} value={gradeMarks}
                          onChange={e => setGradeMarks(e.target.value)} placeholder="0" min={0} max={data.max_marks || 100} />
                        <input style={{ ...inputSt, width: 120, padding: '0.3rem 0.5rem', fontSize: '0.78rem' }} value={gradeFeedback}
                          onChange={e => setGradeFeedback(e.target.value)} placeholder="Feedback…" />
                        <button onClick={() => saveGrade(sub.id)} disabled={grading}
                          style={{ padding: '0.3rem 0.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem' }}>
                          {grading ? '…' : '✓'}
                        </button>
                        <button onClick={() => setGradingId(null)} style={{ padding: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 700 }}>
                        {sub.marks_obtained != null ? `${sub.marks_obtained}${data.max_marks ? `/${data.max_marks}` : ''}` : '—'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`sp-badge sp-badge--${sub.status === 'GRADED' ? 'green' : sub.status === 'SUBMITTED' ? 'blue' : 'gray'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => { setGradingId(sub.id); setGradeMarks(sub.marks_obtained ?? ''); setGradeFeedback(sub.teacher_feedback ?? ''); }}
                      className="btn-edit" title="Grade">
                      <CheckCircle size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
        <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: 8, fontWeight: 600, cursor: 'pointer', background: 'white' }}>Close</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [classes,     setClasses]     = useState([]);
  const [terms,       setTerms]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const [filterClass,  setFilterClass]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [modal,   setModal]   = useState(null); // 'create' | 'edit' | 'detail'
  const [current, setCurrent] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [mError,  setMError]  = useState(null);

  const loadMeta = async () => {
    try {
      const [cls, ays] = await Promise.all([principalApi.getClasses(), principalApi.getAcademicYears()]);
      setClasses(cls);
      const cur = ays.find(a => a.is_current);
      if (cur) {
        const ay = await principalApi.getAcademicYearById(cur.id);
        setTerms(ay?.terms || []);
      }
    } catch (_) {}
  };

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const params = {};
      if (filterClass)  params.class_id = filterClass;
      if (filterStatus) params.status   = filterStatus;
      setAssignments(await assignmentApi.list(params));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [filterClass, filterStatus]);

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const save = async (fields) => {
    setSaving(true); setMError(null);
    try {
      if (current?.id) { await assignmentApi.update(current.id, fields); }
      else             { await assignmentApi.create(fields); }
      setModal(null); setCurrent(null); await loadAssignments();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this assignment? All submissions will also be deleted.')) return;
    await assignmentApi.remove(id).then(loadAssignments).catch(e => alert(e.message));
  };

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Assignments</h1>
          <p className="sp-page-sub">Create individual or group assignments and track submissions</p>
        </div>
        <button onClick={() => { setModal('create'); setCurrent(null); setMError(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', background: 'var(--primary)', color: 'white', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <select style={{ ...inputSt, maxWidth: 160 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select style={{ ...inputSt, maxWidth: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading ? <LoadingSpinner message="Loading assignments…" /> :
       error   ? <ErrorBanner message={error} onRetry={loadAssignments} /> :
       assignments.length === 0 ? (
        <div className="sp-card"><EmptyState icon="📝" title="No assignments yet" subtitle="Click 'New Assignment' to create your first one." /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {assignments.map(a => (
            <div key={a.id} className="sp-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.title}</span>
                    <span className={`sp-badge sp-badge--${a.type === 'GROUP' ? 'blue' : 'green'}`}>
                      {a.type === 'GROUP' ? <><Users size={10} /> Group</> : <><User size={10} /> Individual</>}
                    </span>
                    <span className={`sp-badge sp-badge--${a.status === 'ACTIVE' ? 'green' : a.status === 'CLOSED' ? 'red' : 'gray'}`}>{a.status}</span>
                    {a.due_date && isPast(a.due_date) && a.status === 'ACTIVE' && (
                      <span className="sp-badge sp-badge--red">OVERDUE</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {a.subject_name} · {a.class_name} Section {a.section_name} · {a.term_name}
                    {a.due_date && ` · Due ${fmtDate(a.due_date)}`}
                    {a.max_marks && ` · ${a.max_marks} marks`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {a.submission_count} submission{a.submission_count !== '1' ? 's' : ''}
                    {a.type === 'GROUP' && ` · ${a.group_count} groups`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  <button className="btn-edit" onClick={() => { setCurrent(a); setModal('detail'); }} title="View details"><Eye size={13} /></button>
                  <button className="btn-edit" onClick={() => { setCurrent(a); setModal('edit'); setMError(null); }} title="Edit"><Edit2 size={13} /></button>
                  <button className="btn-danger" onClick={() => del(a.id)} title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {modal === 'create' && (
        <Modal title="New Assignment" onClose={() => setModal(null)} wide>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <AssignmentForm classes={classes} terms={terms} onSave={save} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {/* Edit modal */}
      {modal === 'edit' && current && (
        <Modal title="Edit Assignment" onClose={() => setModal(null)} wide>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <AssignmentForm initial={current} classes={classes} terms={terms} onSave={save} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {/* Detail modal */}
      {modal === 'detail' && current && (
        <Modal title="Assignment Details" onClose={() => setModal(null)} wide>
          <AssignmentDetail assignmentId={current.id} onClose={() => setModal(null)} onRefresh={loadAssignments} />
        </Modal>
      )}
    </div>
  );
}
