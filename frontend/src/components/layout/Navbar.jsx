import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';

const NAV_LINKS = [
  { label: 'About Us', to: '/about'   },
  { label: 'Events',   to: '/events'  },
  { label: 'Jobs',     to: '/jobs'    },
  { label: 'Contact',  to: '/contact' },
  { label: 'Pricing',  pricing: true  },
];

const Navbar = ({ transparent = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const closeMenu = () => setMobileOpen(false);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparent]);

  /* Pricing click: if already on /landing just scroll, otherwise navigate there first */
  const handlePricing = (e) => {
    e.preventDefault();
    closeMenu();
    if (location.pathname === '/landing') {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/landing');
      /* After navigation the landing page mounts; scroll after a short paint delay */
      setTimeout(() => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    }
  };

  const renderLink = ({ label, to, pricing }) => {
    if (pricing) {
      return (
        <a key={label} href="#pricing" onClick={handlePricing}>{label}</a>
      );
    }
    return <Link key={label} to={to}>{label}</Link>;
  };

  return (
    <nav
      className={`saas-navbar${transparent ? ' saas-navbar--transparent' : ''}${
        scrolled ? ' saas-navbar--scrolled' : ''
      }`}
    >
      <div className="container nav-container">
        {/* Brand */}
        <Link to="/landing" className="nav-brand" style={{ textDecoration: 'none' }}>
          <img src="/logo.svg" alt="Haile-Manas Academy" className="brand-logo" />
          <span className="brand-text">Haile-Manas</span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          {NAV_LINKS.map(renderLink)}
        </div>

        {/* Desktop actions */}
        <div className="nav-actions">
          <ThemeToggle />
          <Link
            to="/login"
            className="btn btn-primary"
            style={{ padding: '0.45rem 1.1rem', fontSize: '0.875rem' }}
          >
            Sign In
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-nav-menu">
          {NAV_LINKS.map(({ label, to, pricing }) => {
            if (pricing) {
              return (
                <a key={label} href="#pricing" onClick={handlePricing}>{label}</a>
              );
            }
            return (
              <Link key={label} to={to} onClick={closeMenu}>{label}</Link>
            );
          })}
          <div
            className="mobile-nav-actions"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <Link to="/login" className="btn btn-primary" onClick={closeMenu} style={{ flex: 1 }}>
              Sign In to Portal
            </Link>
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
