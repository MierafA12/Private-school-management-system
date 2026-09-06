import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import '../../styles/pages/Landing.css';
import '../../styles/pages/PublicPages.css';

const CONTACT_INFO = [
  {
    icon: <MapPin size={22} strokeWidth={1.5} />,
    label: 'Address',
    lines: ['Debre Berhan, Amhara Region', 'Ethiopia'],
  },
  {
    icon: <Phone size={22} strokeWidth={1.5} />,
    label: 'Phone',
    lines: ['+251 11 661 XXXX', '+251 91 234 5678'],
  },
  {
    icon: <Mail size={22} strokeWidth={1.5} />,
    label: 'Email',
    lines: ['info@haile-manas.edu.et', 'admissions@haile-manas.edu.et'],
  },
  {
    icon: <Clock size={22} strokeWidth={1.5} />,
    label: 'Office Hours',
    lines: ['Mon – Fri: 7:30 AM – 5:00 PM', 'Saturday: 8:00 AM – 12:00 PM'],
  },
];

const DEPARTMENTS = [
  { value: 'general',    label: 'General Enquiry' },
  { value: 'admissions', label: 'Admissions' },
  { value: 'finance',    label: 'Finance / Fees' },
  { value: 'academics',  label: 'Academics' },
  { value: 'hr',         label: 'Human Resources / Jobs' },
  { value: 'technical',  label: 'Technical / Portal Support' },
];

export default function Contact() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', department: '', subject: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    /* In production wire this to a real endpoint or email service.
       For now we simulate a short delay then show the success state. */
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 900);
  };

  return (
    <div className="saas-wrapper">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pub-hero">
        <div className="container pub-hero-inner">
          <h1 className="pub-hero-title">Contact Us</h1>
          <p className="pub-hero-desc">
            Reach out to us for admissions enquiries, fee questions, portal support,
            or any general question about Haile-Manas Academy.
          </p>
        </div>
      </section>

      {/* ── Contact info cards ── */}
      <section className="pub-section pub-section--alt">
        <div className="container">
          <div className="contact-info-grid">
            {CONTACT_INFO.map(({ icon, label, lines }) => (
              <div className="contact-info-card" key={label}>
                <div className="contact-info-icon">{icon}</div>
                <div>
                  <h4 className="contact-info-label">{label}</h4>
                  {lines.map((line, i) => (
                    <p key={i} className="contact-info-line">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + map ── */}
      <section className="pub-section">
        <div className="container contact-layout">

          {/* Form */}
          <div className="contact-form-wrap">
            <h2 className="contact-form-title">Send Us a Message</h2>
            <p className="contact-form-sub">
              Fill in the form and we will get back to you within one business day.
            </p>

            {submitted ? (
              <div className="contact-success">
                <CheckCircle size={48} className="contact-success-icon" />
                <h3>Message Sent!</h3>
                <p>
                  Thank you for reaching out. A member of our team will respond to
                  <strong> {form.email}</strong> within one business day.
                </p>
                <button
                  className="btn btn-secondary-outline"
                  onClick={() => { setSubmitted(false); setForm({ name:'',email:'',phone:'',department:'',subject:'',message:'' }); }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={onSubmit} noValidate>
                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="cf-name">Full Name *</label>
                    <input
                      id="cf-name" name="name" type="text"
                      placeholder="e.g. Abebe Girma"
                      value={form.name} onChange={onChange} required
                    />
                  </div>
                  <div className="contact-field">
                    <label htmlFor="cf-email">Email Address *</label>
                    <input
                      id="cf-email" name="email" type="email"
                      placeholder="you@example.com"
                      value={form.email} onChange={onChange} required
                    />
                  </div>
                </div>

                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="cf-phone">Phone Number</label>
                    <input
                      id="cf-phone" name="phone" type="tel"
                      placeholder="+251 91 234 5678"
                      value={form.phone} onChange={onChange}
                    />
                  </div>
                  <div className="contact-field">
                    <label htmlFor="cf-dept">Department</label>
                    <select id="cf-dept" name="department" value={form.department} onChange={onChange}>
                      <option value="">Select department…</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="contact-field">
                  <label htmlFor="cf-subject">Subject *</label>
                  <input
                    id="cf-subject" name="subject" type="text"
                    placeholder="Brief subject of your message"
                    value={form.subject} onChange={onChange} required
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="cf-message">Message *</label>
                  <textarea
                    id="cf-message" name="message" rows={5}
                    placeholder="Write your message here…"
                    value={form.message} onChange={onChange} required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary contact-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="contact-spinner" />
                  ) : (
                    <><Send size={15} /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Map placeholder + quick links */}
          <div className="contact-sidebar">
            <div className="contact-map-placeholder">
              <MapPin size={32} className="contact-map-icon" />
              <p>Debre Berhan<br />Amhara Region, Ethiopia</p>
              <a
                href="https://maps.google.com/?q=Debre+Berhan+Ethiopia"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary-outline"
                style={{ marginTop: '1rem', fontSize: '0.85rem' }}
              >
                Open in Google Maps
              </a>
            </div>

            <div className="contact-quick-links">
              <h4>Quick Links</h4>
              <Link to="/about">About the School</Link>
              <Link to="/events">School Events</Link>
              <Link to="/jobs">Career Opportunities</Link>
              <Link to="/login">Staff &amp; Parent Portal</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section container text-center">
        <h2>Already have an account?</h2>
        <p>Sign in to your portal to access announcements, fees, grades and more.</p>
        <div className="cta-buttons">
          <Link to="/login" className="btn btn-primary">Sign In to Portal</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
