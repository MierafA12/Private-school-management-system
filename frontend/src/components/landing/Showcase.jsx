import React from 'react';

const Showcase = () => {
  return (
    <>
      <section className="showcase-section container">
        <div className="showcase-row">
          <div className="showcase-content">
            <h2>Student Management</h2>
            <p>Comprehensive oversight of all student records in one centralized location.</p>
          </div>
          <div className="showcase-visual">
            <div className="css-ui-window">
               <div className="ui-header"><div className="ui-dots"></div></div>
               <div className="ui-body list-layout">
                  <div className="ui-row"><div className="ui-avatar"></div><div className="ui-line"></div></div>
                  <div className="ui-row"><div className="ui-avatar"></div><div className="ui-line"></div></div>
                  <div className="ui-row"><div className="ui-avatar"></div><div className="ui-line"></div></div>
               </div>
            </div>
          </div>
        </div>

        <div className="showcase-row reverse">
          <div className="showcase-content">
            <h2>Teacher Portal</h2>
            <p>Empower educators with intuitive gradebooks, schedules, and integrated tools.</p>
          </div>
          <div className="showcase-visual">
            <div className="css-ui-window">
               <div className="ui-header"><div className="ui-dots"></div></div>
               <div className="ui-body grid-layout">
                  <div className="ui-box"><div className="wf-line short" style={{margin:'1rem'}}></div><div className="wf-line" style={{margin:'0 1rem'}}></div></div>
                  <div className="ui-box"><div className="wf-line short" style={{margin:'1rem'}}></div><div className="wf-line" style={{margin:'0 1rem'}}></div></div>
                  <div className="ui-box"><div className="wf-line short" style={{margin:'1rem'}}></div><div className="wf-line" style={{margin:'0 1rem'}}></div></div>
                  <div className="ui-box"><div className="wf-line short" style={{margin:'1rem'}}></div><div className="wf-line" style={{margin:'0 1rem'}}></div></div>
               </div>
            </div>
          </div>
        </div>

        <div className="showcase-row">
          <div className="showcase-content">
            <h2>Parent Portal</h2>
            <p>Real-time updates on attendance, grades, and school announcements directly on mobile.</p>
          </div>
          <div className="showcase-visual mobile-visual">
             <div className="css-mobile-mockup">
                <div className="mob-notch"></div>
                <div className="mob-header"></div>
                <div className="mob-card"><div className="wf-line" style={{margin:'1rem'}}></div><div className="wf-line short" style={{margin:'0 1rem'}}></div></div>
                <div className="mob-card"><div className="wf-line" style={{margin:'1rem'}}></div><div className="wf-line short" style={{margin:'0 1rem'}}></div></div>
                <div className="mob-card"><div className="wf-line" style={{margin:'1rem'}}></div><div className="wf-line short" style={{margin:'0 1rem'}}></div></div>
             </div>
          </div>
        </div>
      </section>

      <section className="roles-section bg-white">
        <div className="container">
          <div className="section-header">
            <h2>Role-Based Dashboards</h2>
            <p>Tailored interfaces ensuring every user sees exactly what they need.</p>
          </div>
          <div className="roles-grid-cards">
            {['Principal', 'Registrar', 'Teacher', 'Accountant', 'Parents', 'Students'].map((role, i) => (
              <div className="role-ui-card" key={i}>
                <h4>{role} Dashboard</h4>
                <div className="fake-ui">
                   <div className="fake-header"></div>
                   <div className="fake-body">
                      <div className="wf-line" style={{margin:'1rem', width: '60%'}}></div>
                      <div className="wf-line" style={{margin:'0.5rem 1rem'}}></div>
                      <div className="wf-line short" style={{margin:'0.5rem 1rem'}}></div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="timeline-section container">
        <div className="section-header text-center">
          <h2>School Operations</h2>
          <p>Everything connected through one platform.</p>
        </div>
        <div className="timeline-grid">
          {['Admission', 'Enrollment', 'Attendance', 'Assessment', 'Report Cards'].map((step, i) => (
            <div className="timeline-item" key={i}>
              <div className="timeline-dot"></div>
              <h4>{step}</h4>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Showcase;
