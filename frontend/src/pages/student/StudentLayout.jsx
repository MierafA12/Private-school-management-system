import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, BookOpen, ClipboardList,
  FileText, CreditCard, Bell, MessageSquare, LogOut,
  Menu, X, GraduationCap, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import NotificationBell from '../../components/shared/NotificationBell';
import ThemeToggle from '../../components/shared/ThemeToggle';
import EthiopianDateBadge from '../../components/shared/EthiopianDateBadge';
import '../../styles/portals/layout.css';
import '../../styles/portals/student.css';

const NAV = [
  { to: '/student/dashboard',  icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/student/attendance', icon: CalendarDays,    label: 'Attendance'  },
  { to: '/student/timetable',  icon: ClipboardList,   label: 'Timetable'   },
  { to: '/student/subjects',   icon: BookOpen,        label: 'Subjects'    },
  { to: '/student/exams',      icon: FileText,        label: 'Exams'       },
  { to: '/student/reportcard', icon: GraduationCap,   label: 'Report Card' },
  { to: '/student/fees',       icon: CreditCard,      label: 'Fees'        },
  { to: '/student/messages',   icon: MessageSquare,   label: 'Messages'    },
  { to: '/student/notices',    icon: Bell,            label: 'Notices'     },
];

const initials = (n = '') => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'ST';

export default function StudentLayout() {
  const [open, setOpen] = useState(false);
  const { collapsed, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const name   = user?.full_name || user?.email || 'Student';
  const avatar = initials(name);
  const firstName = name.split(' ')[0] || 'Student';
  const page   = NAV.find(n => location.pathname.startsWith(n.to))?.label
    || (location.pathname.includes('profile') ? 'My Profile' : 'Dashboard');

  return (
    <div className="sl-root">
      {open && <div className="sl-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sl-sidebar ${open ? 'sl-sidebar--open' : ''} ${collapsed ? 'sl-sidebar--collapsed' : ''}`}>
        <div className="sl-logo">
          <Link to="/student/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }} title="Student Dashboard">
            <img src="/logo.svg" alt="Haile-Manas Academy" style={{ width: 28, height: 28, flexShrink: 0 }} />
            <div className="sl-logo-text">
              <div className="sl-logo-name" style={{ fontSize: '0.85rem', fontWeight: 800 }}>Haile-Manas</div>
              <div className="sl-logo-sub" style={{ fontSize: '0.68rem', letterSpacing: '0.02em' }}>Student Portal</div>
            </div>
          </Link>
          <button
            type="button"
            className="sl-collapse-btn"
            onClick={toggleSidebar}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={16} />}
          </button>
          <button className="sl-close-btn" onClick={() => setOpen(false)} aria-label="Close Sidebar"><X size={18} /></button>
        </div>

        <nav className="sl-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/student/dashboard'}
              className={({ isActive }) => `sl-nav-item${isActive ? ' sl-nav-item--active' : ''}`}
              onClick={() => setOpen(false)}
              title={label}
            >
              <Icon size={16} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sl-sidebar-footer">
          <div className="sl-user-row">
            <NavLink
              to="/student/profile"
              className="sl-user-link"
              onClick={() => setOpen(false)}
              title={`${name} (${user?.role || 'Student'})`}
            >
              <div className="sl-avatar">{avatar}</div>
              <div className="sl-user-details">
                <span className="sl-user-name">{name}</span>
                <span className="sl-user-role">{user?.role || 'Student'}</span>
              </div>
            </NavLink>
            <button
              className="sl-logout-btn"
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className={`sl-main ${collapsed ? 'sl-main--collapsed' : ''}`}>
        <header className="sl-topbar">
          <div className="sl-topbar-left">
            <button className="sl-menu-btn" onClick={() => setOpen(true)} aria-label="Open Menu"><Menu size={20} /></button>
            <div className="sl-topbar-title-wrap">
              <span className="sl-portal-pill sl-portal-pill--student">Student</span>
              <span className="sl-topbar-divider">/</span>
              <h1 className="sl-page-title">{page}</h1>
            </div>
          </div>
          <div className="sl-topbar-right">
            <EthiopianDateBadge />
            <ThemeToggle />
            <NotificationBell portalRoot="/student" />
            <button
              className="sl-topbar-user-btn"
              onClick={() => navigate('/student/profile')}
              title={`Profile: ${name} (${user?.role || 'Student'})`}
              aria-label="My Profile"
            >
              <div className="sl-topbar-avatar">{avatar}</div>
              <div className="sl-topbar-user-meta">
                <span className="sl-topbar-user-name">{firstName}</span>
                <span className="sl-topbar-user-role">Student</span>
              </div>
            </button>
          </div>
        </header>
        <main className="sl-content"><Outlet /></main>
      </div>
    </div>
  );
}

