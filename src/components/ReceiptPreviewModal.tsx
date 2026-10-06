import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Printer,
  X,
  Banknote,
  CreditCard,
  QrCode,
  ArrowRight,
  Check,
  Wallet,
  Calculator,
  ChevronLeft,
  ShieldCheck,
  Download,
  Scissors,
  Ticket,
  FileText,
  Volume2,
  VolumeX,
  Store,
  Plus,
  Edit3,
  Minus,
  Trash2,
  ShoppingBag,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import type { Bill, RestaurantProfile, PaymentMode, BillItemSnapshot, Item, OrderType, TaxMode } from '../types';
import { formatPaise, rupeesToPaise } from '../utils/currency';
import { generateUpiString, generateQrCodeDataUrl, printViaBluetooth, printViaRawBt, buildEscPosBill, generateEscPosBill, getShortVariantCode, isBluetoothPrinterConnected, isAndroidNative } from '../utils/printer';
import { searchMenuItems } from '../utils/search';
import { DEFAULT_RESTAURANT_LOGO } from '../utils/constants';
import { exportSingleBillToPdf } from '../utils/pdfExport';
import { db } from '../db';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill;
  profile: RestaurantProfile;
  isDuplicate?: boolean;
  autoPrint?: boolean;
  initialShowQr?: boolean;
  onAfterPrint?: () => void;
  onUpdateBillPayment?: (billId: string, paymentMode: PaymentMode, paymentStatus: 'paid' | 'unpaid') => void;
  onLoadBillIntoCart?: (bill: Bill) => void;
  onBillEdited?: (bill: Bill) => void;
}

/**
 * Clean Print Helper:
 * Prints ONLY the thermal receipt slip inside a detached hidden iframe.
 * Eliminates background web app, modal overlay, and buttons from the print dialog.
 */
function printCleanReceipt(receiptElementId: string, isWide: boolean) {
  const elem = document.getElementById(receiptElementId);
  if (!elem) {
    window.print();
    return;
  }

  // On Mobile / Android WebView or Capacitor, window.print() triggers the native print dialog
  const isMobileOrApp = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || typeof (window as any).Capacitor !== 'undefined';
  if (isMobileOrApp) {
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const paperContentWidth = isWide ? '72mm' : '48mm';
  const pageSizeWidth = isWide ? '80mm' : '58mm';

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Receipt_${elem.querySelector('.order-num-text')?.textContent || 'Bill'}</title>
        <style>
          @page {
            margin: 0mm;
            size: ${pageSizeWidth} auto;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              width: 100% !important;
              display: flex !important;
              justify-content: center !important;
            }
          }
          * {
            box-sizing: border-box !important;
            margin: 0;
            padding: 0;
          }
          body {
            background: #ffffff;
            color: #000000;
            font-family: 'Space Mono', 'Courier New', Courier, monospace;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 2mm 0;
            width: 100%;
          }
          .thermal-receipt, #printable-receipt {
            width: ${paperContentWidth} !important;
            max-width: ${paperContentWidth} !important;
            min-width: ${paperContentWidth} !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 4mm 3mm !important;
            border: none !important;
            box-shadow: none !important;
            font-size: ${isWide ? '11px' : '10px'} !important;
            line-height: 1.35 !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
          }
          .thermal-receipt table, #printable-receipt table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: ${isWide ? '10.5px' : '9.5px'} !important;
          }
          .thermal-receipt img, #printable-receipt img {
            max-width: 100% !important;
            height: auto !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${elem.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 250);
}

/**
 * Authentic POS Thermal Stepper Motor & Cutter Audio Effect
 */
function playThermalPrintSound(durationMs = 1200, isMuted = false) {
  if (isMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const bufferSize = Math.floor(ctx.sampleRate * (durationMs / 1000));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const stepper = Math.sin(2 * Math.PI * 140 * t) * 0.14;
      const whine = Math.sin(2 * Math.PI * 2200 * t) * 0.04;
      const friction = (Math.random() * 2 - 1) * 0.1;
      output[i] = stepper + whine + friction;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1600;
    filter.Q.value = 3.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.055, ctx.currentTime + (durationMs / 1000) - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (durationMs / 1000));

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    // Guillotine cut click
    setTimeout(() => {
      try {
        const osc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);
        clickGain.gain.setValueAtTime(0.18, ctx.currentTime);
        clickGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.connect(clickGain);
        clickGain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } catch (e) {}
    }, Math.max(0, durationMs - 70));
  } catch (err) {}
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  bill,
  profile,
  isDuplicate = false,
  autoPrint = false,
  initialShowQr,
  onAfterPrint,
  onUpdateBillPayment,
  onLoadBillIntoCart,
  onBillEdited,
}) => {
  const [currentBill, setCurrentBill] = useState<Bill>(bill);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddItemDropdown, setShowAddItemDropdown] = useState<boolean>(false);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [printing, setPrinting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to Print');

  // Default: Respect initialShowQr if provided, else store preferences
  const [billFormat, setBillFormat] = useState<'token_bill' | 'bill_only'>('bill_only');
  const [showQr, setShowQr] = useState<boolean>(initialShowQr ?? (profile.showQrOnBill === true));
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Animation state
  const [isDispensing, setIsDispensing] = useState<boolean>(false);
  const [feedKey, setFeedKey] = useState<number>(0);

  // Settle Payment state
  const [step, setStep] = useState<'preview' | 'payment'>('preview');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(bill?.paymentMode || 'cash');
  const [cashTenderedRupees, setCashTenderedRupees] = useState<string>('');
  const cashInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch active items for quick-add in editing mode
  useEffect(() => {
    if (isOpen) {
      db.items.filter((i) => i.isActive && !i.isDeleted).toArray().then(setAllItems);
    }
  }, [isOpen]);

  // Filtered Items for Quick-Add Search in in-preview editor using fuzzy engine
  const filteredAddItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems.slice(0, 8);
    return searchMenuItems(allItems, searchQuery).slice(0, 10);
  }, [allItems, searchQuery]);

  // Synchronize currentBill when bill prop changes
  useEffect(() => {
    if (bill) {
      setCurrentBill(bill);
    }
  }, [bill]);

  // Initialize from store settings on open: defaults strictly to 'bill_only' and showQr=false
  useEffect(() => {
    if (isOpen) {
      // 1. Bill Format: default strictly to 'bill_only' unless explicitly set to 'token_bill'
      if (profile.defaultBillFormat === 'token_bill') {
        setBillFormat('token_bill');
      } else {
        setBillFormat('bill_only');
      }

      // 2. Dynamic QR: default to initialShowQr if provided, else store settings
      if (initialShowQr !== undefined) {
        setShowQr(initialShowQr);
      } else if (profile.showQrOnBill === true) {
        setShowQr(true);
      } else {
        setShowQr(false);
      }

      setStep('preview');
      setIsEditing(false);
      setPaymentMode(bill?.paymentMode || 'cash');
      setCashTenderedRupees('');

      // CRITICAL: NEVER automatically play print motor audio or pretend it's printing on preview!
      // Only execute print if autoPrint is explicitly requested.
      if (autoPrint) {
        setStatusMessage('Printing Receipt...');
        setIsDispensing(true);
        setFeedKey((k) => k + 1);
        playThermalPrintSound(1100, isMuted);

        const timer = setTimeout(() => {
          setIsDispensing(false);
          handlePrintDirect(false, initialShowQr);
        }, 500);

        return () => clearTimeout(timer);
      } else {
        setIsDispensing(false);
        setStatusMessage(bill?.printCount > 0 ? `Receipt Printed (${bill.printCount}x)` : 'Preview Mode | Ready to Print');
      }
    }
  }, [isOpen, autoPrint, initialShowQr, profile.defaultBillFormat, profile.showQrOnBill, bill?.id]);

  // Recalculate financial breakdown for currentBill on edits
  const recalculateBill = (
    items: BillItemSnapshot[],
    discountType: 'flat' | 'percent',
    discountValue: number,
    packagingChargePaise: number,
    orderType: OrderType,
    tableNo?: string
  ): Bill => {
    const subtotal = items.reduce((acc, it) => acc + it.lineTotal, 0);

    let discountAmount = 0;
    if (discountType === 'percent') {
      discountAmount = Math.round((subtotal * discountValue) / 100);
    } else {
      discountAmount = discountValue;
    }
    discountAmount = Math.min(subtotal, Math.max(0, discountAmount));
    const subtotalAfterDiscount = subtotal - discountAmount;

    let taxableAmount = subtotalAfterDiscount;
    let totalTax = 0;
    let cgst = 0;
    let sgst = 0;

    if (profile.taxMode === 'none') {
      taxableAmount = subtotalAfterDiscount;
      totalTax = 0;
      cgst = 0;
      sgst = 0;
    } else if (profile.taxMode === 'inclusive') {
      const taxFactor = 1 + profile.defaultGstPercent / 100;
      taxableAmount = Math.round(subtotalAfterDiscount / taxFactor);
      totalTax = subtotalAfterDiscount - taxableAmount;
      cgst = Math.round(totalTax / 2);
      sgst = totalTax - cgst;
    } else {
      taxableAmount = subtotalAfterDiscount;
      totalTax = Math.round((subtotalAfterDiscount * profile.defaultGstPercent) / 100);
      cgst = Math.round(totalTax / 2);
      sgst = totalTax - cgst;
    }

    const rawGrandTotal =
      profile.taxMode === 'inclusive'
        ? subtotalAfterDiscount + packagingChargePaise + (currentBill.serviceCharge || 0)
        : subtotalAfterDiscount + totalTax + packagingChargePaise + (currentBill.serviceCharge || 0);

    const roundedGrandTotal = Math.round(rawGrandTotal / 100) * 100;
    const roundOff = roundedGrandTotal - rawGrandTotal;

    return {
      ...currentBill,
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      packagingCharge: packagingChargePaise,
      taxableAmount,
      cgst,
      sgst,
      roundOff,
      grandTotal: roundedGrandTotal,
      orderType,
      tableNo: orderType === 'dine_in' ? tableNo : undefined,
    };
  };

  const handleUpdateItemQty = (itemIndex: number, delta: number) => {
    const newItems = [...currentBill.items];
    const target = newItems[itemIndex];
    if (!target) return;
    const newQty = target.qty + delta;
    if (newQty <= 0) {
      newItems.splice(itemIndex, 1);
    } else {
      newItems[itemIndex] = {
        ...target,
        qty: newQty,
        lineTotal: newQty * target.unitPrice,
      };
    }
    const updated = recalculateBill(
      newItems,
      currentBill.discountType,
      currentBill.discountValue,
      currentBill.packagingCharge,
      currentBill.orderType,
      currentBill.tableNo
    );
    setCurrentBill(updated);
  };

  const handleRemoveItem = (itemIndex: number) => {
    const newItems = currentBill.items.filter((_, idx) => idx !== itemIndex);
    const updated = recalculateBill(
      newItems,
      currentBill.discountType,
      currentBill.discountValue,
      currentBill.packagingCharge,
      currentBill.orderType,
      currentBill.tableNo
    );
    setCurrentBill(updated);
  };

  const handleAddItem = (menuItem: Item) => {
    const newItems = [...currentBill.items];
    const existingIdx = newItems.findIndex((it) => it.itemId === menuItem.id && !it.variantSnapshot);
    if (existingIdx >= 0) {
      const existing = newItems[existingIdx];
      const newQty = existing.qty + 1;
      newItems[existingIdx] = {
        ...existing,
        qty: newQty,
        lineTotal: newQty * existing.unitPrice,
      };
    } else {
      newItems.push({
        id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        itemId: menuItem.id,
        nameSnapshot: menuItem.name,
        nameHindiSnapshot: menuItem.nameHindi,
        shortNameSnapshot: menuItem.shortName,
        qty: 1,
        unitPrice: menuItem.basePrice,
        taxPercent: menuItem.taxPercent,
        lineTotal: menuItem.basePrice,
      });
    }
    const updated = recalculateBill(
      newItems,
      currentBill.discountType,
      currentBill.discountValue,
      currentBill.packagingCharge,
      currentBill.orderType,
      currentBill.tableNo
    );
    setCurrentBill(updated);
    setSearchQuery('');
    setShowAddItemDropdown(false);
  };

  const handleUpdatePackaging = (chargePaise: number) => {
    const updated = recalculateBill(
      currentBill.items,
      currentBill.discountType,
      currentBill.discountValue,
      chargePaise,
      currentBill.orderType,
      currentBill.tableNo
    );
    setCurrentBill(updated);
  };

  const handleUpdateOrderType = (newOrderType: OrderType) => {
    const newPkg =
      newOrderType === 'takeaway' || newOrderType === 'delivery'
        ? (profile.defaultPackagingCharge ?? 10) * 100
        : 0;
    const updated = recalculateBill(
      currentBill.items,
      currentBill.discountType,
      currentBill.discountValue,
      newPkg,
      newOrderType,
      currentBill.tableNo
    );
    setCurrentBill(updated);
  };

  const handleSaveEdits = async () => {
    try {
      const nextRev = (currentBill.revisionNo || 1) + 1;
      await db.bills.update(currentBill.id, {
        items: currentBill.items,
        subtotal: currentBill.subtotal,
        discountType: currentBill.discountType,
        discountValue: currentBill.discountValue,
        discountAmount: currentBill.discountAmount,
        packagingCharge: currentBill.packagingCharge,
        serviceCharge: currentBill.serviceCharge,
        taxableAmount: currentBill.taxableAmount,
        cgst: currentBill.cgst,
        sgst: currentBill.sgst,
        roundOff: currentBill.roundOff,
        grandTotal: currentBill.grandTotal,
        orderType: currentBill.orderType,
        tableNo: currentBill.tableNo,
        updatedAt: Date.now(),
        revisionNo: nextRev,
      });

      await db.billRevisions.add({
        id: `rev_${Date.now()}`,
        billId: currentBill.id,
        revisionNo: nextRev,
        snapshotJson: JSON.stringify(currentBill),
        changedAt: Date.now(),
        reason: 'Edited in Receipt Preview',
      });

      setIsEditing(false);
      setStatusMessage('Bill updated successfully');
      if (onBillEdited) onBillEdited(currentBill);
    } catch (err: any) {
      console.error('Failed to save bill edits:', err);
    }
  };

  // Generate Real Dynamic UPI QR Code
  useEffect(() => {
    if (currentBill && showQr) {
      const vpa = profile.upiVpa?.trim() || 'bookmydine@upi';
      const payee = profile.upiPayeeName?.trim() || profile.name?.trim() || 'Store';
      const upiUrl = generateUpiString(vpa, payee, currentBill.grandTotal, currentBill.billNo);
      generateQrCodeDataUrl(upiUrl).then(setQrDataUrl);
    } else {
      setQrDataUrl('');
    }
  }, [currentBill, profile.upiVpa, profile.upiPayeeName, profile.name, showQr]);

  // Keyboard shortcut listener: Enter to Print, Esc to Close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      } else if (e.key === 'Enter' && !e.shiftKey) {
        if (isEditing) return; // Don't print while typing in edit inputs
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (step === 'preview') {
          handlePrintDirect(true);
        } else if (step === 'payment') {
          handleConfirmPaymentAndPrint();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditing, step, paymentMode, cashTenderedRupees, currentBill]);

  // Focus cash input on entering payment mode
  useEffect(() => {
    if (step === 'payment' && paymentMode === 'cash') {
      setTimeout(() => cashInputRef.current?.focus(), 150);
    }
  }, [step, paymentMode]);

  if (!isOpen || !currentBill) return null;

  const isWide = profile.paperWidth === 80;
  const cashTenderedPaise = rupeesToPaise(cashTenderedRupees || '0');
  const hasEnteredCash = cashTenderedRupees.trim() !== '';
  const isUnderpaid = hasEnteredCash && paymentMode === 'cash' && cashTenderedPaise < currentBill.grandTotal;
  const shortfallPaise = Math.max(0, currentBill.grandTotal - cashTenderedPaise);
  const changeDuePaise = Math.max(0, cashTenderedPaise - currentBill.grandTotal);

  // Compute Logo Dimensions based on setting
  const getLogoDimensions = () => {
    switch (profile.billLogoSize) {
      case 'small':
        return { maxHeight: '36px', maxWidth: '110px' };
      case 'large':
        return { maxHeight: '68px', maxWidth: '170px' };
      case 'xlarge':
        return { maxHeight: '84px', maxWidth: '210px' };
      case 'medium':
      default:
        return { maxHeight: '52px', maxWidth: '140px' };
    }
  };
  const logoDims = getLogoDimensions();

  const triggerDispenseAnimation = () => {
    setIsDispensing(true);
    setFeedKey((k) => k + 1);
    setStatusMessage('Printing Receipt...');
    playThermalPrintSound(1100, isMuted);
    setTimeout(() => {
      setIsDispensing(false);
      setStatusMessage('Ready to Print');
    }, 1100);
  };

  // Hardware or Clean Browser Print
  const handlePrintDirect = async (userInitiated: boolean = false, overrideQr?: boolean) => {
    if (printing) return;
    setPrinting(true);
    setStatusMessage('Sending to printer...');
    triggerDispenseAnimation();

    const effectiveQr = overrideQr !== undefined ? overrideQr : showQr;

    try {
      const escPos = await generateEscPosBill(
        currentBill,
        profile,
        isDuplicate,
        { includeTokenSlip: billFormat === 'token_bill', includeQrCode: effectiveQr }
      );

      const nextCount = (currentBill.printCount || 0) + 1;
      await db.bills.update(currentBill.id, {
        printCount: nextCount,
        updatedAt: Date.now(),
      });
      setCurrentBill((prev) => ({ ...prev, printCount: nextCount }));

      // 1. Try Real Bluetooth Print (Android Native Socket & Web Bluetooth)
      if (isBluetoothPrinterConnected() || isAndroidNative() || (typeof navigator !== 'undefined' && 'bluetooth' in navigator)) {
        const res = await printViaBluetooth(escPos.bytes, userInitiated);
        if (res.success) {
          setStatusMessage(`Receipt Printed (Copy #${nextCount})`);
          if (onAfterPrint) onAfterPrint();
          return;
        } else if (!userInitiated) {
          // If autoPrint and Bluetooth not connected, open clean browser receipt print dialog
          printCleanReceipt('printable-receipt', isWide);
          setStatusMessage(`Print Dialog Opened (Copy #${nextCount})`);
          if (onAfterPrint) onAfterPrint();
          return;
        } else if (res.message) {
          setStatusMessage(res.message);
        }
      }

      // 2. Fallback to System / Browser Print Dialog
      printCleanReceipt('printable-receipt', isWide);
      setStatusMessage(`Print Dialog Opened (Copy #${nextCount})`);
      if (onAfterPrint) onAfterPrint();
    } catch (err: any) {
      console.warn('Printing error:', err);
      printCleanReceipt('printable-receipt', isWide);
      setStatusMessage('Print Dialog Opened');
    } finally {
      setPrinting(false);
    }
  };

  // PDF Export & Print
  const handleBrowserPrint = async () => {
    try {
      setStatusMessage('Exporting PDF Invoice...');
      const res = await exportSingleBillToPdf(currentBill, profile);
      if (res.success) {
        setStatusMessage('PDF Exported Successfully');
      } else {
        printCleanReceipt('printable-receipt', isWide);
        setStatusMessage('Print Dialog Opened');
      }
    } catch {
      printCleanReceipt('printable-receipt', isWide);
    }
  };

  // Settle Payment & Print & Immediately Return to Billing for New Order
  const handleConfirmPaymentAndPrint = async () => {
    if (onUpdateBillPayment) {
      onUpdateBillPayment(currentBill.id, paymentMode, 'paid');
    }
    try {
      await db.bills.update(currentBill.id, {
        paymentMode,
        paymentStatus: 'paid',
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error('Error updating bill payment:', err);
    }
    setStatusMessage('Payment Settled! Starting new order...');
    handlePrintDirect();

    // Automatically close modal and return to billing screen ready for next order!
    setTimeout(() => {
      if (onAfterPrint) onAfterPrint();
      onClose();
    }, 450);
  };

  const cashDenominations = [
    { label: 'Exact', rupees: currentBill.grandTotal / 100 },
    { label: '₹50', rupees: 50 },
    { label: '₹100', rupees: 100 },
    { label: '₹200', rupees: 200 },
    { label: '₹500', rupees: 500 },
    { label: '₹1000', rupees: 1000 },
    { label: '₹2000', rupees: 2000 },
  ];

  const paymentMethods = [
    { id: 'cash' as PaymentMode, label: 'Cash', icon: Banknote },
    { id: 'upi' as PaymentMode, label: 'UPI / QR', icon: QrCode },
    { id: 'card' as PaymentMode, label: 'Card (POS)', icon: CreditCard },
    { id: 'other' as PaymentMode, label: 'Other', icon: Wallet },
  ];

  const orderNumStr = (currentBill.orderNo || currentBill.tokenNo || 1).toString().padStart(5, '0');
  const billDate = new Date(currentBill.createdAt);
  const dateStr = billDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const timeStr = billDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateTimeFormatted = `${dateStr}, ${timeStr}`;

  const activeLogoUrl = profile.logoUrl || DEFAULT_RESTAURANT_LOGO;

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(241, 245, 249, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 110,
        padding: '24px 16px 80px 16px',
        userSelect: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ============================================================
          MAIN WRAPPER: Side-by-Side on Settle, Centered on Preview/Edit
          ============================================================ */}
      <div
        style={{
          display: 'flex',
          flexDirection: step === 'payment' && !isEditing ? 'row' : 'column',
          flexWrap: step === 'payment' && !isEditing ? 'wrap' : 'nowrap',
          alignItems: step === 'payment' && !isEditing ? 'flex-start' : 'center',
          justifyContent: 'center',
          gap: '16px',
          width: '100%',
          maxWidth: step === 'payment' && !isEditing ? '840px' : (isEditing ? '520px' : (isWide ? '360px' : '320px')),
          position: 'relative',
          transition: 'all 0.2s ease',
          margin: 'auto 0',
        }}
      >
        {/* ============================================================
            LEFT COLUMN / PRINTER UNIT (Crisp Light Mode POS Simulation)
            ============================================================ */}
        <div
          className={step === 'payment' && !isEditing ? 'printer-unit-payment-responsive' : ''}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: isEditing ? '100%' : (step === 'payment' ? (isWide ? '350px' : '310px') : '100%'),
            flexShrink: 0,
            position: 'relative',
          }}
        >
        {/* Industrial Rectangular Ceramic Printer Head Housing */}
        <div
          style={{
            width: '100%',
            height: '32px',
            backgroundColor: '#FFFFFF',
            borderRadius: '0px',
            border: '1px solid #9CA3AF',
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            position: 'relative',
            zIndex: 30,
          }}
        >
          {/* Centered Printer Head Icon and Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Printer size={13} strokeWidth={2.4} />
              <span style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                THERMAL POS
              </span>
            </div>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '0px',
                backgroundColor: currentBill.printCount > 0 ? '#DCFCE7' : '#F1F5F9',
                color: currentBill.printCount > 0 ? '#15803D' : '#475569',
                border: `1px solid ${currentBill.printCount > 0 ? '#86EFAC' : '#CBD5E1'}`,
                letterSpacing: '0.3px',
              }}
            >
              {currentBill.printCount > 0 ? `PRINTED (${currentBill.printCount}x)` : 'PREVIEW ONLY'}
            </span>
          </div>

          {/* Sound Toggle (Top Right of Printer Cap) */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '0px',
              color: isMuted ? '#9CA3AF' : '#15803D',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
            title={isMuted ? 'Unmute printer sound' : 'Mute printer sound'}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>

        {/* Recessed Mechanical Paper Slot Slit (Sharp Rectangle) */}
        <div
          style={{
            width: '100%',
            height: '5px',
            backgroundColor: '#111827',
            borderLeft: '1px solid #9CA3AF',
            borderRight: '1px solid #9CA3AF',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
            position: 'relative',
            zIndex: 25,
            borderRadius: '0px',
          }}
        />

        {isEditing ? (
          /* ============================================================
             INDUSTRIAL RECTANGULAR BILL ITEM & PACKAGING CHARGE EDITOR
             ============================================================ */
          <div
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #9CA3AF',
              borderTop: 'none',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: 'calc(85vh - 80px)',
              overflowY: 'auto',
            }}
          >
            {/* Edit Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Edit3 size={16} color="#B45309" />
                  <span>EDIT ORDER : {currentBill.billNo}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                  Fix mistake: add or remove items, adjust quantities, change packaging
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrentBill(bill);
                  setIsEditing(false);
                }}
                style={{
                  background: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#4B5563',
                  borderRadius: '0px',
                }}
              >
                Cancel
              </button>
            </div>

            {/* Order Type Tabs */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#4B5563', textTransform: 'uppercase', marginBottom: '4px' }}>
                Order Type
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {(['dine_in', 'takeaway', 'delivery'] as const).map((t) => {
                  const isSelected = currentBill.orderType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleUpdateOrderType(t)}
                      style={{
                        padding: '6px 8px',
                        border: `1.5px solid ${isSelected ? '#15803D' : '#D1D5DB'}`,
                        backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                        color: isSelected ? '#15803D' : '#374151',
                        fontWeight: 800,
                        fontSize: '11px',
                        cursor: 'pointer',
                        borderRadius: '0px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t === 'dine_in' ? 'Dine In' : t === 'takeaway' ? 'Takeaway / Parcel' : 'Delivery'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Packaging Charge Toggle / Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              padding: '8px 10px',
              border: '1px solid #E2E8F0',
              borderRadius: '0px',
            }}>
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#334155' }}>
                  📦 Packaging Charge:
                </div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>
                  Current: ₹{(currentBill.packagingCharge / 100).toFixed(2)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleUpdatePackaging(0)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '0px',
                    border: `1px solid ${currentBill.packagingCharge === 0 ? '#1E293B' : '#CBD5E1'}`,
                    backgroundColor: currentBill.packagingCharge === 0 ? '#1E293B' : '#FFFFFF',
                    color: currentBill.packagingCharge === 0 ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  ₹0
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdatePackaging((profile.defaultPackagingCharge ?? 10) * 100)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '0px',
                    border: `1px solid ${currentBill.packagingCharge === (profile.defaultPackagingCharge ?? 10) * 100 ? '#15803D' : '#CBD5E1'}`,
                    backgroundColor: currentBill.packagingCharge === (profile.defaultPackagingCharge ?? 10) * 100 ? '#15803D' : '#FFFFFF',
                    color: currentBill.packagingCharge === (profile.defaultPackagingCharge ?? 10) * 100 ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  ₹{profile.defaultPackagingCharge ?? 10}
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdatePackaging(2000)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '0px',
                    border: `1px solid ${currentBill.packagingCharge === 2000 ? '#15803D' : '#CBD5E1'}`,
                    backgroundColor: currentBill.packagingCharge === 2000 ? '#15803D' : '#FFFFFF',
                    color: currentBill.packagingCharge === 2000 ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  ₹20
                </button>
              </div>
            </div>

            {/* Bill Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#4B5563', textTransform: 'uppercase' }}>
                Order Items ({currentBill.items.length})
              </div>
              {currentBill.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#DC2626', fontSize: '12px', fontWeight: 700, border: '1px dashed #FCA5A5', backgroundColor: '#FEF2F2' }}>
                  No items left in order. Add dishes from below or cancel.
                </div>
              ) : (
                currentBill.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.nameSnapshot}
                        {item.variantSnapshot && <span style={{ fontSize: '10px', fontWeight: 400, color: '#6B7280' }}> ({item.variantSnapshot})</span>}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#6B7280' }}>
                        ₹{(item.unitPrice / 100).toFixed(2)} each
                      </div>
                    </div>

                    {/* Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(idx, -1)}
                        style={{
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#F3F4F6',
                          border: '1px solid #D1D5DB',
                          color: '#111827',
                          fontWeight: 900,
                          cursor: 'pointer',
                          borderRadius: '0px',
                        }}
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span style={{ minWidth: '22px', textAlign: 'center', fontSize: '12.5px', fontWeight: 800 }}>
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(idx, 1)}
                        style={{
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#F3F4F6',
                          border: '1px solid #D1D5DB',
                          color: '#111827',
                          fontWeight: 900,
                          cursor: 'pointer',
                          borderRadius: '0px',
                        }}
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Amount */}
                    <div style={{ width: '60px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: '#111827', marginLeft: '6px' }}>
                      ₹{(item.lineTotal / 100).toFixed(2)}
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#DC2626',
                        cursor: 'pointer',
                        marginLeft: '6px',
                        padding: '4px',
                        borderRadius: '0px',
                      }}
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* + Add Dish Section */}
            <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#4B5563', textTransform: 'uppercase', marginBottom: '6px' }}>
                + Add Dish to Bill
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowAddItemDropdown(true);
                  }}
                  onFocus={() => setShowAddItemDropdown(true)}
                  placeholder="Type dish name to search menu..."
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    border: '1px solid #9CA3AF',
                    borderRadius: '0px',
                    outline: 'none',
                  }}
                />
                {showAddItemDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '160px',
                    overflowY: 'auto',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #9CA3AF',
                    borderTop: 'none',
                    borderRadius: '0px',
                    zIndex: 40,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}>
                    {filteredAddItems.length === 0 ? (
                      <div style={{ padding: '8px 10px', fontSize: '11px', color: '#9CA3AF' }}>
                        No dishes found matching "{searchQuery}"
                      </div>
                    ) : (
                      filteredAddItems.map((menuItem) => (
                        <div
                          key={menuItem.id}
                          onClick={() => handleAddItem(menuItem)}
                          style={{
                            padding: '7px 10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #F3F4F6',
                            cursor: 'pointer',
                            fontSize: '11.5px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                        >
                          <span style={{ fontWeight: 700, color: '#111827' }}>
                            {menuItem.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#15803D' }}>
                              ₹{(menuItem.basePrice / 100).toFixed(2)}
                            </span>
                            <span style={{ fontSize: '10px', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '1px 5px', fontWeight: 800 }}>
                              + Add
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recalculated Breakdown */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '0px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '11.5px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 700 }}>₹{(currentBill.subtotal / 100).toFixed(2)}</span>
              </div>
              {currentBill.packagingCharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309' }}>
                  <span>Packaging Charge:</span>
                  <span style={{ fontWeight: 700 }}>+₹{(currentBill.packagingCharge / 100).toFixed(2)}</span>
                </div>
              )}
              {(currentBill.cgst > 0 || currentBill.sgst > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>GST (CGST + SGST):</span>
                  <span>+₹{((currentBill.cgst + currentBill.sgst) / 100).toFixed(2)}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderTop: '1px solid #94A3B8',
                paddingTop: '6px',
                marginTop: '2px',
                fontSize: '14px',
                fontWeight: 900,
                color: '#0F172A',
              }}>
                <span>UPDATED TOTAL:</span>
                <span>RS {(currentBill.grandTotal / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSaveEdits}
                disabled={currentBill.items.length === 0}
                style={{
                  flex: 1.4,
                  padding: '10px 12px',
                  backgroundColor: '#15803D',
                  border: '1px solid #166534',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  borderRadius: '0px',
                  cursor: currentBill.items.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Check size={16} strokeWidth={2.5} />
                <span>Save Changes</span>
              </button>

              {onLoadBillIntoCart && (
                <button
                  type="button"
                  onClick={() => {
                    onLoadBillIntoCart(currentBill);
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #0F172A',
                    color: '#FFFFFF',
                    fontWeight: 750,
                    fontSize: '12px',
                    borderRadius: '0px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                  title="Load back into POS Cart to edit with full menu grid"
                >
                  <ShoppingBag size={14} />
                  <span>Edit in POS</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setCurrentBill(bill);
                  setIsEditing(false);
                }}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #9CA3AF',
                  color: '#374151',
                  fontWeight: 750,
                  fontSize: '12px',
                  borderRadius: '0px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Paper Container with Full Scrollability (Sharp Rectangle) */}
            <div
              style={{
                width: '100%',
                maxHeight: 'calc(80vh - 120px)',
                overflowY: 'auto',
                position: 'relative',
                zIndex: 20,
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                border: '1px solid #9CA3AF',
                borderTop: 'none',
                borderRadius: '0px',
              }}
            >
          {/* Thermal Paper Slip (Emerges seamlessly from printer head) */}
          <div
            id="printable-receipt"
            key={feedKey}
            className={`thermal-receipt ${isDispensing ? 'anim-continuous-dispense' : ''}`}
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              fontFamily: "'Space Mono', 'Courier New', Courier, monospace",
              padding: '16px 14px 22px 14px',
              fontSize: '11px',
              lineHeight: 1.35,
              position: 'relative',
            }}
          >
            {/* =========================================================
                PART 1: TOKEN SLIP (When Token + Bill is selected)
                ========================================================= */}
            {billFormat === 'token_bill' && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '11px', letterSpacing: '1px' }}>
                  *** KITCHEN / TOKEN ***
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '28px',
                    fontWeight: 900,
                    letterSpacing: '2px',
                    margin: '4px 0',
                    padding: '4px 0',
                    border: '1.5px solid #000000',
                  }}
                >
                  TOKEN #{orderNumStr}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px' }}>
                  <span>Order: <strong>{currentBill.orderType.toUpperCase()}</strong></span>
                  {currentBill.tableNo && <span>Table: <strong>{currentBill.tableNo}</strong></span>}
                </div>
                <div style={{ fontSize: '10px' }}>
                  Time: {new Date(currentBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ borderTop: '1px dashed #000000', margin: '6px 0 4px 0' }} />
                <div style={{ fontSize: '9.5px', fontWeight: 800 }}>ITEMS TO PREPARE:</div>
                {currentBill.items.map((item, idx) => {
                  const shortVar = item.variantSnapshot ? getShortVariantCode(item.variantSnapshot) : '';
                  return (
                    <div key={idx} style={{ fontSize: '10.5px', fontWeight: 700 }}>
                      {item.qty}x {item.shortNameSnapshot || item.nameSnapshot}
                      {shortVar && <span style={{ fontWeight: 600, color: '#374151' }}> ({shortVar})</span>}
                      {item.note && <div style={{ fontSize: '9px', fontStyle: 'italic', color: '#DC2626' }}> *{item.note}</div>}
                    </div>
                  );
                })}
                <div style={{ borderTop: '1.5px dashed #000000', borderBottom: '1.5px dashed #000000', padding: '6px 0', margin: '10px 0', textAlign: 'center', fontSize: '9px', fontWeight: 800, letterSpacing: '1px' }}>
                  ✂ - - - - - TEAR HERE - - - - - ✂
                </div>
              </div>
            )}

            {/* =========================================================
                PART 2: INDIAN STANDARD CUSTOMER BILL (Clean & Authentic)
                ========================================================= */}

            {/* Duplicate Copy Marker */}
            {(isDuplicate || currentBill.printCount > 1) && (
              <div style={{ textAlign: 'center', fontWeight: 800, border: '1px dashed #000000', padding: '2px', marginBottom: '8px', fontSize: '10px' }}>
                *** DUPLICATE COPY ***
              </div>
            )}

            {/* Restaurant Profile Header with Brand Logo */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              {/* Brand Logo (Custom Uploaded or Default Restaurant Emblem) */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                <img
                  src={activeLogoUrl}
                  alt={profile.name || 'Store Logo'}
                  style={{
                    maxHeight: logoDims.maxHeight,
                    maxWidth: logoDims.maxWidth,
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              </div>

              {/* Store Name */}
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {profile.name || 'NINJA CAFE & RESTAURANT'}
              </div>
              {profile.tagline && (
                <div style={{ fontSize: '10px', marginTop: '1px' }}>{profile.tagline}</div>
              )}
              {profile.address && (
                <div style={{ fontSize: '9.5px', marginTop: '1px', lineHeight: 1.25 }}>{profile.address}</div>
              )}
              {profile.phone && (
                <div style={{ fontSize: '9.5px', marginTop: '1px' }}>PHONE: +91 {profile.phone.replace(/[^0-9]/g, '').slice(-10)}</div>
              )}
              {profile.gstin && (
                <div style={{ fontSize: '9.5px', marginTop: '1px', fontWeight: 700 }}>GSTIN: {profile.gstin}</div>
              )}
              {profile.fssai && (
                <div style={{ fontSize: '9.5px', marginTop: '1px' }}>FSSAI: {profile.fssai}</div>
              )}
            </div>

            {/* Centered Order Number Box - For ALL types (Dine-in, Takeaway, Delivery) */}
            <div style={{ borderTop: '1px dashed #000000', margin: '6px 0' }} />
            <div
              style={{
                textAlign: 'center',
                fontSize: '17px',
                fontWeight: 900,
                letterSpacing: '2.5px',
                fontFamily: "'Courier Prime', monospace, 'Courier New'",
                padding: '3px 0',
              }}
            >
              ORDER : # {orderNumStr.split('').join(' ')}
            </div>
            <div style={{ borderTop: '1px dashed #000000', margin: '6px 0' }} />

            {/* Bill Meta Data */}
            <div style={{ fontSize: '10px', lineHeight: 1.4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Bill: <strong>{currentBill.billNo}</strong></span>
                <span>{dateTimeFormatted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Date: {new Date(currentBill.createdAt).toLocaleDateString('en-IN')}</span>
                <span style={{ fontWeight: 800 }}>{currentBill.orderType === 'takeaway' ? 'PARCEL / TAKEAWAY' : currentBill.orderType.toUpperCase()}</span>
              </div>
              {currentBill.tableNo && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Table: <strong>{currentBill.tableNo}</strong></span>
                  {currentBill.customerName && <span>Cust: {currentBill.customerName}</span>}
                </div>
              )}
              {!currentBill.tableNo && currentBill.customerName && (
                <div>Customer: {currentBill.customerName} {currentBill.customerPhone ? `(${currentBill.customerPhone})` : ''}</div>
              )}
            </div>

            {/* Dashed Separator */}
            <div style={{ borderTop: '1px dashed #000000', margin: '6px 0' }} />

            {/* Items Table */}
            <div style={{ fontSize: '10.5px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, paddingBottom: '3px' }}>
                <span style={{ flex: 1 }}>ITEM</span>
                <span style={{ width: '40px', textAlign: 'center' }}>QTY</span>
                <span style={{ width: '65px', textAlign: 'right' }}>AMT</span>
              </div>

              {/* Items List */}
              <div style={{ borderTop: '1px solid #000000', paddingTop: '3px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {currentBill.items.map((item, idx) => {
                  const shortVar = item.variantSnapshot ? getShortVariantCode(item.variantSnapshot) : '';
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ flex: 1, paddingRight: '4px', fontWeight: 700 }}>
                          {item.shortNameSnapshot || item.nameSnapshot}
                          {shortVar && <span style={{ fontWeight: 600, fontSize: '9.5px', color: '#374151' }}> ({shortVar})</span>}
                        </span>
                        <span style={{ width: '40px', textAlign: 'center' }}>{item.qty}</span>
                        <span style={{ width: '65px', textAlign: 'right', fontWeight: 700 }}>
                          {(item.lineTotal / 100).toFixed(2)}
                        </span>
                      </div>
                      {item.note && (
                        <div style={{ fontSize: '8.5px', fontStyle: 'italic', color: '#DC2626' }}>
                          *{item.note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dashed Separator */}
            <div style={{ borderTop: '1px dashed #000000', margin: '6px 0' }} />

            {/* Calculations & GST Breakup */}
            <div style={{ fontSize: '10px', lineHeight: 1.45 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>{(currentBill.subtotal / 100).toFixed(2)}</span>
              </div>

              {currentBill.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>Discount {currentBill.discountType === 'percent' ? `(${currentBill.discountValue}%)` : ''}</span>
                  <span>-{(currentBill.discountAmount / 100).toFixed(2)}</span>
                </div>
              )}

              {currentBill.serviceCharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Service Charge</span>
                  <span>{(currentBill.serviceCharge / 100).toFixed(2)}</span>
                </div>
              )}

              {currentBill.packagingCharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Packaging Charge</span>
                  <span>{(currentBill.packagingCharge / 100).toFixed(2)}</span>
                </div>
              )}

              {currentBill.cgst > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST @ {(profile.defaultGstPercent / 2).toFixed(1)}%</span>
                  <span>{(currentBill.cgst / 100).toFixed(2)}</span>
                </div>
              )}

              {currentBill.sgst > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SGST @ {(profile.defaultGstPercent / 2).toFixed(1)}%</span>
                  <span>{(currentBill.sgst / 100).toFixed(2)}</span>
                </div>
              )}

              {currentBill.roundOff !== 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Round Off</span>
                  <span>{(currentBill.roundOff > 0 ? '+' : '') + (currentBill.roundOff / 100).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Dashed Separator */}
            <div style={{ borderTop: '1px dashed #000000', margin: '6px 0' }} />

            {/* GRAND TOTAL ROW (Bold & Bigger) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontSize: '15px',
                fontWeight: 900,
                letterSpacing: '0.4px',
              }}
            >
              <span>TOTAL:</span>
              <span style={{ fontSize: '18px', fontWeight: 900 }}>
                {(currentBill.grandTotal / 100).toFixed(2)}
              </span>
            </div>

            {/* Double Solid Line */}
            <div style={{ borderTop: '1.5px solid #000000', borderBottom: '1.5px solid #000000', height: '3px', margin: '6px 0' }} />

            {/* PAYMENT MODE ROW */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                fontWeight: 800,
              }}
            >
              <span>PAYMENT ({currentBill.paymentMode.toUpperCase()})</span>
              <span>RS {(currentBill.grandTotal / 100).toFixed(2)}</span>
            </div>

            {/* DYNAMIC UPI QR CODE (If enabled) */}
            {showQr && (
              <div style={{ textAlign: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #000000' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.4px', marginBottom: '4px' }}>
                  SCAN & PAY
                </div>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="UPI Payment QR"
                    style={{
                      width: '110px',
                      height: '110px',
                      margin: '0 auto',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '9.5px', color: '#B45309', margin: '4px 0' }}>
                    {profile.upiVpa ? 'Generating QR...' : 'Add UPI ID in Settings to show QR'}
                  </div>
                )}
              </div>
            )}

            {/* Standard Footer */}
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
              {profile.footerText && profile.footerText.trim() && profile.footerText.trim().toLowerCase() !== 'thanks for visiting' ? (
                profile.footerText.split('\n').map((l, idx) => (
                  <div key={idx}>{l.trim()}</div>
                ))
              ) : (
                <>
                  <div>THANK YOU!</div>
                  <div style={{ marginTop: '2px', fontSize: '10px' }}>VISIT AGAIN</div>
                </>
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '9px', color: '#64748B', fontWeight: 700, letterSpacing: '0.4px' }}>
              Powered by bookmydineqr
            </div>
          </div>
        </div>

        {/* ============================================================
            BOTTOM ACTION TOOLBAR (When step === 'preview')
            ============================================================ */}
        {step === 'preview' && (
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '0px',
              padding: '10px 12px',
              border: '1px solid #9CA3AF',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Integrated Status & Paper Format Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '8px',
                borderBottom: '1px solid #E5E7EB',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#111827' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '0px',
                    backgroundColor: isDispensing ? '#B45309' : '#15803D',
                    display: 'inline-block',
                  }}
                />
                <span>{statusMessage}</span>
              </div>
              <div style={{ fontSize: '10px', fontWeight: 750, color: '#6B7280' }}>
                {isWide ? '80mm Thermal' : '58mm Thermal'}
              </div>
            </div>

            {/* Quick Segmented Switchers: Format (50%) & QR (50%) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
              {/* Format Toggle */}
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#F3F4F6',
                  padding: '2px',
                  borderRadius: '0px',
                  border: '1px solid #D1D5DB',
                }}
              >
                <button
                  type="button"
                  onClick={() => setBillFormat('token_bill')}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    borderRadius: '0px',
                    border: 'none',
                    backgroundColor: billFormat === 'token_bill' ? '#2563EB' : 'transparent',
                    color: billFormat === 'token_bill' ? '#FFFFFF' : '#475569',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Token + Bill
                </button>
                <button
                  type="button"
                  onClick={() => setBillFormat('bill_only')}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    borderRadius: '0px',
                    border: 'none',
                    backgroundColor: billFormat === 'bill_only' ? '#2563EB' : 'transparent',
                    color: billFormat === 'bill_only' ? '#FFFFFF' : '#475569',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Bill Only
                </button>
              </div>

              {/* QR Toggle */}
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#F3F4F6',
                  padding: '2px',
                  borderRadius: '0px',
                  border: '1px solid #D1D5DB',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowQr(true)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    borderRadius: '0px',
                    border: 'none',
                    backgroundColor: showQr ? '#15803D' : 'transparent',
                    color: showQr ? '#FFFFFF' : '#4B5563',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  With QR
                </button>
                <button
                  type="button"
                  onClick={() => setShowQr(false)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    borderRadius: '0px',
                    border: 'none',
                    backgroundColor: !showQr ? '#475569' : 'transparent',
                    color: !showQr ? '#FFFFFF' : '#4B5563',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  No QR
                </button>
              </div>
            </div>

            {/* Row 2: Primary High-Priority POS Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 1.1fr', gap: '6px', width: '100%' }}>
              {/* Forest Green Print CTA */}
              <button
                type="button"
                onClick={() => handlePrintDirect(true)}
                disabled={printing || isDispensing}
                style={{
                  padding: '10px 8px',
                  borderRadius: '0px',
                  backgroundColor: '#15803D',
                  color: '#FFFFFF',
                  border: '1px solid #166534',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(21, 128, 61, 0.25)',
                }}
              >
                <Printer size={15} strokeWidth={2.4} />
                <span>{printing ? 'Printing...' : 'Print Receipt'}</span>
              </button>

              {/* Edit Bill Button */}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '10px 8px',
                  borderRadius: '0px',
                  backgroundColor: '#B45309',
                  border: '1px solid #92400E',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(180, 83, 9, 0.25)',
                }}
                title="Edit bill items, add/remove dishes, fix mistakes"
              >
                <Edit3 size={14} />
                <span>Edit Bill</span>
              </button>

              {/* Settle Payment Button (Sapphire Light Mode CTA) */}
              <button
                type="button"
                onClick={() => setStep('payment')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '0px',
                  backgroundColor: '#2563EB',
                  border: '1px solid #1D4ED8',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Banknote size={15} />
                <span>Settle</span>
              </button>
            </div>

            {/* Row 3: Secondary Actions & Navigation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 0.9fr', gap: '6px', width: '100%' }}>
              {/* New Order / Next Bill Button */}
              <button
                type="button"
                onClick={() => {
                  if (onAfterPrint) onAfterPrint();
                  onClose();
                }}
                style={{
                  padding: '8px 8px',
                  borderRadius: '0px',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #9CA3AF',
                  color: '#111827',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
                title="Finish & Start New Order (F2)"
              >
                <Plus size={13} />
                <span>New Bill</span>
              </button>

              {/* PDF / Save Invoice Button */}
              <button
                type="button"
                onClick={handleBrowserPrint}
                style={{
                  padding: '8px 8px',
                  borderRadius: '0px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  color: '#111827',
                  fontWeight: 750,
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
                title="Save & Export PDF Invoice"
              >
                <Download size={13} color="#DC2626" />
                <span>Save PDF</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  if (onAfterPrint) onAfterPrint();
                  onClose();
                }}
                style={{
                  padding: '8px 8px',
                  borderRadius: '0px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#DC2626',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
                title="Close and Return to Billing (Esc)"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>
        )}
          </>
        )}
        </div>

        {/* ============================================================
            RIGHT COLUMN: PAYMENT SETTLEMENT CARD (When step === 'payment')
            Full Scrollable & Responsive with Live Add/Edit Dishes
            ============================================================ */}
        {step === 'payment' && !isEditing && (
          <div
            style={{
              flex: '1 1 340px',
              maxWidth: '460px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '0px',
              padding: '16px',
              maxHeight: 'calc(90vh - 60px)',
              overflowY: 'auto',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
              border: '1px solid #9CA3AF',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Header: Settle Title and Grand Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Collect & Settle Payment
                </span>
                <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginTop: '2px' }}>
                  Order #{orderNumStr} • {currentBill.orderType.toUpperCase()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 700 }}>BILL TOTAL</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>
                  RS {(currentBill.grandTotal / 100).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Quick In-Settle "Edit / Add Dishes" Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FCD34D',
                borderRadius: '0px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 600 }}>
                Need to add items or adjust bill?
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#B45309',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  borderRadius: '0px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Edit3 size={12} />
                <span>Edit / Add Dishes</span>
              </button>
            </div>

            {/* Payment Method Selector (4 Grid Options with Icons) */}
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Select Payment Mode:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {paymentMethods.map((m) => {
                  const isSelected = paymentMode === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setPaymentMode(m.id);
                        if (m.id === 'cash') {
                          setTimeout(() => cashInputRef.current?.focus(), 100);
                        }
                      }}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '0px',
                        border: `1.5px solid ${isSelected ? '#15803D' : '#D1D5DB'}`,
                        backgroundColor: isSelected ? '#F0FDF4' : '#F9FAFB',
                        color: isSelected ? '#15803D' : '#374151',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Icon size={15} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Settlement Section */}
            {paymentMode === 'cash' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase' }}>
                    Cash Received from Customer:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCashTenderedRupees((currentBill.grandTotal / 100).toFixed(0));
                      cashInputRef.current?.focus();
                    }}
                    style={{
                      fontSize: '10.5px',
                      color: '#15803D',
                      fontWeight: 800,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Set Exact (₹{(currentBill.grandTotal / 100).toFixed(2)})
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: isUnderpaid ? '#DC2626' : '#6B7280', fontSize: '16px' }}>
                    ₹
                  </span>
                  <input
                    ref={cashInputRef}
                    type="number"
                    value={cashTenderedRupees}
                    onChange={(e) => setCashTenderedRupees(e.target.value)}
                    placeholder={(currentBill.grandTotal / 100).toFixed(0)}
                    style={{
                      width: '100%',
                      paddingLeft: '26px',
                      paddingRight: '10px',
                      paddingTop: '8px',
                      paddingBottom: '8px',
                      fontSize: '16px',
                      fontWeight: 800,
                      borderRadius: '0px',
                      border: isUnderpaid ? '2px solid #DC2626' : '1.5px solid #9CA3AF',
                      backgroundColor: isUnderpaid ? '#FEF2F2' : '#FFFFFF',
                      color: isUnderpaid ? '#991B1B' : '#111827',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Quick Cash Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {cashDenominations.map((denom, i) => {
                    const isDenomExact = denom.label === 'Exact';
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setCashTenderedRupees(denom.rupees.toString());
                          cashInputRef.current?.focus();
                        }}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '0px',
                          backgroundColor: isDenomExact ? '#EFF6FF' : '#F3F4F6',
                          border: `1px solid ${isDenomExact ? '#93C5FD' : '#D1D5DB'}`,
                          fontSize: '11px',
                          fontWeight: 750,
                          color: isDenomExact ? '#1D4ED8' : '#111827',
                          cursor: 'pointer',
                        }}
                      >
                        {denom.label}
                      </button>
                    );
                  })}
                </div>

                {/* Error Banner when Less Amount is Entered */}
                {isUnderpaid && (
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: '0px',
                      backgroundColor: '#FEF2F2',
                      border: '1.5px solid #F87171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#991B1B',
                    }}
                  >
                    <AlertTriangle size={17} color="#DC2626" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '11px', lineHeight: 1.35 }}>
                      <div style={{ fontWeight: 800, color: '#B91C1C' }}>
                        LESS AMOUNT ENTERED: ₹{(cashTenderedPaise / 100).toFixed(2)}
                      </div>
                      <div style={{ color: '#7F1D1D', marginTop: '1px' }}>
                        Amount entered is <strong>₹{(shortfallPaise / 100).toFixed(2)} SHORT</strong> of total due (₹{(currentBill.grandTotal / 100).toFixed(2)}).
                      </div>
                    </div>
                  </div>
                )}

                {/* Change Return Result (When sufficient cash entered) */}
                {hasEnteredCash && !isUnderpaid && (
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: '0px',
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #86EFAC',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534' }}>
                      Change to Return:
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: '#15803D' }}>
                      RS {(changeDuePaise / 100).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* UPI QR Quick Verification Section */}
            {paymentMode === 'upi' && (
              <div style={{
                padding: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>
                  UPI / QR Payment Collection
                </div>
                {profile.upiVpa ? (
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                    Customer scans QR on bill or UPI App paying <strong>₹{(currentBill.grandTotal / 100).toFixed(2)}</strong> to <strong>{profile.upiVpa}</strong>
                  </div>
                ) : (
                  <div style={{ fontSize: '10.5px', color: '#B45309' }}>
                    Configure UPI ID in Settings to show QR on receipts
                  </div>
                )}
              </div>
            )}

            {/* Card Settlement Note */}
            {paymentMode === 'card' && (
              <div style={{
                padding: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                fontSize: '11px',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <CreditCard size={16} color="#2563EB" />
                <span>Collect <strong>₹{(currentBill.grandTotal / 100).toFixed(2)}</strong> on POS card swipe terminal</span>
              </div>
            )}

            {/* Action Buttons for Settle Step */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setStep('preview')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '0px',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  color: '#374151',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>

              {isUnderpaid ? (
                <button
                  type="button"
                  disabled
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '0px',
                    backgroundColor: '#F87171',
                    color: '#FFFFFF',
                    border: '1px solid #EF4444',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                  title="Cannot settle: Amount entered is less than total due"
                >
                  <AlertTriangle size={14} />
                  <span>Short by ₹{(shortfallPaise / 100).toFixed(2)}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmPaymentAndPrint}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '0px',
                    backgroundColor: '#15803D',
                    color: '#FFFFFF',
                    border: '1px solid #166534',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(21, 128, 61, 0.25)',
                  }}
                >
                  <Check size={15} strokeWidth={2.6} />
                  <span>Confirm & Settle Payment</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
