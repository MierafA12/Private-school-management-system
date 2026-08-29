import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, ChevronDown } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import './principal.css';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-box"><h3>{title}</h3>{children}</div>
    </div>
  );
}

// ── Subject Form ──────────────────────────────────────────────────────────────
function SubjectForm({ initial = {}, onSave, onClose, saving }) {
  const [code, setCode]   = useState(initial.code        || '');
  const [name, setName]   = useState(initial.name        || '');
  const [desc, setDesc]   = useState(initial.description || '');

  const submit = (e) => { e.preventDefault(); onSave({ code, name, description: desc }); };

  return (
    <form onSubmit={submit}>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Subject Code <span>*</span></label>
          <input className="pf-input" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. MTH701" required />
        </div>
        <div className="pf-field">
          <label className="pf-label">Subject Name <span>*</span></label>
          <input className="pf-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics" required />
        </div>
      </div>
      <div className="pf-field">
        <label className="pf-label">Description</label>
        <input className="pf-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional" />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

// ── Assign to Curriculum Form ─────────────────────────────────────────────────
function CurriculumForm({ subjects, onSave, onClose, saving }) {
  const [academicYears, setAcademicYears] = useState([]);
  const [classes,       setClasses]       = useState([]);
  const [yearId,    setYearId]    = useState('');
  const [classId,   setClassId]   = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [isCore,    setIsCore]    = useState(true);
  const [periods,   setPeriods]   = useState(5);
  const [passMark,  setPassMark]  = useState(50);
  const [maxMark,   setMaxMark]   = useState(100);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([principalApi.getAcademicYears(), principalApi.getClasses()])
      .then(([ays, cls]) => { setAcademicYears(ays); setClasses(cls); })
      .finally(() => setLoadingData(false));
  }, []);

  const submit = (e) => {
    e.preventDefault();
    onSave({ academic_year_id: yearId, class_id: classId, subject_id: subjectId,
             is_core: isCore, weekly_periods: parseInt(periods),
             pass_mark: parseFloat(passMark), max_mark: parseFloat(maxMark) });
  };

  if (loadingData) return <LoadingSpinner message="" />;

  return (
    <form onSubmit={submit}>
      <div className="pf-field">
        <label className="pf-label">Academic Year <span>*</span></label>
        <select className="pf-select" value={yearId} onChange={e => setYearId(e.target.value)} required>
          <option value="">— Select —</option>
          {academicYears.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="pf-field">
        <label className="pf-label">Class <span>*</span></label>
        <select className="pf-select" value={classId} onChange={e => setClassId(e.target.value)} required>
          <option value="">— Select —</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="pf-field">
        <label className="pf-label">Subject <span>*</span></label>
        <select className="pf-select" value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
          <option value="">— Select —</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </select>
      </div>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Periods/Week</label>
          <input type="number" className="pf-input" value={periods} onChange={e => setPeriods(e.target.value)} min={1} max={20} />
        </div>
        <div className="pf-field">
          <label className="pf-label">Max Marks</label>
          <input type="number" className="pf-input" value={maxMark} onChange={e => setMaxMark(e.target.value)} min={1} />
        </div>
        <div className="pf-field">
          <label className="pf-label">Pass Mark</label>
          <input type="number" className="pf-input" value={passMark} onChange={e => setPassMark(e.target.value)} min={0} />
        </div>
        <div className="pf-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
          <input type="checkbox" id="isCore" checked={isCore} onChange={e => setIsCore(e.target.checked)} />
          <label htmlFor="isCore" style={{ fontSize: '0.875rem' }}>Core subject</label>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>{saving ? 'Saving…' : 'Assign'}</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [modal,    setModal]    = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [mError,   setMError]   = useState(null);

  const load = async () => {
    try { setLoading(true); setError(null); setSubjects(await principalApi.getSubjects()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const saveSubject = async (fields) => {
    setSaving(true); setMError(null);
    try {
      if (modal.data) { await principalApi.updateSubject(modal.data.id, fields); }
      else            { await principalApi.createSubject(fields); }
      setModal(null); await load();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject? It will be removed from all curricula.')) return;
    try { await principalApi.deleteSubject(id); await load(); }
    catch (err) { alert(err.message); }
  };

  const assignSubject = async (fields) => {
    setSaving(true); setMError(null);
    try { await principalApi.assignSubject(fields); setModal(null); }
    catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner message="Loading subjects…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="sp-page-title">Subjects</h1>
          <p className="sp-page-sub">Manage the master subject list and assign subjects to classes</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => { setModal({ type: 'assign' }); setMError(null); }}>
            <ChevronDown size={16} /> Assign to Class
          </button>
          <button className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => { setModal({ type: 'subject' }); setMError(null); }}>
            <Plus size={16} /> New Subject
          </button>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="sp-card"><div className="sp-empty"><div className="sp-empty-icon">📚</div>No subjects yet.</div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {subjects.map(s => (
            <div className="sp-card" key={s.id} style={{ padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={18} color="#2563EB" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.code}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button className="btn-edit"   onClick={() => { setModal({ type: 'subject', data: s }); setMError(null); }}><Edit2  size={13} /></button>
                  <button className="btn-danger" onClick={() => deleteSubject(s.id)}>                                          <Trash2 size={13} /></button>
                </div>
              </div>
              {s.description && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.6rem', lineHeight: 1.4 }}>{s.description}</p>
              )}
              <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Used in {s.curriculum_count} curriculum{s.curriculum_count !== '1' ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'subject' && (
        <Modal title={modal.data ? 'Edit Subject' : 'New Subject'} onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <SubjectForm initial={modal.data || {}} onSave={saveSubject} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === 'assign' && (
        <Modal title="Assign Subject to Class" onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <CurriculumForm subjects={subjects} onSave={assignSubject} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
    </div>
  );
}
