import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <header className="hero-section container">
      <div className="hero-content hero-content--centered">
        <h1 className="hero-title">
          The Complete Educational Platform 
        </h1>
        <p className="hero-desc">
          Streamline your entire academic journey from a single, secure cloud platform.
        </p>
        <div className="hero-cta">
          <Link to="/login" className="btn btn-primary">
            Sign In to Portal
          </Link>
          <a href="#solutions" className="btn btn-secondary-outline">
            Explore Features
          </a>
        </div>
      </div>
    </header>
  );
};

export default Hero;
