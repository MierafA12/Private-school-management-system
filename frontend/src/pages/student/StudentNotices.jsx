import { useEffect, useState } from 'react';
import { Bell, Calendar, AlertTriangle, Info } from 'lucide-react';
import { studentApi } from '../../api';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../../components/shared/PageState';

const TYPE_MAP = {
  ALL:      { cls: 'info',   Icon: Info,          color: '#2563EB', badge: 'blue'  },
  STUDENTS: { cls: 'info',   Icon: Info,          color: '#2563EB', badge: 'blue'  },
  CLASS:    { cls: 'info',   Icon: Info,          color: '#2563EB', badge: 'blue'  },
};
const PRIORITY_MAP = {
  URGENT: { cls: 'urgent', Icon: AlertTriangle, color: 'var(--primary)', badge: 'red'   },
  HIGH:   { cls: 'urgent', Icon: AlertTriangle, color: '#D97706',        badge: 'yellow'},
  NORMAL: { cls: 'info',   Icon: Info,          color: '#2563EB',        badge: 'blue'  },
  LOW:    { cls: 'event',  Icon: Calendar,      color: '#16A34A',        badge: 'green' },
};

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default function StudentNotices() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState('All');

  const FILTERS = ['All', 'Urgent', 'High', 'Normal'];

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await studentApi.getAnnouncements({ limit: 50 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading announcements…" />;
  if (error)   return <ErrorBanner message={error} onRetry={load} />;

  const filtered = filter === 'All'
    ? items
    : items.filter(n => n.priority === filter.toUpperCase());

  return (
    <div>
      <div className="sp-page-header">
        <h1 className="sp-page-title">Notices & Announcements</h1>
        <p className="sp-page-sub">School-wide announcements and important reminders</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '999px',
              border: '1px solid var(--border-color)',
              background: filter === f ? 'var(--primary)' : 'white',
              color: filter === f ? 'white' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            {f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          {filtered.length} {filtered.length === 1 ? 'notice' : 'notices'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="sp-card"><EmptyState icon="📢" title="No announcements" subtitle="There are no announcements to show right now." /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(n => {
            const { cls, Icon, color, badge } = PRIORITY_MAP[n.priority] || PRIORITY_MAP.NORMAL;
            return (
              <div key={n.id} className={`notice-item notice-item--${cls}`}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: cls === 'urgent' ? '#FEF2F2' : cls === 'event' ? '#F0FDF4' : '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      <span className="notice-title">{n.title}</span>
                      <span className={`sp-badge sp-badge--${badge}`}>{n.priority}</span>
                      {n.audience === 'CLASS' && <span className="sp-badge sp-badge--gray">Your Class</span>}
                    </div>
                    <div className="notice-body">{n.body}</div>
                    <div className="notice-footer">
                      <span className="notice-date">📅 {fmtDate(n.publish_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
