import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, clearTokens, getAccessToken } from '../api';

// Re-export so old imports still work
export { roleHomePath } from '../utils/roleHomePath';

const AuthContext = createContext(null);

// ─── Demo mode ────────────────────────────────────────────────────────────────
const DEMO_USER = {
  id: 'demo-registrar-001', email: 'registrar@school.com',
  phone: null, role: 'Registrar', full_name: 'School Registrar', isDemo: true,
};
const isDemoMode = () => import.meta.env.VITE_DEMO_MODE === 'true';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (isDemoMode()) return DEMO_USER;
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) { setLoading(false); return; }
    if (!getAccessToken()) { clearTokens(); setUser(null); }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    if (isDemoMode()) {
      const map = {
        'registrar@school.com': { ...DEMO_USER },
        'admin@school.com':     { ...DEMO_USER, id: 'demo-admin-001', role: 'Super Admin', email: 'admin@school.com', full_name: 'Super Admin' },
        'principal@school.com': { ...DEMO_USER, id: 'demo-principal-001', role: 'Principal', email: 'principal@school.com', full_name: 'School Principal' },
      };
      const u = map[credentials.email] || DEMO_USER;
      setUser(u);
      return { user: u, access_token: 'demo-token', refresh_token: 'demo-refresh' };
    }
    const data = await authApi.login(credentials);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    if (!isDemoMode()) {
      authApi.logout().catch(() => {});
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
