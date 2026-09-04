import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Menu, X } from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className="saas-navbar">
      <div className="container nav-container">
        <div className="nav-brand">
          <ShieldCheck size={24} className="brand-icon" />
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
          <Link to="/login" className="btn btn-primary">Sign In</Link>
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
