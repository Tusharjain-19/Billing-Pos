import React from 'react';

interface FooterProps {
  onOpenCookieSettings: () => void;
  onNavigatePage: (page: string) => void;
  onNavigate404: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenCookieSettings,
  onNavigatePage,
  onNavigate404
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        
        <div className="footer-top-grid">
          
          {/* Col 1: Brand Info with Real Logo */}
          <div className="footer-brand">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                onNavigatePage('home');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}
              title="Return to top"
            >
              <div style={{ width: '38px', height: '38px', flexShrink: 0 }}>
                <img
                  src="assets/brand/logo.png"
                  alt="Billing Pro POS Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <h4 style={{ margin: 0, fontSize: '17px', color: '#FFFFFF' }}>BILLING PRO POS</h4>
            </a>

            <p style={{ lineHeight: '1.6', color: '#94A3B8', fontSize: '12px' }}>
              Free, fast offline billing software for restaurants, cafés, dhabas, bakeries, and retail counters. Zero internet needed.
            </p>

            <div className="footer-badge-offline" style={{ marginTop: '10px' }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px' }}></span>
              <span>100% OFFLINE &bull; NO INTERNET NEEDED</span>
            </div>
          </div>

          {/* Col 2: Navigation Pages */}
          <div className="footer-col">
            <h5>Navigation</h5>
            <ul className="footer-links">
              <li>
                <a href="#home" onClick={(e) => { e.preventDefault(); onNavigatePage('home'); }}>
                  Home Page
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => { e.preventDefault(); onNavigatePage('features'); }}>
                  Features &amp; Workflow
                </a>
              </li>
              <li>
                <a href="#printer" onClick={(e) => { e.preventDefault(); onNavigatePage('printer'); }}>
                  Thermal Print Test
                </a>
              </li>
              <li>
                <a href="#downloads" onClick={(e) => { e.preventDefault(); onNavigatePage('downloads'); }}>
                  Downloads &amp; Hardware
                </a>
              </li>
              <li>
                <a href="#faq" onClick={(e) => { e.preventDefault(); onNavigatePage('faq'); }}>
                  Frequently Asked Questions
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Direct Downloads */}
          <div className="footer-col">
            <h5>Free Downloads</h5>
            <ul className="footer-links">
              <li><a href="downloads/Billing_Pro_POS_Setup_v1.0.0.exe" download>Windows PC Setup (.EXE)</a></li>
              <li><a href="downloads/Billing_Pro_v1.0.apk" download>Android Mobile (.APK)</a></li>
              <li>
                <a href="#downloads" onClick={(e) => { e.preventDefault(); onNavigatePage('downloads'); }}>
                  Hardware Comparison
                </a>
              </li>
              <li>
                <a href="#printer" onClick={(e) => { e.preventDefault(); onNavigatePage('printer'); }}>
                  Thermal Receipt Test
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Hardware Support */}
          <div className="footer-col">
            <h5>Hardware Support</h5>
            <ul className="footer-links">
              <li><a href="#printer" onClick={(e) => { e.preventDefault(); onNavigatePage('printer'); }}>2-Inch (58mm) Printers</a></li>
              <li><a href="#printer" onClick={(e) => { e.preventDefault(); onNavigatePage('printer'); }}>3-Inch (80mm) Printers</a></li>
              <li><a href="#downloads" onClick={(e) => { e.preventDefault(); onNavigatePage('downloads'); }}>USB &amp; Bluetooth Thermal</a></li>
              <li><a href="#downloads" onClick={(e) => { e.preventDefault(); onNavigatePage('downloads'); }}>Automatic Cash Drawers</a></li>
              <li><a href="#downloads" onClick={(e) => { e.preventDefault(); onNavigatePage('downloads'); }}>Barcode &amp; QR Scanners</a></li>
            </ul>
          </div>

          {/* Col 5: Contact Us */}
          <div className="footer-col">
            <h5>Contact &amp; Support</h5>
            <ul className="footer-links">
              <li>
                <a
                  href="https://www.tusharjain.in/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#22C55E', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Contact Page (tusharjain.in)</span>
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigatePage('contact');
                  }}
                  style={{ color: '#FFFFFF', fontWeight: 600 }}
                >
                  Direct Support Hub &rarr;
                </a>
              </li>
              <li>
                <a href="https://www.tusharjain.in" target="_blank" rel="noopener noreferrer">
                  Developer Portfolio
                </a>
              </li>
              <li>
                <a href="../USER_GUIDE.md">
                  User Setup Guide
                </a>
              </li>
              <li>
                <a
                  href="#404"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate404();
                  }}
                >
                  Diagnostic (404 Page)
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Dynamic Current Year */}
        <div className="footer-bottom-row">
          <div>
            <span>&copy; {currentYear} Billing Pro POS. Developed by Tushar Jain. 100% Free &amp; Open Source Software.</span>
          </div>
          <div className="footer-meta-right">
            <a
              href="https://www.tusharjain.in/contact"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#22C55E', fontWeight: 600, textDecoration: 'none' }}
            >
              Contact Us &rarr;
            </a>
            <button type="button" onClick={onOpenCookieSettings} className="btn-cookie-manage">
              Storage Settings
            </button>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ color: '#94A3B8', textDecoration: 'underline' }}
            >
              Back to Top &uarr;
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
