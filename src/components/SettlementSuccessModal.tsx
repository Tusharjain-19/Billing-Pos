import React, { useEffect, useState } from 'react';
import { Check, Printer, Eye, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatPaise } from '../utils/currency';

interface SettlementSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNo: number | string;
  amountPaise: number;
  currencySymbol: string;
  paymentMode: string;
  printerName?: string;
  onReprint?: () => void;
  onViewBill?: () => void;
  title?: string;
  subtitle?: string;
}

export const SettlementSuccessModal: React.FC<SettlementSuccessModalProps> = ({
  isOpen,
  onClose,
  orderNo,
  amountPaise,
  currencySymbol,
  paymentMode,
  printerName,
  onReprint,
  onViewBill,
  title,
  subtitle,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) return;

    // Trigger celebratory confetti burst
    try {
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#059669', '#34D399', '#2563EB', '#F59E0B'],
      });
    } catch {}

    // Auto-dismiss countdown (2.2 seconds)
    const duration = 2200;
    const intervalTime = 50;
    const step = 100 / (duration / intervalTime);

    setProgress(100);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(interval);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const orderNumStr = typeof orderNo === 'number' ? orderNo.toString().padStart(5, '0') : orderNo;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          boxShadow: '0 25px 60px -12px rgba(16, 185, 129, 0.35), 0 10px 25px rgba(0, 0, 0, 0.1)',
          border: '1.5px solid #E2E8F0',
          padding: '32px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Progress Countdown Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '4px',
            width: `${progress}%`,
            backgroundColor: '#10B981',
            transition: 'width 50ms linear',
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* Animated Green Circle with Pulsing Rings & Check Icon */}
        <div
          style={{
            position: 'relative',
            width: '96px',
            height: '96px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer glow ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              animation: 'pulseRing 1.8s infinite ease-in-out',
            }}
          />
          {/* Middle soft ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.25)',
            }}
          />
          {/* Main solid green circle */}
          <div
            style={{
              position: 'relative',
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <Check size={48} color="#FFFFFF" strokeWidth={3.5} />
          </div>
        </div>

        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Sparkles size={16} color="#10B981" />
          <h2
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 900,
              color: '#0F172A',
              letterSpacing: '-0.02em',
            }}
          >
            {title || 'Order Settled & Printed!'}
          </h2>
          <Sparkles size={16} color="#10B981" />
        </div>

        {/* Subtitle */}
        <p
          style={{
            margin: '0 0 18px 0',
            fontSize: '13px',
            color: '#64748B',
            fontWeight: 500,
          }}
        >
          {subtitle || `Order #${orderNumStr} has been recorded & thermal bill printed.`}
        </p>

        {/* Details Card */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#F8FAFC',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Paid ({paymentMode.toUpperCase()})
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {formatPaise(amountPaise, (currencySymbol as any) || '₹')}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Printer Status
            </div>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                justifyContent: 'flex-end',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#16A34A',
                }}
              />
              <span>{printerName || 'MT580P (OK)'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          {onReprint && (
            <button
              type="button"
              onClick={() => {
                onReprint();
              }}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: '12px',
                backgroundColor: '#F0F9FF',
                border: '1.5px solid #BAE6FD',
                color: '#0284C7',
                fontSize: '13px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Printer size={15} />
              <span>Re-print</span>
            </button>
          )}

          {onViewBill && (
            <button
              type="button"
              onClick={() => {
                onViewBill();
                onClose();
              }}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: '12px',
                backgroundColor: '#10B981',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Eye size={15} />
              <span>View Bill</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '11px 18px',
              borderRadius: '12px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
