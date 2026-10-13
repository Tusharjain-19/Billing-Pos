import React from 'react';

export const Contact: React.FC = () => {
  return (
    <section id="contact" className="section">
      <div className="container">
        
        <div className="section-head">
          <div className="section-pretitle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Direct Support</span>
          </div>
          <h2 className="section-title">Need Help or Have Questions? Contact Us</h2>
          <p className="section-description">
            Need help installing on your shop computer, setting up your restaurant menu, or connecting your thermal printer? Reach out anytime via our official contact page.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Card 1: Official Contact Portal */}
          <div className="feature-card" style={{ borderTop: '4px solid var(--primary)', display: 'flex', flexDirection: 'column' }}>
            <div className="feature-icon-box" style={{ color: 'var(--accent-blue)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            <h3 className="feature-title">Official Contact Page</h3>
            <p className="feature-body">
              Submit your inquiry or message through our official contact portal for setup support, custom features, or business queries:
            </p>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', margin: '8px 0 16px', fontFamily: 'var(--font-mono)' }}>
              tusharjain.in/contact
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
              <a
                href="https://www.tusharjain.in/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Open Contact Form</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* Card 2: Developer Portfolio */}
          <div className="feature-card" style={{ borderTop: '4px solid var(--accent-green)', display: 'flex', flexDirection: 'column' }}>
            <div className="feature-icon-box" style={{ color: 'var(--accent-green)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h3 className="feature-title">Developer Portfolio</h3>
            <p className="feature-body">
              Billing Pro POS is engineered and maintained by Tushar Jain. Explore more open-source software, applications, and developer works:
            </p>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-green)', margin: '8px 0 16px', fontFamily: 'var(--font-mono)' }}>
              tusharjain.in
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
              <a
                href="https://www.tusharjain.in"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-green"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Visit Portfolio</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* Card 3: User Guide & Hardware Setup */}
          <div className="feature-card" style={{ borderTop: '4px solid #64748B', display: 'flex', flexDirection: 'column' }}>
            <div className="feature-icon-box" style={{ color: '#475569' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <h3 className="feature-title">Setup Documentation</h3>
            <p className="feature-body">
              Read step-by-step instructions on connecting thermal printers, configuring GST tax slabs, importing Excel menus, and barcode scanners:
            </p>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', margin: '8px 0 16px' }}>
              Offline User Manual &amp; Hardware Guide
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
              <a
                href="../USER_GUIDE.md"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Read Setup Guide</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
