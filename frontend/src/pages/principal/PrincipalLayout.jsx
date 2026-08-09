import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  Menu,
  X,
  LogOut,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import "../../styles/portals/principal.css";

export default function PrincipalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="portal-layout">
      {/* Mobile Header */}
      <div className="portal-mobile-header">
        <div className="portal-brand">Haile-Manas Academy</div>
        <button className="portal-menu-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="portal-sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="portal-sidebar-header">
          <div className="portal-brand">Haile-Manas</div>
          <button className="portal-close-btn" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>

        <div className="portal-user-info">
          <div className="portal-user-avatar">
            {user?.full_name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="portal-user-name">{user?.full_name || 'Principal'}</div>
            <div className="portal-user-role">Principal</div>
          </div>
        </div>

        <nav className="portal-nav">
          <NavLink to="/principal/dashboard" onClick={closeSidebar} className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/principal/announcements" onClick={closeSidebar} className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <Megaphone size={20} /> Announcements
          </NavLink>
          {/* Add more links here like reports or approvals in the future */}
        </nav>

        <div className="portal-sidebar-footer">
          <button onClick={handleLogout} className="portal-logout-btn">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="portal-main">
        <Outlet />
      </main>
    </div>
  );
}
