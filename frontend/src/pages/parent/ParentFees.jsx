import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, ExternalLink, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { parentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const STATUS_BADGE = {
  PAID:'green', PARTIAL:'yellow', UNPAID:'red',
  OVERDUE:'red', WAIVED:'blue', CANCELLED:'gray',
};
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
const fmtAmt = (n, cur = 'ETB') =>
  `${cur} ${parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function ParentFees() {
  const [searchParams] = useSearchParams();

  // Chapa sometimes HTML-encodes & as &amp; — decode it
  const rawSearch   = window.location.search.replace(/&amp;/g, '&');
  const urlParams   = new URLSearchParams(rawSearch);
  const returnTxRef = urlParams.get('tx_ref')      || searchParams.get('tx_ref');
  const returnInvId = urlParams.get('invoice_id')  || searchParams.get('invoice_id');

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [payModal,   setPayModal]   = useState(null);
  const [payAmt,     setPayAmt]     = useState('');
  const [paying,     setPaying]     = useState(false);
  const [payErr,     setPayErr]     = useState(null);
  const [returnMsg,  setReturnMsg]  = useState(null);
  const [verifying,  setVerifying]  = useState(false);

  const load = async () => {
    try { setLoading(true); setError(null); setData(await parentApi.getFees()); }
    catch (e) { setError(e.message); }
    finally   { setLoading(false); }
  };

  /* ── Verify with Chapa after redirect ────────────────────────────────────
     Polls up to 3 times (2.5 s apart) if Chapa status is still 'pending'.   */
  const verifyWithRetry = async (tx_ref, invoice_id, attempt = 1) => {
    try {
      console.log(`[verify] attempt ${attempt} tx_ref=${tx_ref}`);
      const res = await parentApi.verifyPayment(tx_ref, invoice_id);
      const vd  = res?.data || res;
      console.log('[verify] response:', vd);

      if (vd?.status === 'success') {
        setReturnMsg({
          type: 'success',
          text: vd.duplicate
            ? 'Payment already recorded — invoice is up to date.'
            : `Payment confirmed! Receipt: ${vd.receipt_number || 'issued'}.`,
        });
        load();
        return;
      }

      if (vd?.status === 'pending') {
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2500));
          return verifyWithRetry(tx_ref, invoice_id, attempt + 1);
        }
        setReturnMsg({
          type: 'info',
          text: 'Your payment is being processed by Chapa. The invoice will update automatically once confirmed.',
        });
        load();
        return;
      }

      if (vd?.status === 'unknown') {
        setReturnMsg({
          type: 'info',
          text: 'Could not confirm payment status yet. If you completed the payment, your invoice will update shortly — refresh in a moment.',
        });
        load();
        return;
      }

      // failed / abandoned / cancelled
      setReturnMsg({
        type: 'warn',
        text: vd?.status === 'abandoned'
          ? 'Payment was not completed — you left Chapa before confirming. No charge was made. Click Pay to try again.'
          : `Payment was not completed (status: ${vd?.status || 'cancelled'}). No charge was made. You can try again.`,
      });
    } catch (err) {
      console.error('[verify] error:', err);
      setReturnMsg({
        type: 'info',
        text: 'Payment status check could not complete. If you paid on Chapa, refresh this page in a moment to see the updated invoice.',
      });
    }
  };

  useEffect(() => {
    load();
    if (returnTxRef && returnInvId) {
      setVerifying(true);
      verifyWithRetry(returnTxRef, returnInvId).finally(() => setVerifying(false));
    }
  }, []); // eslint-disable-line

  const openPay = (inv) => {
    setPayModal(inv);
    setPayAmt(parseFloat(inv.balance).toFixed(2));
    setPayErr(null);
  };

  const handlePay = async () => {
    setPaying(true);
    setPayErr(null);
    try {
      console.log('[Pay] calling initiatePayment for invoice', payModal.id, 'amount', payAmt);
      const result = await parentApi.initiatePayment(
        payModal.id,
        parseFloat(payAmt),
        'GATEWAY'
      );
      console.log('[Pay] backend response:', result);

      const url = result?.checkout_url || result?.data?.checkout_url;
      if (url) {
        console.log('[Pay] redirecting to Chapa:', url);
        window.location.href = url;
      } else {
        setPayErr('No checkout URL returned from server. Please try again.');
        setPaying(false);
      }
    } catch (err) {
      console.error('[Pay] error:', err);
      setPayErr(err.message || 'Payment initialisation failed. Please try again.');
      setPaying(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────── */
  if (loading || verifying)
    return <LoadingSpinner message={verifying ? 'Verifying payment with Chapa…' : 'Loading fee records…'} />;
  if (error)
    return <ErrorBanner message={error} onRetry={load} />;
  if (!data) return null;

  const { summary, invoices } = data;

  const RETURN_COLORS = {
    success: { bg: '#ECFDF5', border: '#6EE7B7' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE' },
    warn:    { bg: '#FFFBEB', border: '#FDE68A' },
  };

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Fee Payments</h1>
        <p className="sp-page-sub">Invoices and payment history for your linked children</p>
      </div>

      {/* ── Return-from-Chapa banner ── */}
      {returnMsg && (
        <div style={{
          marginBottom: '1.5rem', padding: '0.9rem 1.25rem', borderRadius: 10,
          background: RETURN_COLORS[returnMsg.type]?.bg,
          border: `1px solid ${RETURN_COLORS[returnMsg.type]?.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {returnMsg.type === 'success' && <CheckCircle2 size={18} color="#16A34A" />}
            {returnMsg.type === 'warn'    && <AlertCircle  size={18} color="#D97706" />}
            <span style={{ fontSize: '.875rem', fontWeight: 500 }}>{returnMsg.text}</span>
          </div>
          <button
            onClick={() => setReturnMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Summary cards ── */}
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
            <div className="pp-fee-stat-lbl">Overdue</div>
          </div>
        )}
      </div>

      {/* ── Invoices table ── */}
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
                  <th>Invoice #</th><th>Student</th><th>Term</th><th>Total</th>
                  <th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, fontSize: '.8rem' }}>{inv.invoice_number}</td>
                    <td style={{ fontSize: '.82rem' }}>
                      {inv.first_name ? `${inv.first_name} ${inv.last_name}` : (inv.student_name || '—')}
                    </td>
                    <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{inv.term_name}</td>
                    <td style={{ fontWeight: 600 }}>{fmtAmt(inv.total_amount, inv.currency)}</td>
                    <td style={{ color: '#16A34A' }}>{fmtAmt(inv.amount_paid, inv.currency)}</td>
                    <td style={{ color: parseFloat(inv.balance) > 0 ? 'var(--primary)' : '#16A34A', fontWeight: 700 }}>
                      {fmtAmt(inv.balance, inv.currency)}
                    </td>
                    <td style={{ fontSize: '.8rem' }}>{fmtDate(inv.due_date)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem', alignItems: 'flex-start' }}>
                        <span className={`sp-badge sp-badge--${STATUS_BADGE[inv.status] || 'gray'}`}>
                          {inv.status}
                        </span>
                        {inv.gateway_status && !['NONE', null, undefined].includes(inv.gateway_status) && (
                          <span
                            className={`sp-badge sp-badge--${inv.gateway_status === 'SUCCESS' ? 'green' : inv.gateway_status === 'PENDING' ? 'yellow' : 'gray'}`}
                            style={{ fontSize: '.65rem' }}
                          >
                            {inv.gateway_status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {!['PAID','WAIVED','CANCELLED'].includes(inv.status) && parseFloat(inv.balance) > 0 && (
                        <button
                          className="sp-badge sp-badge--yellow"
                          style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}
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

      {/* ── Chapa payment modal ── */}
      {payModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 600,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '80px', paddingLeft: '1rem', paddingRight: '1rem',
            overflowY: 'auto',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !paying) setPayModal(null); }}
        >
          <div style={{
            background: 'var(--card-bg, #FFFFFF)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '100%', maxWidth: '400px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            marginBottom: '2rem',
          }}>

            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                  Pay via Chapa
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {payModal.invoice_number} · {payModal.first_name
                    ? `${payModal.first_name} ${payModal.last_name}`
                    : (payModal.student_name || '—')}
                </div>
              </div>
              {!paying && (
                <button type="button" onClick={() => setPayModal(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem' }}>
              {/* Balance */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                background: 'var(--bg-color)', borderRadius: 8,
                padding: '.6rem 1rem', marginBottom: '.9rem', fontSize: '.875rem',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Balance</span>
                <strong style={{ color: 'var(--primary)' }}>{fmtAmt(payModal.balance, payModal.currency)}</strong>
              </div>

              {/* Error */}
              {payErr && (
                <div style={{
                  display: 'flex', gap: '.5rem', alignItems: 'flex-start',
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 8, padding: '.65rem', fontSize: '.82rem', color: '#991B1B',
                  marginBottom: '.9rem',
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{payErr}</span>
                </div>
              )}

              {/* Amount */}
              <div style={{ marginBottom: '.9rem' }}>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem', color: 'var(--text-main)' }}>
                  Amount ({payModal.currency})
                </label>
                <input
                  type="number" step="0.01" min="0.01" max={payModal.balance}
                  value={payAmt} onChange={e => setPayAmt(e.target.value)}
                  disabled={paying}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '.55rem .85rem', fontSize: '.9rem',
                    border: '1px solid var(--border-color)', borderRadius: 8,
                    background: 'var(--card-bg)', color: 'var(--text-main)',
                  }}
                />
              </div>

              {/* Chapa info */}
              <div style={{
                background: '#F0FDF4', border: '1px solid #A7F3D0',
                borderRadius: 8, padding: '.6rem .85rem',
                fontSize: '.77rem', color: '#065F46', lineHeight: 1.5,
                marginBottom: '1rem',
              }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.3rem', marginBottom: '.15rem' }}>
                  <ExternalLink size={11} /> Secure Chapa checkout
                </div>
                Telebirr · CBE Birr · Awash Bank · Cards
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '.75rem' }}>
                <button type="button"
                  onClick={() => setPayModal(null)}
                  disabled={paying}
                  style={{
                    padding: '.7rem 1.1rem', borderRadius: 8, cursor: 'pointer',
                    border: '1px solid var(--border-color)', background: 'var(--bg-color)',
                    color: 'var(--text-muted)', fontWeight: 600, fontSize: '.875rem',
                    flexShrink: 0,
                  }}>
                  Cancel
                </button>
                <button type="button"
                  onClick={handlePay}
                  disabled={paying || !payAmt || parseFloat(payAmt) <= 0}
                  style={{
                    flex: 1, padding: '.7rem', borderRadius: 8, cursor: 'pointer',
                    border: 'none', background: 'var(--accent, #D97706)',
                    color: '#fff', fontWeight: 700, fontSize: '.9rem',
                    opacity: (paying || !payAmt || parseFloat(payAmt) <= 0) ? 0.6 : 1,
                  }}>
                  {paying ? 'Opening Chapa…' : `Pay ${fmtAmt(payAmt, payModal.currency)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
