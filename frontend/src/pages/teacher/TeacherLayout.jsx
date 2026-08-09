import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, CheckSquare, FileText, MessageSquare, Menu, X, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import '../../styles/portals/teacher.css';

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/teacher/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/teacher/classes',    icon: Users,           label: 'My Classes' },
    { to: '/teacher/timetable',  icon: Calendar,        label: 'Timetable' },
    { to: '/teacher/attendance', icon: CheckSquare,     label: 'Attendance' },
    { to: '/teacher/grades',     icon: FileText,        label: 'Grades' },
    { to: '/teacher/notifications', icon: Bell,         label: 'Notices' },
  ];

  return (
    <div className="sl-layout">
      {/* Mobile Header */}
      <div className="sl-mobile-header">
        <div className="sl-mobile-brand">
          <div className="sl-logo-icon tp-logo-icon"><Users size={20} /></div>
          <span>Teacher Portal</span>
        </div>
        <button className="sl-mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`sl-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sl-sidebar-header">
          <div className="sl-logo-icon tp-logo-icon"><Users size={20} /></div>
          <span className="sl-logo-text">Teacher Portal</span>
          <button className="sl-close-menu" onClick={() => setMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="sl-user-profile tp-user-card">
          <div className="sl-avatar tp-avatar">
            {user?.first_name?.charAt(0) || 'T'}
          </div>
          <div className="sl-user-info">
            <div className="sl-user-name">{user?.first_name} {user?.last_name}</div>
            <div className="sl-user-role tp-role-badge">Teacher</div>
          </div>
        </div>

        <ul className="sl-nav-list">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => `sl-nav-link ${isActive ? 'tp-nav-active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon size={20} />
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sl-sidebar-footer">
          <button onClick={handleLogout} className="sl-nav-link" style={{ width: '100%', border: 'none', background: 'none' }}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="sl-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Content Area */}
      <main className="sl-main-content">
        <div className="sl-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
