import { useEffect, useState, useCallback } from 'react';
import {
  Plus, ChevronDown, ChevronRight, Save, Edit2,
  CheckCircle, AlertCircle, BookOpen, Trash2,
} from 'lucide-react';
import { examApi, teacherApi, principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';
import EthiopianDatePicker from '../../components/shared/EthiopianDatePicker';
import { formatDualDate } from '../../utils/ethiopianDate';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso) => (iso ? formatDualDate(iso) : '—');

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 600, padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-card, #FFFFFF)', borderRadius: 16, padding: '1.75rem',
        width: '100%', maxWidth: wide ? 720 : 480,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        border: '1px solid var(--border-color)',
      }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const Btn = ({ children, onClick, variant = 'primary', disabled, style = {} }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.55rem 1rem', borderRadius: 8, fontWeight: 600,
    fontSize: '0.85rem', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.15s', opacity: disabled ? 0.55 : 1, border: 'none',
    ...style,
  };
  const variants = {
    primary: { background: 'var(--primary)', color: 'white' },
    ghost:   { background: 'var(--bg-card, #FFFFFF)', color: 'var(--text-main)', border: '1px solid var(--border-color)' },
    success: { background: '#16A34A', color: 'white' },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
};

// ─── Create / Edit exam schedule ─────────────────────────────────────────────
function ExamForm({ initial = {}, classes, subjects, terms, yearId, onSave, onClose, saving }) {
  const [classId,   setClassId]   = useState(initial.class_id   || '');
  const [sectionId, setSectionId] = useState(initial.section_id || '');
  const [subjectId, setSubjectId] = useState(initial.curriculum_subject_id || '');
  const [termId,    setTermId]    = useState(initial.term_id    || (terms[0]?.id || ''));
  const [title,     setTitle]     = useState(initial.title      || '');
  const [examDate,  setExamDate]  = useState(initial.exam_date?.slice(0,10) || '');
  const [venue,     setVenue]     = useState(initial.venue      || '');
  const [sections,  setSections]  = useState([]);
  const [curSubs,   setCurSubs]   = useState([]);

  useEffect(() => {
    if (!classId) { setSections([]); return; }
    principalApi.getClassById(classId).then(c => setSections(c?.sections || [])).catch(() => {});
  }, [classId]);

  useEffect(() => {
    if (!classId || !yearId) return;
    principalApi.getCurriculum(yearId, classId).then(setCurSubs).catch(() => {});
  }, [classId, yearId]);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      term_id: termId, academic_year_id: yearId,
      class_id: classId, section_id: sectionId,
      curriculum_subject_id: subjectId,
      title, exam_date: examDate, venue: venue || undefined,
    });
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Term *</label>
          <select style={inputSt} value={termId} onChange={e => setTermId(e.target.value)} required>
            <option value="">— Select —</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Class *</label>
          <select style={inputSt} value={classId} onChange={e => { setClassId(e.target.value); setSectionId(''); setSubjectId(''); }} required>
            <option value="">— Select —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Section *</label>
          <select style={inputSt} value={sectionId} onChange={e => setSectionId(e.target.value)} required disabled={!classId}>
            <option value="">— Select —</option>
            {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject *</label>
          <select style={inputSt} value={subjectId} onChange={e => setSubjectId(e.target.value)} required disabled={!classId}>
            <option value="">— Select —</option>
            {curSubs.map(cs => <option key={cs.id} value={cs.id}>{cs.subject_name}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exam Title *</label>
          <input style={inputSt} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Term 1 Mathematics Mid-Exam" required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exam Date (Ethiopian Calendar) *</label>
          <EthiopianDatePicker value={examDate} onChange={setExamDate} required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Venue</label>
          <input style={inputSt} value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Room 7" />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn disabled={saving}>{saving ? 'Saving…' : 'Save Exam'}</Btn>
      </div>
    </form>
  );
}

const inputSt = {
  padding: '0.6rem 0.875rem', border: '1px solid var(--border-color)',
  borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit',
  color: 'var(--text-main)', background: 'var(--bg-card, #FFFFFF)', width: '100%', outline: 'none',
};

// ─── Mark Components Setup ────────────────────────────────────────────────────
function ComponentsForm({ examId, existing, onDone }) {
  const [rows,   setRows]   = useState(
    existing.length
      ? existing.map(c => ({ name: c.name, max_marks: c.max_marks }))
      : [{ name: 'Assignment', max_marks: 10 }, { name: 'Mid Exam', max_marks: 40 }, { name: 'Final Exam', max_marks: 50 }]
  );
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState(null);

  const total = rows.reduce((s, r) => s + (parseFloat(r.max_marks) || 0), 0);

  const updateRow = (i, k, v) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow    = () => setRows(r => [...r, { name: '', max_marks: '' }]);
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));

  const save = async () => {
    if (rows.some(r => !r.name || !r.max_marks)) { setErr('All rows need a name and mark.'); return; }
    setSaving(true); setErr(null);
    try {
      await examApi.saveComponents(examId, rows.map((r, i) => ({ ...r, sort_order: i })));
      onDone();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
        Define how marks are broken down for this exam. Total should equal 100.
      </p>
      {err && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>{err}</p>}
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
          <input style={inputSt} placeholder="Component name e.g. Quiz" value={r.name}
            onChange={e => updateRow(i, 'name', e.target.value)} />
          <input type="number" style={{ ...inputSt }} placeholder="Max" value={r.max_marks}
            onChange={e => updateRow(i, 'max_marks', e.target.value)} min={1} />
          <button onClick={() => removeRow(i)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #FECACA', color: 'var(--primary)', background: 'transparent', cursor: 'pointer' }}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button onClick={addRow} style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
        <Plus size={13} /> Add component
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', color: total === 100 ? '#16A34A' : 'var(--primary)', fontWeight: 700 }}>
          Total: {total} / 100 {total !== 100 && '⚠️ should be 100'}
        </span>
        <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Components'}</Btn>
      </div>
    </div>
  );
}

// ─── Mark Sheet ───────────────────────────────────────────────────────────────
function MarkSheet({ exam, onClose }) {
  const [sheet,    setSheet]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [edits,    setEdits]    = useState({});  // { studentId: { compId: { marks, absent } } }
  const [savingId, setSavingId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const data = await examApi.getMarkSheet(exam.id, exam.section_id);
      setSheet(data);
      // Pre-fill edits from existing marks
      const init = {};
      data.students.forEach(stu => {
        init[stu.id] = {};
        data.components.forEach((comp, i) => {
          const existing = stu.marks[i];
          init[stu.id][comp.id] = {
            marks:  existing?.marks_obtained ?? '',
            absent: existing?.is_absent ?? false,
          };
        });
      });
      setEdits(init);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [exam.id, exam.section_id]);

  useEffect(() => { load(); }, [load]);

  const setMark = (stuId, compId, key, val) => {
    setEdits(prev => ({
      ...prev,
      [stuId]: { ...prev[stuId], [compId]: { ...prev[stuId]?.[compId], [key]: val } },
    }));
  };

  const saveRow = async (stuId) => {
    const stuEdits = edits[stuId] || {};
    const marks = sheet.components.map(comp => ({
      mark_component_id: comp.id,
      marks_obtained:    stuEdits[comp.id]?.absent ? null : parseFloat(stuEdits[comp.id]?.marks ?? '') || 0,
      is_absent:         stuEdits[comp.id]?.absent ?? false,
    }));
    setSavingId(stuId);
    try {
      await examApi.saveMarks(exam.id, stuId, marks);
      setSavedIds(prev => new Set([...prev, stuId]));
    } catch (err) { alert(err.message); }
    finally { setSavingId(null); }
  };

  if (loading) return <div style={{ padding: '2rem' }}><LoadingSpinner message="Loading mark sheet…" /></div>;
  if (error)   return <div style={{ padding: '1rem' }}><ErrorBanner message={error} onRetry={load} /></div>;

  const { components = [], students = [] } = sheet || {};

  if (!components.length) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          No mark components defined yet. Set up components first.
        </p>
        <Btn onClick={onClose} variant="ghost">Close</Btn>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '0.875rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exam.title}</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {exam.subject_name} · {exam.class_name} Section {exam.section_name} · {fmtDate(exam.exam_date)}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              <th style={thSt}>Roll #</th>
              <th style={thSt}>Student</th>
              {components.map(c => (
                <th key={c.id} style={thSt}>
                  {c.name}
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{c.max_marks}</div>
                </th>
              ))}
              <th style={thSt}>Total</th>
              <th style={thSt}>%</th>
              <th style={thSt}></th>
            </tr>
          </thead>
          <tbody>
            {students.map(stu => {
              const stuEdits = edits[stu.id] || {};
              let rowTotal = 0;
              let rowMax   = 0;
              components.forEach(c => {
                const e = stuEdits[c.id];
                rowMax += parseFloat(c.max_marks) || 0;
                if (!e?.absent && e?.marks !== '' && e?.marks !== undefined)
                  rowTotal += parseFloat(e.marks) || 0;
              });
              const pct = rowMax > 0 ? Math.round((rowTotal / rowMax) * 100) : 0;
              const isSaved = savedIds.has(stu.id);

              return (
                <tr key={stu.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={tdSt}><span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{stu.roll_number || '—'}</span></td>
                  <td style={{ ...tdSt, fontWeight: 600 }}>{stu.first_name} {stu.last_name}</td>
                  {components.map(c => {
                    const e = stuEdits[c.id] || {};
                    return (
                      <td key={c.id} style={tdSt}>
                        {e.absent ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600 }}>ABS</span>
                            <button onClick={() => setMark(stu.id, c.id, 'absent', false)}
                              style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textDecoration: 'underline' }}>clear</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <input
                              type="number"
                              min={0} max={parseFloat(c.max_marks)}
                              step="0.5"
                              value={e.marks ?? ''}
                              onChange={ev => setMark(stu.id, c.id, 'marks', ev.target.value)}
                              style={{ width: 60, padding: '0.3rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.85rem' }}
                            />
                            <button onClick={() => setMark(stu.id, c.id, 'absent', true)}
                              style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0.2rem' }} title="Mark absent">
                              ABS
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ ...tdSt, fontWeight: 700 }}>{rowTotal.toFixed(1)}</td>
                  <td style={{ ...tdSt, color: pct >= 50 ? '#16A34A' : '#B91C1C', fontWeight: 700 }}>{pct}%</td>
                  <td style={tdSt}>
                    {isSaved
                      ? <CheckCircle size={16} color="#16A34A" />
                      : <button
                          onClick={() => saveRow(stu.id)}
                          disabled={savingId === stu.id}
                          style={{ padding: '0.35rem 0.6rem', background: 'var(--primary)', color: 'white', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                          {savingId === stu.id ? '…' : <Save size={13} />}
                        </button>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <Btn variant="ghost" onClick={onClose}>Close</Btn>
      </div>
    </div>
  );
}

const thSt = { padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' };
const tdSt = { padding: '0.6rem 0.75rem', verticalAlign: 'middle' };

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function TeacherGrades() {
  const [exams,    setExams]    = useState([]);
  const [years,    setYears]    = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [terms,    setTerms]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [filterTerm,  setFilterTerm]  = useState('');
  const [filterClass, setFilterClass] = useState('');

  const [modal,   setModal]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [mError,  setMError]  = useState(null);
  const [expanded, setExpanded] = useState({});

  // Load meta once
  useEffect(() => {
    Promise.all([principalApi.getAcademicYears(), principalApi.getClasses()])
      .then(([y, c]) => {
        setYears(y); setClasses(c);
        const cur = y.find(a => a.is_current);
        if (cur) {
          principalApi.getAcademicYearById(cur.id).then(ay => {
            setTerms(ay?.terms || []);
            if (ay?.terms?.length) setFilterTerm(ay.terms[0].id);
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadExams = useCallback(async () => {
    if (!filterTerm) return;
    try {
      setLoading(true); setError(null);
      const params = { term_id: filterTerm };
      if (filterClass) params.class_id = filterClass;
      setExams(await examApi.getSchedules(params));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [filterTerm, filterClass]);

  useEffect(() => { loadExams(); }, [loadExams]);

  const currentYear = years.find(y => y.is_current);

  const createExam = async (fields) => {
    setSaving(true); setMError(null);
    try {
      await examApi.createSchedule(fields);
      setModal(null); await loadExams();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const deleteExam = async (id) => {
    if (!confirm('Delete this exam schedule?')) return;
    try { await examApi.deleteSchedule(id); await loadExams(); }
    catch (err) { alert(err.message); }
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Grades & Mark Entry</h1>
          <p className="sp-page-sub">Create exam schedules, enter marks, generate report cards</p>
        </div>
        <button className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => { setModal({ type: 'exam' }); setMError(null); }}
          disabled={!currentYear}>
          <Plus size={16} /> New Exam Schedule
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <select style={{ ...inputSt, maxWidth: 160 }} value={filterTerm} onChange={e => setFilterTerm(e.target.value)}>
          <option value="">All Terms</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select style={{ ...inputSt, maxWidth: 160 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner message="Loading exams…" /> :
       error   ? <ErrorBanner message={error} onRetry={loadExams} /> :
       exams.length === 0 ? (
        <div className="sp-card"><EmptyState icon="📝" title="No exam schedules" subtitle="Click 'New Exam Schedule' to create one." /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {exams.map(exam => (
            <div className="sp-card" key={exam.id}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
                onClick={() => toggleExpand(exam.id)}>
                {expanded[exam.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{exam.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {exam.subject_name} · {exam.class_name} Section {exam.section_name} · {fmtDate(exam.exam_date)}
                    {exam.venue && ` · ${exam.venue}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
                  {/* Components setup */}
                  <button className="btn-edit" title="Set mark components"
                    onClick={() => setModal({ type: 'components', exam })}>
                    <BookOpen size={13} />
                  </button>
                  {/* Enter marks */}
                  <button className="btn-prim" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => setModal({ type: 'marksheet', exam })}>
                    <Edit2 size={12} /> Enter Marks
                  </button>
                  <button className="btn-danger" onClick={() => deleteExam(exam.id)}><Trash2 size={13} /></button>
                </div>
              </div>

              {/* Expanded: component summary */}
              {expanded[exam.id] && (
                <ComponentSummary examId={exam.id} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create exam modal */}
      {modal?.type === 'exam' && (
        <Modal title="New Exam Schedule" onClose={() => setModal(null)} wide>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <ExamForm
            classes={classes} terms={terms} subjects={[]}
            yearId={currentYear?.id}
            onSave={createExam} onClose={() => setModal(null)} saving={saving}
          />
        </Modal>
      )}

      {/* Set components modal */}
      {modal?.type === 'components' && (
        <Modal title={`Mark Components — ${modal.exam.title}`} onClose={() => setModal(null)}>
          <ComponentsFormWrapper exam={modal.exam} onDone={() => { setModal(null); loadExams(); }} />
        </Modal>
      )}

      {/* Mark sheet modal */}
      {modal?.type === 'marksheet' && (
        <Modal title="Mark Entry Sheet" onClose={() => setModal(null)} wide>
          <MarkSheet exam={modal.exam} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// Wrapper to load existing components before rendering form
function ComponentsFormWrapper({ exam, onDone }) {
  const [components, setComponents] = useState(null);
  useEffect(() => {
    examApi.getComponents(exam.id).then(setComponents).catch(() => setComponents([]));
  }, [exam.id]);
  if (!components) return <LoadingSpinner message="" />;
  return <ComponentsForm examId={exam.id} existing={components} onDone={onDone} />;
}

// Small component summary shown when row is expanded
function ComponentSummary({ examId }) {
  const [components, setComponents] = useState([]);
  useEffect(() => {
    examApi.getComponents(examId).then(setComponents).catch(() => {});
  }, [examId]);

  if (!components.length) return (
    <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
      No mark components — click the 📖 icon to set them up.
    </div>
  );

  const total = components.reduce((s, c) => s + parseFloat(c.max_marks), 0);
  return (
    <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {components.map(c => (
        <span key={c.id} className="sp-badge sp-badge--blue">
          {c.name} ({c.max_marks})
        </span>
      ))}
      <span className="sp-badge sp-badge--gray">Total: {total}</span>
    </div>
  );
}
