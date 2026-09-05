import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { accountantApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const fmt     = (n, cur='ETB') => `${cur === 'ETB' ? 'Birr' : cur} ${parseFloat(n||0).toLocaleString(undefined,{minimumFractionDigits:2})}`;
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';
const STATUS_CLR  = { PAID:'green', PARTIAL:'yellow', UNPAID:'red', OVERDUE:'red', WAIVED:'blue', CANCELLED:'gray' };
const METHOD_CLR  = { CASH:'green', BANK_TRANSFER:'blue', MOBILE_MONEY:'yellow', GATEWAY:'blue', CHEQUE:'gray', WAIVER:'gray' };
const METHODS = ['CASH','BANK_TRANSFER','MOBILE_MONEY','CARD','CHEQUE','GATEWAY','WAIVER'];

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [form,    setForm]    = useState({ amount:'', method:'CASH', payment_date:'', transaction_ref:'', notes:'' });
  const [saving,  setSaving]  = useState(false);
  const [payErr,  setPayErr]  = useState(null);
  const [payOk,   setPayOk]   = useState(null);

  const load = async () => {
    try { setLoading(true); setError(null); setInvoice(await accountantApi.getInvoice(id)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      setSaving(true); setPayErr(null); setPayOk(null);
      const p = await accountantApi.recordPayment({ invoice_id: id, ...form, amount: parseFloat(form.amount) });
      setPayOk(`Payment recorded. Receipt: ${p.receipt_number}`);
      setForm({ amount:'', method:'CASH', payment_date:'', transaction_ref:'', notes:'' });
      load();
    } catch (err) { setPayErr(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner message="Loading invoice…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;
  if (!invoice) return null;

  const canPay = !['PAID','WAIVED','CANCELLED'].includes(invoice.status) && parseFloat(invoice.balance) > 0;

  return (
    <div>
      <Link to="/accountant/invoices" className="sp-badge sp-badge--gray" style={{ textDecoration:'none', marginBottom:'1rem', display:'inline-flex', alignItems:'center', gap:'.4rem' }}>
        <ArrowLeft size={14} /> Back to Invoices
      </Link>

      <div className="sp-page-header" style={{ marginTop:'.75rem' }}>
        <h1 className="sp-page-title">{invoice.invoice_number}</h1>
        <span className={`sp-badge sp-badge--${STATUS_CLR[invoice.status]||'gray'}`} style={{ fontSize:'.85rem' }}>{invoice.status}</span>
      </div>

      <div className="sp-two-col">
        {/* Invoice info */}
        <div className="sp-card">
          <div className="sp-card-header"><span className="sp-card-title">Invoice Details</span></div>
          <div className="sp-card-body">
            {[
              ['Student',       invoice.student_name],
              ['Student #',     invoice.student_number],
              ['Semester',      invoice.term_name],
              ['Academic Year', invoice.academic_year],
              ['Category',      invoice.fee_category || '—'],
              ['Total Amount',  fmt(invoice.total_amount, invoice.currency)],
              ['Amount Paid',   fmt(invoice.amount_paid,  invoice.currency)],
              ['Balance',       fmt(invoice.balance,      invoice.currency)],
              ['Due Date',      fmtDate(invoice.due_date)],
              ['Created',       fmtDate(invoice.created_at)],
            ].map(([k, v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'.5rem 0', borderBottom:'1px solid #F3F4F6', fontSize:'.875rem' }}>
                <span style={{ color:'var(--text-muted)', fontWeight:500 }}>{k}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Record payment */}
        <div className="sp-card">
          <div className="sp-card-header"><span className="sp-card-title">Record Payment</span></div>
          <div className="sp-card-body">
            {!canPay ? (
              <div className="sp-empty"><div className="sp-empty-icon">✅</div>Invoice is {invoice.status.toLowerCase()}</div>
            ) : (
              <>
                {payErr && <div className="auth-error" style={{ marginBottom:'1rem', padding:'.75rem', borderRadius:8, fontSize:'.85rem' }}>{payErr}</div>}
                {payOk  && <div style={{ background:'#ECFDF5', color:' var(--acc-green-dark)', padding:'.75rem', borderRadius:8, marginBottom:'1rem', fontSize:'.85rem', fontWeight:600 }}>{payOk}</div>}
                <form onSubmit={handlePay}>
                  <div className="ap-form-grid">
                    <div className="ap-form-group">
                      <label>Amount *</label>
                      <input type="number" step="0.01" min="0.01" max={invoice.balance}
                        placeholder={`Max: ${fmt(invoice.balance, invoice.currency)}`}
                        value={form.amount} onChange={e => setForm(f=>({...f, amount:e.target.value}))} required />
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
                      <input placeholder="Cheque # / Transfer Ref / Receipt #" value={form.transaction_ref} onChange={e => setForm(f=>({...f, transaction_ref:e.target.value}))} />
                    </div>
                    <div className="ap-form-group ap-form-full">
                      <label>Notes</label>
                      <input placeholder="Optional notes" value={form.notes} onChange={e => setForm(f=>({...f, notes:e.target.value}))} />
                    </div>
                  </div>
                  <button type="submit" className="ap-btn-primary" style={{ marginTop:'1rem', width:'100%' }} disabled={saving}>
                    {saving ? 'Recording…' : 'Record Payment'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="sp-card" style={{ marginTop:'1.5rem' }}>
        <div className="sp-card-header">
          <span className="sp-card-title">Payment History</span>
          <span className="sp-badge sp-badge--blue">{invoice.payments?.length || 0}</span>
        </div>
        {!invoice.payments?.length ? (
          <div className="sp-empty"><div className="sp-empty-icon">💳</div>No payments recorded yet</div>
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead><tr><th>Receipt</th><th>Amount</th><th>Method</th><th>Date</th><th>Reference</th><th>By</th></tr></thead>
              <tbody>
                {invoice.payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight:600, color:'var(--acc-green)', fontSize:'.8rem' }}>{p.receipt_number}</td>
                    <td style={{ fontWeight:700 }}>{invoice.currency === 'ETB' ? 'Birr' : invoice.currency} {parseFloat(p.amount).toLocaleString()}</td>
                    <td><span className={`sp-badge sp-badge--${METHOD_CLR[p.payment_method]||'gray'}`}>{p.payment_method}</span></td>
                    <td style={{ fontSize:'.8rem' }}>{fmtDate(p.payment_date)}</td>
                    <td style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>{p.transaction_reference||'—'}</td>
                    <td style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>{p.recorded_by_email||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
