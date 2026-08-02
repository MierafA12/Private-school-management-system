/**
 * Maps a user role to their portal home route.
 * Kept in a separate file so AuthContext.jsx only exports
 * React components/hooks — required for Vite Fast Refresh.
 */
export const roleHomePath = (role) => {
  if (role === 'Student')     return '/student/dashboard';
  if (role === 'Registrar')   return '/registrar/dashboard';
  if (role === 'Principal')   return '/registrar/dashboard';
  if (role === 'Super Admin') return '/registrar/dashboard';
  if (role === 'Teacher')     return '/student/dashboard';
  if (role === 'Parent')      return '/parent/dashboard';
  if (role === 'Accountant')  return '/accountant/dashboard';
  return '/login';
};
