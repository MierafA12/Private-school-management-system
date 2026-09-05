import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, ExternalLink, CheckCircle2 } from 'lucide-react';
import { parentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const STATUS_BADGE = { PAID:'green', PARTIAL:'yellow', UNPAID:'red', OVERDUE:'red', WAIVED:'blue', CANCELLED:'gray' };
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' }) : '—';
const fmtAmt  = (n, cur='ETB') => `${cur} ${parseFloat(n||0).toLocaleString(undefined,{ minimumFractionDigits:2 })}`;

export default function ParentFees() {
  const [searchParams] = useSearchParams();

  // Chapa sometimes HTML-encodes & as &amp; in the return_url — decode it
  const rawSearch = window.location.search.replace(/&amp;/g, '&');
  const urlParams = new URLSearchParams(rawSearch);
  const returnTxRef = urlParams.get('tx_ref') || searchParams.get('tx_ref');
  const returnInvId = urlParams.get('invoice_id') || searchParams.get('invoice_id');

  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payAmt,   setPayAmt]   = useState('');
  const [paying,   setPaying]   = useState(false);
  const [payErr,   setPayErr]   = useState(null);
  const [returnMsg,  setReturnMsg]  = useState(null);
  const [verifying,  setVerifying]  = useState(false);

  const load = async () => {
    try { setLoading(true); setError(null); setData(await parentApi.getFees()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // On mount — if returning from Chapa, trigger fallback verify via getFeeById
  useEffect(() => {
    load();
    if (returnTxRef && returnInvId) {
      setVerifying(true);
      parentApi.getFeeById(returnInvId)
        .then(inv => {
          if (inv?.status === 'PAID' || inv?.gateway_status === 'SUCCESS') {
            setReturnMsg({ type:'success', text:'Payment confirmed! Your invoice has been updated.' });
          } else if (inv?.gateway_status === 'PENDING') {
            setReturnMsg({ type:'info', text:'Payment is being processed. This page will reflect the status once confirmed by the gateway.' });
          } else {
            setReturnMsg({ type:'warn', text:'Payment status could not be confirmed. Please contact the school if you were charged.' });
          }
          load(); // refresh invoice list
        })
        .catch(() => setReturnMsg({ type:'warn', text:'Could not verify payment status. Please refresh in a moment.' }))
        .finally(() => setVerifying(false));
    }
  }, []); // eslint-disable-line

  const openPay = (inv) => {
    setPayModal(inv);
    setPayAmt(parseFloat(inv.balance).toFixed(2));
    setPayErr(null);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      setPaying(true); setPayErr(null);
      const result = await parentApi.initiatePayment(payModal.id, parseFloat(payAmt), 'GATEWAY');
      // Redirect to Chapa hosted checkout
      if (result?.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        setPayErr('No checkout URL returned. Please try again.');
      }
    } catch (err) {
      setPayErr(err.message);
      setPaying(false);
    }
  };

  if (loading || verifying) return <LoadingSpinner message={verifying ? 'Verifying payment…' : 'Loading fee records…'} />;
  if (error)                return <ErrorBanner message={error} onRetry={load} />;
  if (!data)                return null;

  const { summary, invoices } = data;

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Fee Statements</h1>
        <p className="sp-page-sub">Invoices and payment history for your linked children</p>
      </div>

      {/* Return-from-Chapa message */}
      {returnMsg && (
        <div style={{
          marginBottom:'1.5rem', padding:'1rem 1.25rem', borderRadius:12,
          background: returnMsg.type==='success'?'#ECFDF5':returnMsg.type==='warn'?'#FFFBEB':'#EFF6FF',
          border: `1px solid ${returnMsg.type==='success'?'#6EE7B7':returnMsg.type==='warn'?'#FDE68A':'#BFDBFE'}`,
          display:'flex', alignItems:'center', gap:'0.75rem',
        }}>
          {returnMsg.type === 'success' && <CheckCircle2 size={20} color="#16A34A" />}
          <span style={{ fontSize:'.875rem', fontWeight:500 }}>{returnMsg.text}</span>
        </div>
      )}

      {/* Summary */}
      <div className="pp-fee-summary">
        <div className={`pp-fee-stat ${summary.total_balance > 0 ? 'pp-fee-stat--danger' : 'pp-fee-stat--success'}`}>
          <div className="pp-fee-stat-val">{fmtAmt(summary.total_balance)}</div>
          <div className="pp-fee-stat-lbl">Outstanding Balance</div>
        </div>
        <div className="pp-fee-stat pp-fee-stat--gold">
          <div className="pp-fee-stat-val">{fmtAmt(summary.total_billed)}</div>
          <div className="pp-fee-stat-lbl">Total Billed</div>
        </div>
        <div className="pp-fee-stat pp-fee-stat--success">
          <div className="pp-fee-stat-val">{fmtAmt(summary.total_paid)}</div>
          <div className="pp-fee-stat-lbl">Total Paid</div>
        </div>
        {summary.overdue_count > 0 && (
          <div className="pp-fee-stat pp-fee-stat--danger">
            <div className="pp-fee-stat-val">{summary.overdue_count}</div>
            <div className="pp-fee-stat-lbl">Overdue Invoice{summary.overdue_count > 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      {/* Invoices table */}
      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title">Invoices</span>
          <span className="sp-badge sp-badge--blue">{invoices.length} total</span>
        </div>
        {invoices.length === 0 ? (
          <div className="sp-empty"><div className="sp-empty-icon">🧾</div>No invoices found</div>
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Invoice #</th><th>Student</th><th>Semester</th><th>Total</th>
                  <th>Paid</th><th>Balance</th><th>Due</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight:600, fontSize:'.8rem' }}>{inv.invoice_number}</td>
                    <td style={{ fontSize:'.82rem' }}>{inv.student_name}</td>
                    <td style={{ fontSize:'.8rem', color:'var(--text-muted)' }}>{inv.term_name}</td>
                    <td style={{ fontWeight:600 }}>{fmtAmt(inv.total_amount, inv.currency)}</td>
                    <td style={{ color:'#16A34A' }}>{fmtAmt(inv.amount_paid, inv.currency)}</td>
                    <td style={{ color: parseFloat(inv.balance)>0?'var(--primary)':'#16A34A', fontWeight:700 }}>
                      {fmtAmt(inv.balance, inv.currency)}
                    </td>
                    <td style={{ fontSize:'.8rem' }}>{fmtDate(inv.due_date)}</td>
                    <td>
                      <div style={{ display:'flex', flexDirection:'column', gap:'.2rem', alignItems:'flex-start' }}>
                        <span className={`sp-badge sp-badge--${STATUS_BADGE[inv.status]||'gray'}`}>{inv.status}</span>
                        {inv.gateway_status && inv.gateway_status !== 'NONE' && (
                          <span className={`sp-badge sp-badge--${inv.gateway_status==='SUCCESS'?'green':inv.gateway_status==='PENDING'?'yellow':'gray'}`}
                            style={{ fontSize:'.65rem' }}>
                            {inv.gateway_status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {!['PAID','WAIVED','CANCELLED'].includes(inv.status) && parseFloat(inv.balance) > 0 && (
                        <button
                          className="sp-badge sp-badge--yellow"
                          style={{ cursor:'pointer', border:'none', display:'inline-flex', alignItems:'center', gap:'.3rem' }}
                          onClick={() => openPay(inv)}
                        >
                          <CreditCard size={12} /> Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chapa payment modal */}
      {payModal && (
        <div className="pp-modal-overlay">
          <div className="pp-modal">
            <div className="pp-modal-title">Pay via Chapa</div>
            <div className="pp-modal-sub">
              {payModal.invoice_number} · {payModal.student_name}
              <br />Balance: <strong>{fmtAmt(payModal.balance, payModal.currency)}</strong>
            </div>

            {payErr && (
              <div className="auth-error" style={{ marginBottom:'1rem', padding:'.75rem', borderRadius:8, fontSize:'.85rem' }}>
                {payErr}
              </div>
            )}

            <form onSubmit={handlePay}>
              <div className="pp-form-group" style={{ marginBottom:'1rem' }}>
                <label>Amount ({payModal.currency})</label>
                <input
                  type="number" step="0.01" min="0.01"
                  max={payModal.balance}
                  value={payAmt}
                  onChange={e => setPayAmt(e.target.value)}
                  required
                />
              </div>

              <div style={{
                background:'#F0FDF4', border:'1px solid #A7F3D0',
                borderRadius:10, padding:'.75rem 1rem',
                fontSize:'.8rem', color:'#065F46', marginBottom:'1.25rem',
              }}>
                <div style={{ fontWeight:700, marginBottom:'.25rem' }}>
                  <ExternalLink size={13} style={{ verticalAlign:'middle', marginRight:4 }} />
                  You will be redirected to Chapa's secure checkout
                </div>
                Supports: Telebirr, CBE Birr, Awash Bank, Cards and more.
                Your card details are never shared with us.
              </div>

              <div className="pp-modal-actions">
                <button type="button" className="pp-btn-cancel" onClick={() => setPayModal(null)} disabled={paying}>
                  Cancel
                </button>
                <button type="submit" className="pp-btn-pay" disabled={paying}>
                  {paying ? 'Redirecting…' : `Pay ${fmtAmt(payAmt, payModal.currency)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
