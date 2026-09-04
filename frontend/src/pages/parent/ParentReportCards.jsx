import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';
import ChildSelector from './ChildSelector';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function ParentReportCards() {
  const [searchParams] = useSearchParams();
  const [children,    setChildren]    = useState([]);
  const [activeId,    setActiveId]    = useState(searchParams.get('child') || null);
  const [cards,       setCards]       = useState([]);
  const [activeCard,  setActiveCard]  = useState(null);
  const [cardDetail,  setCardDetail]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [detailLoad,  setDetailLoad]  = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    parentApi.getChildren().then((list) => {
      setChildren(list);
      if (!activeId && list.length) setActiveId(list[0].id);
    }).catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!activeId) return;
    setActiveCard(null); setCardDetail(null);
    const fetch = async () => {
      try {
        setLoading(true); setError(null);
        setCards(await parentApi.getChildReportCards(activeId));
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetch();
  }, [activeId]);

  const openCard = async (card) => {
    setActiveCard(card.id);
    try {
      setDetailLoad(true);
      setCardDetail(await parentApi.getChildReportCardById(activeId, card.id));
    } catch (_) {}
    finally { setDetailLoad(false); }
  };

  const activeChild = children.find(c => c.id === activeId);

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Report Cards</h1>
        <p className="sp-page-sub">
          {activeChild ? `${activeChild.first_name} ${activeChild.last_name}` : 'Select a child'}
        </p>
      </div>

      <ChildSelector children={children} activeId={activeId} onChange={(id) => { setActiveId(id); setActiveCard(null); setCardDetail(null); }} />

      {loading ? <LoadingSpinner message="Loading report cards…" /> : error ? <ErrorBanner message={error} onRetry={() => {}} /> : (
        <div className="sp-two-col">
          {/* List */}
          <div className="sp-card">
            <div className="sp-card-header">
              <span className="sp-card-title">Published Report Cards</span>
              <span className="sp-badge sp-badge--blue">{cards.length}</span>
            </div>
            {cards.length === 0 ? (
              <div className="sp-empty"><div className="sp-empty-icon">📋</div>No published report cards yet</div>
            ) : (
              <div>
                {cards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => openCard(card)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: activeCard === card.id ? 'rgba(217, 119, 6, 0.12)' : 'transparent',
                      borderLeft: activeCard === card.id ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{card.term_name} · {card.academic_year}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      {card.overall_grade && <span className="sp-badge sp-badge--yellow">Grade: {card.overall_grade}</span>}
                      {card.total_percentage != null && (
                        <span className={`sp-badge ${parseFloat(card.total_percentage)>=50?'sp-badge--green':'sp-badge--red'}`}>
                          {parseFloat(card.total_percentage).toFixed(1)}%
                        </span>
                      )}
                      {card.class_rank && <span className="sp-badge sp-badge--blue">Rank #{card.class_rank}</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Published: {fmtDate(card.published_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="sp-card">
            <div className="sp-card-header">
              <span className="sp-card-title">Subject Breakdown</span>
            </div>
            {!activeCard ? (
              <div className="sp-empty"><div className="sp-empty-icon">👆</div>Select a report card to view details</div>
            ) : detailLoad ? (
              <LoadingSpinner message="Loading details…" />
            ) : !cardDetail ? (
              <div className="sp-empty">Could not load details</div>
            ) : (
              <div>
                {cardDetail.advisor_remarks && (
                  <div style={{ padding: '1rem 1.25rem', background: 'rgba(217, 119, 6, 0.12)', borderBottom: '1px solid rgba(217, 119, 6, 0.3)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Advisor Remarks</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{cardDetail.advisor_remarks}</div>
                  </div>
                )}
                <div className="sp-table-wrap">
                  <table className="sp-table">
                    <thead>
                      <tr><th>Subject</th><th>Marks</th><th>%</th><th>Grade</th><th>Passed</th></tr>
                    </thead>
                    <tbody>
                      {(cardDetail.subjects || []).map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600 }}>{s.subject_name}</td>
                          <td>{s.total_marks ?? '—'}</td>
                          <td>{s.percentage != null ? `${parseFloat(s.percentage).toFixed(1)}%` : '—'}</td>
                          <td><span className="sp-badge sp-badge--yellow">{s.letter_grade || '—'}</span></td>
                          <td><span className={`sp-badge ${s.is_passed ? 'sp-badge--green' : 'sp-badge--red'}`}>{s.is_passed ? 'Yes' : 'No'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
