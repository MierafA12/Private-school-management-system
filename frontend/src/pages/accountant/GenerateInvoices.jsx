import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { accountantApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

export default function GenerateInvoices() {
  const [terms,   setTerms]   = useState([]);
  const [classes, setClasses] = useState([]);
  const [structs, setStructs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [form,    setForm]    = useState({ term_id:'', class_id:'', fee_structure_id:'', due_date:'' });
  const [running, setRunning] = useState(false);
  const [result,  setResult]  = useState(null);
  const [runErr,  setRunErr]  = useState(null);

  useEffect(() => {
    Promise.all([accountantApi.getTerms(), accountantApi.getClasses(), accountantApi.getFeeStructures()])
      .then(([t, c, s]) => { setTerms(t); setClasses(c); setStructs(s); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!confirm('Generate invoices for all active students in this class/term? Existing invoices will be skipped.')) return;
    try {
      setRunning(true); setRunErr(null); setResult(null);
      const r = await accountantApi.generateInvoices(form);
      setResult(r);
    } catch (err) { setRunErr(err.message); }
    finally { setRunning(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (loading) return <LoadingSpinner message="Loading…" />;
  if (error)   return <ErrorBanner message={error} onRetry={() => {}} />;

  return (
    <div>
      <Link to="/accountant/invoices" className="sp-badge sp-badge--gray"
        style={{ textDecoration:'none', marginBottom:'1rem', display:'inline-flex', alignItems:'center', gap:'.4rem' }}>
        <ArrowLeft size={14} /> Back to Invoices
      </Link>

      <div className="sp-page-header" style={{ marginTop:'.75rem' }}>
        <h1 className="sp-page-title">Generate Invoices</h1>
        <p className="sp-page-sub">Bulk-create fee invoices for all active enrollments in a class/term</p>
      </div>

      <div className="sp-card" style={{ maxWidth:560 }}>
        <div className="sp-card-header"><span className="sp-card-title">Generation Parameters</span></div>
        <div className="sp-card-body">
          {runErr && (
            <div className="auth-error" style={{ marginBottom:'1rem', padding:'.75rem', borderRadius:8, fontSize:'.85rem' }}>{runErr}</div>
          )}
          <form onSubmit={handleGenerate}>
            <div className="ap-form-grid">
              <div className="ap-form-group ap-form-full">
                <label>Term *</label>
                <select value={form.term_id} onChange={e => set('term_id', e.target.value)} required>
                  <option value="">Select term…</option>
                  {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="ap-form-group ap-form-full">
                <label>Class *</label>
                <select value={form.class_id} onChange={e => set('class_id', e.target.value)} required>
                  <option value="">Select class…</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="ap-form-group ap-form-full">
                <label>Fee Structure *</label>
                <select value={form.fee_structure_id} onChange={e => set('fee_structure_id', e.target.value)} required>
                  <option value="">Select fee structure…</option>
                  {structs.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.category} — {s.currency} {parseFloat(s.amount).toLocaleString()}{s.class_name ? ` (${s.class_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ap-form-group ap-form-full">
                <label>Due Date (optional)</label>
                <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
              </div>
            </div>

            <button type="submit" className="ap-btn-primary" style={{ marginTop:'1.5rem', width:'100%' }} disabled={running}>
              {running ? 'Generating…' : '⚡ Generate Invoices'}
            </button>
          </form>

          {result && (
            <div className={`ap-result-box ap-result-box--${result.generated > 0 ? 'success' : 'warn'}`}>
              <div className="ap-result-num">{result.generated}</div>
              <div className="ap-result-text">Invoices generated</div>
              {result.skipped > 0 && (
                <div style={{ fontSize:'.8rem', marginTop:'.5rem', opacity:.75 }}>
                  {result.skipped} already existed and were skipped
                </div>
              )}
              <div style={{ marginTop:'1rem' }}>
                <Link to="/accountant/invoices" className="ap-btn-primary" style={{ textDecoration:'none', display:'inline-flex' }}>
                  View Invoices →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
