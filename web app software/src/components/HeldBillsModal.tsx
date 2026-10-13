import React from 'react';
import { X, Layers, Clock, ArrowRight, Trash2 } from 'lucide-react';
import type { HeldBill, RestaurantProfile } from '../types';
import { formatPaise } from '../utils/currency';
import { db } from '../db';
import { customConfirm } from './CustomDialog';

interface HeldBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldBills: HeldBill[];
  profile: RestaurantProfile;
  onResumeHeldBill: (heldBill: HeldBill) => void;
  onRefreshData: () => void;
}

export const HeldBillsModal: React.FC<HeldBillsModalProps> = ({
  isOpen,
  onClose,
  heldBills,
  profile,
  onResumeHeldBill,
  onRefreshData,
}) => {
  if (!isOpen) return null;

  const handleDeleteHeld = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await customConfirm(
      'Are you sure you want to delete this parked bill?',
      'Delete Parked Bill',
      'Delete',
      'Cancel',
      true
    );
    if (confirmed) {
      await db.heldBills.delete(id);
      onRefreshData();
    }
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
      zIndex: 110,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        padding: '24px',
        width: '100%',
        maxWidth: '460px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Parked & Held Orders
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {heldBills.length} active held orders / open tables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '50%',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* List of Held Bills */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {heldBills.length === 0 ? (
            <div style={{
              padding: '30px 20px',
              textAlign: 'center',
              color: 'var(--text-dim)',
            }}>
              No held orders right now.
            </div>
          ) : (
            heldBills.map((hb) => {
              const totalAmount = hb.items.reduce((sum, item) => sum + item.lineTotal, 0);
              return (
                <div
                  key={hb.id}
                  onClick={() => onResumeHeldBill(hb)}
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                        {hb.title}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                      }}>
                        {hb.orderType.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {hb.items.length} items • Saved {new Date(hb.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--accent-green)', marginTop: '4px' }}>
                      {formatPaise(totalAmount, profile.currencySymbol)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={(e) => handleDeleteHeld(hb.id, e)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: 'var(--accent-rose)',
                      }}
                      title="Delete held bill"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
