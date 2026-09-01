/**
 * Maps a user role to the default home route for that portal.
 */
export const roleHomePath = (role) => {
  if (role === 'Student')     return '/student/dashboard';
  if (role === 'Registrar')   return '/registrar/dashboard';
  if (role === 'Principal')   return '/principal/dashboard';
  if (role === 'Super Admin') return '/principal/dashboard';
  if (role === 'Teacher')     return '/teacher/dashboard';
  if (role === 'Parent')      return '/parent/dashboard';
  if (role === 'Accountant')  return '/accountant/dashboard';
  return '/login';
};
