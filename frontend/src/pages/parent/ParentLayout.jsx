import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Award,
  CreditCard, Bell, MessageSquare, User, LogOut,
  Menu, X, HeartHandshake,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/shared/NotificationBell';
import "../../styles/portals/student.css";

const NAV = [
  { to: '/parent/dashboard',   icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/parent/children',    icon: Users,           label: 'My Children'   },
  { to: '/parent/attendance',  icon: Calendar,        label: 'Attendance'    },
  { to: '/parent/grades',      icon: Award,           label: 'Academics'     },
  { to: '/parent/fees',        icon: CreditCard,      label: 'Fee Payments'  },
  { to: '/parent/messages',    icon: MessageSquare,   label: 'Messages'      },
  { to: '/parent/notices',     icon: Bell,            label: 'Announcements' },
  { to: '/parent/profile',     icon: User,            label: 'My Profile'    },
];

const initials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'PR';

export default function ParentLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.full_name || user?.email || 'Parent';
  const avatarText  = initials(displayName);

  const currentNav = NAV.find(n => location.pathname.startsWith(n.to));
  const currentPage = currentNav ? currentNav.label : 'Dashboard';

  return (
    <div className="sl-root">
      {open && <div className="sl-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sl-sidebar ${open ? 'sl-sidebar--open' : ''}`}>
        <div className="sl-logo">
          <div className="sl-logo-icon"><HeartHandshake size={18} color="white" /></div>
          <div>
            <div className="sl-logo-name">EduFlow</div>
            <div className="sl-logo-sub">Parent Portal</div>
          </div>
          <button className="sl-close-btn" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <nav className="sl-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sl-nav-item${isActive ? ' sl-nav-item--active' : ''}`
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sl-sidebar-footer">
          <div className="sl-user-row">
            <div className="sl-avatar">{avatarText}</div>
            <div className="sl-user-details">
              <span className="sl-user-name">{displayName}</span>
              <span className="sl-user-role">Parent</span>
            </div>
            <button className="sl-logout-btn" onClick={handleLogout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="sl-main">
        <header className="sl-topbar">
          <div className="sl-topbar-left">
            <button className="sl-menu-btn" onClick={() => setOpen(true)}><Menu size={20} /></button>
            <div className="sl-breadcrumb">
              <span>Parent</span>
              <span>/</span>
              <span className="sl-breadcrumb-current">{currentPage}</span>
            </div>
          </div>
          <div className="sl-topbar-right">
            <NotificationBell portalRoot="/parent" />
            <div className="sl-topbar-avatar" title={displayName}>{avatarText}</div>
          </div>
        </header>

        <main className="sl-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
