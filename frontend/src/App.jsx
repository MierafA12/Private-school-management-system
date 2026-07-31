import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, roleHomePath } from './context/AuthContext';

// Public
import Landing  from './pages/Landing';
import Login    from './pages/Login';

// Student portal
import StudentLayout     from './pages/student/StudentLayout';
import StudentDashboard  from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentTimetable  from './pages/student/StudentTimetable';
import StudentSubjects   from './pages/student/StudentSubjects';
import StudentExams      from './pages/student/StudentExams';
import StudentReportCard from './pages/student/StudentReportCard';
import StudentFees       from './pages/student/StudentFees';
import StudentMessages   from './pages/student/StudentMessages';
import StudentNotices    from './pages/student/StudentNotices';

// Registrar portal
import RegistrarLayout    from './pages/registrar/RegistrarLayout';
import RegistrarDashboard from './pages/registrar/RegistrarDashboard';
import RegisterPerson     from './pages/registrar/RegisterPerson';
import UserList           from './pages/registrar/UserList';

import './index.css';
import { LoadingSpinner } from './components/shared/PageState';

const REGISTRAR_ROLES = ['Registrar', 'Principal', 'Super Admin'];

/** Redirects unauthenticated users to /login */
function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // redirect to that role's home instead of a 403
    return <Navigate to={roleHomePath(user.role)} replace />;
  }
  return children;
}

/** Redirects already-logged-in users to their portal */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return user ? <Navigate to={roleHomePath(user.role)} replace /> : children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/landing" replace />} />

        {/* Public */}
        <Route path="/landing"  element={<Landing />} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />

        {/* ── Student portal ── */}
        <Route
          path="/student"
          element={
            <PrivateRoute allowedRoles={['Student']}>
              <StudentLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"  element={<StudentDashboard />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="timetable"  element={<StudentTimetable />} />
          <Route path="subjects"   element={<StudentSubjects />} />
          <Route path="exams"      element={<StudentExams />} />
          <Route path="reportcard" element={<StudentReportCard />} />
          <Route path="fees"       element={<StudentFees />} />
          <Route path="messages"   element={<StudentMessages />} />
          <Route path="notices"    element={<StudentNotices />} />
        </Route>

        {/* ── Registrar portal ── */}
        <Route
          path="/registrar"
          element={
            <PrivateRoute allowedRoles={REGISTRAR_ROLES}>
              <RegistrarLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<RegistrarDashboard />} />
          <Route path="register"  element={<RegisterPerson />} />
          <Route path="users"     element={<UserList />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </Router>
  );
}
