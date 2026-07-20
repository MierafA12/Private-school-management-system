import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <header className="hero-section container">
      <div className="hero-grid">
        <div className="hero-content">
          <div className="hero-badge"></div>
          <h1 className="hero-title">
            The Complete Educational Platform 
          </h1>
          <p className="hero-desc">
            Streamline your entire academic journey from a single, secure cloud platform.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary">
              Register
            </Link>
            <a href="#overview" className="btn btn-secondary">
              Watch Overview
            </a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="laptop-mockup">
            <div className="css-dashboard">
               <div className="dash-sidebar"></div>
               <div className="dash-main">
                  <div className="dash-header"></div>
                  <div className="dash-cards">
                     <div className="d-card"><div className="wf-line short" style={{margin:'1rem'}}></div><div className="wf-line" style={{margin:'0 1rem'}}></div></div>
                     <div className="d-card"><div className="wf-line short" style={{margin:'1rem'}}></div><div className="wf-line" style={{margin:'0 1rem'}}></div></div>
                     <div className="d-card"><div className="wf-line short" style={{margin:'1rem'}}></div><div className="wf-line" style={{margin:'0 1rem'}}></div></div>
                  </div>
                  <div className="dash-chart"></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
