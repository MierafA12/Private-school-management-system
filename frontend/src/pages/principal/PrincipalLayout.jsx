import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, School, CalendarDays, Layers, BookOpen,
  Star, DollarSign, UserCheck, Clock, Megaphone, FileText, User, LogOut,
  Menu, X, GraduationCap, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/shared/NotificationBell';
import '../../styles/portals/layout.css';
import './principal.css';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { to: '/principal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    title: 'Academic Structure',
    items: [
      { to: '/principal/academic-years', icon: CalendarDays, label: 'Academic Years' },
      { to: '/principal/classes',        icon: Layers,       label: 'Classes & Sections' },
      { to: '/principal/subjects',       icon: BookOpen,     label: 'Curriculum Subjects' },
      { to: '/principal/timetable',      icon: Clock,        label: 'Weekly Timetable' },
    ],
  },
  {
    title: 'Assessment & Grading',
    items: [
      { to: '/principal/class-advisors', icon: UserCheck,    label: 'Class Advisors' },
      { to: '/principal/grading-scales', icon: Star,         label: 'Grading Scales' },
      { to: '/principal/report-cards',   icon: FileText,     label: 'Report Cards' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/principal/school-profile', icon: School,       label: 'School Profile' },
      { to: '/principal/fee-structures', icon: DollarSign,   label: 'Fee Structures' },
      { to: '/principal/announcements',  icon: Megaphone,    label: 'Announcements' },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

const initials = (n = '') =>
  n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'PR';

export default function PrincipalLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const name   = user?.full_name || user?.email || 'Principal';
  const avatar = initials(name);

  // Find active item and group
  const activeItem = ALL_NAV_ITEMS.find(n => location.pathname.startsWith(n.to));
  const activeGroup = NAV_GROUPS.find(g => g.items.some(i => location.pathname.startsWith(i.to)));
  const pageTitle  = activeItem?.label || 'Dashboard';

  return (
    <div className="sl-root">
      {open && <div className="sl-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sl-sidebar ${open ? 'sl-sidebar--open' : ''}`}>
        <div className="sl-logo">
          <div className="sl-logo-icon">
            <GraduationCap size={18} color="white" />
          </div>
          <div>
            <div className="sl-logo-name">EduFlow</div>
            <div className="sl-logo-sub">Principal Portal</div>
          </div>
          <button className="sl-close-btn" onClick={() => setOpen(false)} aria-label="Close Sidebar">
            <X size={18} />
          </button>
        </div>

        <nav className="sl-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} style={{ marginBottom: '0.5rem' }}>
              <div className="sl-nav-group-title">{group.title}</div>
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `sl-nav-item${isActive ? ' sl-nav-item--active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sl-sidebar-footer">
          <NavLink
            to="/principal/profile"
            className="sl-user-row"
            onClick={() => setOpen(false)}
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            <div className="sl-avatar">{avatar}</div>
            <div className="sl-user-details">
              <span className="sl-user-name">{name}</span>
              <span className="sl-user-role">{user?.role || 'Principal'}</span>
            </div>
            <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </NavLink>
          <button
            className="sl-logout-full"
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="sl-main">
        <header className="sl-topbar">
          <div className="sl-topbar-left">
            <button className="sl-menu-btn" onClick={() => setOpen(true)} aria-label="Open Menu">
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {activeGroup && activeGroup.title !== 'Overview' && (
                <>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {activeGroup.title}
                  </span>
                  <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                </>
              )}
              <span className="sl-page-title">{pageTitle}</span>
            </div>
          </div>
          <div className="sl-topbar-right">
            <NotificationBell portalRoot="/principal" />
            <button
              className="sl-topbar-avatar-btn"
              onClick={() => navigate('/principal/profile')}
              title="My Profile"
            >
              {avatar}
            </button>
          </div>
        </header>
        <main className="sl-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
