import React from 'react';
import logoImg from '../../assets/brand/logo.png';

interface NavbarProps {
  currentPage: string;
  onNavigatePage: (page: string) => void;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onDownloadTrigger: (filename: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigatePage,
  onToggleMobileMenu,
  isMobileMenuOpen,
  onDownloadTrigger
}) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'demo', label: 'Demo Video' },
    { id: 'features', label: 'Features' },
    { id: 'printer', label: 'Print Test' },
    { id: 'downloads', label: 'Downloads' },
    { id: 'contact', label: 'Contact' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        
        {/* Brand Header with Crisp High-Contrast Logo */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onNavigatePage('home');
          }}
          className="brand-wrap"
          aria-label="Billing Pro POS Home"
          title="Return to home"
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>

          <div className="brand-text-block">
            <span className="brand-title">BILLING PRO POS</span>
            <span className="brand-subtitle">FREE OFFLINE BILLING &bull; 100% OPEN SOURCE</span>
          </div>
        </a>

        {/* Multipage Navigation Links - Consistent Industrial Light-Mode Active State */}
        <nav aria-label="Primary Navigation">
          <ul className="nav-links">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <li key={item.id} className="nav-item">
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigatePage(item.id);
                    }}
                    className={isActive ? 'active' : ''}
                    style={{
                      backgroundColor: isActive ? '#F0FDF4' : 'transparent',
                      color: isActive ? '#15803D' : '#374151',
                      borderColor: isActive ? '#86EFAC' : 'transparent',
                      fontWeight: isActive ? 700 : 600,
                      padding: '6px 12px',
                      borderRadius: '0px',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      fontSize: '13px',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Header Action Buttons */}
        <div className="header-cta-group">
          <a
            href="downloads/Billing_Pro_POS_Setup_v1.0.0.exe"
            className="btn btn-primary btn-sm"
            download
            onClick={() => onDownloadTrigger('Billing_Pro_POS_Setup_v1.0.0.exe')}
            title="Download Windows Installer (.exe)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/>
            </svg>
            <span>Setup .EXE</span>
          </a>

          <a
            href="downloads/Billing_Pro_v1.0.apk"
            className="btn btn-green btn-sm"
            download
            onClick={() => onDownloadTrigger('Billing_Pro_v1.0.apk')}
            title="Download Android Package (.apk)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.551 0 .9992.4476.9992.9993s-.4482 1.0003-.9999 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.5511 0 .9993.4476.9993.9993s-.4482 1.0003-.9993 1.0003m11.4045-6.02l1.996-3.4565c.0836-.1446.0341-.3291-.1105-.4127-.1446-.0836-.3291-.0341-.4127.1105l-2.025 3.5068c-1.3789-.6286-2.9161-.9796-4.5293-.9796-1.6133 0-3.1504.351-4.5293.9796l-2.025-3.5068c-.0836-.1446-.2681-.1941-.4127-.1105-.1446.0836-.1941.2681-.1105.4127l1.996 3.4565c-3.1706 1.728-5.3262 5.0342-5.4678 8.8719h18.6882c-.1416-3.8377-2.2972-7.1439-5.4677-8.8719"/>
            </svg>
            <span>Android .APK</span>
          </a>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="btn-mobile-menu"
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
