import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Code2,
  CheckCircle2,
  Loader2,
  Download,
  Share2,
  Sparkles
} from 'lucide-react';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  itemCountDescription: string;
  onExportExcel: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  onExportJson?: () => Promise<void>;
  excelDescription?: string;
  pdfDescription?: string;
  jsonDescription?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  itemCountDescription,
  onExportExcel,
  onExportPdf,
  onExportJson,
  excelDescription = 'Formatted multi-sheet spreadsheet compatible with Microsoft Excel, Apple Numbers & Google Sheets.',
  pdfDescription = 'Official printable document with branding, itemized tables, taxes and summaries.',
  jsonDescription = 'Raw structured data backup file suitable for system restore and terminal data migration.',
}) => {
  const [activeAction, setActiveAction] = useState<'excel' | 'pdf' | 'json' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = async (type: 'excel' | 'pdf' | 'json', fn: () => Promise<void>) => {
    try {
      setActiveAction(type);
      setSuccessMessage(null);
      await fn();
      setSuccessMessage(`Successfully exported as ${type.toUpperCase()}!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Export error in modal:', err);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: '#2563EB',
                  backgroundColor: '#EFF6FF',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                Export & Share
              </span>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                {itemCountDescription}
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {title}
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
              {subtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              borderBottom: '1px solid #A7F3D0',
              padding: '10px 24px',
              color: '#065F46',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} color="#059669" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Options List */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 1. EXCEL OPTION */}
          <button
            type="button"
            disabled={activeAction !== null}
            onClick={() => handleAction('excel', onExportExcel)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              borderRadius: '14px',
              border: '1.5px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              cursor: activeAction !== null ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#16A34A';
              e.currentTarget.style.backgroundColor = '#F0FDF4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {activeAction === 'excel' ? (
                  <Loader2 size={22} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <FileSpreadsheet size={22} />
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                    Export to Excel (.xlsx)
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      backgroundColor: '#DCFCE7',
                      color: '#166534',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    SPREADSHEET
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0', lineHeight: '1.4' }}>
                  {excelDescription}
                </p>
              </div>
            </div>

            <div style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '8px' }}>
              <Download size={18} />
            </div>
          </button>

          {/* 2. PDF OPTION */}
          <button
            type="button"
            disabled={activeAction !== null}
            onClick={() => handleAction('pdf', onExportPdf)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              borderRadius: '14px',
              border: '1.5px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              cursor: activeAction !== null ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#DC2626';
              e.currentTarget.style.backgroundColor = '#FEF2F2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {activeAction === 'pdf' ? (
                  <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <FileText size={22} />
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                    Export to PDF (.pdf)
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      backgroundColor: '#FEE2E2',
                      color: '#991B1B',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    PRINT READY
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0', lineHeight: '1.4' }}>
                  {pdfDescription}
                </p>
              </div>
            </div>

            <div style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '8px' }}>
              <Download size={18} />
            </div>
          </button>

          {/* 3. JSON OPTION (IF PROVIDED) */}
          {onExportJson && (
            <button
              type="button"
              disabled={activeAction !== null}
              onClick={() => handleAction('json', onExportJson)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '14px',
                border: '1.5px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                cursor: activeAction !== null ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#64748B';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {activeAction === 'json' ? (
                    <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Code2 size={22} />
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>
                      Raw JSON Backup (.json)
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      BACKUP
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '3px 0 0 0', lineHeight: '1.4' }}>
                    {jsonDescription}
                  </p>
                </div>
              </div>

              <div style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '8px' }}>
                <Download size={18} />
              </div>
            </button>
          )}
        </div>

        {/* Footer Notice */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: '#64748B',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Share2 size={13} color="#2563EB" /> Supports mobile sharing & desktop download
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#0F172A',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
