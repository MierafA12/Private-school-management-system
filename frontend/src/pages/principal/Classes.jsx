import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, X, Users, UserPlus, Search, UserMinus } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import './principal.css';

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: wide ? 620 : 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: 4 }}
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Section Students Modal ──────────────────────────────────────────────────
function SectionStudentsModal({ cls, section, onClose, onOpenEnroll, onStudentRemoved }) {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [removing, setRemoving] = useState(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await principalApi.getSectionStudents(section.id);
      setStudents(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [section.id]);

  const handleRemove = async (enrollment) => {
    const name = `${enrollment.first_name} ${enrollment.last_name}`;
    if (!window.confirm(`Unenroll ${name} from ${cls.name} - Section ${section.name}?`)) return;
    try {
      setRemoving(enrollment.id);
      await principalApi.removeStudentFromSection(enrollment.id);
      await loadStudents();
      if (onStudentRemoved) onStudentRemoved();
    } catch (err) {
      alert(err.message || 'Failed to unenroll student');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-color, #1E293B)' }}>
            {cls.name} — Section {section.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>
            Room: {section.room_number || 'N/A'} · Capacity: {section.capacity || '—'} · Enrolled: {students.length}
          </div>
        </div>
        <button
          type="button"
          className="btn-prim"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          onClick={onOpenEnroll}
        >
          <UserPlus size={14} /> Enroll Student
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem 0' }}><LoadingSpinner message="Loading enrolled students…" /></div>
      ) : error ? (
        <div style={{ color: '#EF4444', fontSize: '0.85rem', padding: '1rem' }}>{error}</div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1', margin: '1rem 0' }}>
          <Users size={32} style={{ color: '#94A3B8', marginBottom: '0.5rem' }} />
          <div style={{ fontWeight: 600, color: '#334155' }}>No students enrolled in this section yet</div>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.25rem 0 1rem' }}>
            Room capacity is {section.capacity || 50}, but currently 0 students have been assigned to this section for the active academic year.
          </p>
          <button
            type="button"
            className="btn-prim"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
            onClick={onOpenEnroll}
          >
            <UserPlus size={14} /> Enroll First Student
          </button>
        </div>
      ) : (
        <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
          <table className="sp-table" style={{ margin: 0 }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 1 }}>
                <th>Roll #</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Gender</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr key={st.id}>
                  <td style={{ fontWeight: 600, color: '#0284C7' }}>{st.roll_number || '—'}</td>
                  <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{st.student_id_number || '—'}</td>
                  <td style={{ fontWeight: 500 }}>{st.first_name} {st.last_name}</td>
                  <td style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{st.gender || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-danger"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      title="Remove from Section"
                      disabled={removing === st.id}
                      onClick={() => handleRemove(st)}
                    >
                      <UserMinus size={12} /> {removing === st.id ? 'Removing…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="modal-footer" style={{ marginTop: '1.25rem' }}>
        <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ─── Enroll Student Into Section Modal ───────────────────────────────────────
function EnrollStudentModal({ cls, section, onClose, onEnrolled }) {
  const [unenrolled, setUnenrolled] = useState([]);
  const [search,     setSearch]     = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [enrolling,  setEnrolling]  = useState(false);
  const [error,      setError]      = useState(null);

  const fetchUnenrolled = async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      const list = await principalApi.getUnenrolledStudents(query);
      setUnenrolled(list || []);
      if (list && list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnenrolled('');
  }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      alert('Please select a student to enroll.');
      return;
    }
    try {
      setEnrolling(true);
      setError(null);
      await principalApi.enrollStudentToSection(section.id, {
        student_id: selectedId,
        roll_number: rollNumber.trim() || undefined,
      });
      onEnrolled();
    } catch (err) {
      setError(err.message || 'Failed to enroll student');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <form onSubmit={handleEnroll}>
      <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1E293B' }}>
          Enrolling into: <span style={{ color: 'var(--primary, #0284C7)' }}>{cls.name} — Section {section.name}</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
          Room: {section.room_number || 'N/A'} · Max Capacity: {section.capacity || 50}
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.6rem 0.8rem', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Student selection */}
      <div className="pf-field">
        <label className="pf-label">Select Student to Enroll <span>*</span></label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              className="pf-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name or ID…"
              style={{ paddingLeft: '2rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>
          <button type="button" className="btn-ghost" onClick={() => fetchUnenrolled(search)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
            Filter
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '1rem 0' }}><LoadingSpinner message="Searching students…" /></div>
        ) : unenrolled.length === 0 ? (
          <div style={{ padding: '1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', fontSize: '0.82rem', color: '#92400E' }}>
            No unenrolled students found for the current academic year. If you recently registered students in the Registrar portal, ensure they are not already enrolled in another section.
          </div>
        ) : (
          <select
            className="pf-input"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            required
            size={Math.min(6, unenrolled.length + 1)}
            style={{ fontFamily: 'inherit', fontSize: '0.85rem', lineHeight: '1.4' }}
          >
            {unenrolled.map(s => (
              <option key={s.id} value={s.id} style={{ padding: '0.35rem 0.5rem' }}>
                {s.first_name} {s.last_name} ({s.student_id_number || 'No ID'}) {s.gender ? `• ${s.gender}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="pf-field" style={{ marginTop: '1rem' }}>
        <label className="pf-label">Roll Number (Optional)</label>
        <input
          className="pf-input"
          value={rollNumber}
          onChange={e => setRollNumber(e.target.value)}
          placeholder="e.g. 01 or A-101"
        />
      </div>

      <div className="modal-footer" style={{ marginTop: '1.25rem' }}>
        <button type="button" className="btn-ghost" onClick={onClose} disabled={enrolling}>Cancel</button>
        <button
          type="submit"
          className="btn-prim"
          disabled={enrolling || loading || unenrolled.length === 0 || !selectedId}
        >
          {enrolling ? 'Enrolling…' : 'Enroll Student'}
        </button>
      </div>
    </form>
  );
}

// ─── Create Class + Sections together ────────────────────────────────────────
function CreateClassForm({ onSave, onClose, saving }) {
  const [name,        setName]        = useState('');
  const [gradeLevel,  setGradeLevel]  = useState('');
  const [description, setDescription] = useState('');

  // Sections list — start with one empty row
  const [sections, setSections] = useState([{ name: '', room_number: '', capacity: '' }]);

  const addSection  = () => setSections(s => [...s, { name: '', room_number: '', capacity: '' }]);
  const removeSection = (i) => setSections(s => s.filter((_, idx) => idx !== i));
  const updateSection = (i, key, val) =>
    setSections(s => s.map((sec, idx) => idx === i ? { ...sec, [key]: val } : sec));

  const submit = (e) => {
    e.preventDefault();
    // at least one non-empty section name required
    const validSections = sections.filter(s => s.name.trim());
    if (!validSections.length) { alert('Add at least one section (e.g. A, B).'); return; }
    onSave({
      class:    { name, grade_level: parseInt(gradeLevel), description: description || undefined },
      sections: validSections.map(s => ({
        name:        s.name.trim().toUpperCase(),
        room_number: s.room_number || undefined,
        capacity:    s.capacity   ? parseInt(s.capacity) : undefined,
      })),
    });
  };

  return (
    <form onSubmit={submit}>
      {/* Class info */}
      <div className="pc-section-title" style={{ marginTop: 0 }}>Class Details</div>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Class Name <span>*</span></label>
          <input className="pf-input" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Grade 7" required />
        </div>
        <div className="pf-field">
          <label className="pf-label">Grade Level <span>*</span></label>
          <input type="number" className="pf-input" value={gradeLevel}
            onChange={e => setGradeLevel(e.target.value)} placeholder="7" min={0} max={20} required />
        </div>
      </div>
      <div className="pf-field">
        <label className="pf-label">Description</label>
        <input className="pf-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
      </div>

      {/* Sections */}
      <div className="pc-section-title" style={{ marginTop: '1.25rem' }}>
        Sections <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
          — at least one required
        </span>
      </div>

      {sections.map((sec, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
          <div>
            {i === 0 && <label className="pf-label">Name</label>}
            <input className="pf-input" value={sec.name} onChange={e => updateSection(i, 'name', e.target.value)}
              placeholder="A" style={{ textTransform: 'uppercase' }} required={i === 0} />
          </div>
          <div>
            {i === 0 && <label className="pf-label">Room Number</label>}
            <input className="pf-input" value={sec.room_number} onChange={e => updateSection(i, 'room_number', e.target.value)} placeholder="e.g. Room 12" />
          </div>
          <div>
            {i === 0 && <label className="pf-label">Capacity</label>}
            <input type="number" className="pf-input" value={sec.capacity}
              onChange={e => updateSection(i, 'capacity', e.target.value)} placeholder="40" min={1} />
          </div>
          <div style={{ paddingTop: i === 0 ? '1.25rem' : 0 }}>
            {sections.length > 1 && (
              <button type="button" className="btn-danger" onClick={() => removeSection(i)}
                style={{ padding: '0.4rem' }} title="Remove">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      ))}

      <button type="button" onClick={addSection}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.25rem' }}>
        <Plus size={14} /> Add another section
      </button>

      <div className="modal-footer" style={{ marginTop: '1.25rem' }}>
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>
          {saving ? 'Creating…' : 'Create Class & Sections'}
        </button>
      </div>
    </form>
  );
}

// ─── Edit Class (name/level only) ────────────────────────────────────────────
function EditClassForm({ initial = {}, onSave, onClose, saving }) {
  const [name,        setName]        = useState(initial.name        || '');
  const [gradeLevel,  setGradeLevel]  = useState(initial.grade_level ?? '');
  const [description, setDescription] = useState(initial.description || '');

  const submit = (e) => {
    e.preventDefault();
    onSave({ name, grade_level: parseInt(gradeLevel), description });
  };

  return (
    <form onSubmit={submit}>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Class Name <span>*</span></label>
          <input className="pf-input" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="pf-field">
          <label className="pf-label">Grade Level <span>*</span></label>
          <input type="number" className="pf-input" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} min={0} max={20} required />
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

// ─── Add / Edit Section ───────────────────────────────────────────────────────
function SectionForm({ initial = {}, onSave, onClose, saving }) {
  const [name,     setName]     = useState(initial.name        || '');
  const [room,     setRoom]     = useState(initial.room_number || '');
  const [capacity, setCapacity] = useState(initial.capacity    || '');

  const submit = (e) => {
    e.preventDefault();
    onSave({
      name: name.trim().toUpperCase(),
      room_number: room || undefined,
      capacity:    capacity ? parseInt(capacity) : undefined,
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="pf-field">
        <label className="pf-label">Section Name <span>*</span></label>
        <input className="pf-input" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. A" required style={{ textTransform: 'uppercase' }} />
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
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

  // Create class + sections in sequence
  const createClassWithSections = async ({ class: classFields, sections }) => {
    setSaving(true); setMError(null);
    try {
      const created = await principalApi.createClass(classFields);
      for (const sec of sections) {
        await principalApi.createSection(created.id, sec);
      }
      setModal(null);
      await load();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const updateClass = async (fields) => {
    setSaving(true); setMError(null);
    try {
      await principalApi.updateClass(modal.data.id, fields);
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
          <p className="sp-page-sub">Each class requires at least one section when created</p>
        </div>
        <button className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => { setModal({ type: 'create' }); setMError(null); }}>
          <Plus size={16} /> New Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="sp-card">
          <div className="sp-empty">
            <div className="sp-empty-icon">🏫</div>
            <div style={{ fontWeight: 600 }}>No classes yet</div>
            <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>Click "New Class" to create a class with sections.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {classes.map(cls => (
            <div className="sp-card" key={cls.id}>
              {/* Class row */}
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
                  <button className="btn-edit"   onClick={() => { setModal({ type: 'edit', data: cls }); setMError(null); }}><Edit2 size={13} /></button>
                  <button className="btn-danger" onClick={() => deleteClass(cls.id)}><Trash2 size={13} /></button>
                  <button className="btn-prim"   style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => { setModal({ type: 'section', classId: cls.id }); setMError(null); }}>
                    <Plus size={13} /> Section
                  </button>
                </div>
              </div>

              {/* Sections */}
              {expanded[cls.id] && (
                <div style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem 1.25rem' }}>
                  {!cls.sections ? (
                    <LoadingSpinner message="" />
                  ) : cls.sections.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No sections. Click "+ Section" to add one.</div>
                  ) : (
                    <table className="sp-table">
                      <thead>
                        <tr>
                          <th>Section</th>
                          <th>Room</th>
                          <th>Capacity</th>
                          <th>Enrolled Students</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cls.sections.map(sec => (
                          <tr key={sec.id}>
                            <td style={{ fontWeight: 600 }}>Section {sec.name}</td>
                            <td style={{ fontSize: '0.8rem' }}>{sec.room_number || '—'}</td>
                            <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                              {sec.capacity ? `${sec.capacity} max` : '—'}
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => setModal({ type: 'students', class: cls, section: sec })}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  border: '1px solid',
                                  borderColor: sec.current_students > 0 ? '#10B981' : '#CBD5E1',
                                  background: sec.current_students > 0 ? '#ECFDF5' : '#F8FAFC',
                                  color: sec.current_students > 0 ? '#065F46' : '#64748B',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Click to view enrolled students"
                              >
                                <Users size={12} />
                                <span>
                                  {sec.current_students} {sec.capacity ? `/ ${sec.capacity}` : ''} Enrolled
                                </span>
                                {Number(sec.current_students) === 0 && (
                                  <span style={{ fontSize: '0.7rem', opacity: 0.75, fontWeight: 500 }}>(0)</span>
                                )}
                              </button>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  className="btn-prim"
                                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  title="Enroll student to this section"
                                  onClick={() => setModal({ type: 'enroll', class: cls, section: sec })}
                                >
                                  <UserPlus size={12} /> Enroll
                                </button>
                                <button
                                  type="button"
                                  className="btn-ghost"
                                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid #E2E8F0' }}
                                  title="View section students"
                                  onClick={() => setModal({ type: 'students', class: cls, section: sec })}
                                >
                                  <Users size={12} /> View
                                </button>
                                <button
                                  type="button"
                                  className="btn-edit"
                                  style={{ padding: '0.3rem 0.45rem' }}
                                  title="Edit section"
                                  onClick={() => { setModal({ type: 'section', classId: cls.id, sectionData: sec }); setMError(null); }}
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-danger"
                                  style={{ padding: '0.3rem 0.45rem' }}
                                  title="Delete section"
                                  onClick={() => deleteSection(cls.id, sec.id)}
                                >
                                  <Trash2 size={12} />
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

      {/* Create class + sections */}
      {modal?.type === 'create' && (
        <Modal title="New Class" onClose={() => setModal(null)} wide>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <CreateClassForm onSave={createClassWithSections} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {/* Edit class info */}
      {modal?.type === 'edit' && (
        <Modal title="Edit Class" onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <EditClassForm initial={modal.data} onSave={updateClass} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {/* Add / edit section */}
      {modal?.type === 'section' && (
        <Modal title={modal.sectionData ? 'Edit Section' : 'Add Section'} onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <SectionForm initial={modal.sectionData || {}} onSave={saveSection} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {/* View section students */}
      {modal?.type === 'students' && (
        <Modal title="Enrolled Students" onClose={() => setModal(null)} wide>
          <SectionStudentsModal
            cls={modal.class}
            section={modal.section}
            onClose={() => setModal(null)}
            onOpenEnroll={() => setModal({ type: 'enroll', class: modal.class, section: modal.section })}
            onStudentRemoved={() => loadClass(modal.class.id)}
          />
        </Modal>
      )}

      {/* Enroll student into section */}
      {modal?.type === 'enroll' && (
        <Modal title="Enroll Student into Section" onClose={() => setModal(null)}>
          <EnrollStudentModal
            cls={modal.class}
            section={modal.section}
            onClose={() => setModal(null)}
            onEnrolled={async () => {
              await loadClass(modal.class.id);
              setModal({ type: 'students', class: modal.class, section: modal.section });
            }}
          />
        </Modal>
      )}
    </div>
  );
}
