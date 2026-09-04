import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { accountantApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const fmt = (n, cur = 'ETB') =>
  `${cur === 'ETB' ? 'Birr' : cur} ${parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const METHOD_COLOR = {
  CASH: 'green', BANK_TRANSFER: 'blue', MOBILE_MONEY: 'yellow',
  GATEWAY: 'blue', CHEQUE: 'gray', WAIVER: 'gray',
};

export default function AccountantDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    try { setLoading(true); setError(null); setData(await accountantApi.getDashboard()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;
  if (!data)   return null;

  const { financial, recent_payments, monthly_trend } = data;
  const maxTrend = Math.max(...(monthly_trend || []).map(m => parseFloat(m.total)), 1);

  const KPIS = [
    { label: 'Total Collected',  value: fmt(financial.total_collected),  mod: 'green',  icon: <CheckCircle size={40} /> },
    { label: 'Outstanding',      value: fmt(financial.total_outstanding), mod: 'red',    icon: <AlertTriangle size={40} /> },
    { label: 'Total Billed',     value: fmt(financial.total_billed),      mod: 'gold',   icon: <TrendingUp size={40} /> },
    { label: 'Invoices (term)',  value: financial.total_invoices,         mod: 'blue',   icon: <FileText size={40} /> },
  ];

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Finance Dashboard</h1>
        <p className="sp-page-sub">Current academic year overview</p>
      </div>

      {/* KPIs */}
      <div className="ap-kpi-grid">
        {KPIS.map(({ label, value, mod, icon }) => (
          <div key={label} className={`ap-kpi ap-kpi--${mod}`}>
            <div className="ap-kpi-label">{label}</div>
            <div className="ap-kpi-value">{value}</div>
            <div className="ap-kpi-icon">{icon}</div>
          </div>
        ))}
      </div>

      <div className="sp-two-col">
        {/* Monthly trend */}
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title">📈 Collections — Last 6 Months</span>
          </div>
          <div className="sp-card-body">
            {monthly_trend.length === 0 ? (
              <div className="sp-empty"><div className="sp-empty-icon">📊</div>No data yet</div>
            ) : (
              <>
                <div className="ap-trend-bars">
                  {monthly_trend.map((m) => {
                    const pct = Math.max((parseFloat(m.total) / maxTrend) * 100, 4);
                    return (
                      <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          className="ap-trend-bar"
                          style={{ height: `${pct}%`, width: '100%' }}
                          title={`${m.month}: Birr ${parseFloat(m.total).toLocaleString()}`}
                        />
                        <div className="ap-trend-label">{m.month.split(' ')[0]}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="sp-card">
          <div className="sp-card-header"><span className="sp-card-title">Quick Actions</span></div>
          <div className="sp-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {[
              { to: '/accountant/invoices/generate', label: '➕ Generate Invoices',  color: 'green'  },
              { to: '/accountant/payments/record',   label: '💳 Record Payment',     color: 'blue'   },
              { to: '/accountant/fee-structures',    label: '⚙️ Fee Structures',     color: 'yellow' },
              { to: '/accountant/reports',           label: '📊 Financial Reports',  color: 'gray'   },
            ].map(({ to, label, color }) => (
              <Link key={to} to={to}
                className={`sp-badge sp-badge--${color}`}
                style={{ textDecoration: 'none', padding: '.65rem 1rem', fontSize: '.875rem', justifyContent: 'flex-start' }}
              >{label}</Link>
            ))}

            {parseInt(financial.overdue_count) > 0 && (
              <Link to="/accountant/reports?tab=arrears"
                style={{ textDecoration: 'none', marginTop: '.5rem' }}
              >
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '.75rem 1rem', color: 'var(--primary)', fontWeight: 600, fontSize: '.85rem' }}>
                  ⚠️ {financial.overdue_count} overdue invoice{financial.overdue_count > 1 ? 's' : ''} — view arrears
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent payments */}
      <div className="sp-card" style={{ marginTop: '1.5rem' }}>
        <div className="sp-card-header">
          <span className="sp-card-title">Recent Payments</span>
          <Link to="/accountant/payments" style={{ fontSize: '.8rem', color: 'var(--acc-green)', fontWeight: 600 }}>View all →</Link>
        </div>
        {recent_payments.length === 0 ? (
          <div className="sp-empty"><div className="sp-empty-icon">💳</div>No payments recorded yet</div>
        ) : (
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead><tr><th>Receipt</th><th>Student</th><th>Invoice</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
              <tbody>
                {recent_payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, fontSize: '.8rem', color: 'var(--acc-green)' }}>{p.receipt_number}</td>
                    <td style={{ fontSize: '.82rem' }}>{p.student_name}</td>
                    <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{p.invoice_number}</td>
                    <td style={{ fontWeight: 700 }}>{p.currency === 'ETB' ? 'Birr' : p.currency} {parseFloat(p.amount).toLocaleString()}</td>
                    <td><span className={`sp-badge sp-badge--${METHOD_COLOR[p.payment_method] || 'gray'}`}>{p.payment_method}</span></td>
                    <td style={{ fontSize: '.8rem' }}>{fmtDate(p.payment_date)}</td>
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
