import React from 'react';
import logoImg from '../../assets/brand/logo.png';

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
    <footer
      className="site-footer"
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '2px solid #E2E8F0',
        color: '#374151',
        padding: '48px 0 24px',
        fontSize: '13px',
      }}
    >
      <div className="container">

        {/* Master Architectural Value Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            padding: '16px 20px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            marginBottom: '40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#15803D', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>100% FREE &amp; OPEN SOURCE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#0284C7', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>100% OFFLINE LOCAL STORAGE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#D97706', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>ANY THERMAL PRINTER (58/80MM)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#7C3AED', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>DYNAMIC BHARAT UPI QR (&#8377;)</span>
          </div>
        </div>
        
        {/* Main Footer Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr',
            gap: '32px',
            paddingBottom: '36px',
            borderBottom: '1px solid #E2E8F0',
          }}
          className="footer-grid-responsive"
        >
          
          {/* Col 1: Brand Info with Crisp Official Logo */}
          <div>
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                onNavigatePage('home');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '14px', textDecoration: 'none' }}
              title="Return to top"
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  flexShrink: 0,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  padding: '3px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                <img
                  src={logoImg || 'assets/brand/logo.png'}
                  alt="Billing Pro POS Logo"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'assets/brand/logo.png';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  BILLING PRO POS
                </h4>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748B', fontWeight: 700 }}>
                  OFFLINE RESTAURANT &amp; RETAIL POS
                </span>
              </div>
            </a>

            <p style={{ lineHeight: '1.6', color: '#475569', fontSize: '12px', marginBottom: '16px' }}>
              Free, fast offline billing software for restaurants, cafes, dhabas, sweet shops, bakeries, and retail counters. Zero internet needed, zero cloud subscriptions.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#F0FDF4', color: '#15803D', padding: '3px 8px', border: '1px solid #86EFAC', fontSize: '11px', fontWeight: 700 }}>
                <span className="pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: '#15803D' }}></span>
                <span>PRODUCTION READY v1.0</span>
              </span>
              <a
                href="https://github.com/Tusharjain-19/Billing-Pos"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#F1F5F9', color: '#334155', padding: '3px 8px', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}
              >
                <span>GitHub Repo</span>
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Pages */}
          <div>
            <h5 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F172A', marginBottom: '14px' }}>
              Navigation
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <a href="#home" onClick={(e) => { e.preventDefault(); onNavigatePage('home'); }} style={{ color: '#475569', textDecoration: 'none' }}>
                  Home Overview
                </a>
              </li>
              <li>
                <a href="#demo-video" onClick={(e) => { e.preventDefault(); onNavigatePage('demo'); }} style={{ color: '#15803D', fontWeight: 600, textDecoration: 'none' }}>
                  Live Demo Video
                </a>
              </li>
              <li>
                <a href="#features" onClick={(e) => { e.preventDefault(); onNavigatePage('features'); }} style={{ color: '#475569', textDecoration: 'none' }}>
                  Features &amp; Workflow
                </a>
              </li>
              <li>
                <a href="#printer" onClick={(e) => { e.preventDefault(); onNavigatePage('printer'); }} style={{ color: '#475569', textDecoration: 'none' }}>
                  Thermal Print Test
                </a>
              </li>
              <li>
                <a href="#downloads" onClick={(e) => { e.preventDefault(); onNavigatePage('downloads'); }} style={{ color: '#475569', textDecoration: 'none' }}>
                  Downloads &amp; Hardware
                </a>
              </li>
              <li>
                <a href="#faq" onClick={(e) => { e.preventDefault(); onNavigatePage('faq'); }} style={{ color: '#475569', textDecoration: 'none' }}>
                  FAQ &amp; Architecture
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Direct Downloads */}
          <div>
            <h5 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F172A', marginBottom: '14px' }}>
              Free Downloads
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <a href="downloads/Billing_Pro_POS_Setup_v1.0.0.exe" download style={{ color: '#0F172A', fontWeight: 700, textDecoration: 'none' }}>
                  Windows PC Setup (.EXE)
                </a>
              </li>
              <li>
                <a href="downloads/Billing_Pro_v1.0.apk" download style={{ color: '#15803D', fontWeight: 700, textDecoration: 'none' }}>
                  Android Mobile App (.APK)
                </a>
              </li>
              <li>
                <a href="#downloads" onClick={(e) => { e.preventDefault(); onNavigatePage('downloads'); }} style={{ color: '#475569', textDecoration: 'none' }}>
                  Hardware Matrix
                </a>
              </li>
              <li>
                <a href="#printer" onClick={(e) => { e.preventDefault(); onNavigatePage('printer'); }} style={{ color: '#475569', textDecoration: 'none' }}>
                  ESC/POS Simulator
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Hardware Support */}
          <div>
            <h5 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F172A', marginBottom: '14px' }}>
              Hardware Setup
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><span style={{ color: '#475569' }}>2-Inch (58mm) Thermal</span></li>
              <li><span style={{ color: '#475569' }}>3-Inch (80mm) Thermal</span></li>
              <li><span style={{ color: '#475569' }}>USB &amp; Bluetooth Receipt</span></li>
              <li><span style={{ color: '#475569' }}>Cash Drawers (RJ11/RJ12)</span></li>
              <li><span style={{ color: '#475569' }}>1D/2D Barcode &amp; QR Readers</span></li>
            </ul>
          </div>

          {/* Col 5: Contact & Support */}
          <div>
            <h5 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F172A', marginBottom: '14px' }}>
              Contact &amp; Support
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigatePage('contact');
                  }}
                  style={{ color: '#15803D', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Contact Support Hub &rarr;</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.tusharjain.in/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#475569', textDecoration: 'none' }}
                >
                  Online Contact Form
                </a>
              </li>
              <li>
                <a
                  href="https://www.tusharjain.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#475569', textDecoration: 'none' }}
                >
                  Developer Portfolio
                </a>
              </li>
              <li>
                <a
                  href="#404"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate404();
                  }}
                  style={{ color: '#64748B', textDecoration: 'none' }}
                >
                  Diagnostic (404 Page)
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '20px',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: '#64748B',
          }}
        >
          <div>
            <span>&copy; {currentYear} Billing Pro POS. Engineered by <strong>Tushar Jain</strong>. 100% Free &amp; Open Source Software.</span>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onNavigatePage('contact')}
              style={{ background: 'none', border: 'none', color: '#15803D', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Contact Support
            </button>
            <button
              type="button"
              onClick={onOpenCookieSettings}
              style={{ background: 'none', border: '1px solid #CBD5E1', color: '#475569', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '0px' }}
            >
              Storage Settings
            </button>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ color: '#64748B', textDecoration: 'underline' }}
            >
              Back to Top &uarr;
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
