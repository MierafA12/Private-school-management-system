import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Calendar, Clock, MapPin, Tag } from 'lucide-react';
import '../../styles/pages/Landing.css';
import '../../styles/pages/PublicPages.css';

/* Add events here when they are available */
const EVENTS = [];

const CATEGORY_COLORS = {
  Academic: { bg: 'rgba(59,130,246,0.1)',  color: '#3B82F6' },
  Ceremony: { bg: 'rgba(168,85,247,0.1)', color: '#A855F7' },
  Sports:   { bg: 'rgba(34,197,94,0.1)',  color: '#22C55E' },
  Cultural: { bg: 'rgba(249,115,22,0.1)', color: '#F97316' },
  Holiday:  { bg: 'rgba(234,179,8,0.1)',  color: '#EAB308' },
};

export default function Events() {
  return (
    <div className="saas-wrapper">
      <Navbar />

      {/* ── Page header ── */}
      <section className="pub-hero">
        <div className="container pub-hero-inner">
          <h1 className="pub-hero-title">School Events</h1>
          <p className="pub-hero-desc">
            Stay up to date with examinations, ceremonies, sports days, and cultural events
            at Haile-Manas Academy.
          </p>
          <div className="pub-hero-actions">
            <Link to="/login" className="btn btn-primary">Parent Portal</Link>
            <Link to="/contact" className="btn btn-secondary-outline">Contact School</Link>
          </div>
        </div>
      </section>

      {/* ── Events listing ── */}
      <section className="pub-section">
        <div className="container">
          {EVENTS.length === 0 ? (
            /* Empty state — clean, no extra sections */
            <div className="pub-empty-state">
              <div className="pub-empty-icon">📅</div>
              <h3>No events scheduled yet</h3>
              <p>
                There are no events listed at the moment. Sign in to the parent portal
                to receive school announcements and event notifications directly.
              </p>
              <Link to="/login" className="btn btn-primary">Sign In to Portal</Link>
            </div>
          ) : (
            <div className="pub-events-grid">
              {EVENTS.map(({ id, category, title, date, time, location, desc }) => {
                const catStyle = CATEGORY_COLORS[category] || {};
                return (
                  <div className="pub-event-card" key={id}>
                    {category && (
                      <span
                        className="pub-event-cat"
                        style={{ background: catStyle.bg, color: catStyle.color, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Tag size={11} />
                        {category}
                      </span>
                    )}
                    <h3 className="pub-event-title">{title}</h3>
                    <p className="pub-event-desc">{desc}</p>
                    <div className="pub-event-meta">
                      <span><Calendar size={13} />{date}</span>
                      {time && time !== '—' && <span><Clock size={13} />{time}</span>}
                      {location && location !== '—' && <span><MapPin size={13} />{location}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
