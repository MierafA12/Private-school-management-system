import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="footer-section bg-white">
    <div className="container footer-grid">
      {/* Brand */}
      <div>
        <div className="footer-brand">
          <img src="/logo.svg" alt="Haile-Manas Academy" className="brand-logo" />
          <span className="brand-text">Haile-Manas</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, maxWidth: '220px', marginTop: '0.5rem' }}>
          A leading private academy in Debre Berhan committed to academic excellence and character formation.
        </p>
      </div>

      {/* School */}
      <div className="footer-links">
        <h4>School</h4>
        <Link to="/about">About Us</Link>
        <Link to="/events">Events</Link>
        <Link to="/jobs">Careers</Link>
        <Link to="/contact">Contact Us</Link>
      </div>

      {/* Portals */}
      <div className="footer-links">
        <h4>Portals</h4>
        <Link to="/login">Principal</Link>
        <Link to="/login">Registrar</Link>
        <Link to="/login">Teacher</Link>
        <Link to="/login">Parent</Link>
        <Link to="/login">Student</Link>
      </div>

      {/* Pricing */}
      <div className="footer-links">
        <h4>Pricing</h4>
        <a href="/#pricing">Scholar Plan</a>
        <a href="/#pricing">Academy Plan</a>
        <a href="/#pricing">Campus Plan</a>
        <a href="/#pricing">Scholastic Terms</a>
      </div>

      {/* Legal */}
      <div className="footer-links">
        <h4>Legal</h4>
        <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
        <a href="#" onClick={e => e.preventDefault()}>Terms of Use</a>
        <a href="#" onClick={e => e.preventDefault()}>Cookie Policy</a>
      </div>
    </div>

    <div
      className="container footer-bottom"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}
    >
      <p>&copy; {new Date().getFullYear()} Haile-Manas Academy. All rights reserved.</p>
      <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
        Est. 2006 &nbsp;·&nbsp; Debre Berhan, Amhara Region &nbsp;·&nbsp; Ethiopian Scholastic Calendar
      </p>
    </div>
  </footer>
);

export default Footer;
