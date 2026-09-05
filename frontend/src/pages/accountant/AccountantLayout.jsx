import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Layers, FileText, PlusSquare,
  CreditCard, BarChart2, User, LogOut, Menu, X, Calculator,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import NotificationBell from '../../components/shared/NotificationBell';
import ThemeToggle from '../../components/shared/ThemeToggle';
import EthiopianDateBadge from '../../components/shared/EthiopianDateBadge';
import '../../styles/portals/layout.css';
import '../../styles/portals/accountant.css';

const NAV = [
  { to: '/accountant/dashboard',         icon: LayoutDashboard, label: 'Dashboard'         },
  { to: '/accountant/fee-structures',    icon: Layers,          label: 'Fee Structures'    },
  { to: '/accountant/invoices/generate', icon: PlusSquare,      label: 'Generate Invoices' },
  { to: '/accountant/invoices',          icon: FileText,        label: 'Invoices'          },
  { to: '/accountant/payments',          icon: CreditCard,      label: 'Payments'          },
  { to: '/accountant/reports',           icon: BarChart2,       label: 'Reports'           },
];

const initials = (n = '') => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AC';

export default function AccountantLayout() {
  const [open, setOpen] = useState(false);
  const { collapsed, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isItemActive = (to) => {
    if (to === '/accountant/invoices') {
      return (
        location.pathname === '/accountant/invoices' ||
        (location.pathname.startsWith('/accountant/invoices/') &&
          !location.pathname.startsWith('/accountant/invoices/generate'))
      );
    }
    if (to === '/accountant/invoices/generate') {
      return location.pathname === '/accountant/invoices/generate';
    }
    if (to === '/accountant/dashboard') {
      return location.pathname === '/accountant/dashboard' || location.pathname === '/accountant';
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const name   = user?.full_name || user?.email || 'Accountant';
  const avatar = initials(name);
  const page   = NAV.find(n => isItemActive(n.to))?.label
    || (location.pathname.includes('profile') ? 'My Profile' : 'Dashboard');

  return (
    <div className="sl-root">
      {open && <div className="sl-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sl-sidebar ${open ? 'sl-sidebar--open' : ''} ${collapsed ? 'sl-sidebar--collapsed' : ''}`}>
        <div className="sl-logo">
          <div className="sl-logo-icon" style={{ background: 'transparent', padding: 0 }}>
            <img src="/logo.svg" alt="Haile-Manas Academy" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
          <div className="sl-logo-text">
            <div className="sl-logo-name" style={{ fontSize: '0.85rem', fontWeight: 800 }}>Haile-Manas</div>
            <div className="sl-logo-sub" style={{ fontSize: '0.65rem' }}>Finance Portal</div>
          </div>
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
            <NavLink key={to} to={to}
              className={() => `sl-nav-item${isItemActive(to) ? ' sl-nav-item--active' : ''}`}
              onClick={() => setOpen(false)}
              title={label}
            >
              <Icon size={16} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sl-sidebar-footer">
          <NavLink to="/accountant/profile" className="sl-user-row" onClick={() => setOpen(false)}
            style={{ textDecoration: 'none', cursor: 'pointer' }}
            title={`${name} (${user?.role || 'Accountant'})`}
          >
            <div className="sl-avatar">{avatar}</div>
            <div className="sl-user-details">
              <span className="sl-user-name">{name}</span>
              <span className="sl-user-role">{user?.role || 'Accountant'}</span>
            </div>
            <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </NavLink>
          <button className="sl-logout-full" onClick={() => { logout(); navigate('/login', { replace: true }); }} title="Sign Out">
            <LogOut size={14} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className={`sl-main ${collapsed ? 'sl-main--collapsed' : ''}`}>
        <header className="sl-topbar">
          <div className="sl-topbar-left">
            <button className="sl-menu-btn" onClick={() => setOpen(true)} aria-label="Open Menu"><Menu size={20} /></button>
            <span className="sl-page-title">{page}</span>
          </div>
          <div className="sl-topbar-right">
            <EthiopianDateBadge />
            <ThemeToggle />
            <NotificationBell portalRoot="/accountant" />
            <button className="sl-topbar-avatar-btn" onClick={() => navigate('/accountant/profile')} title="My Profile">
              {avatar}
            </button>
          </div>
        </header>
        <main className="sl-content"><Outlet /></main>
      </div>
    </div>
  );
}

