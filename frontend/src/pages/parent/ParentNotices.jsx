import { useState, useEffect } from 'react';
import { parentApi } from '../../api';
import { LoadingSpinner, ErrorBanner } from '../../components/shared/PageState';

const PRIORITY_CLS = { URGENT: 'urgent', HIGH: 'high', NORMAL: 'normal', LOW: 'low' };
const PRIORITY_BADGE = { URGENT: 'red', HIGH: 'yellow', NORMAL: 'blue', LOW: 'gray' };
const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

export default function ParentNotices() {
  const [announcements, setAnnouncements] = useState([]);
  const [events,        setEvents]        = useState([]);
  const [loadingA,      setLoadingA]      = useState(true);
  const [loadingE,      setLoadingE]      = useState(true);
  const [errorA,        setErrorA]        = useState(null);
  const [rsvpState,     setRsvpState]     = useState({}); // eventId -> response

  useEffect(() => {
    parentApi.getAnnouncements({ limit: 30 })
      .then(setAnnouncements)
      .catch(e => setErrorA(e.message))
      .finally(() => setLoadingA(false));

    parentApi.getEvents({ limit: 20 })
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoadingE(false));
  }, []);

  const handleRsvp = async (eventId, response) => {
    try {
      setRsvpState(s => ({ ...s, [eventId]: response }));
      await parentApi.rsvpEvent(eventId, response);
    } catch (_) {
      setRsvpState(s => ({ ...s, [eventId]: null }));
    }
  };

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Notices & Events</h1>
        <p className="sp-page-sub">School announcements and upcoming events</p>
      </div>

      <div className="sp-two-col">
        {/* Announcements */}
        <div>
          <div className="sp-card-header" style={{ padding: 0, marginBottom: '0.75rem' }}>
            <span className="sp-card-title">📢 Announcements</span>
            <span className="sp-badge sp-badge--blue">{announcements.length}</span>
          </div>

          {loadingA ? <LoadingSpinner message="Loading…" /> :
           errorA   ? <ErrorBanner message={errorA} onRetry={() => {}} /> :
           announcements.length === 0 ? (
            <div className="sp-empty"><div className="sp-empty-icon">📭</div>No announcements</div>
           ) : (
            <div className="pp-notice-list">
              {announcements.map((a) => (
                <div key={a.id} className={`pp-notice pp-notice--${PRIORITY_CLS[a.priority] || 'normal'}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div className="pp-notice-title">{a.title}</div>
                    <span className={`sp-badge sp-badge--${PRIORITY_BADGE[a.priority] || 'blue'}`} style={{ flexShrink: 0 }}>
                      {a.priority}
                    </span>
                  </div>
                  <div className="pp-notice-body">{a.body}</div>
                  <div className="pp-notice-footer">
                    <span className="pp-notice-date">{fmtDate(a.publish_at)}</span>
                    <span className="sp-badge sp-badge--gray" style={{ fontSize: '0.65rem' }}>
                      {a.audience}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events */}
        <div>
          <div className="sp-card-header" style={{ padding: 0, marginBottom: '0.75rem' }}>
            <span className="sp-card-title">📅 Upcoming Events</span>
            <span className="sp-badge sp-badge--yellow">{events.length}</span>
          </div>

          {loadingE ? <LoadingSpinner message="Loading…" /> :
           events.length === 0 ? (
            <div className="sp-empty"><div className="sp-empty-icon">🗓️</div>No upcoming events</div>
           ) : (
            <div className="pp-event-grid">
              {events.map((ev) => {
                const d   = new Date(ev.event_date);
                const rsp = rsvpState[ev.id];
                return (
                  <div key={ev.id} className="pp-event-card">
                    <div className="pp-event-date-badge">
                      <span className="pp-event-day">{d.getDate()}</span>
                      <span className="pp-event-mon">{d.toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="pp-event-title">{ev.title}</div>
                    <div className="pp-event-meta">
                      {ev.start_time && <span>⏰ {ev.start_time}{ev.end_time ? ` – ${ev.end_time}` : ''}</span>}
                      {ev.location && <span style={{ display: 'block' }}>📍 {ev.location}</span>}
                    </div>
                    {ev.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                        {ev.description}
                      </p>
                    )}
                    {ev.rsvp_required && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                        {['ATTENDING','NOT_ATTENDING','MAYBE'].map((resp) => (
                          <button
                            key={resp}
                            className={`pp-rsvp-btn ${rsp === resp ? 'pp-rsvp-btn--active' : ''}`}
                            onClick={() => handleRsvp(ev.id, resp)}
                          >
                            {resp === 'ATTENDING' ? '✅ Going' : resp === 'NOT_ATTENDING' ? '❌ Not Going' : '🤔 Maybe'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
