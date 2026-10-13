import React from 'react';

interface NotFoundPageProps {
  onReturnHome: () => void;
  onDownloadTrigger: (filename: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onReturnHome,
  onDownloadTrigger
}) => {
  const currentIso = new Date().toISOString();

  return (
    <div className="error-page-wrapper">
      <div className="error-card">
        
        <div className="error-badge-strip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>Error Code: 404 &bull; Terminal Route Not Found</span>
        </div>

        <h1 className="error-title">Endpoint Missing from POS Routing Table</h1>

        <p className="error-text">
          The requested URL path or file does not correspond to an active component, download binary, or documentation page in the Billing Pro POS repository.
        </p>

        {/* Technical Diagnostic Readout */}
        <div className="error-diag-box">
          <div className="diag-line-alert">SUBSYSTEM STATUS: ROUTE_UNRESOLVED</div>
          <div className="diag-line-meta">TIMESTAMP: {currentIso}</div>
          <div className="diag-line-meta">PROTOCOL: HTTP/2 (OFFLINE LOCAL ROUTE)</div>
          <div className="diag-line-meta">DISPATCH: ROUTE_RESOLVER_EXIT_CODE(0x00000194)</div>
          <div style={{ marginTop: '8px', color: '#6EE7B7' }}>
            RECOMMENDED ACTION: Return to main terminal portal or select direct download packages below.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="error-actions">
          <button
            type="button"
            onClick={onReturnHome}
            className="btn btn-primary btn-lg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Return to Terminal Home</span>
          </button>

          <a
            href="downloads/Billing_Pro_POS_Setup_v1.0.0.exe"
            className="btn btn-secondary btn-lg"
            download
            onClick={() => onDownloadTrigger('Billing_Pro_POS_Setup_v1.0.0.exe')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/>
            </svg>
            <span>Download Windows .EXE</span>
          </a>

          <a
            href="downloads/Billing_Pro_v1.0.apk"
            className="btn btn-green btn-lg"
            download
            onClick={() => onDownloadTrigger('Billing_Pro_v1.0.apk')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.551 0 .9992.4476.9992.9993s-.4482 1.0003-.9999 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003s.4482-.9993 1-.9993c.5511 0 .9993.4476.9993.9993s-.4482 1.0003-.9993 1.0003m11.4045-6.02l1.996-3.4565c.0836-.1446.0341-.3291-.1105-.4127-.1446-.0836-.3291-.0341-.4127.1105l-2.025 3.5068c-1.3789-.6286-2.9161-.9796-4.5293-.9796-1.6133 0-3.1504.351-4.5293.9796l-2.025-3.5068c-.0836-.1446-.2681-.1941-.4127-.1105-.1446.0836-.1941.2681-.1105.4127l1.996 3.4565c-3.1706 1.728-5.3262 5.0342-5.4678 8.8719h18.6882c-.1416-3.8377-2.2972-7.1439-5.4677-8.8719"/>
            </svg>
            <span>Download Android .APK</span>
          </a>
        </div>

      </div>
    </div>
  );
};
