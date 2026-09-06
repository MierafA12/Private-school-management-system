import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { roleHomePath } from './utils/roleHomePath';
import { NotificationProvider } from './context/NotificationContext';
import NotificationCenter from './components/shared/NotificationCenter';
import { LoadingSpinner } from './components/shared/PageState';

// ── Shared ────────────────────────────────────────────────────────────────────
import MyProfile from './pages/shared/MyProfile';

// ── Public ────────────────────────────────────────────────────────────────────
import Landing from './pages/landing/Landing';
import About   from './pages/landing/About';
import Events  from './pages/landing/Events';
import Jobs    from './pages/landing/Jobs';
import Contact from './pages/landing/Contact';
import Login   from './pages/auth/Login';

// ── Student portal ────────────────────────────────────────────────────────────
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

// ── Registrar portal ──────────────────────────────────────────────────────────
import RegistrarLayout    from './pages/registrar/RegistrarLayout';
import RegistrarDashboard from './pages/registrar/RegistrarDashboard';
import RegisterPerson     from './pages/registrar/RegisterPerson';
import UserList           from './pages/registrar/UserList';
import Enrollments        from './pages/registrar/Enrollments';

// ── Principal portal ──────────────────────────────────────────────────────────
import PrincipalLayout        from './pages/principal/PrincipalLayout';
import PrincipalDashboard     from './pages/principal/PrincipalDashboard';
import SchoolProfile          from './pages/principal/SchoolProfile';
import AcademicYears          from './pages/principal/AcademicYears';
import Classes                from './pages/principal/Classes';
import Subjects               from './pages/principal/Subjects';
import GradingScales          from './pages/principal/GradingScales';
import PrincipalFeeStructures from './pages/principal/FeeStructures';
import ClassAdvisors          from './pages/principal/ClassAdvisors';
import Timetable              from './pages/principal/Timetable';
import PrincipalAnnouncements from './pages/principal/PrincipalAnnouncements';
import ReportCards            from './pages/principal/ReportCards';

// ── Parent portal ─────────────────────────────────────────────────────────────
import ParentLayout      from './pages/parent/ParentLayout';
import ParentDashboard   from './pages/parent/ParentDashboard';
import ParentChildren    from './pages/parent/ParentChildren';
import ParentAttendance  from './pages/parent/ParentAttendance';
import ParentGrades      from './pages/parent/ParentGrades';
import ParentReportCards from './pages/parent/ParentReportCards';
import ParentFees        from './pages/parent/ParentFees';
import ParentNotices     from './pages/parent/ParentNotices';
import ParentMessages    from './pages/parent/ParentMessages';

// ── Teacher portal ────────────────────────────────────────────────────────────
import TeacherLayout     from './pages/teacher/TeacherLayout';
import TeacherDashboard  from './pages/teacher/TeacherDashboard';
import TeacherClasses    from './pages/teacher/TeacherClasses';
import TeacherTimetable  from './pages/teacher/TeacherTimetable';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherGrades     from './pages/teacher/TeacherGrades';

// ── Accountant portal ─────────────────────────────────────────────────────────
import AccountantLayout    from './pages/accountant/AccountantLayout';
import AccountantDashboard from './pages/accountant/AccountantDashboard';
import FeeStructures       from './pages/accountant/FeeStructures';
import InvoiceList         from './pages/accountant/InvoiceList';
import InvoiceDetail       from './pages/accountant/InvoiceDetail';
import GenerateInvoices    from './pages/accountant/GenerateInvoices';
import PaymentList         from './pages/accountant/PaymentList';
import FinancialReports    from './pages/accountant/FinancialReports';

import './styles/index.css';

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user)   return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to={roleHomePath(user.role)} replace />;
  return children;
}

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

          {/* ── Public ── */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/about"   element={<About />} />
          <Route path="/events"  element={<Events />} />
          <Route path="/jobs"    element={<Jobs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login"   element={<PublicRoute><Login /></PublicRoute>} />

          {/* ── Student portal ── */}
          <Route path="/student"
            element={<PrivateRoute allowedRoles={['Student']}><StudentLayout /></PrivateRoute>}
          >
            <Route index            element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<StudentDashboard />} />
            <Route path="attendance"    element={<StudentAttendance />} />
            <Route path="timetable"     element={<StudentTimetable />} />
            <Route path="subjects"      element={<StudentSubjects />} />
            <Route path="exams"         element={<StudentExams />} />
            <Route path="reportcard"    element={<StudentReportCard />} />
            <Route path="fees"          element={<StudentFees />} />
            <Route path="messages"      element={<StudentMessages />} />
            <Route path="notices"       element={<StudentNotices />} />
            <Route path="profile"       element={<MyProfile />} />
            <Route path="notifications" element={<NotificationCenter />} />
          </Route>

          {/* ── Registrar portal ── */}
          <Route path="/registrar"
            element={<PrivateRoute allowedRoles={['Registrar']}><RegistrarLayout /></PrivateRoute>}
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<RegistrarDashboard />} />
            <Route path="register"      element={<RegisterPerson />} />
            <Route path="users"         element={<UserList />} />
            <Route path="enrollments"   element={<Enrollments />} />
            <Route path="profile"       element={<MyProfile />} />
            <Route path="notifications" element={<NotificationCenter />} />
          </Route>

          {/* ── Principal portal ── */}
          <Route path="/principal"
            element={<PrivateRoute allowedRoles={['Principal','Super Admin']}><PrincipalLayout /></PrivateRoute>}
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"      element={<PrincipalDashboard />} />
            <Route path="school-profile" element={<SchoolProfile />} />
            <Route path="academic-years" element={<AcademicYears />} />
            <Route path="classes"        element={<Classes />} />
            <Route path="subjects"       element={<Subjects />} />
            <Route path="grading-scales" element={<GradingScales />} />
            <Route path="fee-structures" element={<PrincipalFeeStructures />} />
            <Route path="class-advisors" element={<ClassAdvisors />} />
            <Route path="timetable"      element={<Timetable />} />
            <Route path="report-cards"   element={<ReportCards />} />
            <Route path="announcements"  element={<PrincipalAnnouncements />} />
            <Route path="profile"        element={<MyProfile />} />
            <Route path="notifications"  element={<NotificationCenter />} />
          </Route>

          {/* ── Parent portal ── */}
          <Route path="/parent"
            element={<PrivateRoute allowedRoles={['Parent']}><ParentLayout /></PrivateRoute>}
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<ParentDashboard />} />
            <Route path="children"      element={<ParentChildren />} />
            <Route path="attendance"    element={<ParentAttendance />} />
            <Route path="grades"        element={<ParentGrades />} />
            <Route path="report-cards"  element={<ParentReportCards />} />
            <Route path="fees"          element={<ParentFees />} />
            <Route path="notices"       element={<ParentNotices />} />
            <Route path="messages"      element={<ParentMessages />} />
            <Route path="profile"       element={<MyProfile />} />
            <Route path="notifications" element={<NotificationCenter />} />
          </Route>

          {/* ── Teacher portal ── */}
          <Route path="/teacher"
            element={<PrivateRoute allowedRoles={['Teacher','Super Admin']}><TeacherLayout /></PrivateRoute>}
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<TeacherDashboard />} />
            <Route path="classes"       element={<TeacherClasses />} />
            <Route path="timetable"     element={<TeacherTimetable />} />
            <Route path="attendance"    element={<TeacherAttendance />} />
            <Route path="grades"        element={<TeacherGrades />} />
            <Route path="profile"       element={<MyProfile />} />
            <Route path="notifications" element={<NotificationCenter />} />
          </Route>

          {/* ── Accountant portal ── */}
          <Route path="/accountant"
            element={<PrivateRoute allowedRoles={['Accountant','Super Admin']}><AccountantLayout /></PrivateRoute>}
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"         element={<AccountantDashboard />} />
            <Route path="fee-structures"    element={<FeeStructures />} />
            <Route path="invoices"          element={<InvoiceList />} />
            <Route path="invoices/generate" element={<GenerateInvoices />} />
            <Route path="invoices/:id"      element={<InvoiceDetail />} />
            <Route path="payments"          element={<PaymentList />} />
            <Route path="payments/record"   element={<Navigate to="/accountant/payments?action=record" replace />} />
            <Route path="reports"           element={<FinancialReports />} />
            <Route path="profile"           element={<MyProfile />} />
            <Route path="notifications"     element={<NotificationCenter />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}
