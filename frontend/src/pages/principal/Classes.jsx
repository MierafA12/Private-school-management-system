import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
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

function ClassForm({ initial = {}, onSave, onClose, saving }) {
  const [name,        setName]        = useState(initial.name        || '');
  const [gradeLevel,  setGradeLevel]  = useState(initial.grade_level ?? '');
  const [description, setDescription] = useState(initial.description || '');

  const submit = (e) => { e.preventDefault(); onSave({ name, grade_level: parseInt(gradeLevel), description }); };

  return (
    <form onSubmit={submit}>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Class Name <span>*</span></label>
          <input className="pf-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grade 7" required />
        </div>
        <div className="pf-field">
          <label className="pf-label">Grade Level <span>*</span></label>
          <input type="number" className="pf-input" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} placeholder="7" min={0} max={20} required />
        </div>
      </div>
      <div className="pf-field">
        <label className="pf-label">Description</label>
        <input className="pf-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

function SectionForm({ initial = {}, onSave, onClose, saving }) {
  const [name,       setName]       = useState(initial.name        || '');
  const [room,       setRoom]       = useState(initial.room_number || '');
  const [capacity,   setCapacity]   = useState(initial.capacity    || '');

  const submit = (e) => { e.preventDefault(); onSave({ name, room_number: room || undefined, capacity: capacity ? parseInt(capacity) : undefined }); };

  return (
    <form onSubmit={submit}>
      <div className="pf-field">
        <label className="pf-label">Section Name <span>*</span></label>
        <input className="pf-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. A" required />
      </div>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Room Number</label>
          <input className="pf-input" value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. Room 12" />
        </div>
        <div className="pf-field">
          <label className="pf-label">Capacity</label>
          <input type="number" className="pf-input" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="40" min={1} />
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function Classes() {
  const [classes,  setClasses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState({});
  const [modal,    setModal]    = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [mError,   setMError]   = useState(null);

  const load = async () => {
    try { setLoading(true); setError(null); setClasses(await principalApi.getClasses()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const loadClass = async (id) => {
    const detail = await principalApi.getClassById(id);
    setClasses(prev => prev.map(c => c.id === id ? { ...c, sections: detail.sections } : c));
  };

  const saveClass = async (fields) => {
    setSaving(true); setMError(null);
    try {
      if (modal.data) { await principalApi.updateClass(modal.data.id, fields); }
      else            { await principalApi.createClass(fields); }
      setModal(null); await load();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const deleteClass = async (id) => {
    if (!confirm('Delete this class and all its sections?')) return;
    try { await principalApi.deleteClass(id); await load(); }
    catch (err) { alert(err.message); }
  };

  const saveSection = async (fields) => {
    setSaving(true); setMError(null);
    try {
      if (modal.sectionData) { await principalApi.updateSection(modal.sectionData.id, fields); }
      else                   { await principalApi.createSection(modal.classId, fields); }
      setModal(null); await loadClass(modal.classId);
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const deleteSection = async (classId, sectionId) => {
    if (!confirm('Delete this section?')) return;
    try { await principalApi.deleteSection(sectionId); await loadClass(classId); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <LoadingSpinner message="Loading classes…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="sp-page-title">Classes & Sections</h1>
          <p className="sp-page-sub">Manage grade levels and their sections</p>
        </div>
        <button className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => { setModal({ type: 'class' }); setMError(null); }}>
          <Plus size={16} /> New Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="sp-card"><div className="sp-empty"><div className="sp-empty-icon">🏫</div>No classes yet.</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {classes.map(cls => (
            <div className="sp-card" key={cls.id}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
                onClick={async () => {
                  toggle(cls.id);
                  if (!cls.sections) await loadClass(cls.id);
                }}
              >
                {expanded[cls.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700 }}>{cls.name}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    Grade {cls.grade_level} · {cls.section_count} section{cls.section_count !== '1' ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
                  <button className="btn-edit"   onClick={() => { setModal({ type: 'class', data: cls }); setMError(null); }}><Edit2 size={13} /></button>
                  <button className="btn-danger" onClick={() => deleteClass(cls.id)}><Trash2 size={13} /></button>
                  <button className="btn-prim"   style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => { setModal({ type: 'section', classId: cls.id }); setMError(null); }}>
                    <Plus size={13} /> Section
                  </button>
                </div>
              </div>

              {expanded[cls.id] && (
                <div style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem 1.25rem' }}>
                  {!cls.sections ? (
                    <LoadingSpinner message="" />
                  ) : cls.sections.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No sections yet.</div>
                  ) : (
                    <table className="sp-table">
                      <thead>
                        <tr><th>Section</th><th>Room</th><th>Capacity</th><th>Students</th><th></th></tr>
                      </thead>
                      <tbody>
                        {cls.sections.map(sec => (
                          <tr key={sec.id}>
                            <td style={{ fontWeight: 600 }}>Section {sec.name}</td>
                            <td style={{ fontSize: '0.8rem' }}>{sec.room_number || '—'}</td>
                            <td>{sec.capacity || '—'}</td>
                            <td style={{ fontWeight: 600 }}>{sec.current_students}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button className="btn-edit"
                                  onClick={() => { setModal({ type: 'section', classId: cls.id, sectionData: sec }); setMError(null); }}>
                                  <Edit2 size={13} />
                                </button>
                                <button className="btn-danger" onClick={() => deleteSection(cls.id, sec.id)}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'class' && (
        <Modal title={modal.data ? 'Edit Class' : 'New Class'} onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <ClassForm initial={modal.data || {}} onSave={saveClass} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === 'section' && (
        <Modal title={modal.sectionData ? 'Edit Section' : 'Add Section'} onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <SectionForm initial={modal.sectionData || {}} onSave={saveSection} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
    </div>
  );
}
