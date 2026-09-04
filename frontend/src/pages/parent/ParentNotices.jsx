import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Bell,
  Info,
  Search,
  Check,
  X,
  HelpCircle,
  Users,
  CheckCircle,
} from 'lucide-react';
import { parentApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

const PRIORITY_META = {
  URGENT: { cls: 'urgent', badge: 'red',    label: 'Urgent', Icon: AlertTriangle, color: 'var(--primary)' },
  HIGH:   { cls: 'high',   badge: 'yellow', label: 'High',   Icon: AlertTriangle, color: '#D97706' },
  NORMAL: { cls: 'normal', badge: 'blue',   label: 'Normal', Icon: Info,          color: '#2563EB' },
  LOW:    { cls: 'low',    badge: 'gray',   label: 'Low',    Icon: Bell,          color: '#64748B' },
};

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

export default function ParentNotices() {
  const [announcements,   setAnnouncements]   = useState([]);
  const [events,          setEvents]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [activeTab,       setActiveTab]       = useState('ALL'); // 'ALL' | 'ANNOUNCEMENTS' | 'EVENTS'
  const [priorityFilter,  setPriorityFilter]  = useState('ALL');
  const [search,          setSearch]          = useState('');
  const [rsvpState,       setRsvpState]       = useState({});
  const [rsvpSubmitting,  setRsvpSubmitting]  = useState({});
  const [toastMessage,    setToastMessage]    = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [annData, evData] = await Promise.all([
        parentApi.getAnnouncements({ limit: 50 }),
        parentApi.getEvents({ limit: 50 }),
      ]);

      const annList = Array.isArray(annData) ? annData : [];
      const evList = Array.isArray(evData) ? evData : [];

      setAnnouncements(annList);
      setEvents(evList);

      const rsvps = {};
      evList.forEach((ev) => {
        if (ev.my_rsvp) rsvps[ev.id] = ev.my_rsvp;
      });
      setRsvpState(rsvps);
    } catch (err) {
      setError(err.message || 'Failed to load notices and events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRsvp = async (eventId, response) => {
    const prev = rsvpState[eventId];
    try {
      setRsvpSubmitting((s) => ({ ...s, [eventId]: true }));
      setRsvpState((s) => ({ ...s, [eventId]: response }));
      await parentApi.rsvpEvent(eventId, response);

      const label =
        response === 'ATTENDING'
          ? 'Attending'
          : response === 'MAYBE'
          ? 'Tentative (Maybe)'
          : 'Not Attending';
      setToastMessage(`RSVP recorded: ${label}`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      setRsvpState((s) => ({ ...s, [eventId]: prev }));
      setToastMessage('Failed to update RSVP. Please try again.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setRsvpSubmitting((s) => ({ ...s, [eventId]: false }));
    }
  };

  const q = search.trim().toLowerCase();

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesPriority =
      priorityFilter === 'ALL' || (a.priority && a.priority.toUpperCase() === priorityFilter);
    const matchesSearch =
      !q ||
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.body && a.body.toLowerCase().includes(q));
    return matchesPriority && matchesSearch;
  });

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      !q ||
      (ev.title && ev.title.toLowerCase().includes(q)) ||
      (ev.description && ev.description.toLowerCase().includes(q)) ||
      (ev.location && ev.location.toLowerCase().includes(q));
    return matchesSearch;
  });

  const urgentCount = announcements.filter((a) => a.priority === 'URGENT').length;

  return (
    <div>
      {/* Header */}
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Notices & Events</h1>
          <p className="sp-page-sub">
            Haile-Manas Academy announcements, calendar events, and parent RSVPs
          </p>
        </div>
      </div>

      {/* Floating toast notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: 'var(--text-main)',
            color: 'var(--bg-card, #FFFFFF)',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <CheckCircle size={18} color="#22C55E" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Toolbar: Views & Search */}
      <div className="pp-notices-toolbar">
        <div className="pp-filter-tabs">
          <button
            className={`pp-tab-btn ${activeTab === 'ALL' ? 'pp-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            All Updates
          </button>
          <button
            className={`pp-tab-btn ${activeTab === 'ANNOUNCEMENTS' ? 'pp-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
          >
            📢 Announcements ({announcements.length})
          </button>
          <button
            className={`pp-tab-btn ${activeTab === 'EVENTS' ? 'pp-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('EVENTS')}
          >
            📅 Events ({events.length})
          </button>
        </div>

        <div className="pp-search-box">
          <Search size={15} className="pp-search-icon" />
          <input
            type="text"
            className="pp-search-input"
            placeholder="Search notices or events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '0.6rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Priority Pills for Announcements */}
      {(activeTab === 'ALL' || activeTab === 'ANNOUNCEMENTS') && (
        <div className="pp-pills-row">
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              alignSelf: 'center',
              marginRight: '0.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Priority:
          </span>
          {['ALL', 'URGENT', 'HIGH', 'NORMAL', 'LOW'].map((p) => {
            const count =
              p === 'ALL'
                ? announcements.length
                : announcements.filter((a) => a.priority === p).length;
            return (
              <button
                key={p}
                className={`pp-pill-btn ${priorityFilter === p ? 'pp-pill-btn--active' : ''}`}
                onClick={() => setPriorityFilter(p)}
              >
                {p === 'ALL' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
                <span
                  style={{
                    fontSize: '0.7rem',
                    opacity: 0.8,
                    background: priorityFilter === p ? 'rgba(255,255,255,0.25)' : 'var(--bg-color)',
                    padding: '1px 5px',
                    borderRadius: '999px',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading & Error States */}
      {loading ? (
        <LoadingSpinner message="Loading notices and events…" />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadData} />
      ) : (
        <>
          {/* TAB: ALL (Combined Two Column View) */}
          {activeTab === 'ALL' && (
            <div className="sp-two-col">
              {/* Left Column: Announcements */}
              <div>
                <div
                  className="sp-card-header"
                  style={{ padding: 0, marginBottom: '0.75rem', border: 'none' }}
                >
                  <span className="sp-card-title">📢 Announcements</span>
                  <span className="sp-badge sp-badge--blue">{filteredAnnouncements.length}</span>
                </div>

                {filteredAnnouncements.length === 0 ? (
                  <div className="sp-card" style={{ padding: '2rem' }}>
                    <EmptyState
                      icon="📭"
                      title="No announcements match"
                      subtitle={search ? 'Try clearing your search term' : 'No announcements currently posted'}
                    />
                  </div>
                ) : (
                  <div className="pp-notice-list">
                    {filteredAnnouncements.map((a) => {
                      const meta = PRIORITY_META[a.priority] || PRIORITY_META.NORMAL;
                      const Icon = meta.Icon;
                      return (
                        <div key={a.id} className={`pp-notice pp-notice--${meta.cls}`}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '0.5rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <Icon size={16} color={meta.color} style={{ flexShrink: 0 }} />
                              <span className="pp-notice-title">{a.title}</span>
                            </div>
                            <span
                              className={`sp-badge sp-badge--${meta.badge}`}
                              style={{ flexShrink: 0, fontSize: '0.7rem' }}
                            >
                              {meta.label}
                            </span>
                          </div>

                          <div className="pp-notice-body">{a.body}</div>

                          <div className="pp-notice-footer">
                            <span className="pp-notice-date">📅 {fmtDate(a.publish_at)}</span>
                            {a.audience && (
                              <span
                                className="sp-badge sp-badge--gray"
                                style={{ fontSize: '0.68rem' }}
                              >
                                {a.audience === 'ALL'
                                  ? 'All School'
                                  : a.audience === 'PARENTS'
                                  ? 'Parents'
                                  : a.audience}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Events */}
              <div>
                <div
                  className="sp-card-header"
                  style={{ padding: 0, marginBottom: '0.75rem', border: 'none' }}
                >
                  <span className="sp-card-title">📅 Upcoming Events</span>
                  <span className="sp-badge sp-badge--yellow">{filteredEvents.length}</span>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="sp-card" style={{ padding: '2rem' }}>
                    <EmptyState
                      icon="🗓️"
                      title="No upcoming events"
                      subtitle={search ? 'Try clearing your search term' : 'No upcoming school events scheduled'}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {filteredEvents.map((ev) => renderEventCard(ev))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ANNOUNCEMENTS ONLY */}
          {activeTab === 'ANNOUNCEMENTS' && (
            <div>
              {filteredAnnouncements.length === 0 ? (
                <div className="sp-card" style={{ padding: '2.5rem' }}>
                  <EmptyState
                    icon="📭"
                    title="No announcements match"
                    subtitle="No announcements found matching the current filters."
                  />
                </div>
              ) : (
                <div className="pp-notice-list">
                  {filteredAnnouncements.map((a) => {
                    const meta = PRIORITY_META[a.priority] || PRIORITY_META.NORMAL;
                    const Icon = meta.Icon;
                    return (
                      <div key={a.id} className={`pp-notice pp-notice--${meta.cls}`}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Icon size={18} color={meta.color} style={{ flexShrink: 0 }} />
                            <span className="pp-notice-title" style={{ fontSize: '1rem' }}>
                              {a.title}
                            </span>
                          </div>
                          <span className={`sp-badge sp-badge--${meta.badge}`}>
                            {meta.label}
                          </span>
                        </div>

                        <div
                          className="pp-notice-body"
                          style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}
                        >
                          {a.body}
                        </div>

                        <div className="pp-notice-footer" style={{ marginTop: '0.75rem' }}>
                          <span className="pp-notice-date">📅 Published on {fmtDate(a.publish_at)}</span>
                          {a.audience && (
                            <span className="sp-badge sp-badge--gray">
                              Audience: {a.audience}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: EVENTS ONLY */}
          {activeTab === 'EVENTS' && (
            <div>
              {filteredEvents.length === 0 ? (
                <div className="sp-card" style={{ padding: '2.5rem' }}>
                  <EmptyState
                    icon="🗓️"
                    title="No upcoming events"
                    subtitle="There are no upcoming calendar events scheduled at this time."
                  />
                </div>
              ) : (
                <div className="pp-event-grid">
                  {filteredEvents.map((ev) => renderEventCard(ev))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  function renderEventCard(ev) {
    const d = new Date(ev.event_date);
    const day = isNaN(d.getTime()) ? '—' : d.getDate();
    const mon = isNaN(d.getTime())
      ? '—'
      : d.toLocaleString('default', { month: 'short' });
    const weekday = isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('default', { weekday: 'short' });

    const currentRsvp = rsvpState[ev.id];
    const isSubmitting = rsvpSubmitting[ev.id];

    return (
      <div key={ev.id} className="pp-event-card">
        <div className="pp-event-header">
          <div className="pp-event-date-badge">
            <span className="pp-event-day">{day}</span>
            <span className="pp-event-mon">{mon}</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pp-event-title">{ev.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {weekday}, {fmtDate(ev.event_date)}
            </div>
          </div>
        </div>

        <div className="pp-event-meta">
          {ev.start_time && (
            <div className="pp-event-meta-item">
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <span>
                {ev.start_time}
                {ev.end_time ? ` – ${ev.end_time}` : ''}
              </span>
            </div>
          )}

          {ev.location && (
            <div className="pp-event-meta-item">
              <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
              <span>{ev.location}</span>
            </div>
          )}

          {ev.capacity && (
            <div className="pp-event-meta-item">
              <Users size={14} style={{ color: 'var(--text-muted)' }} />
              <span>Capacity: {ev.capacity} attendees</span>
            </div>
          )}
        </div>

        {ev.description && (
          <p
            style={{
              fontSize: '0.825rem',
              color: 'var(--text-muted)',
              marginTop: '0.65rem',
              lineHeight: 1.55,
            }}
          >
            {ev.description}
          </p>
        )}

        {/* RSVP Section */}
        <div className="pp-rsvp-section">
          <div className="pp-rsvp-label">
            <span>RSVP Status</span>
            {currentRsvp ? (
              <span
                style={{
                  color:
                    currentRsvp === 'ATTENDING'
                      ? '#16A34A'
                      : currentRsvp === 'MAYBE'
                      ? '#D97706'
                      : '#DC2626',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                }}
              >
                {currentRsvp === 'ATTENDING'
                  ? '✅ You are Going'
                  : currentRsvp === 'MAYBE'
                  ? '🤔 Maybe'
                  : '❌ Not Going'}
              </span>
            ) : ev.rsvp_required ? (
              <span className="sp-badge sp-badge--yellow" style={{ fontSize: '0.68rem' }}>
                RSVP Required
              </span>
            ) : null}
          </div>

          <div className="pp-rsvp-group">
            <button
              className={`pp-rsvp-btn pp-rsvp-btn--going ${
                currentRsvp === 'ATTENDING' ? 'pp-rsvp-btn--active' : ''
              }`}
              onClick={() => handleRsvp(ev.id, 'ATTENDING')}
              disabled={isSubmitting}
            >
              <Check size={13} />
              <span>Going</span>
            </button>

            <button
              className={`pp-rsvp-btn pp-rsvp-btn--maybe ${
                currentRsvp === 'MAYBE' ? 'pp-rsvp-btn--active' : ''
              }`}
              onClick={() => handleRsvp(ev.id, 'MAYBE')}
              disabled={isSubmitting}
            >
              <HelpCircle size={13} />
              <span>Maybe</span>
            </button>

            <button
              className={`pp-rsvp-btn pp-rsvp-btn--not_attending ${
                currentRsvp === 'NOT_ATTENDING' ? 'pp-rsvp-btn--active' : ''
              }`}
              onClick={() => handleRsvp(ev.id, 'NOT_ATTENDING')}
              disabled={isSubmitting}
            >
              <X size={13} />
              <span>Can't Go</span>
            </button>
          </div>

          {ev.rsvp_deadline && (
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginTop: '0.45rem',
              }}
            >
              RSVP by {fmtDate(ev.rsvp_deadline)}
            </div>
          )}
        </div>
      </div>
    );
  }
}
