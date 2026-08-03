import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarDays, TrendingUp,
  FileText, CreditCard, Bell, MessageSquare,
  User, LogOut, Menu, X, UserCheck, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/shared/NotificationBell';
import '../student/student.css';
import './parent.css';

const NAV_ITEMS = [
  { to: '/parent/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/parent/children',     icon: Users,           label: 'My Children'  },
  { to: '/parent/attendance',   icon: CalendarDays,    label: 'Attendance'   },
  { to: '/parent/grades',       icon: TrendingUp,      label: 'Grades'       },
  { to: '/parent/report-cards', icon: FileText,        label: 'Report Cards' },
  { to: '/parent/fees',         icon: CreditCard,      label: 'Fees'         },
  { to: '/parent/notices',      icon: Bell,            label: 'Notices'      },
  { to: '/parent/messages',     icon: MessageSquare,   label: 'Messages'     },
  { to: '/parent/profile',      icon: User,            label: 'Profile'      },
];

const initials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'P';

export default function ParentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.full_name || user?.email || 'Parent';
  const avatarText  = initials(user?.full_name || '');

  return (
    <div className="sl-root">
      {sidebarOpen && (
        <div className="sl-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sl-sidebar ${sidebarOpen ? 'sl-sidebar--open' : ''}`}>
        <div className="sl-logo">
          <div className="sl-logo-icon pp-logo-icon">
            <UserCheck size={22} color="white" />
          </div>
          <div>
            <div className="sl-logo-name">EduFlow</div>
            <div className="sl-logo-sub">Parent Portal</div>
          </div>
          <button className="sl-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sl-student-card pp-user-card">
          <div className="sl-avatar pp-avatar">{avatarText}</div>
          <div className="sl-student-info">
            <div className="sl-student-name">{displayName}</div>
            <div className="sl-student-meta pp-role-badge">{user?.role || 'Parent'}</div>
          </div>
        </div>

        <nav className="sl-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sl-nav-item${isActive ? ' sl-nav-item--active pp-nav-active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className="sl-nav-chevron" />
            </NavLink>
          ))}
        </nav>

        <button className="sl-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="sl-main">
        <header className="sl-topbar">
          <button className="sl-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="sl-topbar-title">Parent Portal</div>
          <div className="sl-topbar-right">
            <NotificationBell portalRoot="/parent" />
            <div className="sl-topbar-avatar pp-avatar">{avatarText}</div>
          </div>
        </header>

        <main className="sl-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
