import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import {
  Award, Users, BookOpen, Heart, Target, Eye,
  MapPin, Phone, Mail, Globe,
} from 'lucide-react';
import '../../styles/pages/Landing.css';
import '../../styles/pages/PublicPages.css';

const VALUES = [
  {
    icon: <Award size={24} strokeWidth={1.5} />,
    title: 'Academic Excellence',
    desc: 'We hold every student to the highest academic standards, nurturing critical thinkers and lifelong learners.',
  },
  {
    icon: <Heart size={24} strokeWidth={1.5} />,
    title: 'Character & Values',
    desc: 'Beyond academics, we shape young people of integrity, empathy, and strong moral character.',
  },
  {
    icon: <Users size={24} strokeWidth={1.5} />,
    title: 'Community',
    desc: 'Students, parents, teachers, and staff work as one extended family to build a thriving school community.',
  },
  {
    icon: <BookOpen size={24} strokeWidth={1.5} />,
    title: 'Holistic Development',
    desc: 'From arts and sports to STEM and leadership, every student\'s unique potential is discovered and developed.',
  },
];

const LEADERSHIP = [
  {
    initials: 'DR',
    name:     'Dr. Haile Bekele',
    role:     'Founder & Director',
    bio:      'PhD in Educational Leadership from Addis Ababa University. 25+ years shaping private education in Ethiopia.',
  },
  {
    initials: 'AT',
    name:     'Ato Manas Tesfaye',
    role:     'Principal',
    bio:      'MSc in Curriculum Design. Committed to building an environment where every child reaches their full potential.',
  },
  {
    initials: 'BG',
    name:     'Biruk Girma',
    role:     'Head of Academics',
    bio:      'Over 15 years teaching and curriculum development across private and public institutions in Addis Ababa.',
  },
  {
    initials: 'SM',
    name:     'Sara Mulugeta',
    role:     'Head of Administration',
    bio:      'A decade of school operations experience ensuring smooth day-to-day management across all departments.',
  },
];

const MILESTONES = [
  { year: '2006', label: 'Founded',          desc: 'Opened with 48 students and 8 staff in Debre Berhan, Amhara Region.' },
  { year: '2010', label: 'First Graduates',  desc: 'Our first Grade 12 class achieved a 94% national exam pass rate.' },
  { year: '2014', label: 'Campus Expansion', desc: 'New science labs, library, and multipurpose hall added.' },
  { year: '2018', label: 'Digital Campus',   desc: 'Launched our first student and parent digital portals.' },
  { year: '2022', label: '800+ Students',    desc: 'Enrolment surpassed 800 students across Grades 1–12.' },
  { year: '2024', label: 'Full SMS',         desc: 'Rolled out the complete school management system across all portals.' },
];

export default function About() {
  return (
    <div className="saas-wrapper">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pub-hero">
        <div className="container pub-hero-inner">
          <h1 className="pub-hero-title">About Haile-Manas Academy</h1>
          <p className="pub-hero-desc">
            A leading private school in Addis Ababa committed to academic excellence, character formation,
            and preparing the next generation of Ethiopian leaders.
          </p>
          <div className="pub-hero-actions">
            <a href="#story" className="btn btn-primary">Our Story</a>
            <Link to="/login" className="btn btn-secondary-outline">Staff Portal</Link>
          </div>
        </div>
      </section>

      {/* ── Quick stats ── */}
      <section className="pub-stats-bar">
        <div className="container pub-stats-inner">
          {[
            { value: '850+',  label: 'Students'       },
            { value: '62',    label: 'Teaching Staff'  },
            { value: 'K–12',  label: 'Grade Levels'    },
            { value: '18 yrs', label: 'In Operation'   },
          ].map(({ value, label }) => (
            <div className="pub-stat" key={label}>
              <span className="pub-stat-value">{value}</span>
              <span className="pub-stat-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission / Vision ── */}
      <section id="story" className="pub-section">
        <div className="container pub-two-col">
          <div className="pub-card pub-card--accent">
            <div className="pub-card-icon"><Target size={28} strokeWidth={1.5} /></div>
            <h3>Our Mission</h3>
            <p>
              To provide an inspiring, inclusive, and rigorous education that equips every student
              with the knowledge, skills, and values needed to thrive in a rapidly changing world —
              grounded in Ethiopian identity and open to global perspectives.
            </p>
          </div>
          <div className="pub-card pub-card--accent">
            <div className="pub-card-icon"><Eye size={28} strokeWidth={1.5} /></div>
            <h3>Our Vision</h3>
            <p>
              To be the most trusted private school in Ethiopia — recognised not just for academic
              results, but for producing compassionate, confident, and capable young citizens who
              serve their communities and country with distinction.
            </p>
          </div>
        </div>
      </section>

      {/* ── Our values ── */}
      <section className="pub-section pub-section--alt">
        <div className="container">
          <div className="section-header text-center">
            <h2>Our Core Values</h2>
            <p>The principles that guide every decision we make — in the classroom and beyond.</p>
          </div>
          <div className="pub-grid-4">
            {VALUES.map(({ icon, title, desc }) => (
              <div className="pub-value-card" key={title}>
                <div className="pub-value-icon">{icon}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="pub-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Our Journey</h2>
            <p>From a small school of 48 students to a thriving campus of 850+.</p>
          </div>
          <div className="pub-timeline">
            {MILESTONES.map(({ year, label, desc }) => (
              <div className="pub-timeline-item" key={year}>
                <div className="pub-timeline-year">{year}</div>
                <div className="pub-timeline-dot" />
                <div className="pub-timeline-content">
                  <h4>{label}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership ── */}
      <section className="pub-section pub-section--alt">
        <div className="container">
          <div className="section-header text-center">
            <h2>Leadership Team</h2>
            <p>Experienced educators and administrators dedicated to our school's mission.</p>
          </div>
          <div className="pub-team-grid">
            {LEADERSHIP.map(({ initials, name, role, bio }) => (
              <div className="pub-team-card" key={name}>
                <div className="pub-team-avatar">{initials}</div>
                <h4>{name}</h4>
                <span className="pub-team-role">{role}</span>
                <p>{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact / location ── */}
      <section className="pub-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Find Us</h2>
          </div>
          <div className="pub-contact-grid">
            <div className="pub-contact-item">
              <MapPin size={20} className="pub-contact-icon" />
              <div>
                <strong>Address</strong>
                <p>Debre Berhan, Amhara Region, Ethiopia</p>
              </div>
            </div>
            <div className="pub-contact-item">
              <Phone size={20} className="pub-contact-icon" />
              <div>
                <strong>Phone</strong>
                <p>+251 11 661 XXXX</p>
              </div>
            </div>
            <div className="pub-contact-item">
              <Mail size={20} className="pub-contact-icon" />
              <div>
                <strong>Email</strong>
                <p>info@haile-manas.edu.et</p>
              </div>
            </div>
            <div className="pub-contact-item">
              <Globe size={20} className="pub-contact-icon" />
              <div>
                <strong>Website</strong>
                <p>www.haile-manas.edu.et</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section container text-center">
        <h2>Be Part of Our Community</h2>
        <p>Whether you're a prospective parent, a teacher, or a returning student — we welcome you.</p>
        <div className="cta-buttons">
          <Link to="/login" className="btn btn-primary">Sign In to Portal</Link>
          <a href="mailto:info@haile-manas.edu.et" className="btn btn-secondary-outline">Get in Touch</a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
