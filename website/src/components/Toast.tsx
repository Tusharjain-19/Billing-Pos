import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: 'calc(100% - 48px)',
        pointerEvents: 'none'
      }}
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const borderColor = isSuccess ? '#15803D' : isError ? '#DC2626' : '#1E293B';
        const bgColor = isSuccess ? '#F0FDF4' : isError ? '#FEF2F2' : '#FFFFFF';
        const iconColor = isSuccess ? '#15803D' : isError ? '#DC2626' : '#1E293B';

        return (
          <div
            key={toast.id}
            style={{
              backgroundColor: bgColor,
              border: `2px solid ${borderColor}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              pointerEvents: 'auto',
              borderRadius: '0px'
            }}
          >
            <div style={{ color: iconColor, flexShrink: 0, marginTop: '2px' }}>
              {isSuccess && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {isError && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              {!isSuccess && !isError && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>

            <div style={{ flexGrow: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', textTransform: 'uppercase' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px', lineHeight: '1.4' }}>
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 700,
                lineHeight: 1,
                padding: '0 4px'
              }}
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
};
