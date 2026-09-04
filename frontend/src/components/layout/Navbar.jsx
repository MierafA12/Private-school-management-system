import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';

const Navbar = ({ transparent = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMenu = () => setMobileOpen(false);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparent]);

  return (
    <nav className={`saas-navbar${transparent ? ' saas-navbar--transparent' : ''}${scrolled ? ' saas-navbar--scrolled' : ''}`}>
      <div className="container nav-container">
        <div className="nav-brand">
          <img src="/logo.svg" alt="Haile-Manas Academy" className="brand-logo" />
          <span className="brand-text">Haile-Manas Academy</span>
        </div>

        {/* Desktop Links */}
        <div className="nav-links">
          <a href="#product">Product</a>
          <a href="#solutions">Solutions</a>
          <a href="#resources">Resources</a>
          <a href="#pricing">Pricing</a>
        </div>

        {/* Desktop Actions */}
        <div className="nav-actions">
          <ThemeToggle />
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="mobile-nav-menu">
          <a href="#product" onClick={closeMenu}>Product</a>
          <a href="#solutions" onClick={closeMenu}>Solutions</a>
          <a href="#resources" onClick={closeMenu}>Resources</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <div className="mobile-nav-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
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
