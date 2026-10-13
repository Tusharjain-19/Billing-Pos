import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  Printer,
  Save,
  CheckCircle2,
  Calculator,
  Split,
  AlertTriangle,
  Clock,
  Receipt
} from 'lucide-react';
import type { PaymentMode, RestaurantProfile } from '../types';
import { formatPaise, rupeesToPaise } from '../utils/currency';
import { generateUpiString, generateQrCodeDataUrl } from '../utils/printer';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  profile: RestaurantProfile;
  suggestedBillNo: string;
  onConfirmCheckout: (paymentMode: PaymentMode, paymentStatus: 'paid' | 'unpaid', shouldPrint: boolean, printWithQr: boolean) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  profile,
  suggestedBillNo,
  onConfirmCheckout,
}) => {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [cashTendered, setCashTendered] = useState<number>(grandTotal);
  const [cashInputVal, setCashInputVal] = useState<string>((grandTotal / 100).toFixed(0));
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [splitCash, setSplitCash] = useState<number>(Math.round(grandTotal / 2));
  const [splitUpi, setSplitUpi] = useState<number>(grandTotal - Math.round(grandTotal / 2));
  const [printWithQr, setPrintWithQr] = useState<boolean>(profile.showQrOnBill === true);
  const cashInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentMode('cash');
      setCashTendered(grandTotal);
      setCashInputVal((grandTotal / 100).toFixed(0));
      setSplitCash(Math.round(grandTotal / 2));
      setSplitUpi(grandTotal - Math.round(grandTotal / 2));
      setPrintWithQr(profile.showQrOnBill === true);

      if (profile.upiVpa && grandTotal > 0) {
        const upiUrl = generateUpiString(profile.upiVpa, profile.upiPayeeName, grandTotal, suggestedBillNo);
        generateQrCodeDataUrl(upiUrl).then(setUpiQrUrl);
      }
    }
  }, [grandTotal, profile, suggestedBillNo, isOpen]);

  // Keyboard Shortcuts for POS speed: Enter to Settle & Print, Esc to Close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        // Prevent default enter behavior if in single line input
        if (paymentMode === 'cash' && cashTendered < grandTotal) {
          // Underpaid, do not submit
          return;
        }
        e.preventDefault();
        onConfirmCheckout(paymentMode, 'paid', true, printWithQr);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, paymentMode, cashTendered, grandTotal, printWithQr, onConfirmCheckout, onClose]);

  if (!isOpen) return null;

  const isUnderpaid = paymentMode === 'cash' && cashTendered < grandTotal;
  const shortfall = Math.max(0, grandTotal - cashTendered);
  const changeDue = Math.max(0, cashTendered - grandTotal);

  const handleCashInputChange = (valStr: string) => {
    setCashInputVal(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num >= 0) {
      setCashTendered(rupeesToPaise(num));
    } else {
      setCashTendered(0);
    }
  };

  const setExactCash = () => {
    setCashTendered(grandTotal);
    setCashInputVal((grandTotal / 100).toFixed(0));
  };

  const setPresetCash = (rupees: number) => {
    const paise = rupeesToPaise(rupees);
    setCashTendered(paise);
    setCashInputVal(rupees.toString());
  };

  const addCashAmount = (extraPaise: number) => {
    const newVal = cashTendered + extraPaise;
    setCashTendered(newVal);
    setCashInputVal((newVal / 100).toFixed(0));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 105,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Banknote size={20} color="var(--primary)" />
              <span>Settle Payment & Checkout</span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Order settlement before bill print
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '50%',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {/* Grand Total Hero Display */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(16, 185, 129, 0.12) 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                TOTAL AMOUNT DUE
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', marginTop: '2px', letterSpacing: '-0.02em' }}>
                {formatPaise(grandTotal, profile.currencySymbol)}
              </div>
            </div>
            <div style={{
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10B981',
              color: '#047857',
              fontWeight: 800,
              fontSize: '13px',
              textAlign: 'center',
            }}>
              Ready to Settle
            </div>
          </div>

          {/* Payment Mode Selector Tabs */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Select Payment Mode
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
            }}>
              {[
                { id: 'cash', label: 'Cash', icon: Banknote, color: '#16A34A' },
                { id: 'upi', label: 'UPI / QR', icon: QrCode, color: '#2563EB' },
                { id: 'card', label: 'Card', icon: CreditCard, color: '#9333EA' },
                { id: 'split', label: 'Split', icon: Split, color: '#D97706' },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMode(m.id as PaymentMode);
                      if (m.id === 'upi') {
                        setPrintWithQr(true);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '12px 6px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-app)',
                      border: `2px solid ${isSelected ? m.color : 'var(--border-color)'}`,
                      color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 2px 8px ${m.color}25` : 'none',
                    }}
                  >
                    <Icon size={20} color={isSelected ? m.color : 'var(--text-muted)'} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contextual Mode Content */}
          {/* CASH MODE */}
          {paymentMode === 'cash' && (
            <div style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Cash Tendered by Customer
                </span>
                <button
                  type="button"
                  onClick={setExactCash}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#15803D',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Exact Cash
                </button>
              </div>

              {/* Interactive Cash Tendered Input */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '12px',
                border: '2px solid var(--border-color)',
                padding: '4px 12px',
                marginBottom: '10px',
              }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-muted)', marginRight: '6px' }}>
                  {profile.currencySymbol || '₹'}
                </span>
                <input
                  ref={cashInputRef}
                  type="number"
                  min="0"
                  step="any"
                  value={cashInputVal}
                  onChange={(e) => handleCashInputChange(e.target.value)}
                  placeholder="0.00"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    fontSize: '22px',
                    fontWeight: 900,
                    color: 'var(--text-main)',
                    outline: 'none',
                    width: '100%',
                  }}
                />
              </div>

              {/* Quick Note Presets */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {[
                  { label: 'Exact', action: () => setExactCash() },
                  { label: '₹100', action: () => setPresetCash(100) },
                  { label: '₹200', action: () => setPresetCash(200) },
                  { label: '₹500', action: () => setPresetCash(500) },
                  { label: '₹1000', action: () => setPresetCash(1000) },
                  { label: '+₹50', action: () => addCashAmount(5000) },
                  { label: '+₹100', action: () => addCashAmount(10000) },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={preset.action}
                    style={{
                      flex: 1,
                      minWidth: '54px',
                      padding: '7px 8px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Underpayment Alert or Change Due Box */}
              {isUnderpaid ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#FEF2F2',
                  border: '1.5px solid #F87171',
                  color: '#991B1B',
                  fontSize: '13px',
                  fontWeight: 750,
                }}>
                  <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
                  <div>
                    <span>Received cash is </span>
                    <strong style={{ textDecoration: 'underline' }}>{formatPaise(shortfall, profile.currencySymbol)} SHORT</strong>
                    <span> of total due.</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: changeDue > 0 ? '#ECFDF5' : '#F8FAFC',
                  border: `1.5px solid ${changeDue > 0 ? '#10B981' : '#E2E8F0'}`,
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: changeDue > 0 ? '#065F46' : '#64748B' }}>
                    CHANGE TO RETURN:
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: changeDue > 0 ? '#059669' : '#0F172A' }}>
                    {formatPaise(changeDue, profile.currencySymbol)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UPI MODE */}
          {paymentMode === 'upi' && (
            <div style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}>
              {upiQrUrl ? (
                <>
                  <div style={{
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    marginBottom: '10px',
                  }}>
                    <img src={upiQrUrl} alt="Scan UPI" style={{ width: '160px', height: '160px', display: 'block' }} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                    Customer scans to pay {formatPaise(grandTotal, profile.currencySymbol)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    UPI ID: <strong>{profile.upiVpa}</strong>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#92400E',
                    backgroundColor: '#FEF3C7',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    marginTop: '10px',
                    fontWeight: 700,
                  }}>
                    * Verify payment received on your merchant soundbox/app before marking settled.
                  </div>
                </>
              ) : (
                <div style={{ color: '#DC2626', fontSize: '13px', fontWeight: 600 }}>
                  Please set your UPI ID in Settings to enable instant QR codes.
                </div>
              )}
            </div>
          )}

          {/* CARD MODE */}
          {paymentMode === 'card' && (
            <div style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '20px 16px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
            }}>
              <CreditCard size={40} color="#9333EA" style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                Charge on EDC Card Machine
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Swipe or Tap for <strong>{formatPaise(grandTotal, profile.currencySymbol)}</strong>
              </div>
            </div>
          )}

          {/* SPLIT MODE */}
          {paymentMode === 'split' && (
            <div style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                Split Payment (Cash + UPI)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Cash Part:</span>
                <input
                  type="number"
                  value={(splitCash / 100).toFixed(0)}
                  onChange={(e) => {
                    const val = rupeesToPaise(e.target.value);
                    setSplitCash(val);
                    setSplitUpi(Math.max(0, grandTotal - val));
                  }}
                  style={{ width: '130px', textAlign: 'right', fontWeight: 800, fontSize: '15px', padding: '6px 8px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>UPI Part:</span>
                <span style={{ fontSize: '17px', fontWeight: 900, color: '#2563EB' }}>
                  {formatPaise(splitUpi, profile.currencySymbol)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Thermal Bill Format Bar (Always visible above footer buttons) */}
        <div
          style={{
            padding: '11px 18px',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={15} color={printWithQr ? '#16A34A' : '#3B82F6'} />
              <span>Thermal Receipt Format:</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {printWithQr ? '✓ Dynamic UPI QR code will print on paper bill' : '✓ Compact receipt without QR code'}
            </div>
          </div>

          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-app)',
            padding: '3px',
            borderRadius: '10px',
            border: '1.5px solid var(--border-color)',
            gap: '4px',
          }}>
            <button
              type="button"
              onClick={() => setPrintWithQr(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: printWithQr ? '#15803D' : 'transparent',
                color: printWithQr ? '#FFFFFF' : 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: printWithQr ? '0 2px 6px rgba(21, 128, 61, 0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <QrCode size={14} />
              <span>With UPI QR</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintWithQr(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: !printWithQr ? '#2563EB' : 'transparent',
                color: !printWithQr ? '#FFFFFF' : 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: !printWithQr ? '0 2px 6px rgba(37, 99, 235, 0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Receipt size={14} />
              <span>Bill Only (No QR)</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '10px',
          backgroundColor: 'var(--bg-surface)',
        }}>
          {isUnderpaid ? (
            <button
              disabled
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                backgroundColor: '#F87171',
                color: '#FFFFFF',
                border: '1px solid #EF4444',
                fontWeight: 800,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'not-allowed',
              }}
            >
              <AlertTriangle size={18} />
              <span>Short by {formatPaise(shortfall, profile.currencySymbol)} — Enter Full Cash</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onConfirmCheckout(paymentMode, 'paid', false, printWithQr)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1.5px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontWeight: 750,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                title="Save order as settled without sending to thermal printer"
              >
                <Save size={16} />
                <span>Save Only</span>
              </button>

              <button
                type="button"
                onClick={() => onConfirmCheckout(paymentMode, 'paid', true, printWithQr)}
                style={{
                  flex: 1,
                  padding: '13px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#15803D',
                  color: '#FFFFFF',
                  border: '1px solid #166534',
                  fontWeight: 900,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(21, 128, 61, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Printer size={19} strokeWidth={2.4} />
                <span>{printWithQr ? 'SETTLE & PRINT (WITH QR)' : 'SETTLE & PRINT BILL'}</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '4px',
                  marginLeft: '4px',
                }}>
                  ↵ ENTER
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
