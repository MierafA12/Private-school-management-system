import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Layers, FileText, PlusSquare,
  CreditCard, BarChart2, LogOut, Menu, X, ChevronRight, Calculator,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/shared/NotificationBell';
import '../student/student.css';
import './accountant.css';

const NAV = [
  { to: '/accountant/dashboard',        icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/accountant/fee-structures',   icon: Layers,          label: 'Fee Structures'   },
  { to: '/accountant/invoices/generate',icon: PlusSquare,      label: 'Generate Invoices'},
  { to: '/accountant/invoices',         icon: FileText,        label: 'Invoices'         },
  { to: '/accountant/payments/record',  icon: CreditCard,      label: 'Record Payment'   },
  { to: '/accountant/payments',         icon: CreditCard,      label: 'Payments'         },
  { to: '/accountant/reports',          icon: BarChart2,       label: 'Reports'          },
];

const initials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'AC';

export default function AccountantLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const name   = user?.full_name || user?.email || 'Accountant';
  const avatar = initials(user?.full_name || '');

  return (
    <div className="sl-root">
      {open && <div className="sl-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sl-sidebar ${open ? 'sl-sidebar--open' : ''}`}>
        <div className="sl-logo">
          <div className="sl-logo-icon ap-logo-icon"><Calculator size={22} color="white" /></div>
          <div>
            <div className="sl-logo-name">EduFlow</div>
            <div className="sl-logo-sub">Finance Portal</div>
          </div>
          <button className="sl-close-btn" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>

        <div className="sl-student-card ap-user-card">
          <div className="sl-avatar ap-avatar">{avatar}</div>
          <div className="sl-student-info">
            <div className="sl-student-name">{name}</div>
            <div className="sl-student-meta ap-role-badge">{user?.role || 'Accountant'}</div>
          </div>
        </div>

        <nav className="sl-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sl-nav-item${isActive ? ' sl-nav-item--active ap-nav-active' : ''}`
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={18} /><span>{label}</span>
              <ChevronRight size={14} className="sl-nav-chevron" />
            </NavLink>
          ))}
        </nav>

        <button className="sl-logout" onClick={handleLogout}>
          <LogOut size={18} /><span>Sign Out</span>
        </button>
      </aside>

      <div className="sl-main">
        <header className="sl-topbar">
          <button className="sl-menu-btn" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <div className="sl-topbar-title">Finance Portal</div>
          <div className="sl-topbar-right">
            <NotificationBell portalRoot="/accountant" />
            <div className="sl-topbar-avatar ap-avatar">{avatar}</div>
          </div>
        </header>
        <main className="sl-content"><Outlet /></main>
      </div>
    </div>
  );
}
