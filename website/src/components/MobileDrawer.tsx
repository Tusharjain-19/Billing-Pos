import React from 'react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigatePage: (page: string) => void;
  onDownloadTrigger: (filename: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  onNavigatePage,
  onDownloadTrigger
}) => {
  if (!isOpen) return null;

  const links = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'printer', label: 'Receipt Print & UPI QR Test' },
    { id: 'downloads', label: 'Downloads & Hardware' },
    { id: 'contact', label: 'Contact Us' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <div className="mobile-nav-drawer open" role="dialog" aria-label="Mobile Navigation">
      <ul className="mobile-nav-links">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigatePage(link.id);
                onClose();
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        <a
          href="downloads/Billing_Pro_POS_Setup_v1.0.0.exe"
          className="btn btn-primary"
          download
          onClick={() => {
            onClose();
            onDownloadTrigger('Billing_Pro_POS_Setup_v1.0.0.exe');
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/>
          </svg>
          <span>Download Windows Setup (.EXE)</span>
        </a>

        <a
          href="downloads/Billing_Pro_v1.0.apk"
          className="btn btn-green"
          download
          onClick={() => {
            onClose();
            onDownloadTrigger('Billing_Pro_v1.0.apk');
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.551 0 .9992.4476.9992.9993s-.4482 1.0003-.9999 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.5511 0 .9993.4476.9993.9993s-.4482 1.0003-.9993 1.0003m11.4045-6.02l1.996-3.4565c.0836-.1446.0341-.3291-.1105-.4127-.1446-.0836-.3291-.0341-.4127.1105l-2.025 3.5068c-1.3789-.6286-2.9161-.9796-4.5293-.9796-1.6133 0-3.1504.351-4.5293.9796l-2.025-3.5068c-.0836-.1446-.2681-.1941-.4127-.1105-.1446.0836-.1941.2681-.1105.4127l1.996 3.4565c-3.1706 1.728-5.3262 5.0342-5.4678 8.8719h18.6882c-.1416-3.8377-2.2972-7.1439-5.4677-8.8719"/>
          </svg>
          <span>Download Android App (.APK)</span>
        </a>

        <a
          href="https://www.tusharjain.in/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          onClick={onClose}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Contact Page (tusharjain.in)</span>
        </a>
      </div>
    </div>
  );
};
