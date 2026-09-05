import { useEffect, useState } from 'react';
import { Plus, Edit2, ChevronDown, ChevronRight, Trash2, CheckCircle } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import EthiopianDatePicker from '../../components/shared/EthiopianDatePicker';
import { formatDualDate, toEthiopian } from '../../utils/ethiopianDate';
import './principal.css';

const fmtDate = (iso) => iso ? formatDualDate(iso) : '—';

// ── Reusable Modal ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ maxWidth: '520px' }}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ── Year Form ─────────────────────────────────────────────────────────────────
function YearForm({ initial = {}, onSave, onClose, saving }) {
  const [name,       setName]       = useState(initial.name       || '');
  const [startDate,  setStartDate]  = useState(initial.start_date?.slice(0,10) || '');
  const [endDate,    setEndDate]    = useState(initial.end_date?.slice(0,10)   || '');
  const [isCurrent,  setIsCurrent]  = useState(initial.is_current || false);
  const [err,        setErr]        = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (startDate && endDate && endDate <= startDate) {
      setErr('End date must be after start date.');
      return;
    }
    setErr('');
    onSave({ name, start_date: startDate, end_date: endDate, is_current: isCurrent });
  };

  return (
    <form onSubmit={submit}>
      {err && (
        <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          {err}
        </div>
      )}

      <div className="pf-field">
        <label className="pf-label">Year Name <span>*</span></label>
        <input className="pf-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 2018/2019 E.C." required />
      </div>

      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Start Date (Ethiopian Calendar) <span>*</span></label>
          <EthiopianDatePicker
            value={startDate}
            onChange={(iso) => { setStartDate(iso); setErr(''); }}
            required
          />
        </div>
        <div className="pf-field">
          <label className="pf-label">End Date (Ethiopian Calendar) <span>*</span></label>
          <EthiopianDatePicker
            value={endDate}
            min={startDate || undefined}
            onChange={(iso) => { setEndDate(iso); setErr(''); }}
            required
          />
        </div>
      </div>

      <div className="pf-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
        <input type="checkbox" id="isCurrent" checked={isCurrent} onChange={e => setIsCurrent(e.target.checked)} />
        <label htmlFor="isCurrent" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Set as current academic year</label>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

// ── Semester Form ─────────────────────────────────────────────────────────────
function TermForm({ yearId, initial = {}, onSave, onClose, saving }) {
  const [name,      setName]      = useState(initial.name          || 'Semester 1 (Meskerem – Tir)');
  const [startDate, setStartDate] = useState(initial.start_date?.slice(0,10) || '');
  const [endDate,   setEndDate]   = useState(initial.end_date?.slice(0,10)   || '');
  const [status,    setStatus]    = useState(initial.status         || 'ACTIVE');
  const [err,       setErr]       = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (startDate && endDate && endDate <= startDate) {
      setErr('End date must be after start date.');
      return;
    }
    setErr('');
    onSave({ name, start_date: startDate, end_date: endDate, status });
  };

  return (
    <form onSubmit={submit}>
      {err && (
        <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          {err}
        </div>
      )}

      <div className="pf-field">
        <label className="pf-label">Semester Name <span>*</span> (2 Semesters per Year)</label>
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
            onClick={() => setName('Semester 1 (Meskerem – Tir)')}
          >
            Semester 1
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
            onClick={() => setName('Semester 2 (Yakatit – Sene)')}
          >
            Semester 2
          </button>
        </div>
        <input className="pf-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Semester 1" required />
      </div>

      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Start Date (Ethiopian Calendar) <span>*</span></label>
          <EthiopianDatePicker
            value={startDate}
            onChange={(iso) => { setStartDate(iso); setErr(''); }}
            required
          />
        </div>
        <div className="pf-field">
          <label className="pf-label">End Date (Ethiopian Calendar) <span>*</span></label>
          <EthiopianDatePicker
            value={endDate}
            min={startDate || undefined}
            onChange={(iso) => { setEndDate(iso); setErr(''); }}
            required
          />
        </div>
      </div>

      <div className="pf-field" style={{ marginTop: '0.5rem' }}>
        <label className="pf-label">Status</label>
        <select className="pf-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AcademicYears() {
  const [years,   setYears]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [expanded, setExpanded] = useState({});

  // Modal state: { type: 'year'|'term'|'editYear'|'editTerm', data? }
  const [modal,   setModal]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [mError,  setMError]  = useState(null);

  const load = async () => {
    try { setLoading(true); setError(null); setYears(await principalApi.getAcademicYears()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  // ── save year ──────────────────────────────────────────────────────────────
  const saveYear = async (fields) => {
    setSaving(true); setMError(null);
    try {
      if (modal.data) {
        await principalApi.updateAcademicYear(modal.data.id, fields);
      } else {
        await principalApi.createAcademicYear(fields);
      }
      setModal(null); await load();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  // ── save term ──────────────────────────────────────────────────────────────
  const saveTerm = async (fields) => {
    setSaving(true); setMError(null);
    try {
      if (modal.termData) {
        await principalApi.updateTerm(modal.termData.id, fields);
      } else {
        await principalApi.createTerm(modal.yearId, fields);
      }
      setModal(null); await load();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const deleteTerm = async (id) => {
    if (!confirm('Delete this semester? This cannot be undone.')) return;
    try { await principalApi.deleteTerm(id); await load(); }
    catch (err) { alert(err.message); }
  };

  const deleteYear = async (id) => {
    if (!confirm('Are you sure you want to delete this academic year? This will delete all semesters inside it. This cannot be undone.')) return;
    try {
      await principalApi.deleteAcademicYear(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading academic years…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="sp-page-title">Academic Years</h1>
          <p className="sp-page-sub">Manage school years and their semesters</p>
        </div>
        <button className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => { setModal({ type: 'year' }); setMError(null); }}>
          <Plus size={16} /> New Academic Year
        </button>
      </div>

      {years.length === 0 ? (
        <div className="sp-card">
          <div className="sp-empty"><div className="sp-empty-icon">📅</div>No academic years yet. Create one to get started.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {years.map(yr => (
            <div className="sp-card" key={yr.id}>
              {/* Year header */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
                onClick={() => toggle(yr.id)}
              >
                {expanded[yr.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{yr.name}</span>
                    {yr.is_current && (
                      <span className="sp-badge sp-badge--green" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={10} /> Current
                      </span>
                    )}
                    <span className={`sp-badge sp-badge--${yr.status === 'ACTIVE' ? 'blue' : 'gray'}`}>{yr.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {fmtDate(yr.start_date)} → {fmtDate(yr.end_date)} · {yr.terms?.length ?? yr.term_count}/2 semesters · {yr.enrollment_count} enrolled
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                  <button className="btn-edit" onClick={() => { setModal({ type: 'year', data: yr }); setMError(null); }} title="Edit Academic Year">
                    <Edit2 size={13} />
                  </button>
                  <button className="btn-danger" onClick={() => deleteYear(yr.id)} title="Delete Academic Year">
                    <Trash2 size={13} />
                  </button>
                  {(yr.terms?.length || 0) < 2 ? (
                    <button className="btn-prim" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => { setModal({ type: 'term', yearId: yr.id }); setMError(null); }}>
                      <Plus size={13} /> Semester
                    </button>
                  ) : (
                    <span className="sp-badge sp-badge--blue" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }} title="Each academic year has exactly 2 semesters">
                      2/2 Semesters
                    </span>
                  )}
                </div>
              </div>

              {/* Semesters */}
              {expanded[yr.id] && (
                <div style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem 1.25rem' }}>
                  {(!yr.terms || yr.terms.length === 0) ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                      No semesters yet — click "+ Semester" to add one.
                    </div>
                  ) : (
                    <table className="sp-table" style={{ marginTop: 0 }}>
                      <thead>
                        <tr><th>Semester</th><th>Start</th><th>End</th><th>Status</th><th></th></tr>
                      </thead>
                      <tbody>
                        {yr.terms.map(t => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 600 }}>{t.name}</td>
                            <td style={{ fontSize: '0.8rem' }}>{fmtDate(t.start_date)}</td>
                            <td style={{ fontSize: '0.8rem' }}>{fmtDate(t.end_date)}</td>
                            <td>
                              <span className={`sp-badge sp-badge--${t.status === 'ACTIVE' ? 'green' : t.status === 'COMPLETED' ? 'blue' : 'gray'}`}>
                                {t.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button className="btn-edit" onClick={() => { setModal({ type: 'term', yearId: yr.id, termData: t }); setMError(null); }}>
                                  <Edit2 size={13} />
                                </button>
                                <button className="btn-danger" onClick={() => deleteTerm(t.id)}>
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

      {/* Modals */}
      {modal?.type === 'year' && (
        <Modal title={modal.data ? 'Edit Academic Year' : 'New Academic Year'} onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <YearForm initial={modal.data || {}} onSave={saveYear} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
      {modal?.type === 'term' && (
        <Modal title={modal.termData ? 'Edit Semester' : 'Add Semester'} onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <TermForm yearId={modal.yearId} initial={modal.termData || {}} onSave={saveTerm} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
    </div>
  );
}
