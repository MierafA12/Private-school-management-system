import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, CheckSquare,
  FileText, User, LogOut, Menu, X, GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/shared/NotificationBell';
import '../../styles/portals/layout.css';
import '../../styles/portals/teacher.css';

const NAV = [
  { to: '/teacher/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/teacher/classes',    icon: Users,           label: 'My Classes' },
  { to: '/teacher/timetable',  icon: Calendar,        label: 'Timetable'  },
  { to: '/teacher/attendance', icon: CheckSquare,     label: 'Attendance' },
  { to: '/teacher/grades',     icon: FileText,        label: 'Grades'     },
];

const initials = (n = '') => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'TC';

export default function TeacherLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const name   = user?.full_name || user?.email || 'Teacher';
  const avatar = initials(name);
  const page   = NAV.find(n => location.pathname.startsWith(n.to))?.label
    || (location.pathname.includes('profile') ? 'My Profile' : 'Dashboard');

  return (
    <div className="sl-root">
      {open && <div className="sl-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sl-sidebar ${open ? 'sl-sidebar--open' : ''}`}>
        <div className="sl-logo">
          <div className="sl-logo-icon"><GraduationCap size={18} color="white" /></div>
          <div><div className="sl-logo-name">EduFlow</div><div className="sl-logo-sub">Teacher Portal</div></div>
          <button className="sl-close-btn" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <nav className="sl-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `sl-nav-item${isActive ? ' sl-nav-item--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={16} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sl-sidebar-footer">
          <NavLink to="/teacher/profile" className="sl-user-row" onClick={() => setOpen(false)}
            style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <div className="sl-avatar">{avatar}</div>
            <div className="sl-user-details">
              <span className="sl-user-name">{name}</span>
              <span className="sl-user-role">{user?.role || 'Teacher'}</span>
            </div>
            <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </NavLink>
          <button className="sl-logout-full" onClick={() => { logout(); navigate('/login', { replace: true }); }}>
            <LogOut size={14} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="sl-main">
        <header className="sl-topbar">
          <div className="sl-topbar-left">
            <button className="sl-menu-btn" onClick={() => setOpen(true)}><Menu size={20} /></button>
            <span className="sl-page-title">{page}</span>
          </div>
          <div className="sl-topbar-right">
            <NotificationBell portalRoot="/teacher" />
            <button className="sl-topbar-avatar-btn" onClick={() => navigate('/teacher/profile')} title="My Profile">
              {avatar}
            </button>
          </div>
        </header>
        <main className="sl-content"><Outlet /></main>
      </div>
    </div>
  );
}
