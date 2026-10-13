import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  PauseCircle,
  RotateCcw,
  Tag,
  MessageSquare,
  ChevronUp,
  X,
  ShoppingBag,
  Utensils,
  Car,
  Receipt,
  Check,
  CreditCard,
  Eye,
  Flame,
  ChefHat,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  Category,
  Item,
  BillItemSnapshot,
  RestaurantProfile,
  OrderType,
  PaymentMode,
  Bill
} from '../types';
import { formatPaise, calculateBillTaxes, rupeesToPaise } from '../utils/currency';
import { searchMenuItems } from '../utils/search';
import { saveNewBill, getNextOrderNo, db } from '../db';
import {
  buildEscPosBill,
  generateEscPosBill,
  buildEscPosKot,
  printViaBluetooth,
  isBluetoothPrinterConnected,
  getSavedPrinterName,
  isAndroidNative,
} from '../utils/printer';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';
import { BluetoothScanModal } from './BluetoothScanModal';
import { SettlementSuccessModal } from './SettlementSuccessModal';
import { customAlert, customConfirm } from './CustomDialog';

/**
 * Background silent print helper for system thermal printing without modal clutter.
 */
function printCleanReceiptHtml(text: string, isWide: boolean, logoUrl?: string) {
  if (typeof document === 'undefined') return;
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
  const pageSizeWidth = isWide ? '80mm' : '58mm';
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt_Slip</title>
        <style>
          @page { margin: 0; size: ${pageSizeWidth} auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: ${isWide ? '11.5px' : '9.5px'};
            white-space: pre-wrap;
            margin: 0;
            padding: 3mm 2mm;
            line-height: 1.35;
            color: #000;
          }
          .receipt-logo {
            text-align: center;
            margin-bottom: 6px;
          }
          .receipt-logo img {
            max-height: 52px;
            max-width: 140px;
            object-fit: contain;
            display: block;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>
        ${logoUrl ? `<div class="receipt-logo"><img src="${logoUrl}" alt="Store Logo" /></div>` : ''}
        ${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </body>
    </html>
  `);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 1500);
  }, 250);
}

interface BillingScreenProps {
  categories: Category[];
  items: Item[];
  profile: RestaurantProfile;
  latestOrderNo: number;
  onRefreshData: () => void;
  onOpenHeldBills: () => void;
  globalSearch?: string;
  onClearGlobalSearch?: () => void;
  externalAddItem?: Item | null;
  onConsumeExternalAddItem?: () => void;
  onCartChange?: (count: number) => void;
}

export const BillingScreen: React.FC<BillingScreenProps> = ({
  categories,
  items,
  profile,
  latestOrderNo,
  onRefreshData,
  onOpenHeldBills,
  globalSearch = '',
  onClearGlobalSearch,
  externalAddItem = null,
  onConsumeExternalAddItem,
  onCartChange,
}) => {
  // Active Bill State
  const [cart, setCart] = useState<BillItemSnapshot[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNo, setTableNo] = useState<string>('T1');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Discount & Charges
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0); // % or paise
  const [packagingCharge, setPackagingCharge] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);

  // Switch Order Type and auto-apply packaging charge for takeaway/delivery
  const handleSelectOrderType = (newType: OrderType) => {
    setOrderType(newType);
    if (newType === 'takeaway' || newType === 'delivery') {
      const defaultPackPaise = (profile.defaultPackagingCharge ?? 10) * 100;
      setPackagingCharge(defaultPackPaise);
    } else {
      setPackagingCharge(0);
    }
  };

  // Menu Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vegOnlyFilter, setVegOnlyFilter] = useState<boolean>(false);

  // Modals & Sheets
  const [variantModalItem, setVariantModalItem] = useState<Item | null>(null);
  const [noteModalItemIndex, setNoteModalItemIndex] = useState<number | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');
  const [discountModalOpen, setDiscountModalOpen] = useState<boolean>(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [receiptPreviewBill, setReceiptPreviewBill] = useState<Bill | null>(null);
  const [receiptPreviewAutoPrint, setReceiptPreviewAutoPrint] = useState<boolean>(false);
  const [receiptPreviewShowQr, setReceiptPreviewShowQr] = useState<boolean>(false);
  const [mobileCartSheetOpen, setMobileCartSheetOpen] = useState<boolean>(false);
  const [bluetoothScanModalOpen, setBluetoothScanModalOpen] = useState<boolean>(false);
  const [pendingPrintBytes, setPendingPrintBytes] = useState<Uint8Array | null>(null);
  const [activeCartOrderNo, setActiveCartOrderNo] = useState<number | null>(null);
  const [successModalData, setSuccessModalData] = useState<{
    isOpen: boolean;
    orderNo: number | string;
    amountPaise: number;
    currencySymbol: string;
    paymentMode: string;
    printerName?: string;
    title?: string;
    subtitle?: string;
    onReprint?: () => void;
    onViewBill?: () => void;
  } | null>(null);

  // Effective search query combining top header search and local menu search
  const effectiveSearch = (globalSearch || searchQuery).trim();

  // Filtered & Ranked Items using Fuzzy Typo-Tolerant Engine
  const filteredItems = useMemo(() => {
    let baseItems = items;
    if (selectedCategory !== 'all') {
      baseItems = baseItems.filter((i) => i.categoryId === selectedCategory);
    }
    if (vegOnlyFilter) {
      baseItems = baseItems.filter((i) => i.isVeg);
    }

    if (!effectiveSearch) {
      return baseItems.filter((it) => !it.isDeleted);
    }

    return searchMenuItems(baseItems, effectiveSearch, categories);
  }, [items, selectedCategory, vegOnlyFilter, effectiveSearch, categories]);

  // Cart Qty Map for Badges
  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((ci) => {
      if (ci.itemId) {
        map.set(ci.itemId, (map.get(ci.itemId) || 0) + ci.qty);
      }
    });
    return map;
  }, [cart]);

  // Total Quantity of items
  const totalItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountValue <= 0 || subtotal <= 0) return 0;
    if (discountType === 'percent') {
      return Math.round((subtotal * discountValue) / 100);
    }
    return Math.min(subtotal, discountValue);
  }, [subtotal, discountType, discountValue]);

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const taxes = useMemo(() => {
    return calculateBillTaxes(subtotalAfterDiscount, profile.taxMode, profile.defaultGstPercent);
  }, [subtotalAfterDiscount, profile.taxMode, profile.defaultGstPercent]);

  const rawGrandTotal = useMemo(() => {
    if (profile.taxMode === 'exclusive') {
      return subtotalAfterDiscount + taxes.totalTax + packagingCharge + serviceCharge;
    }
    // inclusive or none
    return subtotalAfterDiscount + packagingCharge + serviceCharge;
  }, [subtotalAfterDiscount, taxes, packagingCharge, serviceCharge, profile.taxMode]);

  // Round off to nearest Rupee (100 paise)
  const roundedGrandTotal = Math.round(rawGrandTotal / 100) * 100;
  const roundOff = roundedGrandTotal - rawGrandTotal;

  // Add Item to Cart
  const handleItemTap = async (item: Item) => {
    if (item.isOutOfStock || !item.isActive) {
      const confirmPunch = await customConfirm(
        `"${item.name}" is marked OUT OF STOCK. Do you want to punch it anyway?`,
        'Item Out of Stock',
        'Punch Anyway',
        'Cancel',
        false
      );
      if (!confirmPunch) return;
    }

    // Inventory Stock Quantity Boundary Check
    if (typeof item.stockQty === 'number' && item.stockQty !== undefined && item.stockQty !== null) {
      const currentInCart = cart
        .filter((ci) => ci.itemId === item.id)
        .reduce((sum, ci) => sum + ci.qty, 0);

      if (currentInCart >= item.stockQty) {
        customAlert(
          `Only ${item.stockQty} ${item.stockQty === 1 ? 'portion' : 'portions'} of "${item.name}" left in stock! Cannot add more.`,
          'Inventory Limit'
        );
        return;
      }
    }

    if (item.variants && item.variants.length > 0) {
      setVariantModalItem(item);
      return;
    }

    addItemToCart(item, item.basePrice, undefined);
  };

  // Sync active cart count to top header
  useEffect(() => {
    onCartChange?.(totalItemCount);
  }, [totalItemCount, onCartChange]);

  // Handle external add item triggered from top header Omnisearch
  useEffect(() => {
    if (externalAddItem) {
      handleItemTap(externalAddItem);
      onConsumeExternalAddItem?.();
    }
  }, [externalAddItem]);

  const addItemToCart = (item: Item, price: number, variantLabel?: string) => {
    // Inventory Stock Quantity Boundary Check
    if (typeof item.stockQty === 'number' && item.stockQty !== undefined && item.stockQty !== null) {
      const currentInCart = cart
        .filter((ci) => ci.itemId === item.id)
        .reduce((sum, ci) => sum + ci.qty, 0);

      if (currentInCart >= item.stockQty) {
        customAlert(
          `Only ${item.stockQty} ${item.stockQty === 1 ? 'portion' : 'portions'} of "${item.name}" left in stock! Cannot add more.`,
          'Inventory Limit'
        );
        return;
      }
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.itemId === item.id && ci.variantSnapshot === variantLabel
      );

      if (existingIdx >= 0) {
        const next = [...prev];
        const existing = next[existingIdx];
        const newQty = existing.qty + 1;
        next[existingIdx] = {
          ...existing,
          qty: newQty,
          lineTotal: newQty * existing.unitPrice,
        };
        return next;
      } else {
        const newItem: BillItemSnapshot = {
          id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          itemId: item.id,
          nameSnapshot: item.name,
          nameHindiSnapshot: item.nameHindi,
          shortNameSnapshot: item.shortName,
          variantSnapshot: variantLabel,
          qty: 1,
          unitPrice: price,
          taxPercent: item.taxPercent,
          lineTotal: price,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateCartItemQty = (index: number, delta: number) => {
    if (delta > 0) {
      const target = cart[index];
      if (target && target.itemId) {
        const matchedItem = items.find((i) => i.id === target.itemId);
        if (matchedItem && typeof matchedItem.stockQty === 'number' && matchedItem.stockQty !== undefined && matchedItem.stockQty !== null) {
          const currentInCart = cart
            .filter((ci) => ci.itemId === matchedItem.id)
            .reduce((sum, ci) => sum + ci.qty, 0);
          if (currentInCart >= matchedItem.stockQty) {
            customAlert(
              `Only ${matchedItem.stockQty} ${matchedItem.stockQty === 1 ? 'portion' : 'portions'} of "${matchedItem.name}" left in stock! Cannot increase quantity.`,
              'Inventory Limit'
            );
            return;
          }
        }
      }
    }

    setCart((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      const newQty = target.qty + delta;

      if (newQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = {
          ...target,
          qty: newQty,
          lineTotal: newQty * target.unitPrice,
        };
      }
      return next;
    });
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenNoteModal = (index: number) => {
    setNoteModalItemIndex(index);
    setTempNoteText(cart[index]?.note || '');
  };

  const handleSaveNote = () => {
    if (noteModalItemIndex !== null) {
      setCart((prev) => {
        const next = [...prev];
        next[noteModalItemIndex] = {
          ...next[noteModalItemIndex],
          note: tempNoteText.trim() || undefined,
        };
        return next;
      });
      setNoteModalItemIndex(null);
    }
  };

  const handleClearBill = async () => {
    if (cart.length === 0) return;
    const confirmed = await customConfirm(
      'Are you sure you want to clear all items from this order?',
      'Clear Order',
      'Clear All',
      'Keep Order',
      true
    );
    if (confirmed) {
      setCart([]);
      setDiscountValue(0);
      setCustomerName('');
      setCustomerPhone('');
      setMobileCartSheetOpen(false);
    }
  };

  // Hold Current Bill
  const handleHoldBill = async () => {
    if (cart.length === 0) return;
    const title = orderType === 'dine_in' ? `Table ${tableNo}` : `${orderType.toUpperCase()} Order`;
    await db.heldBills.add({
      id: `held_${Date.now()}`,
      title,
      orderType,
      tableNo: orderType === 'dine_in' ? tableNo : undefined,
      customerName,
      customerPhone,
      items: cart,
      savedAt: Date.now(),
      note: '',
    });

    setCart([]);
    setDiscountValue(0);
    setCustomerName('');
    setCustomerPhone('');
    setMobileCartSheetOpen(false);
    onRefreshData();
  };

  // Preview / Review & Edit Bill (Does NOT auto-print, allows in-preview editing)
  const handlePreviewBill = async () => {
    if (cart.length === 0) return;

    try {
      const savedBill = await saveNewBill(
        {
          orderType,
          tableNo: orderType === 'dine_in' ? tableNo : undefined,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          items: cart,
          subtotal,
          discountType,
          discountValue,
          discountAmount,
          serviceCharge,
          packagingCharge,
          taxableAmount: taxes.taxableAmount,
          cgst: taxes.cgst,
          sgst: taxes.sgst,
          roundOff,
          grandTotal: roundedGrandTotal,
          paymentMode: 'cash',
          paymentStatus: 'paid',
          status: 'ACTIVE',
        }
      );

      // Open in strict Preview Mode (no auto-print sound, no double print)
      setReceiptPreviewAutoPrint(false);
      setReceiptPreviewBill(savedBill);
      setMobileCartSheetOpen(false);
      onRefreshData();
    } catch (err: any) {
      customAlert(`Error generating bill preview: ${err.message}`, 'Preview Error', 'error');
    }
  };

  const [lastSettledToast, setLastSettledToast] = useState<{ bill: Bill; printWithQr: boolean } | null>(null);

  // Auto-dismiss settled toast after 5 seconds
  useEffect(() => {
    if (lastSettledToast) {
      const timer = setTimeout(() => setLastSettledToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastSettledToast]);

  // Open Kitchen Order Ticket (KOT) Direct Print
  const handlePrintKot = async () => {
    if (cart.length === 0) {
      customAlert('Cart is empty. Please add items to cart before printing KOT.', 'Empty Cart', 'warning');
      return;
    }

    let orderNum = activeCartOrderNo;
    if (!orderNum) {
      orderNum = await getNextOrderNo();
      setActiveCartOrderNo(orderNum);
    }

    const escPos = buildEscPosKot(
      orderNum,
      orderType,
      orderType === 'dine_in' ? tableNo : undefined,
      cart,
      profile.paperWidth,
      customerName,
      customerPhone
    );

    if (isAndroidNative()) {
      const res = await printViaBluetooth(escPos.bytes, false);
      if (!res.success) {
        setPendingPrintBytes(escPos.bytes);
        setBluetoothScanModalOpen(true);
      }
    } else if (isBluetoothPrinterConnected()) {
      const res = await printViaBluetooth(escPos.bytes, false);
      if (!res.success) {
        printCleanReceiptHtml(escPos.textPreview, profile.paperWidth === 80);
      }
    } else {
      printCleanReceiptHtml(escPos.textPreview, profile.paperWidth === 80);
    }

    // Celebratory confirmation animation for KOT!
    setSuccessModalData({
      isOpen: true,
      orderNo: orderNum,
      amountPaise: subtotal,
      currencySymbol: profile.currencySymbol,
      paymentMode: 'KOT Slip',
      printerName: isBluetoothPrinterConnected() ? (getSavedPrinterName() || 'Kitchen Thermal Printer') : 'Thermal Printer Ready',
      title: 'KOT Sent to Kitchen!',
      subtitle: `Kitchen ticket for Order #${orderNum.toString().padStart(5, '0')} sent to thermal printer.`,
      onReprint: () => printViaBluetooth(escPos.bytes, false),
    });
  };

  // Open Settle & Checkout Modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setMobileCartSheetOpen(false);
    setCheckoutModalOpen(true);
  };

  // Complete from Checkout Modal without cluttering modal popup
  const handleConfirmCheckout = async (
    mode: PaymentMode,
    status: 'paid' | 'unpaid',
    shouldPrint: boolean,
    printWithQr: boolean = false
  ) => {
    if (cart.length === 0) return;
    try {
      const savedBill = await saveNewBill(
        {
          orderType,
          tableNo: orderType === 'dine_in' ? tableNo : undefined,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          items: cart,
          subtotal,
          discountType,
          discountValue,
          discountAmount,
          serviceCharge,
          packagingCharge,
          taxableAmount: taxes.taxableAmount,
          cgst: taxes.cgst,
          sgst: taxes.sgst,
          roundOff,
          grandTotal: roundedGrandTotal,
          paymentMode: mode,
          paymentStatus: status,
          status: 'ACTIVE',
          forcedOrderNo: activeCartOrderNo || undefined,
        }
      );

      setCheckoutModalOpen(false);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#10B981', '#059669', '#34D399', '#FBBF24'],
      });

      if (shouldPrint) {
        const escPos = await generateEscPosBill(savedBill, profile, false, {
          includeQrCode: printWithQr,
        });

        const activeLogo = profile.printLogoOnThermal !== false ? (profile.logoUrl || './logo.png') : undefined;

        if (isAndroidNative()) {
          const res = await printViaBluetooth(escPos.bytes, false);
          if (!res.success) {
            setPendingPrintBytes(escPos.bytes);
            setBluetoothScanModalOpen(true);
          }
        } else if (isBluetoothPrinterConnected()) {
          printViaBluetooth(escPos.bytes, false);
        } else {
          printCleanReceiptHtml(escPos.textPreview, profile.paperWidth === 80, activeLogo);
        }
      }

      // Celebratory Google Pay-style confirmation modal with animated pulsing green tick!
      setSuccessModalData({
        isOpen: true,
        orderNo: savedBill.orderNo || 1,
        amountPaise: roundedGrandTotal,
        currencySymbol: profile.currencySymbol,
        paymentMode: mode,
        printerName: isBluetoothPrinterConnected() ? (getSavedPrinterName() || 'MT580P') : 'System Print Ready',
        title: 'Order Completed Successfully!',
        subtitle: `Invoice #${(savedBill.orderNo || 1).toString().padStart(5, '0')} • ${formatPaise(roundedGrandTotal, profile.currencySymbol)} • ${mode.toUpperCase()}`,
        onReprint: async () => {
          const escPos = await generateEscPosBill(savedBill, profile, true, { includeQrCode: printWithQr });
          printViaBluetooth(escPos.bytes, false);
        },
        onViewBill: () => {
          setReceiptPreviewBill(savedBill);
          setReceiptPreviewShowQr(printWithQr);
        },
      });

      setLastSettledToast({
        bill: savedBill,
        printWithQr,
      });

      setCart([]);
      setActiveCartOrderNo(null);
      setDiscountValue(0);
      setCustomerName('');
      setCustomerPhone('');
      setMobileCartSheetOpen(false);
      onRefreshData();
    } catch (err: any) {
      customAlert(`Error saving bill: ${err.message}`, 'Save Error', 'error');
    }
  };

  // Keyboard Shortcuts (F8 for Preview & Edit Bill, F12 for Checkout & Settlement)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (receiptPreviewBill || checkoutModalOpen || discountModalOpen || variantModalItem) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          handlePreviewBill();
        }
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0) {
          handleOpenCheckout();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    cart,
    orderType,
    tableNo,
    customerName,
    customerPhone,
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    serviceCharge,
    packagingCharge,
    taxes,
    roundOff,
    roundedGrandTotal,
    receiptPreviewBill,
    checkoutModalOpen,
    discountModalOpen,
    variantModalItem,
  ]);

  // Common Bill Item List Component for reuse in Desktop Sidebar and Mobile Drawer
  const renderBillItemsList = () => {
    if (cart.length === 0) {
      return (
        <div style={{
          height: '100%',
          minHeight: '180px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-dim)',
          textAlign: 'center',
          padding: '24px',
        }}>
          <ShoppingBag size={44} strokeWidth={1.5} style={{ opacity: 0.35, marginBottom: '10px' }} />
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-muted)' }}>
            Order is empty
          </div>
          <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: 'var(--text-dim)' }}>
            Tap menu dishes to add items
          </p>
        </div>
      );
    }

    return cart.map((line, idx) => (
      <div
        key={line.id}
        className="animate-bill-item"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          borderRadius: '12px',
          padding: '10px 12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.25 }}>
              {line.shortNameSnapshot || line.nameSnapshot}
            </div>
            {line.variantSnapshot && (
              <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                {line.variantSnapshot}
              </div>
            )}
            {line.note && (
              <div style={{ fontSize: '10.5px', color: 'var(--accent-amber)', fontStyle: 'italic', marginTop: '2px' }}>
                Note: {line.note}
              </div>
            )}
          </div>

          <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            {formatPaise(line.lineTotal, profile.currencySymbol)}
          </div>
        </div>

        {/* Controls: Price per unit, Note, Qty (+/-), Delete */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            @ {formatPaise(line.unitPrice, profile.currencySymbol)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => handleOpenNoteModal(idx)}
              style={{
                padding: '5px',
                borderRadius: '6px',
                background: line.note ? 'rgba(245, 158, 11, 0.15)' : 'none',
                color: line.note ? 'var(--accent-amber)' : 'var(--text-muted)',
              }}
              title="Add cooking note"
            >
              <MessageSquare size={14} />
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-app)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}>
              <button
                onClick={() => updateCartItemQty(idx, -1)}
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  color: 'var(--text-main)',
                }}
              >
                <Minus size={13} />
              </button>

              <span style={{ fontSize: '13px', fontWeight: 800, padding: '0 6px', minWidth: '22px', textAlign: 'center' }}>
                {line.qty}
              </span>

              <button
                onClick={() => updateCartItemQty(idx, 1)}
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  color: 'var(--text-main)',
                }}
              >
                <Plus size={13} />
              </button>
            </div>

            <button
              onClick={() => removeCartItem(idx)}
              style={{
                padding: '5px',
                borderRadius: '6px',
                background: 'none',
                color: 'var(--accent-rose)',
              }}
              title="Remove item"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    ));
  };

  // Bill Financial Summary Block
  const renderBillSummaryBlock = () => (
    <div style={{
      padding: '12px 14px',
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-surface-elevated)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span>Subtotal ({totalItemCount} items):</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
          {formatPaise(subtotal, profile.currencySymbol)}
        </span>
      </div>

      {/* Discount Line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
        <button
          onClick={() => setDiscountModalOpen(true)}
          style={{
            background: 'none',
            color: 'var(--primary)',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: 0,
          }}
        >
          <Tag size={12} />
          <span>Discount {discountAmount > 0 ? `(${discountType === 'percent' ? discountValue + '%' : 'Flat'})` : ''}</span>
        </button>
        <span style={{ color: discountAmount > 0 ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: 700 }}>
          {discountAmount > 0 ? `-${formatPaise(discountAmount, profile.currencySymbol)}` : '+ Add'}
        </span>
      </div>

      {/* Packaging Charge Line (Auto-applies ₹10 or configured fee for Takeaway/Delivery) */}
      {(packagingCharge > 0 || orderType === 'takeaway' || orderType === 'delivery') && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Packaging Charge:</span>
            <div style={{ display: 'inline-flex', gap: '2px' }}>
              <button
                type="button"
                onClick={() => setPackagingCharge(0)}
                style={{
                  padding: '1px 5px',
                  fontSize: '10px',
                  fontWeight: 750,
                  backgroundColor: packagingCharge === 0 ? '#1E293B' : '#E2E8F0',
                  color: packagingCharge === 0 ? '#FFFFFF' : '#475569',
                  border: 'none',
                  borderRadius: '0px',
                  cursor: 'pointer',
                }}
                title="Remove packaging charge"
              >
                ₹0
              </button>
              <button
                type="button"
                onClick={() => setPackagingCharge((profile.defaultPackagingCharge ?? 10) * 100)}
                style={{
                  padding: '1px 5px',
                  fontSize: '10px',
                  fontWeight: 750,
                  backgroundColor: packagingCharge === (profile.defaultPackagingCharge ?? 10) * 100 ? '#15803D' : '#E2E8F0',
                  color: packagingCharge === (profile.defaultPackagingCharge ?? 10) * 100 ? '#FFFFFF' : '#475569',
                  border: 'none',
                  borderRadius: '0px',
                  cursor: 'pointer',
                }}
                title={`Set default ₹${profile.defaultPackagingCharge ?? 10} packaging charge`}
              >
                ₹{profile.defaultPackagingCharge ?? 10}
              </button>
            </div>
          </div>
          <span style={{ color: packagingCharge > 0 ? '#B45309' : 'var(--text-muted)', fontWeight: 700 }}>
            {formatPaise(packagingCharge, profile.currencySymbol)}
          </span>
        </div>
      )}

      {/* GST Tax Info */}
      {profile.taxMode !== 'none' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
          <span>GST ({profile.defaultGstPercent}% {profile.taxMode}):</span>
          <span>{formatPaise(taxes.totalTax, profile.currencySymbol)}</span>
        </div>
      )}

      {/* Round Off */}
      {roundOff !== 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
          <span>Round Off:</span>
          <span>{(roundOff > 0 ? '+' : '') + formatPaise(roundOff, profile.currencySymbol)}</span>
        </div>
      )}

      {/* Grand Total */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '6px',
        marginTop: '2px',
        borderTop: '1px solid var(--border-color)',
      }}>
        <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-main)' }}>
          GRAND TOTAL:
        </span>
        <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {formatPaise(roundedGrandTotal, profile.currencySymbol)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="pos-main-container" style={{
      display: 'flex',
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    }}>
      {/* LEFT SECTION: Categories, Search, and Menu Items Grid */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-app)',
        padding: '12px 14px',
        borderRight: '1px solid var(--border-color)',
      }}>
        {/* Top Filter Bar: Search & Veg Toggle */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          marginBottom: '10px',
        }}>
          {/* Search Bar */}
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Search dishes (English / हिंदी)..."
              value={globalSearch ? globalSearch : searchQuery}
              onChange={(e) => {
                if (globalSearch && onClearGlobalSearch) {
                  onClearGlobalSearch();
                }
                setSearchQuery(e.target.value);
              }}
              style={{
                width: '100%',
                paddingLeft: '36px',
                height: '42px',
                borderRadius: '12px',
                fontSize: '13.5px',
                borderColor: globalSearch ? '#2563EB' : undefined,
              }}
            />
            {(searchQuery || globalSearch) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  if (onClearGlobalSearch) onClearGlobalSearch();
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  color: 'var(--text-muted)',
                  padding: '4px',
                }}
                title="Clear dish search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Veg Only Toggle */}
          <button
            onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
            style={{
              height: '42px',
              padding: '0 12px',
              borderRadius: '12px',
              backgroundColor: vegOnlyFilter ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
              border: `1.5px solid ${vegOnlyFilter ? 'var(--accent-green)' : 'var(--border-color)'}`,
              color: vegOnlyFilter ? 'var(--accent-green)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{
              width: '12px',
              height: '12px',
              border: '2px solid #10b981',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '2px',
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            </div>
            <span>VEG</span>
          </button>
        </div>

        {/* Categories Horizontal Scroll Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '6px',
          marginBottom: '12px',
          flexShrink: 0,
          scrollbarWidth: 'none',
        }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              backgroundColor: selectedCategory === 'all' ? '#2563EB' : '#FFFFFF',
              color: selectedCategory === 'all' ? '#FFFFFF' : '#334155',
              fontSize: '13px',
              fontWeight: 700,
              border: `1px solid ${selectedCategory === 'all' ? '#2563EB' : '#E2E8F0'}`,
              whiteSpace: 'nowrap',
              boxShadow: selectedCategory === 'all' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            All ({items.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  backgroundColor: isSelected ? '#2563EB' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: `1px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Menu Items Grid */}
        <div className="menu-items-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '10px',
          alignContent: 'start',
        }}>
          {filteredItems.map((item) => {
            const inCartQty = cartQtyMap.get(item.id) || 0;
            const isOutOfStock = item.isOutOfStock || !item.isActive;
            return (
              <div
                key={item.id}
                onClick={() => handleItemTap(item)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `1.5px solid ${inCartQty > 0 ? '#2563EB' : isOutOfStock ? '#FDE68A' : '#E2E8F0'}`,
                  borderRadius: '12px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '120px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  opacity: isOutOfStock ? 0.78 : 1,
                  boxShadow: inCartQty > 0
                    ? '0 6px 16px rgba(37, 99, 235, 0.18)'
                    : '0 1px 3px rgba(15, 23, 42, 0.05)',
                }}
              >
                {/* Veg/Non-Veg Badge & Qty Counter / Out of Stock Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: `1.5px solid ${item.isVeg ? '#10B981' : '#EF4444'}`,
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: item.isVeg ? '50%' : '1px',
                      backgroundColor: item.isVeg ? '#10B981' : '#EF4444',
                    }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isOutOfStock ? (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        letterSpacing: '0.2px',
                      }}>
                        OUT OF STOCK
                      </span>
                    ) : item.stockQty !== undefined && item.stockQty <= 5 ? (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        backgroundColor: '#FEF3C7',
                        color: '#B45309',
                        border: '1px solid #FCD34D',
                        letterSpacing: '0.2px',
                      }}>
                        ONLY {item.stockQty} LEFT
                      </span>
                    ) : item.stockQty !== undefined ? (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        border: '1px solid #E2E8F0',
                      }}>
                        {item.stockQty} left
                      </span>
                    ) : null}

                    {inCartQty > 0 && (
                      <div className="animate-badge-pop" style={{
                        backgroundColor: '#2563EB',
                        color: '#ffffff',
                        borderRadius: '999px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                      }}>
                        {inCartQty}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dish Photo if available */}
                {item.imageUrl ? (
                  <div style={{
                    width: '100%',
                    height: '105px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    margin: '6px 0 4px 0',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    position: 'relative',
                  }}>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                ) : null}

                {/* Name & Hindi Name */}
                <div style={{ margin: item.imageUrl ? '2px 0 4px 0' : '6px 0 4px 0' }}>
                  <div style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    lineHeight: '1.25',
                  }}>
                    {item.name}
                  </div>
                  {item.nameHindi && (
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}>
                      {item.nameHindi}
                    </div>
                  )}
                </div>

                {/* Price & Variants Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4px' }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--accent-green)' }}>
                    {formatPaise(item.basePrice, profile.currencySymbol, true)}
                  </div>

                  {item.variants && item.variants.length > 0 && (
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: '#2563EB',
                      padding: '2px 6px',
                      borderRadius: '6px',
                    }}>
                      {item.variants.length} Sizes
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SECTION: Sticky Live Bill Panel (Tablet & Desktop POS View) */}
      <div className="pos-bill-sidebar" style={{
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.05)',
      }}>
        {/* Bill Header: Order Type (Dine-in / Takeaway / Delivery) */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'dine_in', label: 'Dine In', icon: Utensils },
              { id: 'takeaway', label: 'Takeaway / Parcel', icon: ShoppingBag },
              { id: 'delivery', label: 'Delivery', icon: Car },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = orderType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectOrderType(t.id as OrderType)}
                  style={{
                    flex: 1,
                    padding: '7px 4px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-app)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <Icon size={13} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Table / Customer Details Line & Parcel / Order Badges */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {orderType === 'dine_in' ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', minWidth: '120px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Table:</span>
                <input
                  type="text"
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  placeholder="T1"
                  style={{ width: '80px', padding: '6px 10px', fontSize: '13px', fontWeight: 800, borderRadius: '8px', border: '1.5px solid var(--border-color)', outline: 'none' }}
                />
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', gap: '6px', minWidth: '130px' }}>
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ flex: 1, minWidth: 0, padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1.5px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
                />
              </div>
            )}

            {/* Badges Container */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
              {/* If Takeaway/Parcel: Show highlighted PARCEL Badge */}
              {orderType === 'takeaway' && (
                <div style={{
                  padding: '5px 9px',
                  borderRadius: '8px',
                  backgroundColor: '#FEF3C7',
                  border: '1.5px solid #F59E0B',
                  color: '#92400E',
                  fontSize: '11px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  letterSpacing: '0.02em',
                }}>
                  <span>🥡 PARCEL</span>
                </div>
              )}

              {/* Order No Badge */}
              <div style={{
                padding: '5px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--accent-green)',
                fontSize: '11.5px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
              }}>
                Order #{(latestOrderNo + 1).toString().padStart(5, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Bill Line Items List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {renderBillItemsList()}
        </div>

        {/* Bill Financial Summary Strip */}
        {cart.length > 0 && renderBillSummaryBlock()}

        {/* Primary POS Action Buttons */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: 'var(--bg-surface)',
        }}>
          {/* Main CHECKOUT Button */}
          {cart.length === 0 ? (
            <button
              disabled
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '0px',
                backgroundColor: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: '#94A3B8',
                fontWeight: 750,
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'not-allowed',
                userSelect: 'none',
              }}
            >
              <CreditCard size={17} style={{ opacity: 0.5 }} />
              <span>CHECKOUT (₹0.00)</span>
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handlePrintKot}
                  style={{
                    width: orderType === 'takeaway' ? '38%' : '30%',
                    minWidth: '86px',
                    padding: '11px 8px',
                    borderRadius: '0px',
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    fontWeight: 850,
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    border: '1px solid #B45309',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(217, 119, 6, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                  title="Print Kitchen Order Ticket (KOT) slip"
                >
                  <Utensils size={15} strokeWidth={2.4} />
                  <span>{orderType === 'takeaway' ? 'KOT (Parcel)' : 'KOT'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCheckout}
                  style={{
                    flex: 1,
                    padding: '11px 12px',
                    borderRadius: '0px',
                    backgroundColor: '#15803D',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #166534',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(21, 128, 61, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={16} strokeWidth={2.4} />
                    <span>CHECKOUT</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 900,
                        backgroundColor: 'rgba(0, 0, 0, 0.22)',
                        padding: '2px 7px',
                        borderRadius: '0px',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {formatPaise(roundedGrandTotal, profile.currencySymbol)}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 4px',
                        borderRadius: '0px',
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        color: '#FFFFFF',
                      }}
                    >
                      F12
                    </span>
                  </div>
                </button>
              </div>

              <button
                onClick={handlePreviewBill}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '0px',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1.5px solid #1E293B',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease',
                }}
                title="Preview bill slip and edit mistakes without printing (F8)"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={15} strokeWidth={2.4} color="#1E293B" />
                  <span>PREVIEW & EDIT BILL</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700 }}>
                    Check & Fix Items
                  </span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 5px',
                      borderRadius: '0px',
                      backgroundColor: '#1E293B',
                      color: '#FFFFFF',
                    }}
                  >
                    F8
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Secondary Actions Row: Hold, Clear */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleHoldBill}
              disabled={cart.length === 0}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '9px',
                backgroundColor: cart.length > 0 ? '#FFFBEB' : '#F8FAFC',
                border: `1.5px solid ${cart.length > 0 ? '#FDE68A' : '#E2E8F0'}`,
                color: cart.length > 0 ? '#B45309' : '#94A3B8',
                fontWeight: 750,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
              }}
            >
              <PauseCircle size={14} strokeWidth={2.2} />
              <span>Hold Order</span>
            </button>

            <button
              onClick={handleClearBill}
              disabled={cart.length === 0}
              style={{
                padding: '9px 14px',
                borderRadius: '9px',
                backgroundColor: cart.length > 0 ? '#FEF2F2' : '#F8FAFC',
                border: `1.5px solid ${cart.length > 0 ? '#FECACA' : '#E2E8F0'}`,
                color: cart.length > 0 ? '#DC2626' : '#94A3B8',
                fontWeight: 750,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
              }}
              title="Clear entire cart"
            >
              <RotateCcw size={14} strokeWidth={2.2} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING BILL BOTTOM BAR (Visible only on <768px when cart has items) */}
      {cart.length > 0 && (
        <div className="mobile-cart-bar animate-slide-up" style={{
          position: 'fixed',
          bottom: '56px', // Sits directly on top of the mobile bottom nav
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          color: '#111827',
          padding: '10px 14px',
          display: 'none', // Controlled via CSS media query
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 45,
          borderTop: '1px solid #CBD5E1',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
          borderRadius: '0px',
        }}>
          <div
            onClick={() => setMobileCartSheetOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
          >
            <div style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#1D4ED8',
              borderRadius: '0px',
              padding: '3px 8px',
              fontSize: '12px',
              fontWeight: 800,
            }}>
              {totalItemCount}
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                {orderType.replace('_', ' ')} TOTAL
              </div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>
                {formatPaise(roundedGrandTotal, profile.currencySymbol)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setMobileCartSheetOpen(true)}
              style={{
                padding: '8px 12px',
                borderRadius: '0px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: 750,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <span>View Bill</span>
              <ChevronUp size={14} />
            </button>

            <button
              onClick={handleOpenCheckout}
              style={{
                padding: '8px 14px',
                borderRadius: '0px',
                backgroundColor: '#15803D',
                border: '1px solid #166534',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(21, 128, 61, 0.25)',
              }}
            >
              <CreditCard size={15} strokeWidth={2.2} />
              <span>Checkout</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BILL DRAWER / BOTTOM SHEET (<768px Full Bill Controller) */}
      {mobileCartSheetOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>
          <div className="animate-slide-up" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0px',
            borderTop: '2px solid #2563EB',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.16)',
          }}>
            {/* Sheet Handle & Header */}
            <div style={{
              padding: '12px 16px 8px 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{
                width: '36px',
                height: '4px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '999px',
                margin: '0 auto',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Current Order ({totalItemCount} items)
                  </h3>
                </div>
                <button
                  onClick={() => setMobileCartSheetOpen(false)}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    padding: '6px',
                    borderRadius: '50%',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Order Type Chips */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'dine_in', label: 'Dine In', icon: Utensils },
                  { id: 'takeaway', label: 'Takeaway / Parcel', icon: ShoppingBag },
                  { id: 'delivery', label: 'Delivery', icon: Car },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = orderType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectOrderType(t.id as OrderType)}
                      style={{
                        flex: 1,
                        padding: '7px 4px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-app)',
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <Icon size={12} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Table / Customer Details & Parcel Indicator */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {orderType === 'dine_in' ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', minWidth: '110px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>Table:</span>
                    <input
                      type="text"
                      value={tableNo}
                      onChange={(e) => setTableNo(e.target.value)}
                      placeholder="T1"
                      style={{ width: '70px', padding: '5px 8px', fontSize: '12px', fontWeight: 800, borderRadius: '8px', border: '1.5px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', gap: '6px', minWidth: '120px' }}>
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{ flex: 1, minWidth: 0, padding: '5px 8px', fontSize: '12px', borderRadius: '8px', border: '1.5px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  {orderType === 'takeaway' && (
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '8px',
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #F59E0B',
                      color: '#92400E',
                      fontSize: '10.5px',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}>
                      <span>🥡 PARCEL</span>
                    </div>
                  )}

                  <div style={{
                    padding: '5px 9px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'var(--accent-green)',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                  }}>
                    Order #{(latestOrderNo + 1).toString().padStart(5, '0')}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Item List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '38vh',
            }}>
              {renderBillItemsList()}
            </div>

            {/* Summary */}
            {renderBillSummaryBlock()}

            {/* Actions Bar */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              backgroundColor: 'var(--bg-surface)',
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handlePrintKot}
                  style={{
                    width: orderType === 'takeaway' ? '38%' : '32%',
                    padding: '11px 8px',
                    borderRadius: '0px',
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    fontWeight: 850,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    border: '1px solid #B45309',
                    cursor: 'pointer',
                  }}
                  title="Print Kitchen Order Ticket (KOT)"
                >
                  <Utensils size={15} strokeWidth={2.4} />
                  <span>{orderType === 'takeaway' ? 'KOT (Parcel)' : 'KOT'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCheckout}
                  style={{
                    flex: 1,
                    padding: '11px 12px',
                    borderRadius: '0px',
                    backgroundColor: '#15803D',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #166534',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={16} strokeWidth={2.5} />
                    <span>CHECKOUT</span>
                  </div>
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 900,
                      backgroundColor: 'rgba(0, 0, 0, 0.22)',
                      padding: '2px 7px',
                      borderRadius: '0px',
                    }}
                  >
                    {formatPaise(roundedGrandTotal, profile.currencySymbol)}
                  </span>
                </button>
              </div>

              <button
                onClick={handlePreviewBill}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '0px',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  border: '1.5px solid #1E293B',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
                title="Preview bill slip and edit mistakes without printing"
              >
                <Eye size={15} strokeWidth={2.4} color="#1E293B" />
                <span>PREVIEW & EDIT BILL</span>
              </button>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleHoldBill}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '9px',
                    backgroundColor: '#FFFBEB',
                    border: '1.5px solid #FDE68A',
                    color: '#B45309',
                    fontWeight: 750,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                  }}
                >
                  <PauseCircle size={14} strokeWidth={2.2} />
                  <span>Hold Order</span>
                </button>

                <button
                  onClick={handleClearBill}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '9px',
                    backgroundColor: '#FEF2F2',
                    border: '1.5px solid #FECACA',
                    color: '#DC2626',
                    fontWeight: 750,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                  title="Clear bill"
                >
                  <RotateCcw size={14} strokeWidth={2.2} />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VARIANT SELECTION MODAL */}
      {variantModalItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '16px',
        }}>
          <div className="animate-slide-up" style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Select Option / Size
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 16px 0' }}>
              {variantModalItem.name}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {variantModalItem.variants?.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    addItemToCart(variantModalItem, v.price, v.label);
                    setVariantModalItem(null);
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{v.label}</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-green)' }}>
                    {formatPaise(v.price, profile.currencySymbol)}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setVariantModalItem(null)}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '14px',
                borderRadius: '10px',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ITEM NOTE MODAL */}
      {noteModalItemIndex !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '16px',
        }}>
          <div className="animate-slide-up" style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Add Cooking Instruction
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 12px 0' }}>
              For {cart[noteModalItemIndex]?.shortNameSnapshot || cart[noteModalItemIndex]?.nameSnapshot}
            </p>

            <input
              type="text"
              placeholder="e.g. less spicy, no onion, extra crispy"
              value={tempNoteText}
              onChange={(e) => setTempNoteText(e.target.value)}
              style={{ width: '100%', marginBottom: '14px' }}
              autoFocus
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setNoteModalItemIndex(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="glow-btn-blue"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: 700,
                }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCOUNT MODAL */}
      {discountModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '16px',
        }}>
          <div className="animate-slide-up" style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Apply Bill Discount
            </h3>

            {/* Type toggle (% vs Flat ₹) */}
            <div style={{ display: 'flex', gap: '8px', margin: '14px 0' }}>
              <button
                onClick={() => setDiscountType('percent')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: discountType === 'percent' ? 'var(--primary)' : 'var(--bg-app)',
                  color: discountType === 'percent' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                Percentage (%)
              </button>
              <button
                onClick={() => setDiscountType('flat')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: discountType === 'flat' ? 'var(--primary)' : 'var(--bg-app)',
                  color: discountType === 'flat' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                Flat Amount (₹)
              </button>
            </div>

            {/* Quick Presets */}
            {discountType === 'percent' && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setDiscountValue(pct)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '8px',
                      backgroundColor: discountValue === pct ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-app)',
                      border: `1px solid ${discountValue === pct ? 'var(--primary)' : 'var(--border-color)'}`,
                      color: discountValue === pct ? 'var(--primary)' : 'var(--text-main)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            )}

            <input
              type="number"
              placeholder={discountType === 'percent' ? 'Discount %' : 'Discount in ₹'}
              value={discountType === 'percent' ? discountValue || '' : (discountValue ? (discountValue / 100).toString() : '')}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                if (discountType === 'percent') {
                  setDiscountValue(Math.min(100, Math.max(0, val)));
                } else {
                  setDiscountValue(rupeesToPaise(val));
                }
              }}
              style={{ width: '100%', marginBottom: '14px', fontSize: '18px', fontWeight: 700 }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setDiscountValue(0);
                  setDiscountModalOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
              <button
                onClick={() => setDiscountModalOpen(false)}
                className="glow-btn-blue"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: 700,
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL (Cash, UPI QR, Split, Tendered Change) */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        grandTotal={roundedGrandTotal}
        profile={profile}
        suggestedBillNo="Next Bill"
        onConfirmCheckout={handleConfirmCheckout}
      />

      {/* THERMAL RECEIPT PREVIEW MODAL */}
      {receiptPreviewBill && (
        <ReceiptPreviewModal
          isOpen={!!receiptPreviewBill}
          autoPrint={receiptPreviewAutoPrint}
          initialShowQr={receiptPreviewShowQr}
          onClose={() => {
            setReceiptPreviewBill(null);
            // If it was autoPrint from Print & Save, clear cart for next order.
            // If it was preview mode, keep cart active so cashier can continue punching!
            if (receiptPreviewAutoPrint) {
              setCart([]);
              setActiveCartOrderNo(null);
              setDiscountValue(0);
              setCustomerName('');
              setCustomerPhone('');
              setTableNo('T1');
              setPackagingCharge(0);
            }
            onRefreshData();
          }}
          bill={receiptPreviewBill}
          profile={profile}
          onLoadBillIntoCart={async (billToLoad) => {
            // Restore bill back into interactive POS cart for editing
            setCart([...billToLoad.items]);
            setActiveCartOrderNo(billToLoad.orderNo || null);
            setOrderType(billToLoad.orderType);
            setTableNo(billToLoad.tableNo || 'T1');
            setCustomerName(billToLoad.customerName || '');
            setCustomerPhone(billToLoad.customerPhone || '');
            setDiscountType(billToLoad.discountType);
            setDiscountValue(billToLoad.discountValue);
            setPackagingCharge(billToLoad.packagingCharge || 0);
            setServiceCharge(billToLoad.serviceCharge || 0);
            try {
              await db.bills.delete(billToLoad.id);
            } catch (e) {
              console.error('Error deleting draft bill:', e);
            }
            setReceiptPreviewBill(null);
            onRefreshData();
          }}
          onBillEdited={(updatedBill) => {
            setReceiptPreviewBill(updatedBill);
            onRefreshData();
          }}
          onAfterPrint={() => {
            const printedBill = receiptPreviewBill;
            setReceiptPreviewBill(null);
            // Turnover immediately to next new order
            setCart([]);
            setActiveCartOrderNo(null);
            setDiscountValue(0);
            setCustomerName('');
            setCustomerPhone('');
            setTableNo('T1');
            setPackagingCharge(0);
            onRefreshData();

            if (printedBill) {
              setSuccessModalData({
                isOpen: true,
                orderNo: printedBill.orderNo || 1,
                amountPaise: printedBill.grandTotal,
                currencySymbol: profile.currencySymbol,
                paymentMode: printedBill.paymentMode || 'cash',
                printerName: isBluetoothPrinterConnected() ? (getSavedPrinterName() || 'MT580P') : 'System Print Ready',
                title: 'Order Completed Successfully!',
                subtitle: `Invoice #${(printedBill.orderNo || 1).toString().padStart(5, '0')} • ${formatPaise(printedBill.grandTotal, profile.currencySymbol)} • ${(printedBill.paymentMode || 'cash').toUpperCase()}`,
                onReprint: async () => {
                  const escPos = await generateEscPosBill(printedBill, profile, true, { includeQrCode: receiptPreviewShowQr });
                  printViaBluetooth(escPos.bytes, false);
                },
                onViewBill: () => {
                  setReceiptPreviewBill(printedBill);
                  setReceiptPreviewShowQr(receiptPreviewShowQr);
                },
              });
            }
          }}
          onUpdateBillPayment={() => {
            onRefreshData();
          }}
        />
      )}

      {/* FLOATING ORDER SETTLEMENT SUCCESS TOAST */}
      {lastSettledToast && (
        <div
          className="animate-slide-down"
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 140,
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            borderRadius: '16px',
            padding: '10px 14px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            border: '1.5px solid #E2E8F0',
            width: 'calc(100vw - 24px)',
            maxWidth: '520px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <CheckCircle2 size={24} color="#16A34A" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 850, color: '#0F172A', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Order #{(lastSettledToast.bill.orderNo || 1).toString().padStart(5, '0')} Settled & Printed!
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatPaise(lastSettledToast.bill.grandTotal, profile.currencySymbol)} • {(lastSettledToast.bill.paymentMode || 'CASH').toUpperCase()}
                {isBluetoothPrinterConnected() ? ` • ${getSavedPrinterName() || 'MT580P'}` : ' • Receipt Ready'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={async () => {
                const escPos = buildEscPosBill(lastSettledToast.bill, profile, true, {
                  includeQrCode: lastSettledToast.printWithQr,
                });
                if (isAndroidNative()) {
                  const res = await printViaBluetooth(escPos.bytes, false);
                  if (!res.success) {
                    setPendingPrintBytes(escPos.bytes);
                    setBluetoothScanModalOpen(true);
                  }
                } else if (isBluetoothPrinterConnected()) {
                  printViaBluetooth(escPos.bytes, false);
                } else {
                  printCleanReceiptHtml(escPos.textPreview, profile.paperWidth === 80);
                }
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: '#F0F9FF',
                color: '#0284C7',
                border: '1px solid #BAE6FD',
                fontSize: '11px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Print duplicate copy of this receipt"
            >
              <Printer size={13} />
              <span>Re-print</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReceiptPreviewBill(lastSettledToast.bill);
                setReceiptPreviewShowQr(lastSettledToast.printWithQr);
                setReceiptPreviewAutoPrint(false);
                setLastSettledToast(null);
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '11px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Eye size={13} />
              <span>View Bill</span>
            </button>

            <button
              type="button"
              onClick={() => setLastSettledToast(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Real In-App Bluetooth Thermal Printer Scanner Modal */}
      <BluetoothScanModal
        isOpen={bluetoothScanModalOpen}
        onClose={() => {
          setBluetoothScanModalOpen(false);
          setPendingPrintBytes(null);
        }}
        pendingPrintBytes={pendingPrintBytes}
        onPrintCompleted={() => {
          setPendingPrintBytes(null);
          setBluetoothScanModalOpen(false);
        }}
      />

      {/* Celebratory Fullscreen Settlement Confirmation Modal */}
      {successModalData && (
        <SettlementSuccessModal
          isOpen={successModalData.isOpen}
          onClose={() => setSuccessModalData(null)}
          orderNo={successModalData.orderNo}
          amountPaise={successModalData.amountPaise}
          currencySymbol={successModalData.currencySymbol}
          paymentMode={successModalData.paymentMode}
          printerName={successModalData.printerName}
          title={successModalData.title}
          subtitle={successModalData.subtitle}
          onReprint={successModalData.onReprint}
          onViewBill={successModalData.onViewBill}
        />
      )}
    </div>
  );
};
