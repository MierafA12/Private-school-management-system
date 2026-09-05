import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { accountantApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const STATUS_CLR = { PAID:'green', PARTIAL:'yellow', UNPAID:'red', OVERDUE:'red', WAIVED:'blue', CANCELLED:'gray' };
const fmt    = (n, cur='ETB') => `${cur === 'ETB' ? 'Birr' : cur} ${parseFloat(n||0).toLocaleString(undefined,{minimumFractionDigits:2})}`;
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';

export default function InvoiceList() {
  const [data,    setData]    = useState({ invoices:[], total:0 });
  const [terms,   setTerms]   = useState([]);
  const [classes, setClasses] = useState([]);
  const [filter,  setFilter]  = useState({ term_id:'', class_id:'', status:'', search:'' });
  const [page,    setPage]    = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const LIMIT = 30;

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const d = await accountantApi.getInvoices({ ...filter, limit: LIMIT, offset: page * LIMIT });
      setData(d);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    Promise.all([accountantApi.getTerms(), accountantApi.getClasses()])
      .then(([t, c]) => {
        setTerms(Array.isArray(t) ? t : []);
        setClasses(Array.isArray(c) ? c : []);
      }).catch(() => {});
  }, []);

  const set = (k, v) => { setFilter(f => ({ ...f, [k]: v })); setPage(0); };

  return (
    <div>
      <div className="sp-page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Invoices</h1>
          <p className="sp-page-sub">All fee invoices across all students</p>
        </div>
        <Link to="/accountant/invoices/generate" className="ap-btn-primary" style={{ textDecoration:'none' }}>+ Generate</Link>
      </div>

      <div className="ap-filter-bar">
        <input placeholder="Search student / invoice #…" value={filter.search} onChange={e => set('search', e.target.value)} style={{ flex:1, minWidth:200 }} />
        <select value={filter.term_id}   onChange={e => set('term_id',  e.target.value)}>
          <option value="">All semesters</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filter.class_id}  onChange={e => set('class_id', e.target.value)}>
          <option value="">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filter.status}    onChange={e => set('status',   e.target.value)}>
          <option value="">All statuses</option>
          {['PAID','PARTIAL','UNPAID','OVERDUE','WAIVED','CANCELLED'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title">Invoices</span>
          <span className="sp-badge sp-badge--blue">{data.total} total</span>
        </div>
        {loading ? <LoadingSpinner message="Loading…" /> : error ? <ErrorBanner message={error} onRetry={load} /> : (
          <>
            {data.invoices.length === 0 ? (
              <div className="sp-empty"><div className="sp-empty-icon">🧾</div>No invoices found</div>
            ) : (
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr><th>Invoice #</th><th>Student</th><th>Class</th><th>Semester</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {data.invoices.map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight:600, fontSize:'.8rem', color:'var(--acc-green)' }}>{inv.invoice_number}</td>
                        <td style={{ fontSize:'.82rem' }}>{inv.student_name}</td>
                        <td style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>{inv.class_name||'—'}</td>
                        <td style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>{inv.term_name}</td>
                        <td>{fmt(inv.total_amount, inv.currency)}</td>
                        <td style={{ color:'#16A34A' }}>{fmt(inv.amount_paid, inv.currency)}</td>
                        <td style={{ fontWeight:700, color: parseFloat(inv.balance)>0?'var(--primary)':'#16A34A' }}>{fmt(inv.balance, inv.currency)}</td>
                        <td style={{ fontSize:'.78rem' }}>{fmtDate(inv.due_date)}</td>
                        <td><span className={`sp-badge sp-badge--${STATUS_CLR[inv.status]||'gray'}`}>{inv.status}</span></td>
                        <td><Link to={`/accountant/invoices/${inv.id}`} className="sp-badge sp-badge--blue" style={{ textDecoration:'none' }}>View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data.total > LIMIT && (
              <div style={{ padding:'1rem 1.25rem', display:'flex', gap:'.75rem', justifyContent:'flex-end' }}>
                <button className="ap-btn-secondary" disabled={page===0} onClick={() => setPage(p => p-1)}>← Prev</button>
                <span style={{ fontSize:'.8rem', alignSelf:'center', color:'var(--text-muted)' }}>
                  Page {page+1} of {Math.ceil(data.total/LIMIT)}
                </span>
                <button className="ap-btn-secondary" disabled={(page+1)*LIMIT>=data.total} onClick={() => setPage(p => p+1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
