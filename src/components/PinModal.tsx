import React, { useState } from 'react';
import { Lock, X, Delete, Check } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  correctPin: string;
  title?: string;
  subtitle?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  correctPin,
  title = 'Security Verification',
  subtitle = 'Enter 4-digit Owner PIN to proceed',
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin === correctPin) {
        setTimeout(() => {
          setPin('');
          onSuccess();
        }, 150);
      } else if (nextPin.length === correctPin.length) {
        setError(true);
        setTimeout(() => {
          setPin('');
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '24px',
        width: '100%',
        maxWidth: '340px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            color: 'var(--text-muted)',
            padding: '6px',
            borderRadius: '50%',
          }}
        >
          <X size={20} />
        </button>

        {/* Lock Icon */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
          color: error ? 'var(--accent-rose)' : 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          transition: 'all 0.2s ease',
        }}>
          <Lock size={26} />
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
          {title}
        </h3>
        <p style={{ fontSize: '13px', color: error ? 'var(--accent-rose)' : 'var(--text-muted)', margin: '4px 0 20px 0', textAlign: 'center' }}>
          {error ? 'Incorrect PIN! Try again.' : subtitle}
        </p>

        {/* PIN Dots Display */}
        <div style={{
          display: 'flex',
          gap: '14px',
          marginBottom: '24px',
        }}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: pin.length > idx
                  ? (error ? 'var(--accent-rose)' : 'var(--primary)')
                  : 'var(--bg-surface-elevated)',
                border: `2px solid ${pin.length > idx ? (error ? 'var(--accent-rose)' : 'var(--primary)') : 'var(--border-color)'}`,
                transition: 'all 0.15s ease',
                transform: pin.length > idx ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Tactile Touch Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          width: '100%',
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              style={{
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '22px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            onClick={handleClear}
            style={{
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            CLEAR
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            style={{
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '22px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            0
          </button>

          <button
            onClick={handleDelete}
            style={{
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
