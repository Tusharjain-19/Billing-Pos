import React from 'react';

interface ContactProps {
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const Contact: React.FC<ContactProps> = () => {
  return (
    <section id="contact" className="section" style={{ backgroundColor: '#F8FAFC', padding: '40px 0 70px' }}>
      <div className="container" style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Section Header */}
        <div className="section-head" style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div
            className="section-pretitle"
            style={{
              color: 'var(--accent-green)',
              backgroundColor: 'var(--accent-green-light)',
              borderColor: '#86EFAC',
              display: 'inline-flex',
              marginBottom: '12px'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>OFFICIAL DEVELOPER CONTACT PORTAL</span>
          </div>
          <h2 className="section-title" style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
            Get in Touch with Developer
          </h2>
          <p className="section-description" style={{ maxWidth: '680px', margin: '0 auto', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
            For merchant assistance, custom restaurant/retail features, thermal receipt printer integration, or partnership queries, please reach out via our official website contact page.
          </p>
        </div>

        {/* Primary Featured Portal Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #15803D',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            padding: '36px',
            marginBottom: '28px',
            position: 'relative'
          }}
        >
          {/* Top Decorative Indicator */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              height: '4px',
              backgroundColor: '#15803D'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', padding: '3px 10px', fontSize: '11px', fontWeight: 700, color: '#15803D', marginBottom: '12px' }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#15803D', display: 'inline-block' }}></span>
                <span>PRIMARY CONTACT CHANNEL</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                Official Website Contact Page
              </h3>
              <p style={{ fontSize: '14px', color: '#374151', margin: 0, maxWidth: '580px', lineHeight: 1.6 }}>
                Directly communicate with developer <strong>Tushar Jain</strong> for any Billing Pro POS questions, hardware compatibility support, or feature requests.
              </p>
            </div>

            {/* Direct Big Button */}
            <div style={{ alignSelf: 'center' }}>
              <a
                href="https://www.tusharjain.in/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-green"
                style={{
                  padding: '14px 24px',
                  fontSize: '14px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)'
                }}
              >
                <span>Open tusharjain.in/contact</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* Monospace Link Box */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#15803D' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                  Direct URL
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  https://www.tusharjain.in/contact
                </span>
              </div>
            </div>

            <a
              href="https://www.tusharjain.in/contact"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#15803D',
                textDecoration: 'underline'
              }}
            >
              Visit Contact Page &rarr;
            </a>
          </div>

          {/* Coverage Pillars */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              borderTop: '1px solid #E5E7EB',
              paddingTop: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#15803D', display: 'inline-block' }}></span>
              <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>Direct Developer Support</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#15803D', display: 'inline-block' }}></span>
              <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>Thermal Printer Setup</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#15803D', display: 'inline-block' }}></span>
              <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>Menu &amp; GST Invoicing</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#15803D', display: 'inline-block' }}></span>
              <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>100% Free &amp; Open Source</span>
            </div>
          </div>
        </div>

        {/* 3 Secondary Direct Channels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          
          {/* Channel 1: Developer Portfolio */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderTop: '4px solid var(--primary)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary)' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Developer Portfolio
                </h4>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
                Billing Pro POS is built and maintained by <strong>Tushar Jain</strong>. Explore other software projects and credentials.
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748B', marginBottom: '16px' }}>
                https://www.tusharjain.in
              </div>
            </div>

            <a
              href="https://www.tusharjain.in"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Visit Portfolio &rarr;</span>
            </a>
          </div>

          {/* Channel 2: Direct Email */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderTop: '4px solid var(--accent-blue)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-blue)' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Direct Email
                </h4>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
                Send formal technical queries, restaurant feature requests, or deployment inquiries directly via email.
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                jaint0910@gmail.com
              </div>
            </div>

            <a
              href="mailto:jaint0910@gmail.com"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Send Direct Email &rarr;</span>
            </a>
          </div>

          {/* Channel 3: GitHub Repository */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderTop: '4px solid #475569',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#0F172A' }}>
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  GitHub Issues &amp; Code
                </h4>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
                Open an issue on GitHub for bug reports, hardware driver pull requests, or code contributions.
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748B', marginBottom: '16px' }}>
                github.com/Tusharjain-19/Billing-Pos
              </div>
            </div>

            <a
              href="https://github.com/Tusharjain-19/Billing-Pos"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Open GitHub Repository &rarr;</span>
            </a>
          </div>

        </div>

      </div>
    </section>
  );
};
