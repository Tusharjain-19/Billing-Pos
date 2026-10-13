import React from 'react';

interface NotFoundPageProps {
  onReturnHome: () => void;
  onDownloadTrigger: (filename: string) => void;
  onNavigatePage?: (page: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onReturnHome,
  onDownloadTrigger,
  onNavigatePage
}) => {
  const currentIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '80vh', padding: '48px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          maxWidth: '840px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D1D5DB',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
          padding: '36px',
        }}
      >
        
        {/* Error Code & Warning Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #E5E7EB', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#DC2626', display: 'inline-block' }}></span>
            <span>HTTP 404 &bull; TERMINAL ROUTE VOID</span>
          </div>

          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#6B7280', fontWeight: 600 }}>
            TIMESTAMP: {currentIso}
          </div>
        </div>

        {/* Main Error Headline */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: '10px' }}>
            Endpoint Missing from POS Routing Table
          </h1>
          <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            The requested page URL or docket file does not exist in the Billing Pro POS repository. It may have been relocated, renamed, or voided.
          </p>
        </div>

        {/* Realistic Simulated Thermal POS Receipt Strip */}
        <div
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px dashed #CBD5E1',
            padding: '20px 24px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: '#1E293B',
            marginBottom: '32px',
            lineHeight: 1.6,
          }}
        >
          <div style={{ textAlign: 'center', fontWeight: 700, borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '12px' }}>
            BILLING PRO POS &bull; AUDIT LEDGER #404-ERR<br />
            100% OFFLINE LOCAL DISPATCHER
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>DIAGNOSTIC STATUS:</span>
            <span style={{ color: '#DC2626', fontWeight: 700 }}>TRANSACTION_VOIDED</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>DISPATCH ERROR:</span>
            <span>ROUTE_NOT_FOUND (0x00000194)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>DATA INTEGRITY:</span>
            <span style={{ color: '#15803D', fontWeight: 700 }}>LOCAL DB INTACT &bull; NO DATA LOSS</span>
          </div>

          <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '8px', color: '#64748B' }}>
            SUGGESTED ACTION: Return to main POS terminal counter or explore direct downloads below.
          </div>
        </div>

        {/* Primary Action Button Cluster */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <button
            type="button"
            onClick={onReturnHome}
            className="btn btn-primary btn-lg"
            style={{ padding: '12px 24px', fontWeight: 700 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Return to Terminal Home</span>
          </button>

          {onNavigatePage && (
            <button
              type="button"
              onClick={() => onNavigatePage('demo')}
              className="btn btn-green btn-lg"
              style={{ padding: '12px 20px', fontWeight: 700 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Watch Video Demo</span>
            </button>
          )}

          {onNavigatePage && (
            <button
              type="button"
              onClick={() => onNavigatePage('printer')}
              className="btn btn-secondary btn-lg"
              style={{ padding: '12px 20px', fontWeight: 600 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Test Receipt Printer</span>
            </button>
          )}
        </div>

        {/* Direct Installer Download Tiles */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
            Free Software Downloads &amp; Offline Installers:
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <a
              href="downloads/Billing_Pro_POS_Setup_v1.0.0.exe"
              className="btn btn-secondary"
              download
              onClick={() => onDownloadTrigger('Billing_Pro_POS_Setup_v1.0.0.exe')}
              style={{ padding: '10px 14px', justifyContent: 'flex-start', textAlign: 'left' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/>
              </svg>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>Windows PC Setup (.EXE)</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>1-Click Offline Installer &bull; 215 MB</div>
              </div>
            </a>

            <a
              href="downloads/Billing_Pro_v1.0.apk"
              className="btn btn-secondary"
              download
              onClick={() => onDownloadTrigger('Billing_Pro_v1.0.apk')}
              style={{ padding: '10px 14px', justifyContent: 'flex-start', textAlign: 'left' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#15803D', flexShrink: 0 }}>
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.551 0 .9992.4476.9992.9993s-.4482 1.0003-.9999 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.5511 0 .9993.4476.9993.9993s-.4482 1.0003-.9993 1.0003m11.4045-6.02l1.996-3.4565c.0836-.1446.0341-.3291-.1105-.4127-.1446-.0836-.3291-.0341-.4127.1105l-2.025 3.5068c-1.3789-.6286-2.9161-.9796-4.5293-.9796-1.6133 0-3.1504.351-4.5293.9796l-2.025-3.5068c-.0836-.1446-.2681-.1941-.4127-.1105-.1446.0836-.1941.2681-.1105.4127l1.996 3.4565c-3.1706 1.728-5.3262 5.0342-5.4678 8.8719h18.6882c-.1416-3.8377-2.2972-7.1439-5.4677-8.8719"/>
              </svg>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>Android Mobile App (.APK)</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>Smartphones &amp; POS Devices &bull; 12.5 MB</div>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
