import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { accountantApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const fmt = (n, cur='ETB') => `${cur === 'ETB' ? 'Birr' : cur} ${parseFloat(n||0).toLocaleString(undefined,{minimumFractionDigits:2})}`;

const TABS = [
  { id:'collections', label:'📥 Collections' },
  { id:'arrears',     label:'⚠️ Arrears'      },
  { id:'revenue',     label:'📊 Revenue'      },
];

export default function FinancialReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab,     setTab]     = useState(searchParams.get('tab') || 'collections');
  const [terms,   setTerms]   = useState([]);
  const [classes, setClasses] = useState([]);
  const [years,   setYears]   = useState([]);
  const [filter,  setFilter]  = useState({ date_from:'', date_to:'', class_id:'', category:'', term_id:'', academic_year_id:'' });
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([accountantApi.getTerms(), accountantApi.getClasses(), accountantApi.getAcademicYears()])
      .then(([t, c, y]) => {
        setTerms(Array.isArray(t) ? t : []);
        setClasses(Array.isArray(c) ? c : []);
        setYears(Array.isArray(y) ? y : []);
      }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null); setData(null);
      if (tab==='collections') setData(await accountantApi.getCollectionsReport(filter));
      if (tab==='arrears')     setData(await accountantApi.getArrearsReport({ term_id: filter.term_id, class_id: filter.class_id }));
      if (tab==='revenue')     setData(await accountantApi.getRevenueReport({ academic_year_id: filter.academic_year_id, term_id: filter.term_id }));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [tab, filter]);

  useEffect(() => { load(); }, [load]);

  const changeTab = (t) => { setTab(t); setSearchParams({ tab: t }); setData(null); };
  const set = (k,v) => setFilter(f => ({...f, [k]:v}));

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Financial Reports</h1>
        <p className="sp-page-sub">Collections, arrears, and revenue analysis</p>
      </div>

      {/* Tab switcher */}
      <div className="pp-switcher" style={{ marginBottom:'1.5rem' }}>
        {TABS.map(t => (
          <button key={t.id}
            className={`pp-switcher-tab${tab===t.id?' pp-switcher-tab--active':''}`}
            style={{ borderColor: tab===t.id ? 'var(--primary)':undefined, color: tab===t.id?'var(--primary)':undefined, background: tab===t.id?'var(--primary-light, #FEF2F2)':undefined }}
            onClick={() => changeTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="ap-filter-bar" style={{ marginBottom:'1.5rem' }}>
        {tab==='collections' && <>
          <input type="date" value={filter.date_from} onChange={e=>set('date_from',e.target.value)} title="From" />
          <input type="date" value={filter.date_to}   onChange={e=>set('date_to',  e.target.value)} title="To" />
          <select value={filter.class_id} onChange={e=>set('class_id',e.target.value)}>
            <option value="">All classes</option>
            {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </>}
        {tab==='arrears' && <>
          <select value={filter.term_id} onChange={e=>set('term_id',e.target.value)}>
            <option value="">All semesters</option>
            {terms.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filter.class_id} onChange={e=>set('class_id',e.target.value)}>
            <option value="">All classes</option>
            {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </>}
        {tab==='revenue' && <>
          <select value={filter.academic_year_id} onChange={e=>set('academic_year_id',e.target.value)}>
            <option value="">All years</option>
            {years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          <select value={filter.term_id} onChange={e=>set('term_id',e.target.value)}>
            <option value="">All semesters</option>
            {terms.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </>}
      </div>

      {loading ? <LoadingSpinner message="Generating report…" /> :
       error   ? <ErrorBanner message={error} onRetry={load} /> :
       !data   ? null : (
        <>
          {/* Collections */}
          {tab==='collections' && (
            <div className="ap-report-section">
              <div className="ap-report-kpis">
                {[
                  { l:'Total Collected', v:fmt(data.summary?.total_collected), c:'green' },
                  { l:'Payments',        v:data.summary?.payment_count,         c:'blue'  },
                  { l:'Cash',            v:fmt(data.summary?.cash_total),       c:'gold'  },
                  { l:'Mobile Money',    v:fmt(data.summary?.mobile_total),     c:'blue'  },
                ].map(({ l,v,c }) => (
                  <div key={l} className={`ap-kpi ap-kpi--${c}`}>
                    <div className="ap-kpi-label">{l}</div>
                    <div className="ap-kpi-value" style={{ fontSize:'1.3rem' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="sp-card">
                <div className="sp-card-header"><span className="sp-card-title">By Payment Method</span></div>
                {!data.by_method?.length ? <div className="sp-empty"><div className="sp-empty-icon">📊</div>No data</div> : (
                  <div className="sp-table-wrap">
                    <table className="sp-table">
                      <thead><tr><th>Method</th><th>Count</th><th>Total</th></tr></thead>
                      <tbody>
                        {data.by_method.map(m => (
                          <tr key={m.method}>
                            <td><span className="sp-badge sp-badge--blue">{m.method}</span></td>
                            <td>{m.count}</td>
                            <td style={{ fontWeight:700 }}>{fmt(m.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Arrears */}
          {tab==='arrears' && (
            <div className="ap-report-section">
              <div className="ap-report-kpis">
                {[
                  { l:'Outstanding', v:fmt(data.summary?.total_outstanding), c:'red'  },
                  { l:'Total Billed', v:fmt(data.summary?.total_billed),     c:'gold' },
                  { l:'Invoices',     v:data.summary?.invoice_count,         c:'blue' },
                  { l:'Overdue',      v:data.summary?.overdue_count,         c:'red'  },
                ].map(({ l,v,c }) => (
                  <div key={l} className={`ap-kpi ap-kpi--${c}`}>
                    <div className="ap-kpi-label">{l}</div>
                    <div className="ap-kpi-value" style={{ fontSize:'1.3rem' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="sp-card">
                <div className="sp-card-header"><span className="sp-card-title">Outstanding Invoices by Student</span></div>
                {!data.students?.length ? <div className="sp-empty"><div className="sp-empty-icon">✅</div>No outstanding balances</div> : (
                  <div className="sp-table-wrap">
                    <table className="sp-table">
                      <thead><tr><th>Student</th><th>Invoice</th><th>Class</th><th>Semester</th><th>Total</th><th>Balance</th><th>Due</th><th>Status</th></tr></thead>
                      <tbody>
                        {data.students.map(s => (
                          <tr key={s.invoice_number}>
                            <td style={{ fontWeight:600 }}>{s.student_name}</td>
                            <td style={{ fontSize:'.78rem', color:'var(--acc-green)' }}>{s.invoice_number}</td>
                            <td style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>{s.class_name||'—'}</td>
                            <td style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>{s.term_name}</td>
                            <td>{fmt(s.total_amount, s.currency)}</td>
                            <td style={{ fontWeight:700, color:'var(--primary)' }}>{fmt(s.balance, s.currency)}</td>
                            <td style={{ fontSize:'.78rem' }}>{s.due_date ? new Date(s.due_date).toLocaleDateString() : '—'}</td>
                            <td><span className={`sp-badge sp-badge--${s.status==='OVERDUE'?'red':'yellow'}`}>{s.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Revenue */}
          {tab==='revenue' && (
            <div className="ap-report-section">
              <div className="ap-report-kpis">
                {[
                  { l:'Total Billed',    v:fmt(data.overall?.total_billed),     c:'gold'  },
                  { l:'Collected',       v:fmt(data.overall?.total_collected),   c:'green' },
                  { l:'Outstanding',     v:fmt(data.overall?.total_outstanding), c:'red'   },
                  { l:'Paid Invoices',   v:`${data.overall?.paid_count}/${data.overall?.invoice_count}`, c:'blue' },
                ].map(({ l,v,c }) => (
                  <div key={l} className={`ap-kpi ap-kpi--${c}`}>
                    <div className="ap-kpi-label">{l}</div>
                    <div className="ap-kpi-value" style={{ fontSize:'1.3rem' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="sp-card">
                <div className="sp-card-header"><span className="sp-card-title">Revenue by Category</span></div>
                {!data.by_category?.length ? <div className="sp-empty"><div className="sp-empty-icon">📊</div>No data</div> : (
                  <div className="sp-table-wrap">
                    <table className="sp-table">
                      <thead><tr><th>Category</th><th>Billed</th><th>Collected</th><th>Outstanding</th><th>Invoices</th><th>Collection %</th></tr></thead>
                      <tbody>
                        {data.by_category.map(c => {
                          const pct = parseFloat(c.billed)>0 ? Math.round((parseFloat(c.collected)/parseFloat(c.billed))*100) : 0;
                          return (
                            <tr key={c.category}>
                              <td style={{ fontWeight:600 }}>{c.category}</td>
                              <td>{fmt(c.billed)}</td>
                              <td style={{ color:'#16A34A', fontWeight:600 }}>{fmt(c.collected)}</td>
                              <td style={{ color:'var(--primary)', fontWeight:600 }}>{fmt(c.outstanding)}</td>
                              <td>{c.invoice_count}</td>
                              <td>
                                <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                                  <div className="sp-progress" style={{ width:70 }}>
                                    <div className={`sp-progress-fill sp-progress-fill--${pct>=90?'green':pct>=60?'yellow':'red'}`} style={{ width:`${pct}%` }} />
                                  </div>
                                  <span style={{ fontSize:'.78rem', fontWeight:600 }}>{pct}%</span>
                                </div>
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
          )}
        </>
      )}
    </div>
  );
}
