import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  Edit3,
  X
} from 'lucide-react';

export type DialogType = 'info' | 'warning' | 'error' | 'confirm' | 'prompt';

export interface DialogOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  defaultValue?: string;
  placeholder?: string;
  inputType?: string;
}

type DialogState = (DialogOptions & {
  isOpen: boolean;
  resolve: (value: any) => void;
}) | null;

// Event listeners for global non-hook trigger
type DialogListener = (state: DialogState) => void;
let globalDialogListener: DialogListener | null = null;

/**
 * Show custom in-app Alert modal (replaces native window.alert)
 */
export function customAlert(
  message: string,
  title: string = 'Notice',
  type: 'info' | 'warning' | 'error' = 'warning'
): Promise<void> {
  return new Promise((resolve) => {
    if (globalDialogListener) {
      globalDialogListener({
        isOpen: true,
        title,
        message,
        type,
        confirmText: 'Got It',
        resolve: () => resolve(),
      });
    } else {
      resolve();
    }
  });
}

/**
 * Show custom in-app Confirmation modal (replaces native window.confirm)
 */
export function customConfirm(
  message: string,
  title: string = 'Please Confirm',
  confirmText: string = 'Confirm',
  cancelText: string = 'Cancel',
  isDanger: boolean = false
): Promise<boolean> {
  return new Promise((resolve) => {
    if (globalDialogListener) {
      globalDialogListener({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        confirmText,
        cancelText,
        isDanger,
        resolve: (confirmed) => resolve(confirmed),
      });
    } else {
      resolve(true);
    }
  });
}

/**
 * Show custom in-app Prompt modal (replaces native window.prompt)
 */
export function customPrompt(
  message: string,
  defaultValue: string = '',
  title: string = 'Enter Value',
  placeholder: string = '',
  inputType: string = 'text'
): Promise<string | null> {
  return new Promise((resolve) => {
    if (globalDialogListener) {
      globalDialogListener({
        isOpen: true,
        title,
        message,
        type: 'prompt',
        defaultValue,
        placeholder,
        inputType,
        confirmText: 'Submit',
        cancelText: 'Cancel',
        resolve: (val) => resolve(val),
      });
    } else {
      resolve(defaultValue || null);
    }
  });
}

/**
 * Global Host Component to render the custom dialog UI
 * Mount once in App.tsx
 */
export const CustomDialogHost: React.FC = () => {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    globalDialogListener = setDialog;
    return () => {
      globalDialogListener = null;
    };
  }, []);

  useEffect(() => {
    if (dialog && dialog.type === 'prompt') {
      setInputValue(dialog.defaultValue || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [dialog]);

  if (!dialog || !dialog.isOpen) return null;

  const handleClose = (confirmed: boolean, value?: string | null) => {
    const res = dialog.resolve;
    setDialog(null);
    if (res) {
      if (dialog.type === 'prompt') {
        res(confirmed ? (value !== undefined ? value : inputValue) : null);
      } else {
        res(confirmed);
      }
    }
  };

  const isConfirm = dialog.type === 'confirm';
  const isPrompt = dialog.type === 'prompt';

  // Choose icon & accent colors based on type
  let icon = <Info size={24} color="#3B82F6" />;
  let iconBg = 'rgba(59, 130, 246, 0.12)';

  if (dialog.type === 'warning') {
    icon = <AlertTriangle size={24} color="#F59E0B" />;
    iconBg = 'rgba(245, 158, 11, 0.15)';
  } else if (dialog.type === 'error' || dialog.isDanger) {
    icon = <AlertCircle size={24} color="#EF4444" />;
    iconBg = 'rgba(239, 68, 68, 0.15)';
  } else if (dialog.type === 'confirm') {
    icon = <HelpCircle size={24} color={dialog.isDanger ? '#EF4444' : '#10B981'} />;
    iconBg = dialog.isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
  } else if (dialog.type === 'prompt') {
    icon = <Edit3 size={24} color="#3B82F6" />;
    iconBg = 'rgba(59, 130, 246, 0.15)';
  }

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isConfirm && !isPrompt) {
          handleClose(false);
        }
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '390px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          padding: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Close X (for alerts & prompts) */}
        {!isConfirm && (
          <button
            onClick={() => handleClose(false)}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={17} />
          </button>
        )}

        {/* Icon Emblem Badge */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          {icon}
        </div>

        {/* Dialog Title */}
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 800,
            margin: '0 0 8px 0',
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
          }}
        >
          {dialog.title || (isConfirm ? 'Confirm Action' : isPrompt ? 'Update Value' : 'Notice')}
        </h3>

        {/* Dialog Message */}
        <p
          style={{
            fontSize: '13.5px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            margin: '0 0 16px 0',
            wordBreak: 'break-word',
          }}
        >
          {dialog.message}
        </p>

        {/* Prompt Input Field */}
        {isPrompt && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleClose(true, inputValue);
            }}
            style={{ width: '100%', marginBottom: '20px' }}
          >
            <input
              ref={inputRef}
              type={dialog.inputType || 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={dialog.placeholder || 'Enter value...'}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleClose(false);
                }
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '2px solid #3B82F6',
                color: 'var(--text-main)',
                fontSize: '16px',
                fontWeight: 700,
                outline: 'none',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            />
          </form>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            width: '100%',
          }}
        >
          {(isConfirm || isPrompt) && (
            <button
              onClick={() => handleClose(false)}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {dialog.cancelText || 'Cancel'}
            </button>
          )}

          <button
            onClick={() => handleClose(true, inputValue)}
            className={dialog.isDanger ? '' : 'glow-btn-green'}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: dialog.isDanger ? '#EF4444' : '#10B981',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              boxShadow: dialog.isDanger
                ? '0 4px 14px rgba(239, 68, 68, 0.35)'
                : '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            {dialog.confirmText || (isConfirm ? 'Confirm' : isPrompt ? 'Save' : 'OK')}
          </button>
        </div>
      </div>
    </div>
  );
};
