import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, clearTokens, getAccessToken } from '../api';

const AuthContext = createContext(null);

// Map role → home path
export const roleHomePath = (role) => {
  if (role === 'Student')   return '/student/dashboard';
  if (role === 'Registrar') return '/registrar/dashboard';
  if (role === 'Principal') return '/registrar/dashboard';
  if (role === 'Super Admin') return '/registrar/dashboard';
  if (role === 'Teacher')   return '/student/dashboard'; // teacher portal later
  if (role === 'Parent')    return '/student/dashboard'; // parent portal later
  return '/login';
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) {
      clearTokens();
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
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
