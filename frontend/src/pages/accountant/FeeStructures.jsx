import { useState, useEffect } from 'react';
import { Plus, Pencil, Archive } from 'lucide-react';
import { accountantApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const EMPTY_FORM = { academic_year_id:'', term_id:'', class_id:'', category:'', description:'', amount:'', currency:'ETB', is_mandatory:true };

export default function FeeStructures() {
  const [items,   setItems]   = useState([]);
  const [years,   setYears]   = useState([]);
  const [terms,   setTerms]   = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [modal,   setModal]   = useState(null); // null | 'create' | item
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const [fs, yr, tr, cl] = await Promise.all([
        accountantApi.getFeeStructures(),
        accountantApi.getAcademicYears(),
        accountantApi.getTerms(),
        accountantApi.getClasses(),
      ]);
      setItems(Array.isArray(fs) ? fs : []);
      setYears(Array.isArray(yr) ? yr : []);
      setTerms(Array.isArray(tr) ? tr : []);
      setClasses(Array.isArray(cl) ? cl : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setSaveErr(null); setModal('create'); };
  const openEdit   = (item) => {
    setForm({ academic_year_id: item.academic_year_id, term_id: item.term_id||'', class_id: item.class_id||'',
      category: item.category, description: item.description||'', amount: item.amount,
      currency: item.currency, is_mandatory: item.is_mandatory });
    setSaveErr(null); setModal(item);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true); setSaveErr(null);
      if (modal === 'create') await accountantApi.createFeeStructure(form);
      else                    await accountantApi.updateFeeStructure(modal.id, form);
      setModal(null); load();
    } catch (err) { setSaveErr(err.message); }
    finally { setSaving(false); }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this fee structure? It will no longer appear in invoice generation.')) return;
    try { await accountantApi.archiveFeeStructure(id); load(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <LoadingSpinner message="Loading fee structures…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div>
      <div className="sp-page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Fee Structures</h1>
          <p className="sp-page-sub">Configure fee amounts by grade, term, and category</p>
        </div>
        <button className="ap-btn-primary" onClick={openCreate}><Plus size={16} />New Structure</button>
      </div>

      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title">Active Fee Structures</span>
          <span className="sp-badge sp-badge--green">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <div className="sp-empty"><div className="sp-empty-icon">⚙️</div>No fee structures yet. Create one to start generating invoices.</div>
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead><tr><th>Category</th><th>Class</th><th>Semester</th><th>Amount</th><th>Mandatory</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(fs => (
                  <tr key={fs.id}>
                    <td style={{ fontWeight:600 }}>{fs.category}</td>
                    <td style={{ fontSize:'.82rem' }}>{fs.class_name || '—'}</td>
                    <td style={{ fontSize:'.82rem', color:'var(--text-muted)' }}>{fs.term_name || 'All semesters'}</td>
                    <td style={{ fontWeight:700 }}>{fs.currency === 'ETB' ? 'Birr' : fs.currency} {parseFloat(fs.amount).toLocaleString()}</td>
                    <td><span className={`sp-badge sp-badge--${fs.is_mandatory?'green':'gray'}`}>{fs.is_mandatory?'Yes':'No'}</span></td>
                    <td><span className={`sp-badge sp-badge--${fs.status==='ACTIVE'?'green':fs.status==='INACTIVE'?'yellow':'gray'}`}>{fs.status}</span></td>
                    <td style={{ display:'flex', gap:'.4rem' }}>
                      <button className="sp-badge sp-badge--blue" style={{ cursor:'pointer', border:'none', display:'inline-flex', alignItems:'center', gap:'.3rem' }} onClick={() => openEdit(fs)}><Pencil size={12}/>Edit</button>
                      <button className="ap-btn-danger" style={{ padding:'.3rem .7rem', fontSize:'.72rem' }} onClick={() => handleArchive(fs.id)}><Archive size={12}/>Archive</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="ap-modal-overlay">
          <div className="ap-modal">
            <div className="ap-modal-title">{modal==='create'?'New Fee Structure':'Edit Fee Structure'}</div>
            <div className="ap-modal-sub">Configure fee amount by grade, semester, and category</div>
            {saveErr && <div className="auth-error" style={{ marginBottom:'1rem', padding:'.75rem', borderRadius:8, fontSize:'.85rem' }}>{saveErr}</div>}
            <form onSubmit={handleSave}>
              <div className="ap-form-grid">
                <div className="ap-form-group ap-form-full">
                  <label>Academic Year *</label>
                  <select value={form.academic_year_id} onChange={e => setForm(f=>({...f, academic_year_id:e.target.value}))} required>
                    <option value="">Select year…</option>
                    {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_current?' (current)':''}</option>)}
                  </select>
                </div>
                <div className="ap-form-group">
                  <label>Semester (optional)</label>
                  <select value={form.term_id} onChange={e => setForm(f=>({...f, term_id:e.target.value}))}>
                    <option value="">All semesters</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="ap-form-group">
                  <label>Class (optional)</label>
                  <select value={form.class_id} onChange={e => setForm(f=>({...f, class_id:e.target.value}))}>
                    <option value="">All classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="ap-form-group ap-form-full">
                  <label>Category *</label>
                  <input placeholder="e.g. Tuition, Transport, Activities" value={form.category} onChange={e => setForm(f=>({...f, category:e.target.value}))} required />
                </div>
                <div className="ap-form-group">
                  <label>Amount *</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f=>({...f, amount:e.target.value}))} required />
                </div>
                <div className="ap-form-group">
                  <label>Currency</label>
                  <select value={form.currency} onChange={e => setForm(f=>({...f, currency:e.target.value}))}>
                    {['ETB','USD','EUR','GBP','KES','UGX','TZS'].map(c => (
                      <option key={c} value={c}>{c === 'ETB' ? 'ETB — Ethiopian Birr (Br)' : c}</option>
                    ))}
                  </select>
                </div>
                <div className="ap-form-group ap-form-full">
                  <label>Description</label>
                  <input placeholder="Optional description" value={form.description} onChange={e => setForm(f=>({...f, description:e.target.value}))} />
                </div>
              </div>
              <div className="ap-modal-actions">
                <button type="button" className="ap-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="ap-btn-primary" disabled={saving}>{saving?'Saving…':'Save Structure'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
