import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Hero from '../../components/landing/Hero';
import Features from '../../components/landing/Features';
import Showcase from '../../components/landing/Showcase';
import PricingFAQ from '../../components/landing/PricingFAQ';
import "../../styles/pages/Landing.css";

const Landing = () => {
  return (
    <div className="saas-wrapper">
      <Navbar />
      <Hero />
      <Features />
      <Showcase />
      <PricingFAQ />
      <Footer />
    </div>
  );
};

export default Landing;
