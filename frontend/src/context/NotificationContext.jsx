import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { notificationApi } from '../api';

const NotificationContext = createContext(null);

const POLL_INTERVAL = 30000; // 30 seconds

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount]   = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]           = useState(false);
  const intervalRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { count } = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (_) {}
  }, [user]);

  const fetchNotifications = useCallback(async ({ limit = 20, offset = 0 } = {}) => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await notificationApi.list({ limit, offset });
      setNotifications(data.notifications || []);
      return data;
    } catch (_) { return { notifications: [], total: 0 }; }
    finally { setLoading(false); }
  }, [user]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (_) {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (_) {}
  }, []);

  // Start polling when user is logged in
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      clearInterval(intervalRef.current);
      return;
    }
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{
      unreadCount, notifications, loading,
      fetchUnreadCount, fetchNotifications,
      markRead, markAllRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};
