import React, { useState, useEffect } from 'react';

interface CookieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePreferences: (prefs: { essential: boolean; hardware: boolean; analytics: boolean }) => void;
}

export const CookieModal: React.FC<CookieModalProps> = ({
  isOpen,
  onClose,
  onSavePreferences
}) => {
  const [hardware, setHardware] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('billingpro_storage_consent');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hardware !== undefined) setHardware(!!parsed.hardware);
        if (parsed.analytics !== undefined) setAnalytics(!!parsed.analytics);
      } catch (e) {
        // ignore
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay active"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookieModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <h3 id="cookieModalTitle" className="modal-title">
            Local Storage & Hardware Cache Preferences
          </h3>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" aria-label="Close dialog">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="cookie-pref-item">
            <div className="pref-head">
              <span className="pref-title">1. Essential POS IndexedDB Storage</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase' }}>
                Required
              </span>
            </div>
            <div className="pref-desc">
              Essential for storing offline menu dockets, active sales records, categories, and tax rates directly in browser IndexedDB. Disabling this would prevent offline POS functionality.
            </div>
          </div>

          <div className="cookie-pref-item">
            <div className="pref-head">
              <span className="pref-title">2. Hardware Printer & Display Cache</span>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={hardware}
                  onChange={(e) => setHardware(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Enabled</span>
              </label>
            </div>
            <div className="pref-desc">
              Stores preferred thermal receipt paper width (58mm or 80mm), USB serial COM port baud rates, and cash drawer solenoid pulse duration in LocalStorage.
            </div>
          </div>

          <div className="cookie-pref-item">
            <div className="pref-head">
              <span className="pref-title">3. Local Performance Diagnostics</span>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Enabled</span>
              </label>
            </div>
            <div className="pref-desc">
              Stores transaction execution time milestones locally on disk to monitor counter cashier speed. Never transmitted over the internet.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={() => onSavePreferences({ essential: true, hardware, analytics })}
            className="btn btn-primary btn-sm"
          >
            Save & Apply Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
