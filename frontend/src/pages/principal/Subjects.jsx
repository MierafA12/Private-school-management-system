import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, ChevronDown, X } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import './principal.css';

// ─── Preset Ethiopian school subjects ────────────────────────────────────────
const PRESET_SUBJECTS = [
  { name: 'Amharic',        code: 'AMH',  desc: 'Ethiopian national language' },
  { name: 'English',        code: 'ENG',  desc: 'English language and literature' },
  { name: 'Mathematics',    code: 'MTH',  desc: 'Mathematics' },
  { name: 'Science',        code: 'SCI',  desc: 'General science' },
  { name: 'Biology',        code: 'BIO',  desc: 'Biological sciences' },
  { name: 'Chemistry',      code: 'CHM',  desc: 'Chemistry' },
  { name: 'Physics',        code: 'PHY',  desc: 'Physics' },
  { name: 'History',        code: 'HST',  desc: 'History' },
  { name: 'Geography',      code: 'GEO',  desc: 'Geography' },
  { name: 'Civic & Ethics', code: 'CIV',  desc: 'Civic and ethical education' },
  { name: 'Geez',           code: 'GEZ',  desc: 'Classical Ethiopic language' },
  { name: 'Tigrigna',       code: 'TIG',  desc: 'Tigrigna language' },
  { name: 'Oromiffa',       code: 'ORM',  desc: 'Afaan Oromo language' },
  { name: 'Afar',           code: 'AFR',  desc: 'Afar language' },
  { name: 'Somali',         code: 'SOM',  desc: 'Somali language' },
  { name: 'Arabic',         code: 'ARB',  desc: 'Arabic language' },
  { name: 'ICT',            code: 'ICT',  desc: 'Information and Communication Technology' },
  { name: 'Physical Education', code: 'PE',  desc: 'Physical education and sport' },
  { name: 'Art & Craft',    code: 'ART',  desc: 'Visual arts and crafts' },
  { name: 'Music',          code: 'MUS',  desc: 'Music' },
  { name: 'Library',        code: 'LIB',  desc: 'Library and reading skills' },
  { name: 'Religion',       code: 'REL',  desc: 'Religious education' },
  { name: 'Economics',      code: 'ECO',  desc: 'Economics' },
  { name: 'Business',       code: 'BUS',  desc: 'Business studies' },
  { name: 'Agriculture',    code: 'AGR',  desc: 'Agricultural science' },
];

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ maxWidth: wide ? 620 : 480 }}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ─── Subject Form with preset picker ─────────────────────────────────────────
function SubjectForm({ initial = {}, existingCodes = [], onSave, onClose, saving }) {
  const [code,   setCode]   = useState(initial.code        || '');
  const [name,   setName]   = useState(initial.name        || '');
  const [desc,   setDesc]   = useState(initial.description || '');
  const [search, setSearch] = useState('');
  const [mode,   setMode]   = useState(initial.name ? 'custom' : 'pick');
  // mode: 'pick' = show preset list, 'custom' = free-text entry

  const isEditing = !!initial.name;

  // Filter presets by search + not already added
  const filtered = PRESET_SUBJECTS.filter(p => {
    const alreadyAdded = existingCodes.includes(p.code) && p.code !== initial.code;
    const matchSearch  = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return !alreadyAdded && matchSearch;
  });

  const pickPreset = (p) => {
    setCode(p.code);
    setName(p.name);
    setDesc(p.desc);
    setMode('custom'); // switch to edit view after picking
  };

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    onSave({ code: code.trim().toUpperCase(), name: name.trim(), description: desc || undefined });
  };

  // ── Pick mode (preset grid) ─────────────────────────────────────────────
  if (mode === 'pick' && !isEditing) {
    return (
      <div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
          Click a subject to add it, or type a custom name below.
        </p>

        {/* Search */}
        <input
          className="pf-input"
          placeholder="Search subjects…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: '0.75rem' }}
        />

        {/* Preset grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: 280, overflowY: 'auto', marginBottom: '1rem' }}>
          {filtered.map(p => (
            <button
              key={p.code}
              type="button"
              onClick={() => pickPreset(p)}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: 999,
                border: '1px solid var(--border-color)',
                background: 'white',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = ''; }}
            >
              <Plus size={11} /> {p.name}
            </button>
          ))}
          {filtered.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No matching subjects found.</p>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => { setMode('custom'); setCode(''); setName(''); setDesc(''); }}>
            <Plus size={14} /> Enter Custom Subject
          </button>
        </div>
      </div>
    );
  }

  // ── Custom / Edit mode ───────────────────────────────────────────────────
  return (
    <form onSubmit={submit}>
      {!isEditing && (
        <button type="button" onClick={() => setMode('pick')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.875rem' }}>
          ← Back to subject list
        </button>
      )}

      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Subject Code <span>*</span></label>
          <input className="pf-input" value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. MTH" required maxLength={10} />
        </div>
        <div className="pf-field">
          <label className="pf-label">Subject Name <span>*</span></label>
          <input className="pf-input" value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mathematics" required />
        </div>
      </div>
      <div className="pf-field">
        <label className="pf-label">Description</label>
        <input className="pf-input" value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Optional short description" />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>
          {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Subject'}
        </button>
      </div>
    </form>
  );
}

// ─── Bulk add presets that aren't in the list yet ────────────────────────────
function BulkAddForm({ existingCodes, onAdd, onClose, saving }) {
  const available = PRESET_SUBJECTS.filter(p => !existingCodes.includes(p.code));
  const [selected, setSelected] = useState(new Set());

  const toggle = (code) => setSelected(prev => {
    const next = new Set(prev);
    next.has(code) ? next.delete(code) : next.add(code);
    return next;
  });

  const toggleAll = () => {
    if (selected.size === available.length) setSelected(new Set());
    else setSelected(new Set(available.map(p => p.code)));
  };

  const submit = () => {
    const toAdd = available.filter(p => selected.has(p.code));
    if (!toAdd.length) { alert('Select at least one subject.'); return; }
    onAdd(toAdd);
  };

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        Select subjects to add in bulk. Already-added subjects are hidden.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <button type="button" onClick={toggleAll} style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
          {selected.size === available.length ? 'Deselect All' : 'Select All'}
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selected.size} selected</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: 280, overflowY: 'auto', marginBottom: '1rem' }}>
        {available.map(p => (
          <button key={p.code} type="button" onClick={() => toggle(p.code)}
            style={{
              padding: '0.35rem 0.8rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
              background: selected.has(p.code) ? 'var(--primary)' : 'white',
              color:      selected.has(p.code) ? 'white' : 'var(--text-main)',
              border:     `1px solid ${selected.has(p.code) ? 'var(--primary)' : 'var(--border-color)'}`,
              transition: 'all 0.15s',
            }}>
            {p.name}
          </button>
        ))}
        {available.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>All preset subjects have already been added.</p>
        )}
      </div>

      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-prim" disabled={saving || !selected.size} onClick={submit}>
          {saving ? 'Adding…' : `Add ${selected.size || ''} Subject${selected.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}

// ─── Assign to Curriculum Form ────────────────────────────────────────────────
function CurriculumForm({ subjects: propSubjects, onSave, onClose, saving }) {
  const [academicYears, setAcademicYears] = useState([]);
  const [classes,       setClasses]       = useState([]);
  const [subjects,      setSubjects]      = useState(propSubjects || []);
  const [yearId,    setYearId]    = useState('');
  const [classId,   setClassId]   = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [isCore,    setIsCore]    = useState(true);
  const [periods,   setPeriods]   = useState(5);
  const [passMark,  setPassMark]  = useState(50);
  const [maxMark,   setMaxMark]   = useState(100);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    Promise.all([
      principalApi.getAcademicYears(),
      principalApi.getClasses(),
      // Always re-fetch subjects so we get the latest list even if propSubjects is stale/empty
      principalApi.getSubjects(),
    ])
      .then(([ays, cls, subs]) => {
        setAcademicYears(ays);
        setClasses(cls);
        setSubjects(subs);
      })
      .finally(() => setLoadingMeta(false));
  }, []);

  const submit = (e) => {
    e.preventDefault();
    onSave({ academic_year_id: yearId, class_id: classId, subject_id: subjectId,
             is_core: isCore, weekly_periods: parseInt(periods),
             pass_mark: parseFloat(passMark), max_mark: parseFloat(maxMark) });
  };

  if (loadingMeta) return <LoadingSpinner message="" />;

  return (
    <form onSubmit={submit}>
      <div className="pf-field">
        <label className="pf-label">Academic Year <span>*</span></label>
        <select className="pf-select" value={yearId} onChange={e => setYearId(e.target.value)} required>
          <option value="">— Select —</option>
          {academicYears.map(a => <option key={a.id} value={a.id}>{a.name}{a.is_current ? ' ✓' : ''}</option>)}
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
        {subjects.length === 0 && !loadingMeta ? (
          <div style={{ padding: '0.6rem 0.875rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.82rem', color: '#991B1B' }}>
            ⚠️ No subjects in the master list yet. Go to Subjects page and add subjects first.
          </div>
        ) : (
          <select className="pf-select" value={subjectId} onChange={e => setSubjectId(e.target.value)} required disabled={loadingMeta}>
            <option value="">{loadingMeta ? 'Loading subjects…' : '— Select Subject —'}</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        )}
      </div>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Periods / Week</label>
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
        <button type="submit" className="btn-prim" disabled={saving}>{saving ? 'Assigning…' : 'Assign'}</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
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

  const existingCodes = subjects.map(s => s.code);

  const saveSubject = async (fields) => {
    setSaving(true); setMError(null);
    try {
      if (modal.data) { await principalApi.updateSubject(modal.data.id, fields); }
      else            { await principalApi.createSubject(fields); }
      setModal(null); await load();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  // Bulk add from presets
  const bulkAdd = async (presets) => {
    setSaving(true); setMError(null);
    let added = 0;
    const errors = [];
    for (const p of presets) {
      try { await principalApi.createSubject({ code: p.code, name: p.name, description: p.desc }); added++; }
      catch (err) { errors.push(`${p.name}: ${err.message}`); }
    }
    setSaving(false);
    setModal(null);
    await load();
    if (errors.length) alert(`Added ${added}. Errors:\n${errors.join('\n')}`);
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
          <p className="sp-page-sub">Add from preset list or enter a custom subject</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => { setModal({ type: 'bulk' }); setMError(null); }}>
            <Plus size={15} /> Add from List
          </button>
          <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => { setModal({ type: 'assign' }); setMError(null); }}>
            <ChevronDown size={15} /> Assign to Class
          </button>
          <button className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => { setModal({ type: 'subject' }); setMError(null); }}>
            <Plus size={15} /> Custom Subject
          </button>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="sp-card">
          <div className="sp-empty">
            <div className="sp-empty-icon">📚</div>
            <div style={{ fontWeight: 600 }}>No subjects yet</div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
              Click "Add from List" to quickly add common subjects, or "Custom Subject" to enter your own.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
          {subjects.map(s => (
            <div className="sp-card" key={s.id} style={{ padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={18} color="#2563EB" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>{s.code}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  <button className="btn-edit"   onClick={() => { setModal({ type: 'subject', data: s }); setMError(null); }}><Edit2  size={13} /></button>
                  <button className="btn-danger" onClick={() => deleteSubject(s.id)}><Trash2 size={13} /></button>
                </div>
              </div>
              {s.description && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.4 }}>{s.description}</p>
              )}
              <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Used in {s.curriculum_count} curriculum{s.curriculum_count !== '1' ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single subject form (preset picker or custom) */}
      {modal?.type === 'subject' && (
        <Modal title={modal.data ? 'Edit Subject' : 'Add Subject'} onClose={() => setModal(null)} wide={!modal.data}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <SubjectForm
            initial={modal.data || {}}
            existingCodes={existingCodes}
            onSave={saveSubject}
            onClose={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}

      {/* Bulk add */}
      {modal?.type === 'bulk' && (
        <Modal title="Add Subjects from List" onClose={() => setModal(null)} wide>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <BulkAddForm existingCodes={existingCodes} onAdd={bulkAdd} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {/* Assign to curriculum */}
      {modal?.type === 'assign' && (
        <Modal title="Assign Subject to Class" onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <CurriculumForm subjects={subjects} onSave={assignSubject} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
    </div>
  );
}
