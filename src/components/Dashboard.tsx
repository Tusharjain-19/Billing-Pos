import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  Package,
  Layers,
  Clock,
  ArrowUpRight,
  Plus,
  Minus,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Flame,
  Zap,
  Search,
  Sliders,
  X,
  RefreshCw,
  Utensils,
  ChevronDown,
  Check,
  Smartphone,
  Download,
  Edit2
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { isElectronApp } from '../utils/electronStorage';
import type { Bill, Item, Category, RestaurantProfile, TabKey } from '../types';
import { formatPaise, rupeesToPaise } from '../utils/currency';
import { db } from '../db';
import { customPrompt } from './CustomDialog';

interface DashboardProps {
  bills: Bill[];
  items: Item[];
  categories?: Category[];
  profile: RestaurantProfile;
  latestOrderNo: number;
  heldBillsCount: number;
  onNavigateTab: (tab: TabKey) => void;
  onOpenPrinterModal: () => void;
  onOpenHeldBills: () => void;
  onRefreshData?: () => void;
}

type TimeframeFilter = 'today' | '7days' | 'month' | 'all';
type StockFilterTab = 'attention' | 'out_of_stock' | 'fast_depleting' | 'all';

interface ItemSalesMetric {
  itemId: string;
  name: string;
  shortName: string;
  categoryName: string;
  isVeg: boolean;
  basePrice: number;
  currentStock: number | undefined;
  isOutOfStock: boolean;
  unitsSold: number;
  revenuePaise: number;
  ordersCount: number;
  hourlyVelocity: number;
  estimatedHoursUntilStockout: number | null;
  stockUrgency: 'out_of_stock' | 'critical' | 'warning' | 'healthy' | 'untracked';
}

export const Dashboard: React.FC<DashboardProps> = ({
  bills,
  items,
  categories = [],
  profile,
  latestOrderNo,
  heldBillsCount,
  onNavigateTab,
  onOpenPrinterModal,
  onOpenHeldBills,
  onRefreshData,
}) => {
  // Navigation & Interactive Filters
  const [salesTimeframe, setSalesTimeframe] = useState<TimeframeFilter>('today');
  const [salesSortBy, setSalesSortBy] = useState<'qty' | 'revenue' | 'velocity'>('qty');
  const [stockTab, setStockTab] = useState<StockFilterTab>('attention');
  const [stockSearchQuery, setStockSearchQuery] = useState<string>('');
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');

  // Quick Restock & Edit Modal state
  const [restockModalOpen, setRestockModalOpen] = useState<boolean>(false);
  const [inlineAdjustNotice, setInlineAdjustNotice] = useState<string | null>(null);
  const [localStockOverrides, setLocalStockOverrides] = useState<Map<string, { stockQty: number; isOutOfStock: boolean; pricePaise?: number }>>(new Map());
  const [editingStockItem, setEditingStockItem] = useState<ItemSalesMetric | null>(null);
  const [editModalStockQty, setEditModalStockQty] = useState<number>(0);
  const [editModalIsOutOfStock, setEditModalIsOutOfStock] = useState<boolean>(false);
  const [editModalPriceRupees, setEditModalPriceRupees] = useState<string>('');

  // Category Map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Compute Active Items Map
  const activeItems = useMemo(() => {
    return items.filter((i) => !i.isDeleted);
  }, [items]);

  // ── Compute Today's Overall KPI Stats ──
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todayBills = bills.filter((b) => b.createdAt >= startOfToday && b.status === 'ACTIVE');
    const totalTodayRevenue = todayBills.reduce((acc, b) => acc + b.grandTotal, 0);

    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;

    let dineInCount = 0;
    let dineInRevenue = 0;
    let takeawayCount = 0;
    let takeawayRevenue = 0;
    let deliveryCount = 0;
    let deliveryRevenue = 0;

    todayBills.forEach((b) => {
      // Payment Breakdown
      if (b.paymentMode === 'cash') cashTotal += b.grandTotal;
      else if (b.paymentMode === 'upi') upiTotal += b.grandTotal;
      else if (b.paymentMode === 'card') cardTotal += b.grandTotal;

      // Order Type Breakdown
      if (b.orderType === 'dine_in') {
        dineInCount += 1;
        dineInRevenue += b.grandTotal;
      } else if (b.orderType === 'takeaway') {
        takeawayCount += 1;
        takeawayRevenue += b.grandTotal;
      } else if (b.orderType === 'delivery') {
        deliveryCount += 1;
        deliveryRevenue += b.grandTotal;
      }
    });

    const averageBill = todayBills.length > 0 ? Math.round(totalTodayRevenue / todayBills.length) : 0;

    // Total Items Sold Today across all bills
    let totalItemsSoldToday = 0;
    todayBills.forEach((b) => {
      b.items.forEach((it) => {
        totalItemsSoldToday += it.qty || 1;
      });
    });

    return {
      todayBillsCount: todayBills.length,
      totalTodayRevenue,
      cashTotal,
      upiTotal,
      cardTotal,
      averageBill,
      totalItemsSoldToday,
      dineInCount,
      dineInRevenue,
      takeawayCount,
      takeawayRevenue,
      deliveryCount,
      deliveryRevenue,
      todayBills: todayBills.slice(0, 6),
    };
  }, [bills]);

  // ── Compute Filtered Bills based on selected Sales Timeframe ──
  const timeframeBills = useMemo(() => {
    const now = new Date();
    let startTime = 0;

    if (salesTimeframe === 'today') {
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (salesTimeframe === '7days') {
      startTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    } else if (salesTimeframe === 'month') {
      startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    } else {
      startTime = 0;
    }

    return bills.filter((b) => b.createdAt >= startTime && b.status === 'ACTIVE');
  }, [bills, salesTimeframe]);

  // ── Compute Item-by-Item Sales & Velocity Metrics ──
  const { itemMetrics, totalUnitsSoldInTimeframe, lowStockItems, outOfStockItems, zeroSalesItems } = useMemo(() => {
    const now = new Date();
    // Operating hours elapsed today (clamp between 1 and 24)
    const hoursElapsedToday = Math.max(1, Math.min(24, now.getHours() + now.getMinutes() / 60));

    // Aggregate units & revenue per item
    const salesMap = new Map<string, { unitsSold: number; revenuePaise: number; ordersCount: number }>();

    let totalUnits = 0;
    timeframeBills.forEach((bill) => {
      bill.items.forEach((line) => {
        const key = line.itemId || line.shortNameSnapshot || line.nameSnapshot;
        const current = salesMap.get(key) || { unitsSold: 0, revenuePaise: 0, ordersCount: 0 };
        current.unitsSold += line.qty || 1;
        current.revenuePaise += line.lineTotal || (line.unitPrice * (line.qty || 1));
        current.ordersCount += 1;
        salesMap.set(key, current);
        totalUnits += line.qty || 1;
      });
    });

    const metrics: ItemSalesMetric[] = activeItems.map((item) => {
      const sales = salesMap.get(item.id) || salesMap.get(item.shortName) || salesMap.get(item.name) || {
        unitsSold: 0,
        revenuePaise: 0,
        ordersCount: 0,
      };

      const categoryName = categoryMap.get(item.categoryId) || 'General';
      const hourlyVelocity = Number((sales.unitsSold / hoursElapsedToday).toFixed(1));

      const override = localStockOverrides.get(item.id);
      const effectiveStockQty = override !== undefined ? override.stockQty : item.stockQty;
      const effectiveIsOutOfStock = override !== undefined
        ? override.isOutOfStock
        : (item.isOutOfStock || (effectiveStockQty !== undefined && effectiveStockQty <= 0));
      const effectivePrice = override?.pricePaise !== undefined ? override.pricePaise : item.basePrice;

      // Calculate Stock Urgency & Estimated Hours until Stockout
      let stockUrgency: ItemSalesMetric['stockUrgency'] = 'untracked';
      let estimatedHoursUntilStockout: number | null = null;

      if (effectiveStockQty !== undefined && effectiveStockQty !== null) {
        if (effectiveStockQty <= 0 || effectiveIsOutOfStock) {
          stockUrgency = 'out_of_stock';
          estimatedHoursUntilStockout = 0;
        } else if (hourlyVelocity > 0) {
          const hrs = Number((effectiveStockQty / hourlyVelocity).toFixed(1));
          estimatedHoursUntilStockout = hrs;
          if (hrs <= 2 || effectiveStockQty <= 3) {
            stockUrgency = 'critical';
          } else if (hrs <= 5 || effectiveStockQty <= 8) {
            stockUrgency = 'warning';
          } else {
            stockUrgency = 'healthy';
          }
        } else {
          // No sales yet today, check raw quantity
          if (effectiveStockQty <= 5) {
            stockUrgency = 'warning';
          } else {
            stockUrgency = 'healthy';
          }
          estimatedHoursUntilStockout = null;
        }
      } else {
        if (effectiveIsOutOfStock) {
          stockUrgency = 'out_of_stock';
          estimatedHoursUntilStockout = 0;
        } else {
          stockUrgency = 'untracked';
        }
      }

      return {
        itemId: item.id,
        name: item.name,
        shortName: item.shortName,
        categoryName,
        isVeg: item.isVeg,
        basePrice: effectivePrice,
        currentStock: effectiveStockQty,
        isOutOfStock: effectiveIsOutOfStock,
        unitsSold: sales.unitsSold,
        revenuePaise: sales.revenuePaise,
        ordersCount: sales.ordersCount,
        hourlyVelocity,
        estimatedHoursUntilStockout,
        stockUrgency,
      };
    });

    const lowStock = metrics.filter((m) => m.stockUrgency === 'critical' || m.stockUrgency === 'warning');
    const outStock = metrics.filter((m) => m.stockUrgency === 'out_of_stock');
    const zeroSales = metrics.filter((m) => m.unitsSold === 0 && !m.isOutOfStock);

    return {
      itemMetrics: metrics,
      totalUnitsSoldInTimeframe: totalUnits,
      lowStockItems: lowStock,
      outOfStockItems: outStock,
      zeroSalesItems: zeroSales,
    };
  }, [activeItems, timeframeBills, categoryMap, localStockOverrides]);

  // ── Sort & Filter Item Sales ──
  const sortedItemSales = useMemo(() => {
    let list = [...itemMetrics];

    if (itemSearchQuery.trim()) {
      const q = itemSearchQuery.toLowerCase();
      list = list.filter((it) => it.name.toLowerCase().includes(q) || it.shortName.toLowerCase().includes(q) || it.categoryName.toLowerCase().includes(q));
    }

    if (salesSortBy === 'qty') {
      list.sort((a, b) => b.unitsSold - a.unitsSold);
    } else if (salesSortBy === 'revenue') {
      list.sort((a, b) => b.revenuePaise - a.revenuePaise);
    } else if (salesSortBy === 'velocity') {
      list.sort((a, b) => b.hourlyVelocity - a.hourlyVelocity);
    }

    return list;
  }, [itemMetrics, salesSortBy, itemSearchQuery]);

  // ── Filtered Stock List based on Stock Tab ──
  const filteredStockItems = useMemo(() => {
    let list = [...itemMetrics];

    if (stockSearchQuery.trim()) {
      const q = stockSearchQuery.toLowerCase();
      list = list.filter((it) => it.name.toLowerCase().includes(q) || it.shortName.toLowerCase().includes(q) || it.categoryName.toLowerCase().includes(q));
    }

    if (stockTab === 'attention') {
      return list.filter((it) => it.stockUrgency === 'out_of_stock' || it.stockUrgency === 'critical' || it.stockUrgency === 'warning');
    }
    if (stockTab === 'out_of_stock') {
      return list.filter((it) => it.stockUrgency === 'out_of_stock');
    }
    if (stockTab === 'fast_depleting') {
      return list.filter((it) => it.hourlyVelocity > 0 && it.estimatedHoursUntilStockout !== null && it.estimatedHoursUntilStockout <= 6);
    }
    // 'all'
    return list;
  }, [itemMetrics, stockTab, stockSearchQuery]);

  // ── Hourly Sales Velocity & Rush Hour Curve (Today) ──
  const hourlyData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayBills = bills.filter((b) => b.createdAt >= startOfToday && b.status === 'ACTIVE');

    // Buckets from 8 AM to 11 PM (16 hours)
    const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8, 9, 10, ... 23
    let maxHourlyRevenue = 1;
    let peakHour = 13;
    let peakRevenue = 0;
    let peakOrders = 0;

    const hourStats = hours.map((hour) => {
      const billsInHour = todayBills.filter((b) => {
        const billHour = new Date(b.createdAt).getHours();
        return billHour === hour;
      });

      const revenue = billsInHour.reduce((acc, b) => acc + b.grandTotal, 0);
      const orders = billsInHour.length;

      if (revenue > maxHourlyRevenue) maxHourlyRevenue = revenue;
      if (revenue > peakRevenue) {
        peakRevenue = revenue;
        peakHour = hour;
        peakOrders = orders;
      }

      const label = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;

      return {
        hour,
        label,
        revenue,
        orders,
      };
    });

    const currentHour = now.getHours();

    return {
      hourStats,
      maxHourlyRevenue,
      peakHour,
      peakRevenue,
      peakOrders,
      currentHour,
    };
  }, [bills]);

  // ── Quick Stock Update Handlers (Instant optimistic UI + DB sync) ──
  const handleAddStock = async (itemId: string, addQty: number) => {
    try {
      const item = await db.items.get(itemId);
      if (!item) return;

      const existingOverride = localStockOverrides.get(itemId);
      const current = existingOverride !== undefined
        ? existingOverride.stockQty
        : (item.stockQty !== undefined ? item.stockQty : 0);
      const nextQty = Math.max(0, current + addQty);
      const nextIsOut = nextQty <= 0;

      // 1. Instant 0ms optimistic UI update
      setLocalStockOverrides((prev) => {
        const next = new Map(prev);
        const existing = next.get(itemId);
        next.set(itemId, {
          stockQty: nextQty,
          isOutOfStock: nextIsOut,
          pricePaise: existing?.pricePaise,
        });
        return next;
      });

      // 2. Persist in IndexedDB
      await db.items.update(itemId, {
        stockQty: nextQty,
        isOutOfStock: nextIsOut,
        isActive: true,
      });

      setInlineAdjustNotice(`Restocked ${item.shortName || item.name} +${addQty} portions (Total: ${nextQty} portions in stock)`);
      setTimeout(() => setInlineAdjustNotice(null), 3500);

      // 3. Sync across entire app
      await onRefreshData?.();
    } catch (err: any) {
      console.error('Failed to update stock:', err);
    }
  };

  const handleToggleOutOfStock = async (itemId: string, currentlyOut: boolean) => {
    try {
      const item = await db.items.get(itemId);
      if (!item) return;

      const nextOut = !currentlyOut;
      const nextQty = nextOut ? 0 : (item.stockQty && item.stockQty > 0 ? item.stockQty : 20);

      setLocalStockOverrides((prev) => {
        const next = new Map(prev);
        const existing = next.get(itemId);
        next.set(itemId, {
          stockQty: nextQty,
          isOutOfStock: nextOut,
          pricePaise: existing?.pricePaise,
        });
        return next;
      });

      await db.items.update(itemId, {
        isOutOfStock: nextOut,
        stockQty: nextQty,
        isActive: !nextOut,
      });

      setInlineAdjustNotice(`${item.shortName || item.name} marked ${nextOut ? 'OUT OF STOCK' : 'IN STOCK'}`);
      setTimeout(() => setInlineAdjustNotice(null), 3000);
      await onRefreshData?.();
    } catch (err: any) {
      console.error('Failed to toggle stock status:', err);
    }
  };

  const totalAttentionCount = outOfStockItems.length + lowStockItems.length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - 62px)',
        backgroundColor: '#F8FAFC',
        padding: '20px',
        paddingBottom: '90px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* Inline Notification Banner */}
        {inlineAdjustNotice && (
          <div
            style={{
              backgroundColor: '#1E293B',
              color: '#F8FAFC',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10B981" />
              <span>{inlineAdjustNotice}</span>
            </div>
            <button
              onClick={() => setInlineAdjustNotice(null)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* 0. WEBSITE DOWNLOAD APP BANNER (Hidden on Android & PC Desktop) */}
        {!Capacitor.isNativePlatform() && !isElectronApp() && (
          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              borderRadius: '16px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Smartphone size={20} />
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1E3A8A' }}>
                  Billing Pro Android POS App (.apk)
                </div>
                <div style={{ fontSize: '12px', color: '#3B82F6' }}>
                  Enable real in-app Bluetooth thermal printing (MT580P, MPT-II) & offline bill management.
                </div>
              </div>
            </div>

            <a
              href="./billing-pro-pos-release.apk"
              download="billing-pro-pos-release.apk"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: '9px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 750,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              <Download size={14} />
              <span>Download App</span>
            </a>
          </div>
        )}

        {/* 1. WELCOME & ACTION BAR */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                POS Dashboard
              </span>
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#94A3B8' }} />
              <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h2 style={{ fontSize: '21px', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {profile.name}
            </h2>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
              Next Order: <strong style={{ color: '#0F172A' }}>#{latestOrderNo.toString().padStart(4, '0')}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setRestockModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 16px',
                borderRadius: '12px',
                backgroundColor: totalAttentionCount > 0 ? '#FEF2F2' : '#EFF6FF',
                border: totalAttentionCount > 0 ? '1px solid #FECACA' : '1px solid #BFDBFE',
                color: totalAttentionCount > 0 ? '#DC2626' : '#1D4ED8',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Package size={16} />
              <span>
                Quick Restock {totalAttentionCount > 0 && `(${totalAttentionCount} Alerts)`}
              </span>
            </button>

            <button
              onClick={() => onNavigateTab('billing')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 18px',
                borderRadius: '12px',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 4px 14px rgba(29, 78, 216, 0.28)',
              }}
            >
              <Receipt size={17} />
              <span>Open Billing POS</span>
            </button>
          </div>
        </div>

        {/* 2. CRITICAL ATTENTION BANNER (If items running out or stocked out) */}
        {totalAttentionCount > 0 && (
          <div
            style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '16px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#92400E' }}>
                  Kitchen Inventory Alert: {outOfStockItems.length} Out of Stock · {lowStockItems.length} Running Critically Low
                </div>
                <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                  {outOfStockItems.slice(0, 3).map((it) => it.shortName || it.name).join(', ')}
                  {outOfStockItems.length > 3 ? ` and ${outOfStockItems.length - 3} more` : ''} need immediate replenishment.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setStockTab('attention');
                const el = document.getElementById('inventory-stock-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                backgroundColor: '#D97706',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Review Stock Depletion →
            </button>
          </div>
        )}

        {/* 3. TOP 5 METRIC KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {/* Revenue */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '18px 20px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Today's Revenue
                </span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '6px', letterSpacing: '-0.02em' }}>
                  {formatPaise(stats.totalTodayRevenue, profile.currencySymbol)}
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                }}
              >
                <TrendingUp size={20} />
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '11px', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>● Live In-Memory / SQLite</span>
            </div>
          </div>

          {/* Today's Invoices & Quantity Sold */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '18px 20px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Today's Invoices
                </span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '6px', letterSpacing: '-0.02em' }}>
                  {stats.todayBillsCount} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>bills</span>
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <Receipt size={20} />
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#64748B' }}>
              Food items sold: <strong style={{ color: '#0F172A' }}>{stats.totalItemsSoldToday} units</strong>
            </div>
          </div>

          {/* Average Basket Size */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '18px 20px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Avg Order Value
                </span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '6px', letterSpacing: '-0.02em' }}>
                  {formatPaise(stats.averageBill, profile.currencySymbol)}
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F59E0B',
                }}
              >
                <Banknote size={20} />
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#64748B' }}>
              Ticket size per patron
            </div>
          </div>

          {/* Stock Attention KPI Card */}
          <div
            onClick={() => {
              setStockTab('attention');
              document.getElementById('inventory-stock-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              backgroundColor: '#FFFFFF',
              border: totalAttentionCount > 0 ? '1.5px solid #FCA5A5' : '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '18px 20px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Stock Attention
                </span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: totalAttentionCount > 0 ? '#DC2626' : '#10B981', marginTop: '6px' }}>
                  {totalAttentionCount} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>items</span>
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: totalAttentionCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: totalAttentionCount > 0 ? '#DC2626' : '#10B981',
                }}
              >
                <AlertCircle size={20} />
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '11.5px', color: totalAttentionCount > 0 ? '#DC2626' : '#10B981', fontWeight: 700 }}>
              {totalAttentionCount > 0 ? `${outOfStockItems.length} out of stock · Tap to fix →` : 'All items well stocked ✓'}
            </div>
          </div>

          {/* Parked Orders */}
          <div
            onClick={heldBillsCount > 0 ? onOpenHeldBills : undefined}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '18px',
              padding: '18px 20px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
              cursor: heldBillsCount > 0 ? 'pointer' : 'default',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Parked Orders
                </span>
                <div style={{ fontSize: '24px', fontWeight: 900, color: heldBillsCount > 0 ? '#F59E0B' : '#0F172A', marginTop: '6px' }}>
                  {heldBillsCount} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>held</span>
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: heldBillsCount > 0 ? 'rgba(245, 158, 11, 0.15)' : '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: heldBillsCount > 0 ? '#F59E0B' : '#64748B',
                }}
              >
                <Layers size={20} />
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '11.5px', color: heldBillsCount > 0 ? '#F59E0B' : '#64748B', fontWeight: 600 }}>
              {heldBillsCount > 0 ? 'Tap to resume parked bills →' : 'No parked orders'}
            </div>
          </div>
        </div>

        {/* 4. HOURLY RUSH HOUR & PEAK VELOCITY CHART (Today) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '22px 24px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#2563EB" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Hourly Rush Hour & Sales Velocity
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                Real-time ordering velocity across operating hours today
              </p>
            </div>

            {hourlyData.peakRevenue > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                <Flame size={15} />
                <span>
                  Peak Rush: {hourlyData.peakHour === 12 ? '12 PM' : hourlyData.peakHour > 12 ? `${hourlyData.peakHour - 12} PM` : `${hourlyData.peakHour} AM`} ({hourlyData.peakOrders} orders · {formatPaise(hourlyData.peakRevenue, profile.currencySymbol)})
                </span>
              </div>
            )}
          </div>

          {/* Bar Chart Visualizer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              height: '110px',
              paddingTop: '20px',
              borderBottom: '1px solid #E2E8F0',
              overflowX: 'auto',
            }}
          >
            {hourlyData.hourStats.map((h) => {
              const heightPercent = hourlyData.maxHourlyRevenue > 0 ? (h.revenue / hourlyData.maxHourlyRevenue) * 100 : 0;
              const isCurrent = h.hour === hourlyData.currentHour;
              const isPeak = h.hour === hourlyData.peakHour && h.revenue > 0;

              return (
                <div
                  key={h.hour}
                  style={{
                    flex: 1,
                    minWidth: '38px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title={`${h.label}: ${formatPaise(h.revenue, profile.currencySymbol)} (${h.orders} orders)`}
                >
                  {/* Bar Value Tooltip preview */}
                  <span style={{ fontSize: '9px', fontWeight: 700, color: isPeak ? '#DC2626' : '#64748B' }}>
                    {h.orders > 0 ? `${h.orders}b` : ''}
                  </span>

                  {/* Visual Bar */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '28px',
                      height: `${Math.max(6, heightPercent)}%`,
                      borderRadius: '6px 6px 0 0',
                      backgroundColor: isPeak ? '#EF4444' : isCurrent ? '#2563EB' : h.revenue > 0 ? '#93C5FD' : '#E2E8F0',
                      transition: 'height 0.4s ease',
                      position: 'relative',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Hour Labels */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {hourlyData.hourStats.map((h) => (
              <div
                key={h.hour}
                style={{
                  flex: 1,
                  minWidth: '38px',
                  textAlign: 'center',
                  fontSize: '9.5px',
                  fontWeight: h.hour === hourlyData.currentHour ? 800 : 600,
                  color: h.hour === hourlyData.currentHour ? '#2563EB' : '#94A3B8',
                }}
              >
                {h.label}
              </div>
            ))}
          </div>
        </div>

        {/* 5. FOOD QUANTITY & STOCKOUT ESTIMATION HUB ("Needs Attention & Stock Out") */}
        <div
          id="inventory-stock-section"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: 'clamp(14px, 3vw, 22px)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Section Header with Tabs and Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="#D97706" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Food Stock & Depletion Forecast
                </h3>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0 0' }}>
                Track quantities on hand, forecast stockouts based on sales pace, and restock in 1 click
              </p>
            </div>

            {/* Quick Actions (1 Line) */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '380px' }}>
              {/* Search Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#F1F5F9',
                  borderRadius: '10px',
                  padding: '7px 12px',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Search size={14} color="#64748B" />
                <input
                  type="text"
                  placeholder="Filter stock items..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '12px',
                    width: '100%',
                    color: '#0F172A',
                  }}
                />
                {stockSearchQuery && (
                  <button onClick={() => setStockSearchQuery('')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94A3B8' }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                onClick={() => setRestockModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#1E293B',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  border: 'none',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={14} />
                <span>Bulk Restock</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <button
              onClick={() => setStockTab('attention')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: stockTab === 'attention' ? '#DC2626' : '#F1F5F9',
                color: stockTab === 'attention' ? '#FFFFFF' : '#475569',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <span>Needs Attention</span>
              <span
                style={{
                  fontSize: '10.5px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: stockTab === 'attention' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(220, 38, 38, 0.1)',
                  color: stockTab === 'attention' ? '#FFFFFF' : '#DC2626',
                }}
              >
                {totalAttentionCount}
              </span>
            </button>

            <button
              onClick={() => setStockTab('out_of_stock')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: stockTab === 'out_of_stock' ? '#EF4444' : '#F1F5F9',
                color: stockTab === 'out_of_stock' ? '#FFFFFF' : '#475569',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <span>Out of Stock</span>
              <span
                style={{
                  fontSize: '10.5px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: stockTab === 'out_of_stock' ? 'rgba(255, 255, 255, 0.25)' : '#FEE2E2',
                  color: stockTab === 'out_of_stock' ? '#FFFFFF' : '#DC2626',
                }}
              >
                {outOfStockItems.length}
              </span>
            </button>

            <button
              onClick={() => setStockTab('fast_depleting')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: stockTab === 'fast_depleting' ? '#D97706' : '#F1F5F9',
                color: stockTab === 'fast_depleting' ? '#FFFFFF' : '#475569',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <Flame size={13} />
              <span>Fast Depleting Today</span>
            </button>

            <button
              onClick={() => setStockTab('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: stockTab === 'all' ? '#2563EB' : '#F1F5F9',
                color: stockTab === 'all' ? '#FFFFFF' : '#475569',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <span>All Food Items ({activeItems.length})</span>
            </button>
          </div>

          {/* Stock Items Grid / Cards */}
          {filteredStockItems.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', color: '#64748B' }}>
              <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                No items match this filter!
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                All inventory levels are safe and operational.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
              {filteredStockItems.map((item) => {
                const isOut = item.isOutOfStock || (item.currentStock !== undefined && item.currentStock <= 0);
                const isCritical = item.stockUrgency === 'critical';
                const isWarning = item.stockUrgency === 'warning';

                return (
                  <div
                    key={item.itemId}
                    style={{
                      border: isOut ? '1.5px solid #FCA5A5' : isCritical ? '1.5px solid #FDBA74' : '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      backgroundColor: isOut ? '#FEF2F2' : isCritical ? '#FFFBEB' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    {/* Top Row: Name, Veg badge, Status Pill */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: item.isVeg ? '#10B981' : '#EF4444',
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                            {item.categoryName} · {formatPaise(item.basePrice, profile.currencySymbol)}
                          </div>
                        </div>
                      </div>

                      {/* Urgency Badge */}
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          backgroundColor: isOut ? '#DC2626' : isCritical ? '#EA580C' : isWarning ? '#D97706' : '#10B981',
                          color: '#FFFFFF',
                          letterSpacing: '0.3px',
                        }}
                      >
                        {isOut ? 'Stock Out' : isCritical ? 'Critical' : isWarning ? 'Low Stock' : item.currentStock !== undefined ? 'In Stock' : 'Untracked'}
                      </span>
                    </div>

                    {/* Middle Row: Quantity Count & Estimated Stockout Burn Rate */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: isOut ? '#FEE2E2' : '#F8FAFC',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                          Available Quantity
                        </span>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: isOut ? '#DC2626' : '#0F172A' }}>
                          {item.currentStock !== undefined ? `${item.currentStock} portions` : 'Unlimited / Not Set'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                          Burn Rate / Runout
                        </span>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: isOut ? '#DC2626' : isCritical ? '#EA580C' : '#0F172A', marginTop: '2px' }}>
                          {isOut ? (
                            '⚠️ None Available'
                          ) : item.estimatedHoursUntilStockout !== null ? (
                            `~${item.estimatedHoursUntilStockout} hrs left`
                          ) : item.unitsSold > 0 ? (
                            `${item.unitsSold} sold today`
                          ) : (
                            'Steady (0 sold today)'
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: 1-Click Quick Restock Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleAddStock(item.itemId, 5)}
                          title="Add 5 portions to current stock"
                          style={{
                            padding: '5px 9px',
                            borderRadius: '6px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#1E293B',
                            cursor: 'pointer',
                          }}
                        >
                          +5
                        </button>

                        <button
                          onClick={() => handleAddStock(item.itemId, 15)}
                          title="Add 15 portions to current stock"
                          style={{
                            padding: '5px 9px',
                            borderRadius: '6px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#1E293B',
                            cursor: 'pointer',
                          }}
                        >
                          +15
                        </button>

                        <button
                          onClick={() => handleAddStock(item.itemId, 30)}
                          title="Add 30 portions to current stock"
                          style={{
                            padding: '5px 9px',
                            borderRadius: '6px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#1E293B',
                            cursor: 'pointer',
                          }}
                        >
                          +30
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleToggleOutOfStock(item.itemId, item.isOutOfStock)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            backgroundColor: item.isOutOfStock ? '#10B981' : '#F1F5F9',
                            color: item.isOutOfStock ? '#FFFFFF' : '#64748B',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {item.isOutOfStock ? 'Make In Stock' : 'Mark Out of Stock'}
                        </button>

                        <button
                          onClick={() => {
                            setEditingStockItem(item);
                            setEditModalStockQty(item.currentStock !== undefined ? item.currentStock : 20);
                            setEditModalIsOutOfStock(item.isOutOfStock);
                            setEditModalPriceRupees((item.basePrice / 100).toString());
                          }}
                          style={{
                            padding: '5px 9px',
                            borderRadius: '6px',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            border: '1px solid #BFDBFE',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title={`Edit ${item.name} stock & price`}
                        >
                          <Edit2 size={11} />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. ITEM SALES INTELLIGENCE & QUANTITY LEADERBOARD ("Which item is selling how much in quantity") */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Header & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={19} color="#DC2626" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Item Sales Velocity & Quantity Leaderboard
                </h3>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0 0' }}>
                Detailed breakdown of exact quantities sold, total revenue, and contribution by dish
              </p>
            </div>

            {/* Timeframe & Sort Selectors */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Timeframe Selector */}
              <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '3px' }}>
                <button
                  onClick={() => setSalesTimeframe('today')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: salesTimeframe === 'today' ? '#FFFFFF' : 'transparent',
                    color: salesTimeframe === 'today' ? '#0F172A' : '#64748B',
                    fontWeight: salesTimeframe === 'today' ? 800 : 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: salesTimeframe === 'today' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                  }}
                >
                  Today
                </button>

                <button
                  onClick={() => setSalesTimeframe('7days')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: salesTimeframe === '7days' ? '#FFFFFF' : 'transparent',
                    color: salesTimeframe === '7days' ? '#0F172A' : '#64748B',
                    fontWeight: salesTimeframe === '7days' ? 800 : 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: salesTimeframe === '7days' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                  }}
                >
                  7 Days
                </button>

                <button
                  onClick={() => setSalesTimeframe('month')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: salesTimeframe === 'month' ? '#FFFFFF' : 'transparent',
                    color: salesTimeframe === 'month' ? '#0F172A' : '#64748B',
                    fontWeight: salesTimeframe === 'month' ? 800 : 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: salesTimeframe === 'month' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                  }}
                >
                  This Month
                </button>

                <button
                  onClick={() => setSalesTimeframe('all')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: salesTimeframe === 'all' ? '#FFFFFF' : 'transparent',
                    color: salesTimeframe === 'all' ? '#0F172A' : '#64748B',
                    fontWeight: salesTimeframe === 'all' ? 800 : 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: salesTimeframe === 'all' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                  }}
                >
                  All Time
                </button>
              </div>

              {/* Sort By Selector */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>Sort:</span>
                <select
                  value={salesSortBy}
                  onChange={(e) => setSalesSortBy(e.target.value as any)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="qty">Quantity Sold (Units)</option>
                  <option value="revenue">Total Revenue (₹)</option>
                  <option value="velocity">Hourly Velocity</option>
                </select>
              </div>
            </div>
          </div>

          {/* Leaderboard Table / Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedItemSales.slice(0, 10).map((it, idx) => {
              const sharePercent = totalUnitsSoldInTimeframe > 0 ? (it.unitsSold / totalUnitsSoldInTimeframe) * 100 : 0;
              const isTop3 = idx < 3 && it.unitsSold > 0;
              const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

              return (
                <div
                  key={it.itemId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: isTop3 ? 'rgba(248, 250, 252, 0.8)' : '#FFFFFF',
                    border: isTop3 ? '1px solid #E2E8F0' : '1px solid var(--border-color)',
                    gap: '14px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Left: Rank, Name, Category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px', flex: '1 1 200px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 900, minWidth: '24px', color: idx < 3 ? '#D97706' : '#64748B' }}>
                      {rankMedal}
                    </span>

                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: it.isVeg ? '#10B981' : '#EF4444',
                        flexShrink: 0,
                      }}
                    />

                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                        {it.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                        {it.categoryName} · {formatPaise(it.basePrice, profile.currencySymbol)}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Progress Bar of Volume Share */}
                  <div style={{ flex: '2 1 200px', minWidth: '150px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>Volume Share</span>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>{sharePercent.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '7px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '4px',
                          backgroundColor: idx === 0 ? '#DC2626' : idx === 1 ? '#D97706' : '#2563EB',
                          width: `${Math.max(2, sharePercent)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Right: Quantity Sold & Revenue Total */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'right' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                        Quantity Sold
                      </span>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: it.unitsSold > 0 ? '#0F172A' : '#94A3B8' }}>
                        {it.unitsSold} <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B' }}>units</span>
                      </div>
                    </div>

                    <div style={{ minWidth: '90px' }}>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                        Revenue
                      </span>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#10B981' }}>
                        {formatPaise(it.revenuePaise, profile.currencySymbol)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Underperforming / Zero-Sales Kitchen Alert */}
          {zeroSalesItems.length > 0 && salesTimeframe === 'today' && (
            <div
              style={{
                marginTop: '8px',
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px dashed #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={16} color="#64748B" />
                <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 600 }}>
                  Kitchen prep note: <strong style={{ color: '#0F172A' }}>{zeroSalesItems.length} dishes</strong> haven't had orders yet today (avoid over-preparing).
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                {zeroSalesItems.slice(0, 4).map((it) => it.shortName || it.name).join(', ')}
                {zeroSalesItems.length > 4 ? ` +${zeroSalesItems.length - 4} more` : ''}
              </span>
            </div>
          )}
        </div>

        {/* 7. ORDER CHANNEL & PAYMENT MODES SPLIT GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          
          {/* Order Channel Breakdown (Dine-in, Takeaway, Delivery) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Order Channels (Today)
              </h3>
              <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                {stats.todayBillsCount} total orders
              </span>
            </div>

            {/* Dine-In */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0F172A' }}>
                  <Utensils size={15} color="#2563EB" /> Dine-In Table Service
                </span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>
                  {stats.dineInCount} bills ({formatPaise(stats.dineInRevenue, profile.currencySymbol)})
                </span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#2563EB',
                    borderRadius: '4px',
                    width: stats.todayBillsCount > 0 ? `${(stats.dineInCount / stats.todayBillsCount) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>

            {/* Takeaway */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0F172A' }}>
                  <Package size={15} color="#F59E0B" /> Takeaway / Counter Pickup
                </span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>
                  {stats.takeawayCount} bills ({formatPaise(stats.takeawayRevenue, profile.currencySymbol)})
                </span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#F59E0B',
                    borderRadius: '4px',
                    width: stats.todayBillsCount > 0 ? `${(stats.takeawayCount / stats.todayBillsCount) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>

            {/* Delivery */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0F172A' }}>
                  <TrendingUp size={15} color="#10B981" /> Direct Delivery
                </span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>
                  {stats.deliveryCount} bills ({formatPaise(stats.deliveryRevenue, profile.currencySymbol)})
                </span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#10B981',
                    borderRadius: '4px',
                    width: stats.todayBillsCount > 0 ? `${(stats.deliveryCount / stats.todayBillsCount) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Payment Distribution */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '22px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Payment Distribution (Today)
              </h3>
              <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                Total: {formatPaise(stats.totalTodayRevenue, profile.currencySymbol)}
              </span>
            </div>

            {/* UPI */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0F172A' }}>
                  <QrCode size={15} color="#2563EB" /> UPI / Dynamic QR
                </span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>
                  {formatPaise(stats.upiTotal, profile.currencySymbol)}
                </span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#2563EB',
                    borderRadius: '4px',
                    width: stats.totalTodayRevenue > 0 ? `${(stats.upiTotal / stats.totalTodayRevenue) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>

            {/* Cash */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0F172A' }}>
                  <Banknote size={15} color="#10B981" /> Cash Counter
                </span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>
                  {formatPaise(stats.cashTotal, profile.currencySymbol)}
                </span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#10B981',
                    borderRadius: '4px',
                    width: stats.totalTodayRevenue > 0 ? `${(stats.cashTotal / stats.totalTodayRevenue) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>

            {/* Card / Other */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0F172A' }}>
                  <CreditCard size={15} color="#8B5CF6" /> Card / POS Terminal
                </span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>
                  {formatPaise(stats.cardTotal, profile.currencySymbol)}
                </span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#8B5CF6',
                    borderRadius: '4px',
                    width: stats.totalTodayRevenue > 0 ? `${(stats.cardTotal / stats.totalTodayRevenue) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 8. QUICK RESTOCK MODAL DIALOG */}
      {restockModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  Quick Food Stock Replenishment
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                  Add stock portions to dishes so POS accurately tracks inventory
                </p>
              </div>
              <button
                onClick={() => setRestockModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body List */}
            <div style={{ padding: '16px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeItems.map((item) => {
                const isOut = item.isOutOfStock || (item.stockQty !== undefined && item.stockQty <= 0);

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      backgroundColor: isOut ? '#FEF2F2' : '#F8FAFC',
                      border: isOut ? '1px solid #FECACA' : '1px solid #E2E8F0',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Current stock: <strong style={{ color: isOut ? '#DC2626' : '#0F172A' }}>{item.stockQty !== undefined ? `${item.stockQty} portions` : 'Unlimited'}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleAddStock(item.id, 10)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#1E293B',
                          color: '#FFFFFF',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        +10
                      </button>

                      <button
                        onClick={() => handleAddStock(item.id, 25)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#1E293B',
                          color: '#FFFFFF',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        +25
                      </button>

                      <button
                        onClick={() => {
                          const targetMetric = itemMetrics.find((m) => m.itemId === item.id) || {
                            itemId: item.id,
                            name: item.name,
                            shortName: item.shortName,
                            categoryName: categoryMap.get(item.categoryId) || 'General',
                            isVeg: item.isVeg,
                            basePrice: item.basePrice,
                            currentStock: item.stockQty !== undefined ? item.stockQty : 0,
                            isOutOfStock: item.isOutOfStock || false,
                            unitsSold: 0,
                            revenuePaise: 0,
                            ordersCount: 0,
                            hourlyVelocity: 0,
                            estimatedHoursUntilStockout: null,
                            stockUrgency: 'untracked' as const,
                          };
                          setRestockModalOpen(false);
                          setEditingStockItem(targetMetric);
                          setEditModalStockQty(item.stockQty !== undefined ? item.stockQty : 20);
                          setEditModalIsOutOfStock(item.isOutOfStock || false);
                          setEditModalPriceRupees((item.basePrice / 100).toString());
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          color: '#2563EB',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Edit / Set
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 22px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: '#F8FAFC',
              }}
            >
              <button
                onClick={() => setRestockModalOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Done Restocking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK STOCK & PRODUCT EDIT MODAL */}
      {editingStockItem && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setEditingStockItem(null)}
        >
          <div
            className="animate-slide-up"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                  Edit Product & Stock
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                  {editingStockItem.categoryName} • {editingStockItem.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStockItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Product Info Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: editingStockItem.isVeg ? '50%' : '2px',
                      backgroundColor: editingStockItem.isVeg ? '#16A34A' : '#DC2626',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                    {editingStockItem.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: editModalIsOutOfStock ? '#FEF2F2' : '#DCFCE7',
                    color: editModalIsOutOfStock ? '#DC2626' : '#16A34A',
                  }}
                >
                  {editModalIsOutOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
                </span>
              </div>

              {/* Price Field */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Selling Price ({profile.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={editModalPriceRupees}
                  onChange={(e) => setEditModalPriceRupees(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#0F172A',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Stock Quantity Controls */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                    Available Stock Quantity
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>portions in kitchen</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setEditModalStockQty((q) => Math.max(0, q - 1))}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#0F172A',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={editModalStockQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setEditModalStockQty(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    style={{
                      flex: 1,
                      height: '42px',
                      textAlign: 'center',
                      fontSize: '18px',
                      fontWeight: 900,
                      color: '#0F172A',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '10px',
                      padding: '0 10px',
                      boxSizing: 'border-box',
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setEditModalStockQty((q) => q + 1)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#0F172A',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Quick Add Chips */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {[5, 10, 20, 50].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => {
                        setEditModalStockQty((q) => q + delta);
                        setEditModalIsOutOfStock(false);
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        fontSize: '11px',
                        fontWeight: 750,
                        color: '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      +{delta}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalStockQty(0);
                      setEditModalIsOutOfStock(true);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      fontSize: '11px',
                      fontWeight: 750,
                      color: '#DC2626',
                      cursor: 'pointer',
                    }}
                  >
                    Mark 0 (Out)
                  </button>
                </div>
              </div>

              {/* In Stock / Out of Stock Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                    Stock Availability Status
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {editModalIsOutOfStock ? 'Item will be hidden/disabled from ordering' : 'Item is available for billing and orders'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditModalIsOutOfStock((prev) => !prev)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: editModalIsOutOfStock ? '#DC2626' : '#16A34A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {editModalIsOutOfStock ? 'Set IN STOCK' : 'Set OUT OF STOCK'}
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setEditingStockItem(null);
                  onNavigateTab('menu');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Full Edit in Products
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingStockItem(null)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '9px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const pricePaise = editModalPriceRupees.trim()
                      ? rupeesToPaise(parseFloat(editModalPriceRupees))
                      : editingStockItem.basePrice;
                    const finalStock = Math.max(0, editModalStockQty);
                    const finalIsOut = editModalIsOutOfStock || finalStock <= 0;

                    // 1. Optimistic update (0ms lag)
                    setLocalStockOverrides((prev) => {
                      const next = new Map(prev);
                      next.set(editingStockItem.itemId, {
                        stockQty: finalStock,
                        isOutOfStock: finalIsOut,
                        pricePaise,
                      });
                      return next;
                    });

                    // 2. Persist in IndexedDB
                    await db.items.update(editingStockItem.itemId, {
                      stockQty: finalStock,
                      isOutOfStock: finalIsOut,
                      isActive: !finalIsOut,
                      basePrice: pricePaise,
                    });

                    setInlineAdjustNotice(`Saved changes for ${editingStockItem.name}! Stock: ${finalStock} portions`);
                    setTimeout(() => setInlineAdjustNotice(null), 3000);
                    setEditingStockItem(null);
                    await onRefreshData?.();
                  }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '9px',
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
