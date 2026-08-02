import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { LoadingSpinner } from './PageState';
import './notifications.css';

const TYPE_ICON = {
  fee_reminder: '💳', payment_confirmation: '✅', attendance_alert: '📅',
  results_published: '📊', report_card_published: '📋',
  announcement: '📢', new_message: '💬', system: '⚙️', general: '🔔',
};
const TYPE_CLASS = {
  fee_reminder: 'fee', payment_confirmation: 'fee', attendance_alert: 'attendance',
  new_message: 'message', results_published: 'results', report_card_published: 'results',
  announcement: 'general', system: 'general', general: 'general',
};

const FILTERS = [
  { key: '',                     label: 'All'        },
  { key: 'fee_reminder',         label: '💳 Fees'    },
  { key: 'payment_confirmation', label: '✅ Payments' },
  { key: 'attendance_alert',     label: '📅 Attendance' },
  { key: 'new_message',          label: '💬 Messages' },
  { key: 'announcement',         label: '📢 Notices' },
];

const timeAgo = (iso) => {
  const d    = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m    = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  if (h < 168) return `${Math.floor(h / 24)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function NotificationCenter() {
  const { fetchNotifications, markRead, markAllRead, unreadCount } = useNotifications();
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(0);
  const [filter,  setFilter]  = useState('');
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchNotifications({ limit: LIMIT, offset: page * LIMIT, type: filter || undefined });
    if (data) { setItems(data.notifications || []); setTotal(data.total || 0); }
    setLoading(false);
  }, [fetchNotifications, page, filter]);

  useEffect(() => { load(); }, [load]);

  const handleItem = async (n) => {
    if (!n.is_read) { await markRead(n.id); setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x)); }
    if (n.link) navigate(n.link);
  };

  const handleFilter = (key) => { setFilter(key); setPage(0); };

  const handleMarkAll = async () => { await markAllRead(); setItems(prev => prev.map(n => ({ ...n, is_read: true }))); };

  return (
    <div>
      <div className="sp-page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="sp-page-title">Notifications</h1>
          <p className="sp-page-sub">Your activity feed across all modules</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:'.82rem', fontWeight:600, color:'var(--primary)' }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Type filters */}
      <div className="notif-center-filters">
        {FILTERS.map(f => (
          <button key={f.key}
            className={`notif-filter-btn${filter === f.key ? ' notif-filter-btn--active' : ''}`}
            onClick={() => handleFilter(f.key)}
          >{f.label}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner message="Loading notifications…" /> : (
        <>
          {items.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'.75rem' }}>🔔</div>
              <div style={{ fontWeight:600 }}>No notifications{filter ? ' of this type' : ''}</div>
            </div>
          ) : (
            <div className="notif-center-list">
              {items.map(n => (
                <div
                  key={n.id}
                  className={`notif-center-item${!n.is_read ? ' notif-center-item--unread' : ''}`}
                  onClick={() => handleItem(n)}
                >
                  <div className={`notif-item-icon notif-item-icon--${TYPE_CLASS[n.type] || 'general'}`}
                    style={{ width:40, height:40, fontSize:'1.1rem', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}>
                    {TYPE_ICON[n.type] || '🔔'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'.5rem' }}>
                      <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize:'.875rem', color:'var(--text-main)' }}>{n.title}</div>
                      <div style={{ fontSize:'.7rem', color:'var(--text-muted)', whiteSpace:'nowrap', flexShrink:0 }}>{timeAgo(n.created_at)}</div>
                    </div>
                    <div style={{ fontSize:'.8rem', color:'var(--text-muted)', marginTop:'.2rem', lineHeight:1.5 }}>{n.body}</div>
                    {n.ref_type && (
                      <span className="sp-badge sp-badge--gray" style={{ fontSize:'.65rem', marginTop:'.4rem', display:'inline-block' }}>
                        {n.ref_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  {!n.is_read && <div className="notif-unread-dot" style={{ marginTop:4 }} />}
                </div>
              ))}
            </div>
          )}

          {total > LIMIT && (
            <div style={{ display:'flex', justifyContent:'center', gap:'.75rem', marginTop:'1.25rem' }}>
              <button
                style={{ padding:'.5rem 1.25rem', border:'1px solid var(--border-color)', borderRadius:8, background:'white', cursor:'pointer', fontSize:'.85rem' }}
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >← Prev</button>
              <span style={{ alignSelf:'center', fontSize:'.8rem', color:'var(--text-muted)' }}>
                Page {page + 1} of {Math.ceil(total / LIMIT)}
              </span>
              <button
                style={{ padding:'.5rem 1.25rem', border:'1px solid var(--border-color)', borderRadius:8, background:'white', cursor:'pointer', fontSize:'.85rem' }}
                disabled={(page + 1) * LIMIT >= total}
                onClick={() => setPage(p => p + 1)}
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
