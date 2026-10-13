import React, { useState, useEffect } from 'react';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Navbar } from './components/Navbar';
import { MobileDrawer } from './components/MobileDrawer';
import { Hero } from './components/Hero';
import { VideoDemo } from './components/VideoDemo';
import { Features } from './components/Features';
import { ThermalSimulator } from './components/ThermalSimulator';
import { Downloads } from './components/Downloads';
import { HardwareMatrix } from './components/HardwareMatrix';
import { ComparisonTable } from './components/ComparisonTable';
import { FaqAccordion } from './components/FaqAccordion';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { CookieModal } from './components/CookieModal';
import { NotFoundPage } from './components/NotFoundPage';

type PageId = 'home' | 'features' | 'printer' | 'downloads' | 'contact' | 'faq' | '404';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCookieBannerVisible, setIsCookieBannerVisible] = useState(false);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

  // Parse page from hash
  const parsePageFromHash = (): PageId => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'demo' || hash === 'demo-video') return 'home';
    if (hash === 'features') return 'features';
    if (hash === 'printer' || hash === 'simulator') return 'printer';
    if (hash === 'downloads' || hash === 'hardware' || hash === 'specs') return 'downloads';
    if (hash === 'contact') return 'contact';
    if (hash === 'faq') return 'faq';
    if (hash === '404') return '404';
    return 'home';
  };

  // Synchronize routing on load & hashchange
  useEffect(() => {
    setCurrentPage(parsePageFromHash());

    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      setCurrentPage(parsePageFromHash());
      if (hash !== 'demo-video' && hash !== 'demo') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Update document title per page
  useEffect(() => {
    const titles: Record<PageId, string> = {
      home: 'Billing Pro POS | Free & Open Source Offline Restaurant & Retail POS',
      features: 'Features & Workflow | Billing Pro POS',
      printer: 'Receipt Print & UPI QR Test | Billing Pro POS',
      downloads: 'Download Free PC & Android Software | Billing Pro POS',
      contact: 'Contact Us | Billing Pro POS',
      faq: 'Frequently Asked Questions | Billing Pro POS',
      '404': '404 Page Not Found | Billing Pro POS',
    };
    document.title = titles[currentPage] || titles.home;
  }, [currentPage]);

  const navigateToPage = (page: string) => {
    if (page === 'demo' || page === 'demo-video') {
      if (currentPage !== 'home') {
        setCurrentPage('home');
      }
      window.location.hash = '#demo-video';
      setTimeout(() => {
        const el = document.getElementById('demo-video');
        if (el) {
          const headerOffset = 70;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
          const vid = el.querySelector('video');
          if (vid && vid.paused) {
            vid.play().catch(() => {});
          }
        }
      }, 100);
      return;
    }
    const targetPage = (page as PageId) || 'home';
    setCurrentPage(targetPage);
    window.location.hash = '#' + targetPage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toast Helper
  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newToast: ToastMessage = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Download Trigger Handler
  const handleDownload = (filename: string) => {
    showToast(
      'success',
      'Download Started',
      `Downloading ${filename}. Open the file once finished to install.`
    );
  };

  // Cookie Consent Actions
  const handleAcceptAllCookies = () => {
    const payload = { essential: true, hardware: true, analytics: true, timestamp: Date.now() };
    localStorage.setItem('billingpro_storage_consent', JSON.stringify(payload));
    setIsCookieBannerVisible(false);
    showToast('success', 'Preferences Confirmed', 'Offline preferences confirmed.');
  };

  const handleEssentialCookies = () => {
    const payload = { essential: true, hardware: false, analytics: false, timestamp: Date.now() };
    localStorage.setItem('billingpro_storage_consent', JSON.stringify(payload));
    setIsCookieBannerVisible(false);
    showToast('info', 'Essential Storage Only', 'Only essential offline storage enabled.');
  };

  return (
    <div id="top" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Blueprint Parallax Background */}
      <div className="blueprint-grid-bg" aria-hidden="true"></div>

      {/* Multipage Primary Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigatePage={navigateToPage}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onDownloadTrigger={handleDownload}
      />

      {/* Responsive Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigatePage={navigateToPage}
        onDownloadTrigger={handleDownload}
      />

      {/* Multipage Main Content Router */}
      <main style={{ flexGrow: 1 }}>
        
        {/* ================= PAGE 1: HOME ================= */}
        {currentPage === 'home' && (
          <div>
            <Hero onDownloadTrigger={handleDownload} onNavigatePage={navigateToPage} />
            <VideoDemo />

            {/* Quick Multi-Page Route Cards */}
            <section className="section section-alt" style={{ padding: '40px 0' }}>
              <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                  
                  <div className="feature-card" style={{ borderTop: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary)' }}>
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Core Features</h3>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-body)', marginBottom: '16px' }}>
                      Learn how offline local storage, 5-second counter billing, and daily sales reports in &#8377; work.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateToPage('features')}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%' }}
                    >
                      <span>Explore Features &rarr;</span>
                    </button>
                  </div>

                  <div className="feature-card" style={{ borderTop: '4px solid var(--accent-green)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-green)' }}>
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                      </svg>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Receipt Print Test</h3>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-body)', marginBottom: '16px' }}>
                      Test 2-inch and 3-inch thermal bill printing with live dynamic Bharat UPI QR simulation.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateToPage('printer')}
                      className="btn btn-green btn-sm"
                      style={{ width: '100%' }}
                    >
                      <span>Test Thermal Printer &rarr;</span>
                    </button>
                  </div>

                  <div className="feature-card" style={{ borderTop: '4px solid var(--accent-blue)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-blue)' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Free Downloads</h3>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-body)', marginBottom: '16px' }}>
                      Download Windows setup (.EXE) or Android app (.APK). Check printer hardware compatibility.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateToPage('downloads')}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                    >
                      <span>Downloads &amp; Hardware &rarr;</span>
                    </button>
                  </div>

                  <div className="feature-card" style={{ borderTop: '4px solid #64748B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#475569' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Contact Support</h3>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-body)', marginBottom: '16px' }}>
                      Need assistance with menu setup or thermal printer integration? Reach out via our official contact page.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateToPage('contact')}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%' }}
                    >
                      <span>Contact Us &rarr;</span>
                    </button>
                  </div>

                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= PAGE 2: FEATURES ================= */}
        {currentPage === 'features' && (
          <div>
            <div className="subpage-header">
              <div className="container">
                <div className="subpage-breadcrumb">
                  <button type="button" onClick={() => navigateToPage('home')}>Home</button>
                  <span>/</span>
                  <span>Features &amp; Workflow</span>
                </div>
                <h1 className="subpage-title">Features &amp; Counter Workflow</h1>
                <p className="subpage-desc">
                  Designed for zero counter delays: 100% offline local storage, instant dish buttons, dynamic UPI QR payments, and daily income reports in Rupees (&#8377;).
                </p>
              </div>
            </div>

            <Features />

            {/* Quick 3-Step Workflow Banner */}
            <section className="section" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-color)' }}>
              <div className="container">
                <div className="section-head">
                  <h2 className="section-title">How Counter Billing Works in 3 Simple Steps</h2>
                  <p className="section-description">
                    No complicated training required. Any staff member can start billing immediately.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  
                  <div style={{ padding: '24px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
                      STEP 1
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Punch Dishes &amp; Items</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: 0 }}>
                      Click on the dish buttons or scan the item barcode. The bill docket calculates the total and GST in &#8377; automatically.
                    </p>
                  </div>

                  <div style={{ padding: '24px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '8px' }}>
                      STEP 2
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Customer Pays via UPI or Cash</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: 0 }}>
                      Customer scans the dynamic Bharat UPI QR code using PhonePe, GPay, or Paytm, or pays with cash.
                    </p>
                  </div>

                  <div style={{ padding: '24px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '8px' }}>
                      STEP 3
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Print &amp; Hand Receipt</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: 0 }}>
                      The receipt prints on your thermal printer in under 1 second. The system resets instantly for the next customer.
                    </p>
                  </div>

                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= PAGE 3: PRINTER TEST ================= */}
        {currentPage === 'printer' && (
          <div>
            <div className="subpage-header">
              <div className="container">
                <div className="subpage-breadcrumb">
                  <button type="button" onClick={() => navigateToPage('home')}>Home</button>
                  <span>/</span>
                  <span>Thermal Print Test</span>
                </div>
                <h1 className="subpage-title">Receipt Printing &amp; Bharat UPI QR Simulator</h1>
                <p className="subpage-desc">
                  Test bill formatting for 2-inch (58mm) and 3-inch (80mm) thermal printers. Try adding items to recalculate totals in &#8377;, and test paper cuts and feed.
                </p>
              </div>
            </div>

            <ThermalSimulator onSuccess={(title, msg) => showToast('success', title, msg)} />
          </div>
        )}

        {/* ================= PAGE 4: DOWNLOADS & HARDWARE ================= */}
        {currentPage === 'downloads' && (
          <div>
            <div className="subpage-header">
              <div className="container">
                <div className="subpage-breadcrumb">
                  <button type="button" onClick={() => navigateToPage('home')}>Home</button>
                  <span>/</span>
                  <span>Downloads &amp; Hardware</span>
                </div>
                <h1 className="subpage-title">Download Free Software &amp; Hardware Setup</h1>
                <p className="subpage-desc">
                  Download 100% free offline installers for Windows and Android. Connect your existing thermal receipt printers, cash drawers, and barcode scanners.
                </p>
              </div>
            </div>

            <Downloads onDownloadTrigger={handleDownload} />
            <HardwareMatrix />
            <ComparisonTable />
          </div>
        )}

        {/* ================= PAGE 5: CONTACT SUPPORT ================= */}
        {currentPage === 'contact' && (
          <div>
            <div className="subpage-header">
              <div className="container">
                <div className="subpage-breadcrumb">
                  <button type="button" onClick={() => navigateToPage('home')}>Home</button>
                  <span>/</span>
                  <span>Contact Support</span>
                </div>
                <h1 className="subpage-title">Contact Us &amp; Developer Support</h1>
                <p className="subpage-desc">
                  Need help setting up your menu, configuring your receipt printer, or have questions? Reach out directly via our official contact portal.
                </p>
              </div>
            </div>

            <Contact onShowToast={showToast} />
          </div>
        )}

        {/* ================= PAGE 6: FAQ ================= */}
        {currentPage === 'faq' && (
          <div>
            <div className="subpage-header">
              <div className="container">
                <div className="subpage-breadcrumb">
                  <button type="button" onClick={() => navigateToPage('home')}>Home</button>
                  <span>/</span>
                  <span>Frequently Asked Questions</span>
                </div>
                <h1 className="subpage-title">Frequently Asked Questions</h1>
                <p className="subpage-desc">
                  Simple, straightforward answers about offline billing, printer compatibility, UPI QR payments, and zero software costs.
                </p>
              </div>
            </div>

            <FaqAccordion />
          </div>
        )}

        {/* ================= PAGE 7: 404 NOT FOUND ================= */}
        {currentPage === '404' && (
          <NotFoundPage
            onReturnHome={() => navigateToPage('home')}
            onDownloadTrigger={handleDownload}
            onNavigatePage={navigateToPage}
          />
        )}

      </main>

      {/* Clean Non-AI Multi-Page Footer */}
      <Footer
        onOpenCookieSettings={() => setIsCookieModalOpen(true)}
        onNavigatePage={navigateToPage}
        onNavigate404={() => navigateToPage('404')}
      />

      {/* Cookie Consent Banner */}
      {isCookieBannerVisible && (
        <div id="cookieBanner" className="cookie-banner-wrapper" role="dialog" aria-label="Local Storage Notice">
          <div className="container cookie-banner-inner">
            <div className="cookie-text">
              <strong>Offline Storage Notice:</strong>
              Billing Pro POS saves all bills, menu items, and daily sales records directly on your device. We do not track you or transmit your data to the cloud.
            </div>
            <div className="cookie-btn-group">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAcceptAllCookies}
              >
                Accept &amp; Continue
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleEssentialCookies}
              >
                Essential Only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      <CookieModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        onSavePreferences={() => {
          setIsCookieModalOpen(false);
          showToast('success', 'Saved', 'Preferences saved.');
        }}
      />

    </div>
  );
};
