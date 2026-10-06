import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, Download, Home, ShieldAlert } from 'lucide-react';
import { db } from '../db';
import { exportBillsToExcel } from '../utils/excel';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught POS Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  private handleEmergencyExport = async () => {
    try {
      const allBills = await db.bills.toArray();
      const profile = await db.profile.get('default_profile');
      if (allBills.length > 0 && profile) {
        await exportBillsToExcel(allBills, profile.name || 'Billing_Pro_Backup', 'Emergency_Recovery');
      } else {
        alert('No bills available in database to export.');
      }
    } catch (err) {
      alert('Export failed: ' + (err as any).message);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100vw',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#0F172A',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '0px',
              padding: '32px 24px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Error Icon Badge */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '0px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
                marginBottom: '16px',
              }}
            >
              <ShieldAlert size={28} strokeWidth={2.2} />
            </div>

            {/* Error Title */}
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '8px',
                letterSpacing: '-0.02em',
              }}
            >
              Application Error Occurred
            </h1>

            {/* Error Message Description */}
            <p
              style={{
                fontSize: '13px',
                color: '#64748B',
                lineHeight: '1.5',
                marginBottom: '20px',
                maxWidth: '420px',
              }}
            >
              The POS billing engine encountered an unexpected issue. Your local database records and bills are safely preserved in offline storage.
            </p>

            {/* Error Code Details Box */}
            {this.state.error && (
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '0px',
                  padding: '10px 12px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontFamily: '"SF Mono", "Consolas", monospace',
                  color: '#991B1B',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  wordBreak: 'break-all',
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                width: '100%',
                marginBottom: '12px',
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: '1px solid #1D4ED8',
                  borderRadius: '0px',
                  fontSize: '13px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.14s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <RefreshCw size={15} />
                <span>Reload App</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetState}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: '0px',
                  fontSize: '13px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.14s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <Home size={15} />
                <span>Return to POS</span>
              </button>
            </div>

            {/* Emergency Safe Data Recovery Export */}
            <button
              type="button"
              onClick={this.handleEmergencyExport}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#F0FDF4',
                color: '#15803D',
                border: '1px solid #86EFAC',
                borderRadius: '0px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Download size={14} />
              <span>Download Emergency Excel Backup</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
