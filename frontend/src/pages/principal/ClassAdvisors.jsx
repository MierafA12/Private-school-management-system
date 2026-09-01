import { useEffect, useState } from 'react';
import { Plus, Trash2, UserCheck } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';
import './principal.css';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-box"><h3>{title}</h3>{children}</div>
    </div>
  );
}

function AdvisorForm({ years, classes, teachers, onSave, onClose, saving }) {
  const [yearId,    setYearId]    = useState('');
  const [classId,   setClassId]   = useState('');
  const [sectionId, setSectionId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [date,      setDate]      = useState(new Date().toISOString().slice(0, 10));
  const [sections,  setSections]  = useState([]);
  const [loadingSec, setLoadingSec] = useState(false);

  const handleClassChange = async (id) => {
    setClassId(id); setSectionId('');
    if (!id) { setSections([]); return; }
    setLoadingSec(true);
    try {
      const detail = await principalApi.getClassById(id);
      setSections(detail.sections || []);
    } catch { setSections([]); }
    finally { setLoadingSec(false); }
  };

  const submit = (e) => {
    e.preventDefault();
    onSave({ academic_year_id: yearId, class_id: classId, section_id: sectionId, teacher_id: teacherId, assigned_date: date });
  };

  return (
    <form onSubmit={submit}>
      <div className="pf-field">
        <label className="pf-label">Academic Year <span>*</span></label>
        <select className="pf-select" value={yearId} onChange={e => setYearId(e.target.value)} required>
          <option value="">— Select —</option>
          {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' ✓' : ''}</option>)}
        </select>
      </div>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Class <span>*</span></label>
          <select className="pf-select" value={classId} onChange={e => handleClassChange(e.target.value)} required>
            <option value="">— Select —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="pf-field">
          <label className="pf-label">Section <span>*</span></label>
          <select className="pf-select" value={sectionId} onChange={e => setSectionId(e.target.value)} required disabled={!classId || loadingSec}>
            <option value="">— Select —</option>
            {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="pf-field">
        <label className="pf-label">Class Advisor (Teacher) <span>*</span></label>
        <select className="pf-select" value={teacherId} onChange={e => setTeacherId(e.target.value)} required>
          <option value="">— Select Teacher —</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.employee_number})</option>)}
        </select>
      </div>
      <div className="pf-field">
        <label className="pf-label">Assigned Date <span>*</span></label>
        <input type="date" className="pf-input" value={date} onChange={e => setDate(e.target.value)} required />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>{saving ? 'Assigning…' : 'Assign Advisor'}</button>
      </div>
    </form>
  );
}

export default function ClassAdvisors() {
  const [advisors,  setAdvisors]  = useState([]);
  const [years,     setYears]     = useState([]);
  const [classes,   setClasses]   = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [filterYear, setFilterYear] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [modal,     setModal]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [mError,    setMError]    = useState(null);

  const loadMeta = async () => {
    const [y, c, t] = await Promise.all([
      principalApi.getAcademicYears(),
      principalApi.getClasses(),
      principalApi.getTeacherList(),
    ]);
    setYears(y); setClasses(c); setTeachers(t);
    // Default to current year
    const cur = y.find(a => a.is_current);
    if (cur && !filterYear) setFilterYear(cur.id);
    return cur?.id;
  };

  const loadAdvisors = async (yearId) => {
    if (!yearId) return;
    try {
      setLoading(true); setError(null);
      setAdvisors(await principalApi.getClassAdvisors(yearId));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadMeta().then(curId => { if (curId) loadAdvisors(curId); else setLoading(false); });
  }, []); // eslint-disable-line

  useEffect(() => {
    if (filterYear) loadAdvisors(filterYear);
  }, [filterYear]); // eslint-disable-line

  const save = async (fields) => {
    setSaving(true); setMError(null);
    try {
      await principalApi.assignClassAdvisor(fields);
      setModal(null); await loadAdvisors(filterYear);
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Remove this class advisor assignment?')) return;
    try { await principalApi.removeClassAdvisor(id); await loadAdvisors(filterYear); }
    catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Class Advisors</h1>
          <p className="sp-page-sub">Assign homeroom / form teachers to class sections</p>
        </div>
        <button className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => { setModal({ type: 'advisor' }); setMError(null); }}>
          <Plus size={16} /> Assign Advisor
        </button>
      </div>

      {/* Year filter */}
      <div style={{ marginBottom: '1.25rem' }}>
        <select className="pf-select" style={{ maxWidth: 240 }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">Select Academic Year</option>
          {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' ✓' : ''}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner message="Loading advisors…" /> :
       error   ? <ErrorBanner message={error} onRetry={() => loadAdvisors(filterYear)} /> : (
        <div className="sp-card">
          {advisors.length === 0 ? (
            <EmptyState icon="👩‍🏫" title="No advisors assigned" subtitle="Assign a homeroom teacher to each section for the selected year." />
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr><th>Class</th><th>Section</th><th>Teacher</th><th>Emp #</th><th>Assigned</th><th></th></tr>
                </thead>
                <tbody>
                  {advisors.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.class_name}</td>
                      <td>Section {a.section_name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserCheck size={14} color="var(--primary)" />
                          </div>
                          {a.teacher_name}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{a.employee_number}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(a.assigned_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <button className="btn-danger" onClick={() => del(a.id)} title="Remove advisor"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal?.type === 'advisor' && (
        <Modal title="Assign Class Advisor" onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <AdvisorForm years={years} classes={classes} teachers={teachers} onSave={save} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
    </div>
  );
}
