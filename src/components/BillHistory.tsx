import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Printer,
  Ban,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  AlertTriangle,
  Receipt,
  Download,
  Share2,
  AlertCircle,
  Utensils,
  ShoppingBag,
  Car
} from 'lucide-react';
import type { Bill, RestaurantProfile, PaymentMode } from '../types';
import { formatPaise } from '../utils/currency';
import { exportBillsToExcel } from '../utils/excel';
import { exportBillsToPdf, exportSingleBillToPdf } from '../utils/pdfExport';
import { searchBills } from '../utils/search';
import { db } from '../db';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';
import { PinModal } from './PinModal';
import { ExportModal } from './ExportModal';
import { customAlert } from './CustomDialog';

interface BillHistoryProps {
  bills: Bill[];
  profile: RestaurantProfile;
  onRefreshData: () => void;
}

type DateFilterOption = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'all';

export const BillHistory: React.FC<BillHistoryProps> = ({
  bills,
  profile,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('today');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Bill for Detail / Reprint / Cancel
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [reprintModalBill, setReprintModalBill] = useState<Bill | null>(null);

  // Cancel state & PIN protection
  const [cancelModalBill, setCancelModalBill] = useState<Bill | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelError, setCancelError] = useState<string>('');
  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Export State
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Filter bills based on date range, query, payment, and status
  const filteredBills = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const endOfLastMonth = startOfMonth - 1;

    const dateFiltered = bills.filter((b) => {
      // Date filter
      if (dateFilter === 'today' && b.createdAt < startOfToday) return false;
      if (dateFilter === 'yesterday' && (b.createdAt < startOfYesterday || b.createdAt >= startOfToday)) return false;
      if (dateFilter === 'week' && b.createdAt < startOfWeek) return false;
      if (dateFilter === 'month' && b.createdAt < startOfMonth) return false;
      if (dateFilter === 'last_month' && (b.createdAt < startOfLastMonth || b.createdAt > endOfLastMonth)) return false;

      // Payment filter
      if (paymentFilter !== 'all' && b.paymentMode !== paymentFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      return true;
    });

    if (!searchQuery.trim()) return dateFiltered;

    return searchBills(dateFiltered, searchQuery);
  }, [bills, dateFilter, paymentFilter, statusFilter, searchQuery]);

  // Summary Metrics for the filtered view
  const summary = useMemo(() => {
    let totalSales = 0;
    let totalTax = 0;
    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let activeBillsCount = 0;
    let cancelledBillsCount = 0;

    filteredBills.forEach((b) => {
      if (b.status === 'CANCELLED') {
        cancelledBillsCount++;
        return;
      }
      activeBillsCount++;
      totalSales += b.grandTotal;
      totalTax += (b.cgst + b.sgst);
      if (b.paymentMode === 'cash') cashSales += b.grandTotal;
      else if (b.paymentMode === 'upi') upiSales += b.grandTotal;
      else if (b.paymentMode === 'card') cardSales += b.grandTotal;
      else if (b.paymentMode === 'split') {
        cashSales += b.splitPayments?.[0]?.amount || 0;
        upiSales += b.splitPayments?.[1]?.amount || 0;
      }
    });

    return {
      totalSales,
      totalTax,
      cashSales,
      upiSales,
      cardSales,
      activeBillsCount,
      cancelledBillsCount,
    };
  }, [filteredBills]);

  // Handle Cancel Bill with PIN check
  const handleInitiateCancel = (bill: Bill) => {
    setCancelModalBill(bill);
    setCancelReason('');
    setCancelError('');
  };

  const handleConfirmCancelWithPin = () => {
    if (!cancelReason.trim()) {
      setCancelError('Please provide a reason for cancelling this bill.');
      customAlert('Please provide a reason for cancelling this bill.', 'Cancellation Reason Required', 'warning');
      return;
    }

    if (profile.requirePinForActions) {
      setPendingAction(() => () => executeBillCancellation(cancelModalBill!, cancelReason));
      setPinModalOpen(true);
    } else {
      executeBillCancellation(cancelModalBill!, cancelReason);
    }
  };

  const executeBillCancellation = async (bill: Bill, reason: string) => {
    await db.bills.update(bill.id, {
      status: 'CANCELLED',
      cancelReason: reason,
      cancelledAt: Date.now(),
      updatedAt: Date.now(),
    });

    await db.auditLogs.add({
      id: `audit_${Date.now()}`,
      action: 'CANCEL',
      billId: bill.id,
      detail: `Cancelled bill ${bill.billNo}: ${reason}`,
      timestamp: Date.now(),
    });

    setCancelModalBill(null);
    setSelectedBill(null);
    onRefreshData();
  };

  // Handle Reprint
  const handleReprint = async (bill: Bill) => {
    await db.bills.update(bill.id, {
      printCount: bill.printCount + 1,
      updatedAt: Date.now(),
    });

    await db.auditLogs.add({
      id: `audit_${Date.now()}`,
      action: 'REPRINT',
      billId: bill.id,
      detail: `Reprinted bill ${bill.billNo} (Copy #${bill.printCount + 1})`,
      timestamp: Date.now(),
    });

    setReprintModalBill({
      ...bill,
      printCount: bill.printCount + 1,
    });
    onRefreshData();
  };

  // Export current list to Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await exportBillsToExcel(filteredBills, profile.name, dateFilter.toUpperCase());
      if (res.success) {
        setExportNotice(`Exported ${res.totalBills} bills to Excel (${res.fileName}) successfully!`);
        setTimeout(() => setExportNotice(null), 4000);
      } else {
        customAlert(res.error || 'Export failed', 'Export Failed', 'error');
      }
    } catch (err: any) {
      customAlert(err?.message || 'Export error', 'Export Failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export current list to PDF
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const res = await exportBillsToPdf(filteredBills, profile, dateFilter.toUpperCase());
      if (res.success) {
        setExportNotice(`Exported sales report to PDF (${res.fileName}) successfully!`);
        setTimeout(() => setExportNotice(null), 4000);
      } else {
        customAlert(res.error || 'PDF export failed', 'Export Failed', 'error');
      }
    } catch (err: any) {
      customAlert(err?.message || 'Export error', 'Export Failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export single bill to PDF
  const handleExportSingleBillPdf = async (bill: Bill) => {
    try {
      const res = await exportSingleBillToPdf(bill, profile);
      if (res.success) {
        setExportNotice(`Exported Invoice #${bill.billNo} to PDF successfully!`);
        setTimeout(() => setExportNotice(null), 3000);
      } else {
        customAlert(res.error || 'Invoice export failed', 'Export Failed', 'error');
      }
    } catch (err: any) {
      customAlert(err?.message || 'Invoice export error', 'Export Failed', 'error');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--bg-app)',
        padding: '16px',
        paddingBottom: '90px',
        overflowY: 'auto',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Filter & Actions Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Invoices & Bill History
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Sequential audit trail • Total {bills.length} bills recorded
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="mobile-export-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setExportModalOpen(true)}
              className="mobile-export-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 15px',
                borderRadius: '10px',
                backgroundColor: '#2563EB',
                border: '1px solid #1D4ED8',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.15s ease',
              }}
              title="Open Export Options"
            >
              <Download size={15} />
              <span>Export ({filteredBills.length})</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="mobile-export-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '9px 13px',
                borderRadius: '10px',
                backgroundColor: '#10B981',
                border: '1px solid #059669',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '12px',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                opacity: isExporting ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
              }}
              title="Export directly to Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} />
              <span>Excel</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="mobile-export-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '9px 13px',
                borderRadius: '10px',
                backgroundColor: '#EF4444',
                border: '1px solid #DC2626',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '12px',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                opacity: isExporting ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.2)',
              }}
              title="Export directly to PDF Report (.pdf)"
            >
              <FileText size={15} />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Date Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'Last 7 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'all', label: 'All Time' },
          ].map((df) => {
            const isSelected = dateFilter === df.id;
            return (
              <button
                key={df.id}
                onClick={() => setDateFilter(df.id as DateFilterOption)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? '#2563EB' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: `1px solid ${isSelected ? '#2563EB' : 'var(--border-color)'}`,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.25)' : '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                {df.label}
              </button>
            );
          })}
        </div>

        {/* Search & Mode Filters Row */}
        <div className="mobile-filter-stack" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="mobile-search-full" style={{ flex: 'none', width: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search Bill No, Table, Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px', height: '42px', fontSize: '13px', borderRadius: '10px' }}
            />
          </div>

          <div className="mobile-filter-row" style={{ display: 'flex', gap: '10px' }}>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ height: '42px', fontSize: '13px', borderRadius: '10px', flex: 1 }}
            >
              <option value="all">All Payment Modes</option>
              <option value="cash">Cash Only</option>
              <option value="upi">UPI Only</option>
              <option value="card">Card Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '42px', fontSize: '13px', borderRadius: '10px', flex: 1 }}
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active Bills</option>
              <option value="CANCELLED">Cancelled Bills</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
          flexShrink: 0,
        }}
      >
        {/* Total Revenue */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            NET REVENUE ({summary.activeBillsCount} Bills)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
            {formatPaise(summary.totalSales, profile.currencySymbol)}
          </div>
        </div>

        {/* Cash vs UPI breakdown */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            PAYMENT MODES
          </div>
          <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '12.5px' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Cash: </span>
              <strong>{formatPaise(summary.cashSales, profile.currencySymbol, true)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>UPI: </span>
              <strong>{formatPaise(summary.upiSales, profile.currencySymbol, true)}</strong>
            </div>
          </div>
        </div>

        {/* GST Tax Collected */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            GST TAX COLLECTED
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>
            {formatPaise(summary.totalTax, profile.currencySymbol)}
          </div>
        </div>
      </div>

      {/* Export Notice Banner */}
      {exportNotice && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #10B981',
            color: '#059669',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '14px',
            flexShrink: 0,
          }}
        >
          {exportNotice}
        </div>
      )}

      {/* Bills Table Container with Full Horizontal & Vertical Scroll */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '0px',
          border: '1px solid var(--border-color)',
          overflowX: 'auto',
          overflowY: 'auto',
          width: '100%',
          flex: 1,
          minHeight: '260px',
          boxShadow: 'none',
        }}
      >
        {filteredBills.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            No bills found matching current filter criteria.
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '880px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: '#F1F5F9',
                    borderBottom: '1px solid var(--border-color)',
                    textAlign: 'left',
                    color: '#475569',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    position: 'sticky',
                    top: 0,
                    zIndex: 5,
                  }}
                >
                  <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Bill No</th>
                  <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Time</th>
                  <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Order Type</th>
                  <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Items</th>
                  <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Payment</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>Amount</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((b) => {
                  const isCancelled = b.status === 'CANCELLED';
                  return (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        opacity: isCancelled ? 0.6 : 1,
                        backgroundColor: isCancelled ? '#FEF2F2' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        {b.billNo}
                        {b.tokenNo && (
                          <span
                            style={{
                              marginLeft: '6px',
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '0px',
                              backgroundColor: '#E2E8F0',
                              color: '#1E293B',
                              fontWeight: 700,
                            }}
                          >
                            #{b.tokenNo}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 700,
                          fontSize: '11.5px',
                          padding: b.orderType === 'takeaway' ? '2px 6px' : '0px',
                          backgroundColor: b.orderType === 'takeaway' ? '#FEF3C7' : 'transparent',
                          color: b.orderType === 'takeaway' ? '#92400E' : 'inherit',
                          borderRadius: '4px',
                        }}>
                          {b.orderType === 'takeaway' ? (
                            <>
                              <ShoppingBag size={12} />
                              <span>PARCEL</span>
                            </>
                          ) : b.orderType === 'dine_in' ? (
                            <>
                              <Utensils size={12} />
                              <span>DINE IN</span>
                            </>
                          ) : (
                            <>
                              <Car size={12} />
                              <span>DELIVERY</span>
                            </>
                          )}
                        </span>
                        {b.tableNo && <span style={{ color: 'var(--text-dim)', fontSize: '11px', marginLeft: '4px' }}>({b.tableNo})</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {b.items.length} items
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {b.paymentMode.toUpperCase()}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, fontSize: '13.5px', color: isCancelled ? 'var(--text-dim)' : 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        {formatPaise(b.grandTotal, profile.currencySymbol)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '0px',
                            backgroundColor: isCancelled ? '#FEE2E2' : '#DCFCE7',
                            color: isCancelled ? '#DC2626' : '#15803D',
                            border: `1px solid ${isCancelled ? '#FCA5A5' : '#86EFAC'}`,
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedBill(b)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '0px',
                              backgroundColor: '#F1F5F9',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleReprint(b)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '0px',
                              backgroundColor: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#1D4ED8',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Reprint Bill (Duplicate Copy)"
                          >
                            <Printer size={14} />
                          </button>

                          <button
                            onClick={() => handleExportSingleBillPdf(b)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '0px',
                              backgroundColor: '#FEF2F2',
                              border: '1px solid #FECACA',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Download / Share Invoice PDF"
                          >
                            <FileText size={14} />
                          </button>

                          {!isCancelled && (
                            <button
                              onClick={() => handleInitiateCancel(b)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '0px',
                                backgroundColor: '#FEF2F2',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                              title="Cancel / Void Bill"
                            >
                              <Ban size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BILL DETAILS MODAL */}
      {selectedBill && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '16px',
          }}
          onClick={() => setSelectedBill(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '0px',
              border: '1px solid var(--border-color)',
              padding: '20px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Bill #{selectedBill.billNo}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  {new Date(selectedBill.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '6px', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            {/* Bill Lines Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', marginBottom: '16px', paddingRight: '4px' }}>
              {selectedBill.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{it.shortNameSnapshot || it.nameSnapshot}</span>
                    {it.variantSnapshot && <span style={{ color: '#1E293B', fontSize: '11px' }}> ({it.variantSnapshot})</span>}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{it.qty} × {formatPaise(it.unitPrice, profile.currencySymbol)}</div>
                  </div>
                  <div style={{ fontWeight: 800 }}>
                    {formatPaise(it.lineTotal, profile.currencySymbol)}
                  </div>
                </div>
              ))}

              {/* Totals Summary */}
              <div style={{ marginTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '5px', backgroundColor: '#F8FAFC', padding: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: 700 }}>{formatPaise(selectedBill.subtotal, profile.currencySymbol)}</span>
                </div>
                {selectedBill.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803D' }}>
                    <span>Discount:</span>
                    <span style={{ fontWeight: 700 }}>-{formatPaise(selectedBill.discountAmount, profile.currencySymbol)}</span>
                  </div>
                )}
                {selectedBill.packagingCharge && selectedBill.packagingCharge > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Packaging Charge:</span>
                    <span style={{ fontWeight: 700 }}>{formatPaise(selectedBill.packagingCharge, profile.currencySymbol)}</span>
                  </div>
                ) : null}
                {selectedBill.cgst > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>CGST + SGST:</span>
                    <span style={{ fontWeight: 700 }}>{formatPaise(selectedBill.cgst + selectedBill.sgst, profile.currencySymbol)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900, marginTop: '4px', paddingTop: '6px', borderTop: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                  <span>Grand Total:</span>
                  <span>{formatPaise(selectedBill.grandTotal, profile.currencySymbol)}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setSelectedBill(null);
                  handleReprint(selectedBill);
                }}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '0px',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: '#1E293B',
                  color: '#FFFFFF',
                  border: '1px solid #1E293B',
                  cursor: 'pointer',
                }}
              >
                <Printer size={15} />
                <span>Reprint Duplicate Bill</span>
              </button>

              <button
                onClick={() => {
                  handleExportSingleBillPdf(selectedBill);
                }}
                style={{
                  padding: '11px 16px',
                  borderRadius: '0px',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: '1px solid #DC2626',
                  cursor: 'pointer',
                }}
                title="Export Bill to PDF"
              >
                <FileText size={15} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL BILL MODAL */}
      {cancelModalBill && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px',
          }}
          onClick={() => setCancelModalBill(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '0px',
              border: '1px solid var(--border-color)',
              padding: '20px',
              width: '100%',
              maxWidth: '380px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#DC2626' }}>
              Cancel Bill #{cancelModalBill.billNo}
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '6px 0 14px 0' }}>
              This bill will be marked CANCELLED and deducted from sales reports. Sequential bill number will remain preserved.
            </p>

            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Reason for Cancellation (Required):
            </label>
            <input
              type="text"
              placeholder="e.g. customer left, wrong punch, test order"
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (cancelError) setCancelError('');
              }}
              style={{
                width: '100%',
                marginBottom: cancelError ? '8px' : '16px',
                borderColor: cancelError ? '#DC2626' : undefined,
                borderRadius: '0px',
              }}
              autoFocus
            />

            {cancelError && (
              <div
                style={{
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#FEF2F2',
                  padding: '7px 10px',
                  borderRadius: '0px',
                  border: '1px solid #FECACA',
                }}
              >
                <AlertCircle size={14} />
                <span>{cancelError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCancelModalBill(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '0px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleConfirmCancelWithPin}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '0px',
                  backgroundColor: '#DC2626',
                  border: '1px solid #DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPRINT MODAL */}
      {reprintModalBill && (
        <ReceiptPreviewModal
          isOpen={!!reprintModalBill}
          onClose={() => setReprintModalBill(null)}
          bill={reprintModalBill}
          profile={profile}
          isDuplicate={true}
        />
      )}

      {/* PIN VERIFICATION MODAL */}
      <PinModal
        isOpen={pinModalOpen}
        correctPin={profile.pin}
        title="Owner Security PIN"
        subtitle="Enter PIN to authorize bill cancellation"
        onSuccess={() => {
          setPinModalOpen(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
        onClose={() => {
          setPinModalOpen(false);
          setPendingAction(null);
        }}
      />

      {/* Export Invoices & Sales Report Modal (Excel & PDF) */}
      {exportModalOpen && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          title="Export Invoices & Sales Audit"
          subtitle={`Selected Period: ${dateFilter.toUpperCase().replace('_', ' ')}`}
          itemCountDescription={`${filteredBills.length} Invoices`}
          excelDescription="Complete multi-sheet workbook including Bills summary, Itemized orders, Daily turnover, GST taxes, and Payment breakdown."
          pdfDescription="Executive sales & tax audit report formatted for print, compliance, and sharing."
          onExportExcel={async () => {
            const res = await exportBillsToExcel(filteredBills, profile.name, dateFilter.toUpperCase());
            if (!res.success) {
              throw new Error(res.error || 'Excel export failed');
            }
          }}
          onExportPdf={async () => {
            const res = await exportBillsToPdf(filteredBills, profile, dateFilter.toUpperCase());
            if (!res.success) {
              throw new Error(res.error || 'PDF export failed');
            }
          }}
        />
      )}
    </div>
  );
};
