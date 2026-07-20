import React from 'react';
import { Users, BookOpen, CreditCard, Bell, BarChart3, Calendar, Monitor, Smartphone, FileText, ClipboardList, Activity } from 'lucide-react';

const Features = () => {
  return (
    <>
      <section className="trusted-section container text-center">
        <h2 style={{color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 500, margin: 0, padding: '2rem 0'}}>
          Elevating academic excellence and school operations through our unified digital campus.
        </h2>
      </section>

      <section className="stats-section container">
        <div className="stats-grid">
          <div className="stat-card"><h3>50+</h3><p>Private Schools</p></div>
          <div className="stat-card"><h3>25,000+</h3><p>Students</p></div>
          <div className="stat-card"><h3>1,500+</h3><p>Teachers</p></div>
          <div className="stat-card"><h3>99.9%</h3><p>System Uptime</p></div>
        </div>
      </section>

      <section id="product" className="modules-section bg-white">
        <div className="container">
          <div className="section-header text-center">
            <h2>Core Modules</h2>
            <p>Everything you need to run a modern educational institution.</p>
          </div>
          <div className="modules-grid">
            {[
              { icon: <ClipboardList />, title: 'Admissions', desc: 'Seamlessly manage applications, waitlists, and enrollment workflows.' },
              { icon: <Users />, title: 'Student Management', desc: 'Maintain complete academic, medical, and behavioral records.' },
              { icon: <Monitor />, title: 'Teacher Portal', desc: 'Empower educators with digital gradebooks and lesson planning.' },
              { icon: <Smartphone />, title: 'Parent Portal', desc: 'Keep parents engaged with real-time updates and mobile access.' },
              { icon: <Activity />, title: 'Attendance', desc: 'Track daily attendance and automatically notify parents of absences.' },
              { icon: <FileText />, title: 'Examinations', desc: 'Schedule exams, manage grading scales, and generate report cards.' },
              { icon: <BookOpen />, title: 'Grade & Report Cards', desc: 'Automate transcript generation and term-end grading.' },
              { icon: <CreditCard />, title: 'Fee Management', desc: 'Process payments, generate invoices, and manage arrears.' },
              { icon: <Bell />, title: 'Communication', desc: 'Send emails, SMS, and in-app notifications securely.' },
              { icon: <Bell />, title: 'Notifications', desc: 'Automated alerts for fees, attendance, and behavioral updates.' },
              { icon: <Calendar />, title: 'Academic Calendar', desc: 'Schedule terms, holidays, and school-wide events.' },
              { icon: <BarChart3 />, title: 'Analytics Dashboard', desc: 'Gain insights into enrollment trends and financial health.' },
            ].map((module, i) => (
              <div className="module-card" key={i}>
                <div className="module-icon">{module.icon}</div>
                <h4>{module.title}</h4>
                <p>{module.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
