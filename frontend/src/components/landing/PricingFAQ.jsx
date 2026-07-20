import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Check } from 'lucide-react';

const PricingFAQ = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    if (activeFaq === index) setActiveFaq(null);
    else setActiveFaq(index);
  };

  return (
    <>
      <section className="why-us-section bg-white">
        <div className="container">
          <div className="section-header text-center">
            <h2>Why Choose Us</h2>
          </div>
          <div className="why-us-grid">
            {['Responsive Design', 'Cloud Hosted', 'Role-Based Access', 'Automated Reports', 'Secure Data', 'Fast Performance', 'Parent Communication', 'Grades 9-12 Optimized', 'Online Payments', 'Academic Analytics'].map((item, i) => (
              <div className="why-us-item" key={i}>
                <Check className="check-icon" size={20} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials-section container">
        <div className="section-header text-center">
          <h2>Trusted by Administrators</h2>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p>"This platform transformed how our academy operates. Admissions are up, and administrative overhead is down by 40%."</p>
            <div className="author">
              <div className="avatar-circle">SJ</div>
              <div>
                <strong>Dr. Sarah Jenkins</strong>
                <span>Principal, Oakridge Int.</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <p>"The fee management and parent communication modules alone make this the best investment we've made for our school."</p>
            <div className="author">
              <div className="avatar-circle">MC</div>
              <div>
                <strong>Michael Chen</strong>
                <span>Head Registrar, Wellington</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing-section bg-white">
        <div className="container">
          <div className="section-header text-center">
            <h2>Campus Integration</h2>
            <p>Seamlessly connecting students, parents, and faculty.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <p className="price-desc">For small boutique academies.</p>
              <button className="btn btn-secondary" style={{width:'100%', marginTop: '2rem'}}>Contact Sales</button>
            </div>
            <div className="pricing-card featured">
              <h3>Professional</h3>
              <p className="price-desc">Comprehensive suite for grades 9-12.</p>
              <button className="btn btn-primary" style={{width:'100%', marginTop: '2rem'}}>Register</button>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <p className="price-desc">For large academies with advanced needs.</p>
              <button className="btn btn-secondary" style={{width:'100%', marginTop: '2rem'}}>Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      <section className="faq-section container">
        <div className="section-header text-center">
          <h2>Frequently Asked Questions</h2>
        </div>
        <div className="faq-list">
          {[
            { q: 'Is the data secure?', a: 'Yes, we use bank-grade encryption and comply with FERPA guidelines.' },
            { q: 'Can parents access it on mobile?', a: 'Absolutely, the platform is fully responsive and mobile-friendly.' },
            { q: 'How long does implementation take?', a: 'Most schools are fully onboarded within 2 to 4 weeks.' },
          ].map((faq, i) => (
            <div className="faq-item" key={i} onClick={() => toggleFaq(i)}>
              <div className="faq-question">
                <h4>{faq.q}</h4>
                <ChevronDown className={`chevron ${activeFaq === i ? 'open' : ''}`} />
              </div>
              {activeFaq === i && <div className="faq-answer"><p>{faq.a}</p></div>}
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section container text-center">
        <h2>Access Your Secure Portal</h2>
        <p>Please log in with your registered school credentials to access your dashboard.</p>
        <div className="cta-buttons">
          <Link to="/login" className="btn btn-primary">Sign In to Portal</Link>
          <Link to="/support" className="btn btn-secondary">IT Support</Link>
        </div>
      </section>
    </>
  );
};

export default PricingFAQ;
