import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
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

function GradeForm({ initial = {}, onSave, onClose, saving }) {
  const [name,    setName]    = useState(initial.name    || '');
  const [minPct,  setMinPct]  = useState(initial.min_percentage ?? '');
  const [maxPct,  setMaxPct]  = useState(initial.max_percentage ?? '');
  const [label,   setLabel]   = useState(initial.label   || '');
  const [isPass,  setIsPass]  = useState(initial.is_pass !== false);
  const [sortOrd, setSortOrd] = useState(initial.sort_order ?? 0);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      name, min_percentage: parseFloat(minPct), max_percentage: parseFloat(maxPct),
      label, is_pass: isPass, sort_order: parseInt(sortOrd),
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="pf-grid-2">
        <div className="pf-field">
          <label className="pf-label">Grade Label <span>*</span></label>
          <input className="pf-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. A+" required />
        </div>
        <div className="pf-field">
          <label className="pf-label">Description</label>
          <input className="pf-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Excellent" />
        </div>
        <div className="pf-field">
          <label className="pf-label">Min % <span>*</span></label>
          <input type="number" className="pf-input" value={minPct} onChange={e => setMinPct(e.target.value)} min={0} max={100} step={0.01} required />
        </div>
        <div className="pf-field">
          <label className="pf-label">Max % <span>*</span></label>
          <input type="number" className="pf-input" value={maxPct} onChange={e => setMaxPct(e.target.value)} min={0} max={100} step={0.01} required />
        </div>
        <div className="pf-field">
          <label className="pf-label">Sort Order</label>
          <input type="number" className="pf-input" value={sortOrd} onChange={e => setSortOrd(e.target.value)} min={0} />
        </div>
        <div className="pf-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
          <input type="checkbox" id="isPass" checked={isPass} onChange={e => setIsPass(e.target.checked)} />
          <label htmlFor="isPass" style={{ fontSize: '0.875rem' }}>Is a passing grade</label>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-prim" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function GradingScales() {
  const [scales,  setScales]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [modal,   setModal]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [mError,  setMError]  = useState(null);

  const load = async () => {
    try { setLoading(true); setError(null); setScales(await principalApi.getGradingScales()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (fields) => {
    setSaving(true); setMError(null);
    try {
      if (modal.data) { await principalApi.updateGradingScale(modal.data.id, fields); }
      else            { await principalApi.createGradingScale(fields); }
      setModal(null); await load();
    } catch (err) { setMError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this grade? This may affect report card calculations.')) return;
    try { await principalApi.deleteGradingScale(id); await load(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <LoadingSpinner message="Loading grading scales…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Grading Scales</h1>
          <p className="sp-page-sub">Define letter grades, percentage ranges, and pass/fail thresholds</p>
        </div>
        <button className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => { setModal({ type: 'grade' }); setMError(null); }}>
          <Plus size={16} /> Add Grade
        </button>
      </div>

      <div className="sp-card">
        {scales.length === 0 ? (
          <EmptyState icon="📊" title="No grading scale defined" subtitle="Add grade definitions to enable automatic grade calculation." />
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Grade</th>
                  <th>Description</th>
                  <th>Min %</th>
                  <th>Max %</th>
                  <th>Pass</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {scales.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td>
                      <span style={{
                        fontWeight: 700, fontSize: '1rem',
                        color: s.is_pass ? 'var(--primary)' : '#6B7280',
                      }}>{s.name}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.label || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{s.min_percentage}%</td>
                    <td style={{ fontWeight: 600 }}>{s.max_percentage}%</td>
                    <td>
                      {s.is_pass
                        ? <CheckCircle size={16} color="#16A34A" />
                        : <XCircle    size={16} color="#991B1B" />}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn-edit"   onClick={() => { setModal({ type: 'grade', data: s }); setMError(null); }}><Edit2  size={13} /></button>
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

      {modal?.type === 'grade' && (
        <Modal title={modal.data ? 'Edit Grade' : 'Add Grade'} onClose={() => setModal(null)}>
          {mError && <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{mError}</p>}
          <GradeForm initial={modal.data || {}} onSave={save} onClose={() => setModal(null)} saving={saving} />
        </Modal>
      )}
    </div>
  );
}
