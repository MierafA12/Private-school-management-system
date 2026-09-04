import React from 'react';


const Footer = () => {
  return (
    <footer className="footer-section bg-white">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src="/logo.svg" alt="Haile-Manas Academy" className="brand-logo" />
          <span className="brand-text">Haile-Manas Academy</span>
        </div>
        <div className="footer-links">
          <h4>Product</h4>
          <a href="#">Features</a>
          <a href="#">Pricing</a>
          <a href="#">Changelog</a>
        </div>
        <div className="footer-links">
          <h4>Solutions</h4>
          <a href="#">Grades 9-12</a>
          <a href="#">Private Academies</a>
          <a href="#">College Prep</a>
        </div>
        <div className="footer-links">
          <h4>Resources</h4>
          <a href="#">Blog</a>
          <a href="#">Help Center</a>
          <a href="#">Guides</a>
        </div>
        <div className="footer-links">
          <h4>Company</h4>
          <a href="#">About</a>
          <a href="#">Careers</a>
          <a href="#">Contact</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>&copy; {new Date().getFullYear()} Haile-Manas Academy. All rights reserved. Secure Portal.</p>
      </div>
    </footer>
  );
};

export default Footer;
