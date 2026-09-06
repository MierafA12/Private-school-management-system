import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';

/* ── Pricing tiers (per-term / scholastic) ───────────────────────────────── */
const PLANS = [
  {
    name:     'Scholar',
    tagline:  'Small private school',
    price:    'ETB 4,500',
    period:   'per term',
    students: 'Up to 150 students',
    featured: false,
    features: [
      'Principal & Registrar portals',
      'Student & parent portals',
      'Attendance tracking',
      'Fee invoicing & payments',
      'Announcement board',
      'Up to 5 teacher accounts',
      'Email support',
    ],
  },
  {
    name:     'Academy',
    tagline:  'Growing institution',
    price:    'ETB 9,800',
    period:   'per term',
    students: 'Up to 500 students',
    featured: true,
    badge:    'Most Popular',
    features: [
      'Everything in Scholar',
      'Full teacher & accountant portals',
      'Timetable builder & broadcast',
      'Report cards & grading scales',
      'Assignment management',
      'Unlimited teacher accounts',
      'Parent messaging',
      'Priority support',
    ],
  },
  {
    name:     'Campus',
    tagline:  'Large or multi-branch schools',
    price:    'Contact us',
    period:   'custom scholastic plan',
    students: 'Unlimited students',
    featured: false,
    features: [
      'Everything in Academy',
      'Multi-branch / multi-school',
      'Custom integrations',
      'Dedicated onboarding manager',
      'On-site staff training',
      'SLA uptime guarantee',
      'Custom domain & branding',
    ],
  },
];

/* ── Why us ──────────────────────────────────────────────────────────────── */
const WHY_US = [
  'Responsive on all devices',
  'Cloud-hosted & always backed up',
  'Role-based access control',
  'Automated term report cards',
  'Bank-grade data security',
  'Offline-friendly attendance',
  'Parent communication built-in',
  'Supports Ethiopian academic calendar',
  'Chapa / mobile payment ready',
  'Academic analytics & rankings',
];

/* ── Testimonials ────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: '"This platform transformed how our academy operates. Admissions are up, and administrative overhead is down by 40% since we started using it."',
    initials: 'SJ',
    name:     'Dr. Sarah Jenkins',
    role:     'Principal, Oakridge International',
  },
  {
    quote: '"The fee management and parent communication modules alone make this the best investment we\'ve made. Every term runs smoother."',
    initials: 'MC',
    name:     'Michael Chen',
    role:     'Head Registrar, Wellington Academy',
  },
];

/* ── FAQs ────────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'How is pricing calculated?',
    a: 'Plans are billed per scholastic term (3 terms per academic year). You only pay for the terms your school is active. Multi-term discounts are available on request.',
  },
  {
    q: 'Can I switch plans mid-term?',
    a: 'Yes — you can upgrade at any time and the difference is prorated to the remaining weeks of the term. Downgrades take effect at the start of the next term.',
  },
  {
    q: 'Is student data secure?',
    a: 'Absolutely. All data is encrypted in transit (TLS 1.3) and at rest. We do not share or sell student data to any third party.',
  },
  {
    q: 'Does it support the Ethiopian academic calendar?',
    a: 'Yes. The platform includes an Ethiopian date badge and is designed around the 3-term scholastic year used by most private schools in Ethiopia.',
  },
  {
    q: 'How long does onboarding take?',
    a: 'Most schools are fully set up within one week. The onboarding kit and live training sessions walk your registrar through every step.',
  },
  {
    q: 'Can parents access it on mobile?',
    a: 'Yes — the entire platform is responsive. Parents can view attendance, fees, report cards, and messages from any smartphone or tablet.',
  },
];

/* ═════════════════════════════════════════════════════════════════════════ */
const PricingFAQ = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  return (
    <>
      {/* ── Why us ─────────────────────────────────────────────────────── */}
      <section className="why-us-section bg-white">
        <div className="container">
          <div className="section-header text-center">
            <h2>Why Schools Choose Us</h2>
            <p>Purpose-built for private school operations — not a generic tool retrofitted for education.</p>
          </div>
          <div className="why-us-grid">
            {WHY_US.map((item) => (
              <div className="why-us-item" key={item}>
                <Check className="check-icon" size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section className="testimonials-section container">
        <div className="section-header text-center">
          <h2>Trusted by School Administrators</h2>
          <p>Hear from principals and registrars already using the platform.</p>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map(({ quote, initials, name, role }) => (
            <div className="testimonial-card" key={name}>
              <p>{quote}</p>
              <div className="author">
                <div className="avatar-circle">{initials}</div>
                <div>
                  <strong>{name}</strong>
                  <span>{role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────── */}
      <section id="pricing" className="pricing-section">
        <div className="container">
          <div className="section-header text-center">
            <h2>Scholastic Pricing</h2>
            <p>
              Transparent, per-term pricing. No hidden fees — just one simple charge each scholastic term.
            </p>
            <div className="pricing-badge-row">
              <span className="pricing-callout-badge">🗓️ Billed per scholastic term &nbsp;·&nbsp; 3 terms per year</span>
            </div>
          </div>

          <div className="pricing-grid">
            {PLANS.map(({ name, tagline, price, period, students, featured, badge, features }) => (
              <div className={`pricing-card${featured ? ' featured' : ''}`} key={name}>
                {featured && badge && (
                  <div className="pricing-badge">{badge}</div>
                )}
                <div className="pricing-plan-header">
                  <h3 className="pricing-plan-name">{name}</h3>
                  <p className="pricing-plan-tagline">{tagline}</p>
                </div>

                <div className="pricing-price-block">
                  <span className="pricing-amount">{price}</span>
                  <span className="pricing-period">/ {period}</span>
                </div>
                <p className="pricing-students">{students}</p>

                <ul className="pricing-features">
                  {features.map((f) => (
                    <li key={f}>
                      <Check size={15} className="check-icon" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/login"
                  className={`btn ${featured ? 'btn-primary' : 'btn-secondary-outline'}`}
                  style={{ width: '100%', marginTop: '1.5rem', textAlign: 'center' }}
                >
                  {price === 'Contact us' ? 'Get in Touch' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>

          <p className="pricing-note">
            All plans include free system updates throughout the scholastic year.
            Annual billing (3 terms) saves up to 15%.
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="faq-section container">
        <div className="section-header text-center">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know before getting started.</p>
        </div>
        <div className="faq-list">
          {FAQS.map(({ q, a }, i) => (
            <div
              className="faq-item"
              key={i}
              onClick={() => setActiveFaq(activeFaq === i ? null : i)}
            >
              <div className="faq-question">
                <h4>{q}</h4>
                <ChevronDown className={`chevron${activeFaq === i ? ' open' : ''}`} size={18} />
              </div>
              {activeFaq === i && (
                <div className="faq-answer"><p>{a}</p></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="cta-section container text-center">
        <h2>Ready to Simplify This Scholastic Year?</h2>
        <p>Sign in to your secure portal or contact us to set up your school.</p>
        <div className="cta-buttons">
          <Link to="/login" className="btn btn-primary">Sign In to Portal</Link>
          <a href="mailto:admin@haile-manas.edu.et" className="btn btn-secondary-outline">Contact Us</a>
        </div>
      </section>
    </>
  );
};

export default PricingFAQ;
