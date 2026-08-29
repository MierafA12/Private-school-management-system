import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, clearTokens, getAccessToken } from '../api';

const AuthContext = createContext(null);

// ─── Demo user — shown when backend is unreachable ────────────────────────────
const DEMO_USER = {
  id:        'demo-registrar-001',
  email:     'registrar@school.com',
  phone:     null,
  role:      'Registrar',
  full_name: 'School Registrar',
  isDemo:    true,
};

// Check if we should run in demo mode
// Demo mode activates when: no real token AND VITE_DEMO_MODE=true
const isDemoMode = () => import.meta.env.VITE_DEMO_MODE === 'true';

// Map role → home path
export const roleHomePath = (role) => {
  if (role === 'Student')     return '/student/dashboard';
  if (role === 'Registrar')   return '/registrar/dashboard';
  if (role === 'Principal')   return '/principal/dashboard';
  if (role === 'Super Admin') return '/principal/dashboard';
  if (role === 'Teacher')     return '/student/dashboard';
  if (role === 'Parent')      return '/student/dashboard';
  return '/login';
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    // In demo mode, start logged in as registrar
    if (isDemoMode()) return DEMO_USER;
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      // Demo mode — skip token check
      setLoading(false);
      return;
    }
    if (!getAccessToken()) {
      clearTokens();
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    if (isDemoMode()) {
      // Demo login — just set demo user based on email
      const roleMap = {
        'registrar@school.com': { ...DEMO_USER, role: 'Registrar', full_name: 'School Registrar' },
        'admin@school.com':     { ...DEMO_USER, id: 'demo-admin-001', role: 'Super Admin', email: 'admin@school.com', full_name: 'Super Admin' },
      };
      const u = roleMap[credentials.email] || DEMO_USER;
      setUser(u);
      return { user: u, access_token: 'demo-token', refresh_token: 'demo-refresh' };
    }
    const data = await authApi.login(credentials);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    if (!isDemoMode()) await authApi.logout();
    else clearTokens();
    setUser(isDemoMode() ? null : null);
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
