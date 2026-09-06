import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import '../../styles/pages/Landing.css';
import '../../styles/pages/PublicPages.css';

export default function Jobs() {
  return (
    <div className="saas-wrapper">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pub-hero">
        <div className="container pub-hero-inner">
          <h1 className="pub-hero-title">Join Our Team</h1>
          <p className="pub-hero-desc">
            At Haile-Manas Academy we believe great teaching transforms lives. When positions
            open, we look for dedicated educators and professional staff who share our values.
          </p>
          <div className="pub-hero-actions">
            <a href="mailto:jobs@haile-manas.edu.et" className="btn btn-primary">Send Your CV</a>
            <Link to="/about" className="btn btn-secondary-outline">Learn About Us</Link>
          </div>
        </div>
      </section>

      {/* ── Why work here ── */}
      <section className="pub-section pub-section--alt">
        <div className="container">
          <div className="section-header text-center">
            <h2>Why Work at Haile-Manas?</h2>
            <p>Join a school that invests in its people as much as its students.</p>
          </div>
          <div className="pub-grid-4">
            {[
              { icon: '🎓', title: 'Professional Growth',  desc: 'Annual CPD budget, internal training, and conference attendance.' },
              { icon: '❤️', title: 'Supportive Culture',   desc: 'Collaborative staff teams and a leadership that listens.' },
              { icon: '💰', title: 'Competitive Pay',      desc: 'Above-market salaries reviewed annually with performance bonuses.' },
              { icon: '🏥', title: 'Health Benefits',      desc: 'Medical insurance for you and eligible dependants.' },
            ].map(({ icon, title, desc }) => (
              <div className="pub-value-card" key={title}>
                <div className="pub-value-emoji">{icon}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── No open positions ── */}
      <section className="pub-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Current Openings</h2>
          </div>
          <div className="pub-empty-state">
            <div className="pub-empty-icon">📋</div>
            <h3>No open positions at this time</h3>
            <p>
              We do not have any active vacancies right now. Send us your CV and we will
              keep it on file for when suitable opportunities arise.
            </p>
            <a href="mailto:jobs@haile-manas.edu.et" className="btn btn-primary">
              Send Your CV
            </a>
          </div>
        </div>
      </section>

      {/* ── How to apply ── */}
      <section className="pub-section pub-section--alt">
        <div className="container" style={{ maxWidth: '720px' }}>
          <div className="section-header text-center">
            <h2>How to Apply When Positions Open</h2>
          </div>
          <div className="pub-how-to-apply">
            {[
              { step: '01', title: 'Prepare your documents', desc: 'Updated CV, copies of your certificates, and a one-page cover letter addressed to the Principal.' },
              { step: '02', title: 'Send your application',  desc: 'Email all documents to jobs@haile-manas.edu.et with the job title in the subject line.' },
              { step: '03', title: 'Shortlisting',           desc: 'Shortlisted candidates will be contacted within 2 weeks of the application deadline.' },
              { step: '04', title: 'Interview & Demo',       desc: 'Teaching candidates will be invited for a panel interview and a 20-minute demonstration lesson.' },
            ].map(({ step, title, desc }) => (
              <div className="pub-apply-step" key={step}>
                <div className="pub-apply-step-num">{step}</div>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
