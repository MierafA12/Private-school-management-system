import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, RefreshCw, Edit2, ChevronDown } from 'lucide-react';
import { enrollmentApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';
import EthiopianDatePicker from '../../components/shared/EthiopianDatePicker';
import { formatDualDate } from '../../utils/ethiopianDate';
import '../principal/principal.css';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso) => (iso ? formatDualDate(iso) : '—');

const STATUS_COLOR = {
  ACTIVE: 'green', INACTIVE: 'gray', TRANSFERRED: 'blue',
  GRADUATED: 'blue', REPEATED: 'yellow', WITHDRAWN: 'red',
};

// ─── Enroll Modal ─────────────────────────────────────────────────────────────
function EnrollModal({ options, onSave, onClose, saving, error }) {
  const [search,     setSearch]     = useState('');
  const [students,   setStudents]   = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [selected,   setSelected]   = useState(null);

  const [yearId,    setYearId]    = useState(options.academic_years.find(a => a.is_current)?.id || '');
  const [classId,   setClassId]   = useState('');
  const [sectionId, setSectionId] = useState('');
  const [enrollDate,setEnrollDate]= useState(new Date().toISOString().slice(0, 10));

  const selectedClass    = options.classes.find(c => c.id === classId);
  const availableSections = selectedClass?.sections || [];

  // Search unenrolled students
  useEffect(() => {
    if (!yearId) { setStudents([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await enrollmentApi.getUnenrolled(yearId, search || undefined);
        setStudents(data);
      } catch { setStudents([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, yearId]);

  const submit = (e) => {
    e.preventDefault();
    if (!selected) { alert('Please select a student.'); return; }
    onSave({
      student_id:       selected.id,
      academic_year_id: yearId,
      class_id:         classId,
      section_id:       sectionId,
      enrollment_date:  enrollDate,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ maxWidth: 560 }}>
        <h3>Enroll Student</h3>

        {error && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{error}</p>}

        <form onSubmit={submit}>
          {/* Academic year */}
          <div className="pf-field">
            <label className="pf-label">Academic Year <span>*</span></label>
            <select className="pf-select" value={yearId} onChange={e => { setYearId(e.target.value); setSelected(null); }} required>
              <option value="">— Select —</option>
              {options.academic_years.map(a => (
                <option key={a.id} value={a.id}>{a.name}{a.is_current ? ' (Current)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Student search */}
          {yearId && (
            <div className="pf-field">
              <label className="pf-label">Student <span>*</span></label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="pf-input" style={{ paddingLeft: '2rem' }}
                  placeholder="Search by name or student number…"
                  value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
                />
              </div>
              {searching && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Searching…</div>}

              {/* Student picker list */}
              {!selected && students.length > 0 && (
                <div style={{
                  border: '1px solid var(--border-color)', borderRadius: 8, marginTop: '0.3rem',
                  maxHeight: 180, overflowY: 'auto', background: 'white',
                }}>
                  {students.map(s => (
                    <div
                      key={s.id}
                      onClick={() => { setSelected(s); setSearch(`${s.first_name} ${s.last_name}`); }}
                      style={{
                        padding: '0.6rem 0.875rem', cursor: 'pointer', fontSize: '0.875rem',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <span style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                        {s.student_number}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {selected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', padding: '0.5rem 0.875rem', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#15803D' }}>✓ {selected.first_name} {selected.last_name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#166534' }}>{selected.student_number}</span>
                  <button type="button" onClick={() => { setSelected(null); setSearch(''); }} style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--primary)' }}>Change</button>
                </div>
              )}
            </div>
          )}

          {/* Class & Section */}
          <div className="pf-grid-2">
            <div className="pf-field">
              <label className="pf-label">Class <span>*</span></label>
              <select className="pf-select" value={classId} onChange={e => { setClassId(e.target.value); setSectionId(''); }} required>
                <option value="">— Select —</option>
                {options.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="pf-field">
              <label className="pf-label">Section <span>*</span></label>
              <select className="pf-select" value={sectionId} onChange={e => setSectionId(e.target.value)} required disabled={!classId}>
                <option value="">— Select —</option>
                {availableSections.map(s => (
                  <option key={s.id} value={s.id}>Section {s.name}{s.capacity ? ` (Cap: ${s.capacity})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pf-field">
            <label className="pf-label">Enrollment Date (Ethiopian Calendar) <span>*</span></label>
            <EthiopianDatePicker value={enrollDate} onChange={setEnrollDate} required />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-prim" disabled={saving || !selected}>
              {saving ? 'Enrolling…' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Status Modal ────────────────────────────────────────────────────────
function EditModal({ enrollment, onSave, onClose, saving, error }) {
  const [status,    setStatus]    = useState(enrollment.enrollment_status);
  const [rollNo,    setRollNo]    = useState(enrollment.roll_number || '');

  const submit = (e) => {
    e.preventDefault();
    onSave({ enrollment_status: status, roll_number: rollNo || undefined });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <h3>Edit Enrollment</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {enrollment.first_name} {enrollment.last_name} · {enrollment.class_name} {enrollment.section_name}
        </p>
        {error && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{error}</p>}
        <form onSubmit={submit}>
          <div className="pf-field">
            <label className="pf-label">Status</label>
            <select className="pf-select" value={status} onChange={e => setStatus(e.target.value)}>
              {['ACTIVE','INACTIVE','TRANSFERRED','GRADUATED','REPEATED','WITHDRAWN'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="pf-field">
            <label className="pf-label">Roll Number</label>
            <input className="pf-input" value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="e.g. 001" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-prim" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Enrollments() {
  const [options,     setOptions]     = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // Filters
  const [filterYear,    setFilterYear]    = useState('');
  const [filterClass,   setFilterClass]   = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [search,        setSearch]        = useState('');
  const [offset,        setOffset]        = useState(0);
  const LIMIT = 40;

  // Modals
  const [enrollModal, setEnrollModal] = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [mError,      setMError]      = useState(null);

  // Load options once
  useEffect(() => {
    enrollmentApi.getOptions().then(d => {
      setOptions(d);
      // Default to current year
      const cur = d.academic_years.find(a => a.is_current);
      if (cur) setFilterYear(cur.id);
    }).catch(() => {});
  }, []);

  const loadEnrollments = useCallback(async () => {
    if (!options) return;
    try {
      setLoading(true); setError(null);
      const params = { limit: LIMIT, offset };
      if (filterYear)    params.academic_year_id = filterYear;
      if (filterClass)   params.class_id         = filterClass;
      if (filterSection) params.section_id       = filterSection;
      if (filterStatus)  params.status           = filterStatus;
      if (search)        params.search           = search;
      const data = await enrollmentApi.list(params);
      setEnrollments(data.enrollments);
      setTotal(data.total);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [options, filterYear, filterClass, filterSection, filterStatus, search, offset]);

  useEffect(() => { loadEnrollments(); }, [loadEnrollments]);

  // Reset offset when filters change
  useEffect(() => { setOffset(0); }, [filterYear, filterClass, filterSection, filterStatus, search]);

  const selectedClass     = options?.classes.find(c => c.id === filterClass);
  const availableSections = selectedClass?.sections || [];

  const doEnroll = async (fields) => {
    setSaving(true); setMError(null);
    try {
      await enrollmentApi.create(fields);
      setEnrollModal(false);
      await loadEnrollments();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const doEdit = async (fields) => {
    setSaving(true); setMError(null);
    try {
      await enrollmentApi.update(editTarget.enrollment_id, fields);
      setEditTarget(null);
      await loadEnrollments();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const pages = Math.ceil(total / LIMIT);
  const page  = Math.floor(offset / LIMIT);

  if (!options) return <LoadingSpinner message="Loading enrollment options…" />;

  return (
    <div>
      {/* Header */}
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="sp-page-title">Enrollment Management</h1>
          <p className="sp-page-sub">Assign students to classes and sections for each academic year</p>
        </div>
        <button
          className="btn-prim"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => { setEnrollModal(true); setMError(null); }}
        >
          <Plus size={16} /> Enroll Student
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="pf-input" style={{ paddingLeft: '2rem', marginBottom: 0 }}
            placeholder="Search student name or number…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Year filter */}
        <select className="pf-select" style={{ width: 160 }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">All Years</option>
          {options.academic_years.map(a => (
            <option key={a.id} value={a.id}>{a.name}{a.is_current ? ' ✓' : ''}</option>
          ))}
        </select>

        {/* Class filter */}
        <select className="pf-select" style={{ width: 140 }} value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterSection(''); }}>
          <option value="">All Classes</option>
          {options.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Section filter */}
        <select className="pf-select" style={{ width: 130 }} value={filterSection} onChange={e => setFilterSection(e.target.value)} disabled={!filterClass}>
          <option value="">All Sections</option>
          {availableSections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
        </select>

        {/* Status filter */}
        <select className="pf-select" style={{ width: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['ACTIVE','INACTIVE','TRANSFERRED','GRADUATED','REPEATED','WITHDRAWN'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Reset */}
        <button
          title="Reset filters"
          onClick={() => { setSearch(''); setFilterYear(''); setFilterClass(''); setFilterSection(''); setFilterStatus(''); }}
          style={{ padding: '0.55rem', borderRadius: 8, border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Summary pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {loading ? 'Loading…' : `${total} enrollment${total !== 1 ? 's' : ''} found`}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading enrollments…" />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadEnrollments} />
      ) : enrollments.length === 0 ? (
        <div className="sp-card">
          <EmptyState icon="📋" title="No enrollments found" subtitle="Try adjusting the filters or enroll a student." />
        </div>
      ) : (
        <div className="sp-card">
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student #</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Roll #</th>
                  <th>Year</th>
                  <th>Enrolled</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map(e => (
                  <tr key={e.enrollment_id}>
                    <td style={{ fontWeight: 600 }}>{e.first_name} {e.last_name}</td>
                    <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{e.student_number}</td>
                    <td>{e.class_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>Section {e.section_name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{e.roll_number || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.academic_year}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtDate(e.enrollment_date)}</td>
                    <td>
                      <span className={`sp-badge sp-badge--${STATUS_COLOR[e.enrollment_status] || 'gray'}`}>
                        {e.enrollment_status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => { setEditTarget(e); setMError(null); }}
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.25rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)' }}>
              <button
                disabled={page === 0}
                onClick={() => setOffset(o => o - LIMIT)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', fontWeight: 600, color: page === 0 ? 'var(--text-muted)' : 'var(--text-main)' }}
              >← Prev</button>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Page {page + 1} of {pages}</span>
              <button
                disabled={page >= pages - 1}
                onClick={() => setOffset(o => o + LIMIT)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', fontWeight: 600, color: page >= pages - 1 ? 'var(--text-muted)' : 'var(--text-main)' }}
              >Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Enroll modal */}
      {enrollModal && (
        <EnrollModal
          options={options}
          onSave={doEnroll}
          onClose={() => setEnrollModal(false)}
          saving={saving}
          error={mError}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          enrollment={editTarget}
          onSave={doEdit}
          onClose={() => setEditTarget(null)}
          saving={saving}
          error={mError}
        />
      )}
    </div>
  );
}
