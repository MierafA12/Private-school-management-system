import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, BookOpen, ClipboardList,
  FileText, CreditCard, Bell, MessageSquare, LogOut,
  Menu, X, GraduationCap, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './student.css';

const NAV_ITEMS = [
  { to: '/student/dashboard',  icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/student/attendance', icon: CalendarDays,    label: 'Attendance'    },
  { to: '/student/timetable',  icon: ClipboardList,   label: 'Timetable'     },
  { to: '/student/subjects',   icon: BookOpen,        label: 'Subjects'      },
  { to: '/student/exams',      icon: FileText,        label: 'Exams'         },
  { to: '/student/reportcard', icon: GraduationCap,   label: 'Report Card'   },
  { to: '/student/fees',       icon: CreditCard,      label: 'Fees'          },
  { to: '/student/messages',   icon: MessageSquare,   label: 'Messages'      },
  { to: '/student/notices',    icon: Bell,            label: 'Notices'       },
];

/** Derive initials from a full name string */
const initials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'S';

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.full_name || user?.email || 'Student';
  const avatarText  = initials(user?.full_name || '');

  return (
    <div className="sl-root">
      {sidebarOpen && (
        <div className="sl-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sl-sidebar ${sidebarOpen ? 'sl-sidebar--open' : ''}`}>
        <div className="sl-logo">
          <div className="sl-logo-icon"><GraduationCap size={22} color="white" /></div>
          <div>
            <div className="sl-logo-name">EduFlow</div>
            <div className="sl-logo-sub">Student Portal</div>
          </div>
          <button className="sl-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sl-student-card">
          <div className="sl-avatar">{avatarText}</div>
          <div className="sl-student-info">
            <div className="sl-student-name">{displayName}</div>
            <div className="sl-student-meta">{user?.role || 'Student'}</div>
          </div>
        </div>

        <nav className="sl-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sl-nav-item${isActive ? ' sl-nav-item--active' : ''}`
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
          <div className="sl-topbar-title">Student Portal</div>
          <div className="sl-topbar-right">
            <div className="sl-topbar-avatar">{avatarText}</div>
          </div>
        </header>

        <main className="sl-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
