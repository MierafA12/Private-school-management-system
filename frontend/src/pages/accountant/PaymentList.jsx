import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { accountantApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const METHOD_CLR = { CASH:'green', BANK_TRANSFER:'blue', MOBILE_MONEY:'yellow', GATEWAY:'blue', CHEQUE:'gray', WAIVER:'gray' };
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';
const METHODS = ['CASH','BANK_TRANSFER','MOBILE_MONEY','CARD','CHEQUE','GATEWAY','WAIVER'];
const EMPTY_FORM = { invoice_id:'', amount:'', method:'CASH', payment_date:'', transaction_ref:'', notes:'' };

export default function PaymentList() {
  const [searchParams] = useSearchParams();
  const [data,    setData]    = useState({ payments:[], total:0 });
  const [filter,  setFilter]  = useState({ method:'', date_from:'', date_to:'', search:'' });
  const [page,    setPage]    = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [modal,   setModal]   = useState(searchParams.get('action') === 'record');
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [saveOk,  setSaveOk]  = useState(null);
  const LIMIT = 30;

  useEffect(() => {
    if (searchParams.get('action') === 'record') {
      setModal(true);
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      setData(await accountantApi.getPayments({ ...filter, limit: LIMIT, offset: page * LIMIT }));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);
  const set = (k, v) => { setFilter(f => ({ ...f, [k]: v })); setPage(0); };

  const handleRecord = async (e) => {
    e.preventDefault();
    try {
      setSaving(true); setSaveErr(null); setSaveOk(null);
      const p = await accountantApi.recordPayment({ ...form, amount: parseFloat(form.amount) });
      setSaveOk(`✅ Recorded. Receipt: ${p.receipt_number}`);
      setForm(EMPTY_FORM); load();
    } catch (err) { setSaveErr(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="sp-page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Payments</h1>
          <p className="sp-page-sub">All payment transactions</p>
        </div>
        <button className="ap-btn-primary" onClick={() => { setModal(true); setSaveErr(null); setSaveOk(null); }}>+ Record Payment</button>
      </div>

      <div className="ap-filter-bar">
        <input placeholder="Search student / receipt / ref…" value={filter.search} onChange={e => set('search', e.target.value)} style={{ flex:1, minWidth:200 }} />
        <select value={filter.method} onChange={e => set('method', e.target.value)}>
          <option value="">All methods</option>
          {METHODS.map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
        </select>
        <input type="date" value={filter.date_from} onChange={e => set('date_from', e.target.value)} title="From date" />
        <input type="date" value={filter.date_to}   onChange={e => set('date_to',   e.target.value)} title="To date" />
      </div>

      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title">Payment Records</span>
          <span className="sp-badge sp-badge--blue">{data.total} total</span>
        </div>
        {loading ? <LoadingSpinner message="Loading…" /> : error ? <ErrorBanner message={error} onRetry={load} /> : (
          <>
            {data.payments.length === 0 ? (
              <div className="sp-empty"><div className="sp-empty-icon">💳</div>No payments found</div>
            ) : (
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead><tr><th>Receipt</th><th>Student</th><th>Invoice</th><th>Amount</th><th>Method</th><th>Date</th><th>Reference</th><th>Recorded By</th></tr></thead>
                  <tbody>
                    {data.payments.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight:600, fontSize:'.8rem', color:'var(--acc-green)' }}>{p.receipt_number}</td>
                        <td style={{ fontSize:'.82rem' }}>{p.student_name}</td>
                        <td><Link to={`/accountant/invoices/${p.fee_invoice_id}`} style={{ fontSize:'.78rem', color:'var(--acc-green)', textDecoration:'none', fontWeight:600 }}>{p.invoice_number}</Link></td>
                        <td style={{ fontWeight:700 }}>{p.currency === 'ETB' ? 'Birr' : p.currency} {parseFloat(p.amount).toLocaleString()}</td>
                        <td><span className={`sp-badge sp-badge--${METHOD_CLR[p.payment_method]||'gray'}`}>{p.payment_method}</span></td>
                        <td style={{ fontSize:'.8rem' }}>{fmtDate(p.payment_date)}</td>
                        <td style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>{p.transaction_reference||'—'}</td>
                        <td style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>{p.recorded_by_email||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data.total > LIMIT && (
              <div style={{ padding:'1rem 1.25rem', display:'flex', gap:'.75rem', justifyContent:'flex-end' }}>
                <button className="ap-btn-secondary" disabled={page===0} onClick={() => setPage(p=>p-1)}>← Prev</button>
                <span style={{ fontSize:'.8rem', alignSelf:'center', color:'var(--text-muted)' }}>Page {page+1} of {Math.ceil(data.total/LIMIT)}</span>
                <button className="ap-btn-secondary" disabled={(page+1)*LIMIT>=data.total} onClick={() => setPage(p=>p+1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <div className="ap-modal-overlay">
          <div className="ap-modal">
            <div className="ap-modal-title">Record Manual Payment</div>
            <div className="ap-modal-sub">Enter Invoice ID and payment details</div>
            {saveErr && <div className="auth-error" style={{ marginBottom:'1rem', padding:'.75rem', borderRadius:8, fontSize:'.85rem' }}>{saveErr}</div>}
            {saveOk  && <div style={{ background:'#ECFDF5', color:'#065F46', padding:'.75rem', borderRadius:8, marginBottom:'1rem', fontSize:'.85rem', fontWeight:600 }}>{saveOk}</div>}
            <form onSubmit={handleRecord}>
              <div className="ap-form-grid">
                <div className="ap-form-group ap-form-full">
                  <label>Invoice ID (UUID) *</label>
                  <input placeholder="Paste invoice UUID…" value={form.invoice_id} onChange={e => setForm(f=>({...f, invoice_id:e.target.value}))} required />
                </div>
                <div className="ap-form-group">
                  <label>Amount *</label>
                  <input type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f=>({...f, amount:e.target.value}))} required />
                </div>
                <div className="ap-form-group">
                  <label>Method *</label>
                  <select value={form.method} onChange={e => setForm(f=>({...f, method:e.target.value}))}>
                    {METHODS.map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className="ap-form-group ap-form-full">
                  <label>Payment Date</label>
                  <input type="date" value={form.payment_date} onChange={e => setForm(f=>({...f, payment_date:e.target.value}))} />
                </div>
                <div className="ap-form-group ap-form-full">
                  <label>Transaction Reference</label>
                  <input placeholder="Cheque # / Transfer Ref" value={form.transaction_ref} onChange={e => setForm(f=>({...f, transaction_ref:e.target.value}))} />
                </div>
              </div>
              <div className="ap-modal-actions">
                <button type="button" className="ap-btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="ap-btn-primary" disabled={saving}>{saving?'Recording…':'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
