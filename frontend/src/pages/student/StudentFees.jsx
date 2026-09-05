import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { studentApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

const STATUS_COLOR = { PAID: 'green', PARTIAL: 'yellow', UNPAID: 'red', OVERDUE: 'red', WAIVED: 'blue', CANCELLED: 'gray' };
const METHOD_LABEL = { CASH: 'Cash', MPESA: 'M-Pesa', BANK_TRANSFER: 'Bank Transfer', CHEQUE: 'Cheque', CARD: 'Card', OTHER: 'Other' };

const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (n, cur = 'ETB') => `${cur === 'ETB' ? 'Birr' : cur} ${parseFloat(n || 0).toLocaleString()}`;

export default function StudentFees() {
  const [data,       setData]       = useState(null);
  const [detail,     setDetail]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [detailLoad, setDetailLoad] = useState(false);

  const loadList = async () => {
    try {
      setLoading(true);
      setError(null);
      setDetail(null);
      setData(await studentApi.getFees());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    try {
      setDetailLoad(true);
      setError(null);
      setDetail(await studentApi.getFeeInvoiceById(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoad(false);
    }
  };

  useEffect(() => { loadList(); }, []);

  if (loading) return <LoadingSpinner message="Loading fee information…" />;
  if (error && !detail) return <ErrorBanner message={error} onRetry={loadList} />;

  // ── Invoice detail ──────────────────────────────────────────────────────────
  if (detail) {
    const { payments = [] } = detail;
    const balance = parseFloat(detail.balance || 0);

    return (
      <div>
        <div className="sp-page-header">
          <button onClick={() => setDetail(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <ChevronLeft size={16} /> Back to invoices
          </button>
          <h1 className="sp-page-title">Invoice {detail.invoice_number}</h1>
          <p className="sp-page-sub">{detail.term_name} · {detail.academic_year}</p>
        </div>

        <div className="sp-two-col" style={{ marginBottom: '1rem' }}>
          {[
            ['Total Billed', fmtMoney(detail.total_amount, detail.currency), 'blue'],
            ['Amount Paid',  fmtMoney(detail.amount_paid,  detail.currency), 'green'],
            ['Balance',      fmtMoney(balance,              detail.currency), balance > 0 ? 'red' : 'green'],
          ].map(([label, value, color]) => (
            <div className="sp-stat-card" key={label}>
              <div className={`sp-stat-icon sp-stat-icon--${color}`}><CreditCard size={22} /></div>
              <div><div className="sp-stat-value" style={{ fontSize: '1.1rem' }}>{value}</div><div className="sp-stat-label">{label}</div></div>
            </div>
          ))}
        </div>

        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title">💳 Payment History</span>
            <span className={`sp-badge sp-badge--${STATUS_COLOR[detail.status] || 'gray'}`}>{detail.status}</span>
          </div>
          {payments.length === 0 ? (
            <EmptyState icon="💳" title="No payments yet" subtitle="No payments have been recorded for this invoice." />
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{fmtDate(p.payment_date)}</td>
                      <td style={{ fontWeight: 700, color: '#16A34A' }}>{fmtMoney(p.amount, detail.currency)}</td>
                      <td><span className="sp-badge sp-badge--blue">{METHOD_LABEL[p.payment_method] || p.payment_method}</span></td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.transaction_reference || '—'}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
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

  // ── Invoice list ────────────────────────────────────────────────────────────
  const { summary = {}, invoices = [] } = data || {};

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Fee Management</h1>
        <p className="sp-page-sub">View invoices, payment status, and outstanding balances</p>
      </div>

      {/* Summary */}
      <div className="sp-stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.5rem' }}>
        <div className="sp-stat-card">
          <div className="sp-stat-icon sp-stat-icon--blue"><CreditCard size={22} /></div>
          <div>
            <div className="sp-stat-value" style={{ fontSize: '1.1rem' }}>{fmtMoney(summary.total_billed)}</div>
            <div className="sp-stat-label">Total Billed · This semester</div>
          </div>
        </div>
        <div className="sp-stat-card">
          <div className="sp-stat-icon sp-stat-icon--green"><CheckCircle size={22} /></div>
          <div>
            <div className="sp-stat-value" style={{ fontSize: '1.1rem' }}>{fmtMoney(summary.total_paid)}</div>
            <div className="sp-stat-label">Total Paid</div>
          </div>
        </div>
        <div className="sp-stat-card">
          <div className={`sp-stat-icon sp-stat-icon--${parseFloat(summary.total_balance) > 0 ? 'red' : 'green'}`}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div className="sp-stat-value" style={{ fontSize: '1.1rem' }}>{fmtMoney(summary.total_balance)}</div>
            <div className="sp-stat-label">Outstanding</div>
          </div>
        </div>
      </div>

      {/* Invoice table */}
      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title">🧾 Invoices</span>
          <span className="sp-badge sp-badge--blue">{invoices.length} total</span>
        </div>
        {invoices.length === 0 ? (
          <EmptyState icon="🧾" title="No invoices yet" subtitle="Fee invoices will appear here once generated by the school." />
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Semester</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const bal = parseFloat(inv.balance || 0);
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{inv.invoice_number}</td>
                      <td style={{ fontWeight: 600 }}>{inv.term_name}</td>
                      <td>{fmtMoney(inv.total_amount, inv.currency)}</td>
                      <td style={{ color: '#16A34A', fontWeight: 600 }}>{fmtMoney(inv.amount_paid, inv.currency)}</td>
                      <td style={{ color: bal > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {fmtMoney(bal, inv.currency)}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{fmtDate(inv.due_date)}</td>
                      <td>
                        <span className={`sp-badge sp-badge--${STATUS_COLOR[inv.status] || 'gray'}`}>{inv.status}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => loadDetail(inv.id)}
                          disabled={detailLoad}
                          style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
