import { useEffect, useState, useCallback } from 'react';
import { FileText, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import { examApi, principalApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';
import '../principal/principal.css';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ─── Full report card detail modal ───────────────────────────────────────────
function ReportCardModal({ cardId, onClose }) {
  const [card,    setCard]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [remarks, setRemarks] = useState('');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    examApi.getReportCard(cardId).then(d => {
      setCard(d);
      setRemarks(d?.advisor_remarks || '');
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [cardId]);

  const saveAdvisorRemarks = async () => {
    // update via report_card items — for now just show a placeholder
    setSaving(true);
    try {
      // We'd need a separate PATCH /exams/report-cards/:id/advisor-remarks endpoint
      // For now update in DB directly — placeholder
      alert('Remarks saved (backend endpoint coming).');
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 700, padding: '1rem',
    }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
        {loading ? <div style={{ padding: '3rem' }}><LoadingSpinner /></div> :
         error   ? <div style={{ padding: '1.5rem' }}><ErrorBanner message={error} /><button className="btn-ghost" onClick={onClose}>Close</button></div> : (
          <>
            {/* Header */}
            <div style={{ background: 'var(--primary)', padding: '1.5rem 2rem', color: 'white' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Report Card</div>
              <div style={{ opacity: 0.85, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {card.first_name} {card.last_name} · {card.student_number} · {card.term_name} · {card.academic_year}
              </div>
            </div>

            {/* Summary bar */}
            <div style={{ display: 'flex', gap: '2rem', padding: '1rem 2rem', background: '#FEF2F2', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              {[
                ['Class', `${card.class_name} Section ${card.section_name}`],
                ['Overall', card.total_percentage != null ? `${card.total_percentage}%` : '—'],
                ['Grade', card.overall_grade || '—'],
                ['Rank', card.class_rank ? `#${card.class_rank}` : '—'],
                ['Status', card.is_published ? 'Published' : 'Draft'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>{k}</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Subject items */}
            <div style={{ padding: '1.25rem 2rem' }}>
              <table className="sp-table">
                <thead>
                  <tr><th>Subject</th><th>Marks</th><th>%</th><th>Grade</th><th>Pass</th><th>Teacher</th><th>Remarks</th></tr>
                </thead>
                <tbody>
                  {(card.items || []).map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.subject_name}</td>
                      <td>{item.total_marks ?? '—'}</td>
                      <td style={{ fontWeight: 600 }}>{item.percentage != null ? `${item.percentage}%` : '—'}</td>
                      <td>
                        {item.letter_grade
                          ? <span className={`sp-badge ${item.is_passed ? 'sp-badge--green' : 'sp-badge--red'}`}>{item.letter_grade}</span>
                          : '—'}
                      </td>
                      <td>
                        {item.is_passed === true ? <CheckCircle size={15} color="#16A34A" /> :
                         item.is_passed === false ? <XCircle size={15} color="#B91C1C" /> : '—'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.teacher_name || '—'}</td>
                      <td style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>{item.teacher_remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Advisor remarks */}
              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  Class Advisor Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '0.65rem 0.875rem', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn-ghost" onClick={onClose}>Close</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ReportCards() {
  const [years,    setYears]    = useState([]);
  const [terms,    setTerms]    = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [sections, setSections] = useState([]);
  const [cards,    setCards]    = useState([]);

  const [yearId,    setYearId]    = useState('');
  const [termId,    setTermId]    = useState('');
  const [classId,   setClassId]   = useState('');
  const [sectionId, setSectionId] = useState('');

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [generating, setGenerating] = useState(false);
  const [viewId,   setViewId]   = useState(null);

  // Load meta
  useEffect(() => {
    Promise.all([principalApi.getAcademicYears(), principalApi.getClasses()])
      .then(([y, c]) => {
        setYears(y); setClasses(c);
        const cur = y.find(a => a.is_current);
        if (cur) {
          setYearId(cur.id);
          principalApi.getAcademicYearById(cur.id).then(ay => setTerms(ay?.terms || []));
        }
      });
  }, []);

  // Load sections when class changes
  useEffect(() => {
    if (!classId) { setSections([]); setSectionId(''); return; }
    principalApi.getClassById(classId).then(c => setSections(c?.sections || []));
  }, [classId]);

  // Load report cards
  const loadCards = useCallback(async () => {
    if (!termId) return;
    setLoading(true); setError(null);
    try {
      const params = { term_id: termId };
      if (sectionId) params.section_id = sectionId;
      setCards(await examApi.listReportCards(params));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [termId, sectionId]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const generateAll = async () => {
    if (!termId || !sectionId) { alert('Select a term and section first.'); return; }
    if (!confirm(`Generate report cards for all students in this section? Existing cards will be updated.`)) return;
    setGenerating(true);
    try {
      const result = await examApi.generateSectionCards({ term_id: termId, section_id: sectionId });
      alert(`Done! ${result.success?.length || 0} cards generated. ${result.failed?.length ? `${result.failed.length} failed (missing marks?).` : ''}`);
      await loadCards();
    } catch (err) { alert(err.message); }
    finally { setGenerating(false); }
  };

  const togglePublish = async (cardId, current) => {
    try {
      await examApi.publishReportCard(cardId, !current);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, is_published: !current } : c));
    } catch (err) { alert(err.message); }
  };

  const publishAll = async () => {
    if (!confirm('Publish all report cards in this view? Students and parents will be able to see them.')) return;
    const unpublished = cards.filter(c => !c.is_published);
    for (const c of unpublished) {
      try { await examApi.publishReportCard(c.id, true); }
      catch (_) { /* continue */ }
    }
    await loadCards();
  };

  return (
    <div>
      <div className="sp-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Report Cards</h1>
          <p className="sp-page-sub">Generate, review and publish student report cards</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {sectionId && termId && (
            <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={generateAll} disabled={generating}>
              <RefreshCw size={15} /> {generating ? 'Generating…' : 'Generate All'}
            </button>
          )}
          {cards.length > 0 && cards.some(c => !c.is_published) && (
            <button className="btn-prim" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={publishAll}>
              <CheckCircle size={15} /> Publish All
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <select className="pf-select" style={{ minWidth: 150 }} value={yearId}
          onChange={e => {
            setYearId(e.target.value);
            principalApi.getAcademicYearById(e.target.value).then(ay => setTerms(ay?.terms || []));
            setTermId('');
          }}>
          <option value="">Academic Year</option>
          {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' ✓' : ''}</option>)}
        </select>
        <select className="pf-select" style={{ minWidth: 120 }} value={termId} onChange={e => setTermId(e.target.value)} disabled={!yearId}>
          <option value="">Term</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="pf-select" style={{ minWidth: 140 }} value={classId} onChange={e => { setClassId(e.target.value); setSectionId(''); }}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="pf-select" style={{ minWidth: 120 }} value={sectionId} onChange={e => setSectionId(e.target.value)} disabled={!classId}>
          <option value="">All Sections</option>
          {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
        </select>
      </div>

      {/* Tip */}
      {!termId && (
        <div className="sp-card">
          <EmptyState icon="📋" title="Select filters above" subtitle="Choose a term and optionally a section to view or generate report cards." />
        </div>
      )}

      {termId && (loading ? <LoadingSpinner message="Loading report cards…" /> :
       error   ? <ErrorBanner message={error} onRetry={loadCards} /> : (
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title">Report Cards</span>
            <span className="sp-badge sp-badge--blue">{cards.length} total</span>
          </div>
          {cards.length === 0 ? (
            <EmptyState icon="📋" title="No report cards yet"
              subtitle={sectionId ? "Click 'Generate All' to create report cards from entered marks." : "Select a specific section to generate report cards."} />
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Roll #</th>
                    <th>Student</th>
                    <th>Student #</th>
                    <th>%</th>
                    <th>Grade</th>
                    <th>Rank</th>
                    <th>Published</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{c.roll_number || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{c.first_name} {c.last_name}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.student_number}</td>
                      <td style={{ fontWeight: 700 }}>{c.total_percentage != null ? `${c.total_percentage}%` : '—'}</td>
                      <td>
                        {c.overall_grade
                          ? <span className="sp-badge sp-badge--blue">{c.overall_grade}</span>
                          : '—'}
                      </td>
                      <td>{c.class_rank ? `#${c.class_rank}` : '—'}</td>
                      <td>
                        <button
                          onClick={() => togglePublish(c.id, c.is_published)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                            background: c.is_published ? '#F0FDF4' : '#FEF2F2',
                            color: c.is_published ? '#15803D' : '#991B1B',
                            border: `1px solid ${c.is_published ? '#BBF7D0' : '#FECACA'}`,
                            cursor: 'pointer',
                          }}
                        >
                          {c.is_published ? <><CheckCircle size={12} /> Published</> : <><XCircle size={12} /> Draft</>}
                        </button>
                      </td>
                      <td>
                        <button className="btn-edit" onClick={() => setViewId(c.id)} title="View report card">
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {viewId && <ReportCardModal cardId={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}
