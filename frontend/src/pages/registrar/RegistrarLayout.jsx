import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserPlus, Users, LogOut,
  Menu, X, GraduationCap, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../student/student.css';   // reuse shared layout CSS
import './registrar.css';

const NAV = [
  { to: '/registrar/dashboard', icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/registrar/register',  icon: UserPlus,        label: 'Register User'  },
  { to: '/registrar/users',     icon: Users,           label: 'All Users'      },
];

const initials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'R';

export default function RegistrarLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };
  const name     = user?.full_name || user?.email || 'Registrar';
  const av       = initials(user?.full_name || '');

  return (
    <div className="sl-root">
      {open && <div className="sl-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sl-sidebar ${open ? 'sl-sidebar--open' : ''}`}>
        <div className="sl-logo">
          <div className="sl-logo-icon"><GraduationCap size={22} color="white" /></div>
          <div>
            <div className="sl-logo-name">EduFlow</div>
            <div className="sl-logo-sub">Registrar Portal</div>
          </div>
          <button className="sl-close-btn" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>

        <div className="sl-student-card">
          <div className="sl-avatar">{av}</div>
          <div className="sl-student-info">
            <div className="sl-student-name">{name}</div>
            <div className="sl-student-meta">{user?.role || 'Registrar'}</div>
          </div>
        </div>

        <nav className="sl-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `sl-nav-item${isActive ? ' sl-nav-item--active' : ''}`}
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
          <div className="sl-topbar-title">Registrar Portal</div>
          <div className="sl-topbar-right">
            <div className="sl-topbar-avatar">{av}</div>
          </div>
        </header>
        <main className="sl-content"><Outlet /></main>
      </div>
    </div>
  );
}
