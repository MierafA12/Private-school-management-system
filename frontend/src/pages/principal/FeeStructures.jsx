import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';
import './principal.css';

const FEE_TYPES = [
  'Tuition', 'Registration', 'Admission', 'Transport', 'Uniform',
  'Laboratory', 'Library', 'Exam', 'Activity', 'Caution', 'Other',
];

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-box"><h3>{title}</h3>{children}</div>
    </div>
  );
}

function FeeForm({ initial = {}, years, classes, onSave, onClose, saving }) {
  const [yearId,   setYearId]   = useState(initial.academic_year_id || '');
  const [classId,  setClassId]  = useState(initial.class_id         || '');
  const [feeType,  setFeeType]  = useState(initial.fee_type         || '');
  const [amount,   setAmount]   = useState(initial.amount           || '');
  const [currency, setCurrency] = useState(initial.currency         || 'KES');
  const [dueDate,  setDueDate]  = useState(initial.due_date?.slice(0,10) || '');
  const [desc,     setDesc]     = useState(initial.description       || '');

  const submit = (e) => {
    e.preventDefault();
    onSave({
      academic_year_id: yearId, class_id: classId || undefined,
      fee_type: feeType, amount: parseFloat(amount),
      currency, due_date: dueDate || undefined, description: desc || undefined,
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Academic Year <span>*</span></label>
          <select className="pf-select" value={yearId} onChange={e => setYearId(e.target.value)} required>
            <option value="">— Select —</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>
        <div className="pf-field">
          <label className="pf-label">Class (leave blank for all)</label>
          <select className="pf-select" value={classId} onChange={e => setClassId(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="pf-field">
          <label className="pf-label">Fee Type <span>*</span></label>
          <select className="pf-select" value={feeType} onChange={e => setFeeType(e.target.value)} required>
            <option value="">— Select —</option>
            {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="pf-field">
          <label className="pf-label">Amount <span>*</span></label>
          <input type="number" className="pf-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min={0} step="0.01" required />
        </div>
        <div className="pf-field">
          <label className="pf-label">Currency</label>
          <select className="pf-select" value={currency} onChange={e => setCurrency(e.target.value)}>
            {['KES','USD','GBP','EUR','TZS','UGX'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="pf-field">
          <label className="pf-label">Due Date</label>
          <input type="date" className="pf-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="pf-field">
        <label className="pf-label">Description</label>
        <input className="pf-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional notes" />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function FeeStructures() {
  const [structures, setStructures] = useState([]);
  const [years,      setYears]      = useState([]);
  const [classes,    setClasses]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [filterYear, setFilterYear] = useState('');
  const [modal,      setModal]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [mError,     setMError]     = useState(null);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const [s, y, c] = await Promise.all([
        principalApi.getFeeStructures(filterYear || undefined),
        principalApi.getAcademicYears(),
        principalApi.getClasses(),
      ]);
      setStructures(s); setYears(y); setClasses(c);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterYear]); // eslint-disable-line

  const save = async (fields) => {
    setSaving(true); setMError(null);
    try {
      if (modal.data) { await principalApi.updateFeeStructure(modal.data.id, fields); }
      else            { await principalApi.createFeeStructure(fields); }
      setModal(null); await load();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this fee structure?')) return;
    try { await principalApi.deleteFeeStructure(id); await load(); }
    catch (err) { alert(err.message); }
  };

  const fmtAmount = (a, cur) => `${cur} ${parseFloat(a).toLocaleString()}`;
  const fmtDate   = (d) => d ? new Date(d).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' }) : '—';

  if (loading) return <LoadingSpinner message="Loading fee structures…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Fee Structures</h1>
          <p className="sp-page-sub">Define fee types and amounts per academic year and class</p>
        </div>
        <button className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => { setModal({ type: 'fee' }); setMError(null); }}>
          <Plus size={16} /> Add Fee Structure
        </button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '1.25rem' }}>
        <select className="pf-select" style={{ maxWidth: 240 }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">All Academic Years</option>
          {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
      </div>

      <div className="sp-card">
        {structures.length === 0 ? (
          <EmptyState icon="💰" title="No fee structures yet" subtitle="Create fee structures to generate student invoices." />
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr><th>Year</th><th>Class</th><th>Fee Type</th><th>Amount</th><th>Due Date</th><th></th></tr>
              </thead>
              <tbody>
                {structures.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.academic_year_name}</td>
                    <td>{s.class_name || <span style={{ color: 'var(--text-muted)' }}>All Classes</span>}</td>
                    <td style={{ fontWeight: 600 }}>{s.fee_type}</td>
                    <td style={{ fontWeight: 700 }}>{fmtAmount(s.amount, s.currency)}</td>
                    <td style={{ fontSize: '0.8rem' }}>{fmtDate(s.due_date)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn-edit"   onClick={() => { setModal({ type: 'fee', data: s }); setMError(null); }}><Edit2  size={13} /></button>
                        <button className="btn-danger" onClick={() => del(s.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal?.type === 'fee' && (
        <Modal title={modal.data ? 'Edit Fee Structure' : 'Add Fee Structure'} onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <FeeForm initial={modal.data || {}} years={years} classes={classes} onSave={save} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
    </div>
  );
}
