import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="saas-navbar">
      <div className="container nav-container">
        <div className="nav-brand">
          <ShieldCheck size={24} className="brand-icon" />
          <span className="brand-text">Haile-Manas Academy</span>
        </div>
        <div className="nav-links">
          <a href="#product">Product</a>
          <a href="#solutions">Solutions</a>
          <a href="#resources">Resources</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="login-link">Log in</Link>
          <Link to="/register" className="btn btn-primary">Register</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
