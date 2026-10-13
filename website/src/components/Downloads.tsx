import React from 'react';

interface DownloadsProps {
  onDownloadTrigger: (filename: string) => void;
}

export const Downloads: React.FC<DownloadsProps> = ({ onDownloadTrigger }) => {
  return (
    <section id="downloads" className="section section-alt">
      <div className="container">
        
        <div className="section-head">
          <div className="section-pretitle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>100% Free Downloads</span>
          </div>
          <h2 className="section-title">Download Free Billing Software for PC &amp; Mobile</h2>
          <p className="section-description">
            100% Free and open-source. No license keys, no registration, no monthly charges. Download and start making bills in under 2 minutes.
          </p>
        </div>

        {/* 2 Main Platform Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* Card 1: Windows Workstation */}
          <div className="platform-card recommended">
            <span className="platform-badge-recommended">Recommended for Shop Counter</span>
            <div className="platform-header">
              <div className="platform-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/>
                </svg>
              </div>
              <div className="platform-title-wrap">
                <h3>Windows PC &amp; Laptop</h3>
                <span>For Windows 10 &amp; Windows 11</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-body)', marginBottom: '12px' }}>
              Full billing software for desktop computers and laptops. Direct connection to any USB thermal receipt printer, cash drawer, and barcode scanner.
            </p>

            <ul className="platform-specs-list">
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Installer Format</b>: 1-Click Windows Setup (.EXE)</span>
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>File Size</b>: 215 MB Complete Offline Package</span>
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Hardware</b>: USB Receipt Printers, Cash Drawers &amp; Scanners</span>
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Shortcut Keys</b>: Fast billing using F2, F9, and F12 keys</span>
              </li>
            </ul>

            <div className="platform-actions">
              <a
                href="downloads/Billing_Pro_POS_Setup_v1.0.0.exe"
                className="btn btn-primary btn-lg"
                download
                onClick={() => onDownloadTrigger('Billing_Pro_POS_Setup_v1.0.0.exe')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Download for Windows PC (.EXE)</span>
              </a>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
                Creates a desktop shortcut &bull; 100% Free Forever
              </span>
            </div>
          </div>

          {/* Card 2: Android Mobile */}
          <div className="platform-card">
            <div className="platform-header">
              <div className="platform-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.551 0 .9992.4476.9992.9993s-.4482 1.0003-.9999 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.5511 0 .9993.4476.9993.9993s-.4482 1.0003-.9993 1.0003m11.4045-6.02l1.996-3.4565c.0836-.1446.0341-.3291-.1105-.4127-.1446-.0836-.3291-.0341-.4127.1105l-2.025 3.5068c-1.3789-.6286-2.9161-.9796-4.5293-.9796-1.6133 0-3.1504.351-4.5293.9796l-2.025-3.5068c-.0836-.1446-.2681-.1941-.4127-.1105-.1446.0836-.1941.2681-.1105.4127l1.996 3.4565c-3.1706 1.728-5.3262 5.0342-5.4678 8.8719h18.6882c-.1416-3.8377-2.2972-7.1439-5.4677-8.8719"/>
                </svg>
              </div>
              <div className="platform-title-wrap">
                <h3>Android Mobile &amp; Tablets</h3>
                <span>For Any Android Phone &amp; Sunmi POS</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-body)', marginBottom: '12px' }}>
              Easy mobile billing app for table orders, cafes, and mobile vans. Connects to portable Bluetooth thermal printers.
            </p>

            <ul className="platform-specs-list">
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Package Format</b>: Direct Android App (.APK)</span>
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>File Size</b>: 12.5 MB Lightweight Quick Install</span>
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Printers</b>: Bluetooth Portable 2&quot; &amp; 3&quot; Printers</span>
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Features</b>: Large touch buttons &amp; bottom cart drawer</span>
              </li>
            </ul>

            <div className="platform-actions">
              <a
                href="downloads/Billing_Pro_v1.0.apk"
                className="btn btn-green btn-lg"
                download
                onClick={() => onDownloadTrigger('Billing_Pro_v1.0.apk')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Download Android App (.APK)</span>
              </a>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
                Simple direct install on phone or handheld terminal
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
