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

// Parent portal
import ParentLayout      from './pages/parent/ParentLayout';
import ParentDashboard   from './pages/parent/ParentDashboard';
import ParentChildren    from './pages/parent/ParentChildren';
import ParentAttendance  from './pages/parent/ParentAttendance';
import ParentGrades      from './pages/parent/ParentGrades';
import ParentReportCards from './pages/parent/ParentReportCards';
import ParentFees        from './pages/parent/ParentFees';
import ParentNotices     from './pages/parent/ParentNotices';
import ParentMessages    from './pages/parent/ParentMessages';
import ParentProfile     from './pages/parent/ParentProfile';

// Principal portal
import PrincipalLayout        from './pages/principal/PrincipalLayout';
import PrincipalDashboard     from './pages/principal/PrincipalDashboard';
import PrincipalAnnouncements from './pages/principal/PrincipalAnnouncements';

// Accountant portal
import AccountantLayout    from './pages/accountant/AccountantLayout';
import AccountantDashboard from './pages/accountant/AccountantDashboard';
import FeeStructures       from './pages/accountant/FeeStructures';
import InvoiceList         from './pages/accountant/InvoiceList';
import InvoiceDetail       from './pages/accountant/InvoiceDetail';
import GenerateInvoices    from './pages/accountant/GenerateInvoices';
import PaymentList         from './pages/accountant/PaymentList';
import FinancialReports    from './pages/accountant/FinancialReports';

import './index.css';
import { LoadingSpinner } from './components/shared/PageState';
import { NotificationProvider } from './context/NotificationContext';
import NotificationCenter from './components/shared/NotificationCenter';

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
    <NotificationProvider>
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

        {/* ── Parent portal ── */}
        <Route
          path="/parent"
          element={
            <PrivateRoute allowedRoles={['Parent']}>
              <ParentLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<ParentDashboard />} />
          <Route path="children"     element={<ParentChildren />} />
          <Route path="attendance"   element={<ParentAttendance />} />
          <Route path="grades"       element={<ParentGrades />} />
          <Route path="report-cards" element={<ParentReportCards />} />
          <Route path="fees"         element={<ParentFees />} />
          <Route path="notices"      element={<ParentNotices />} />
          <Route path="messages"     element={<ParentMessages />} />
          <Route path="profile"      element={<ParentProfile />} />
        </Route>

        {/* ── Principal portal ── */}
        <Route
          path="/principal"
          element={
            <PrivateRoute allowedRoles={['Principal', 'Super Admin']}>
              <PrincipalLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"     element={<PrincipalDashboard />} />
          <Route path="announcements" element={<PrincipalAnnouncements />} />
        </Route>

        {/* ── Accountant portal ── */}
        <Route
          path="/accountant"
          element={
            <PrivateRoute allowedRoles={['Accountant','Super Admin']}>
              <AccountantLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"         element={<AccountantDashboard />} />
          <Route path="fee-structures"    element={<FeeStructures />} />
          <Route path="invoices"          element={<InvoiceList />} />
          <Route path="invoices/generate" element={<GenerateInvoices />} />
          <Route path="invoices/:id"      element={<InvoiceDetail />} />
          <Route path="payments"          element={<PaymentList />} />
          <Route path="payments/record"   element={<PaymentList />} />
          <Route path="reports"           element={<FinancialReports />} />
        </Route>

        {/* ── Notification center (role-agnostic, nested inside each portal) ── */}
        <Route path="/student/notifications"    element={<PrivateRoute allowedRoles={['Student']}><StudentLayout /></PrivateRoute>}>
          <Route index element={<NotificationCenter />} />
        </Route>
        <Route path="/parent/notifications"     element={<PrivateRoute allowedRoles={['Parent']}><ParentLayout /></PrivateRoute>}>
          <Route index element={<NotificationCenter />} />
        </Route>
        <Route path="/registrar/notifications"  element={<PrivateRoute allowedRoles={REGISTRAR_ROLES}><RegistrarLayout /></PrivateRoute>}>
          <Route index element={<NotificationCenter />} />
        </Route>
        <Route path="/accountant/notifications" element={<PrivateRoute allowedRoles={['Accountant','Super Admin']}><AccountantLayout /></PrivateRoute>}>
          <Route index element={<NotificationCenter />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </Router>
    </NotificationProvider>
  );
}
