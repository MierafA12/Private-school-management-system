import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import "../../styles/components/notifications.css";

const TYPE_ICON = {
  fee_reminder:          '💳',
  payment_confirmation:  '✅',
  attendance_alert:      '📅',
  results_published:     '📊',
  report_card_published: '📋',
  announcement:          '📢',
  new_message:           '💬',
  system:                '⚙️',
  general:               '🔔',
};
const TYPE_CLASS = {
  fee_reminder:         'fee',
  payment_confirmation: 'fee',
  attendance_alert:     'attendance',
  new_message:          'message',
  results_published:    'results',
  report_card_published:'results',
  announcement:         'general',
  system:               'general',
  general:              'general',
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function NotificationBell({ portalRoot = '' }) {
  const { unreadCount, notifications, fetchNotifications, markRead, markAllRead } = useNotifications();
  const [open, setOpen]       = useState(false);
  const [loaded, setLoaded]   = useState(false);
  const wrapRef               = useRef(null);
  const navigate              = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    setOpen(o => !o);
    if (!loaded) { await fetchNotifications({ limit: 10 }); setLoaded(true); }
  };

  const handleItem = async (notif) => {
    if (!notif.is_read) await markRead(notif.id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button className="notif-bell-btn" onClick={handleOpen} title="Notifications" aria-label="Notifications">
        <Bell size={20} />
      </button>
      {unreadCount > 0 && (
        <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all-btn" onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          <div className="notif-dropdown-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon">🔔</div>
                You're all caught up!
              </div>
            ) : (
              notifications.slice(0, 10).map(n => (
                <div
                  key={n.id}
                  className={`notif-item${!n.is_read ? ' notif-item--unread' : ''}`}
                  onClick={() => handleItem(n)}
                >
                  <div className={`notif-item-icon notif-item-icon--${TYPE_CLASS[n.type] || 'general'}`}>
                    {TYPE_ICON[n.type] || '🔔'}
                  </div>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-text">{n.body}</div>
                    <div className="notif-item-time">{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && <div className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>

          <div className="notif-dropdown-footer">
            <Link
              to={`${portalRoot}/notifications`}
              className="notif-see-all"
              onClick={() => setOpen(false)}
            >
              See all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
