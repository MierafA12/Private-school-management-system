import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, UserPlus, Users, ClipboardList, LogOut,
  Menu, X, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import NotificationBell from '../../components/shared/NotificationBell';
import ThemeToggle from '../../components/shared/ThemeToggle';
import EthiopianDateBadge from '../../components/shared/EthiopianDateBadge';
import '../../styles/portals/layout.css';
import '../../styles/portals/registrar.css';

const NAV = [
  { to: '/registrar/dashboard',   icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/registrar/register',    icon: UserPlus,        label: 'Register User' },
  { to: '/registrar/users',       icon: Users,           label: 'All Users'     },
  { to: '/registrar/enrollments', icon: ClipboardList,   label: 'Enrollments'   },
];

const initials = (n = '') => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'RG';

export default function RegistrarLayout() {
  const [open, setOpen] = useState(false);
  const { collapsed, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const name   = user?.full_name || user?.email || 'Registrar';
  const avatar = initials(name);
  const firstName = name.split(' ')[0] || 'Registrar';
  const page   = NAV.find(n => location.pathname.startsWith(n.to))?.label
    || (location.pathname.includes('profile') ? 'My Profile' : 'Dashboard');

  return (
    <div className="sl-root">
      {open && <div className="sl-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sl-sidebar ${open ? 'sl-sidebar--open' : ''} ${collapsed ? 'sl-sidebar--collapsed' : ''}`}>
        <div className="sl-logo">
          <Link to="/registrar/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }} title="Registrar Dashboard">
            <img src="/logo.svg" alt="Haile-Manas Academy" style={{ width: 28, height: 28, flexShrink: 0 }} />
            <div className="sl-logo-text">
              <div className="sl-logo-name" style={{ fontSize: '0.85rem', fontWeight: 800 }}>Haile-Manas</div>
              <div className="sl-logo-sub" style={{ fontSize: '0.68rem', letterSpacing: '0.02em' }}>Registrar Portal</div>
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
              end={to === '/registrar/dashboard'}
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
              to="/registrar/profile"
              className="sl-user-link"
              onClick={() => setOpen(false)}
              title={`${name} (${user?.role || 'Registrar'})`}
            >
              <div className="sl-avatar">{avatar}</div>
              <div className="sl-user-details">
                <span className="sl-user-name">{name}</span>
                <span className="sl-user-role">{user?.role || 'Registrar'}</span>
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
              <span className="sl-portal-pill sl-portal-pill--registrar">Registrar</span>
              <span className="sl-topbar-divider">/</span>
              <h1 className="sl-page-title">{page}</h1>
            </div>
          </div>
          <div className="sl-topbar-right">
            <EthiopianDateBadge />
            <ThemeToggle />
            <NotificationBell portalRoot="/registrar" />
            <button
              className="sl-topbar-user-btn"
              onClick={() => navigate('/registrar/profile')}
              title={`Profile: ${name} (${user?.role || 'Registrar'})`}
              aria-label="My Profile"
            >
              <div className="sl-topbar-avatar">{avatar}</div>
              <div className="sl-topbar-user-meta">
                <span className="sl-topbar-user-name">{firstName}</span>
                <span className="sl-topbar-user-role">Registrar</span>
              </div>
            </button>
          </div>
        </header>
        <main className="sl-content"><Outlet /></main>
      </div>
    </div>
  );
}

