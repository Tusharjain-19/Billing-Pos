import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  FileText,
  Percent,
  DollarSign,
  UtensilsCrossed,
  Clock,
  QrCode,
  Banknote,
  Sun,
  Moon,
  Coffee,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Award,
  Info
} from 'lucide-react';
import type { Bill, RestaurantProfile } from '../types';
import { formatPaise } from '../utils/currency';
import { saveAndShareFile } from '../utils/fileExport';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { renderRevenueTrendChart, renderPaymentModeDonutChart, renderDishVelocityChart } from '../utils/chartRenderer';

interface ReportsScreenProps {
  bills: Bill[];
  profile: RestaurantProfile;
}

type DateRangePreset = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'all' | 'custom';
type MobileTab = 'overview' | 'ratios' | 'velocity' | 'gst' | 'shifts';

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ bills, profile }) => {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<MobileTab>('overview');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Scroll Container & Date Carousel Refs
  const reportsContainerRef = useRef<HTMLDivElement | null>(null);
  const dateBarRef = useRef<HTMLDivElement | null>(null);

  const scrollToTop = () => {
    reportsContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (reportsContainerRef.current) {
      reportsContainerRef.current.scrollTo({
        top: reportsContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const scrollDateBar = (direction: 'left' | 'right') => {
    if (dateBarRef.current) {
      dateBarRef.current.scrollBy({
        left: direction === 'left' ? -180 : 180,
        behavior: 'smooth',
      });
    }
  };

  // Screen Width Detection for dedicated mobile layout
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth < 768);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Filter bills based on selected date range and ACTIVE status
  const filteredBills = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000 - 1;

    return bills.filter((b) => {
      if (b.status === 'CANCELLED') return false;

      const t = b.createdAt;
      switch (datePreset) {
        case 'today':
          return t >= startOfToday && t <= endOfToday;
        case 'yesterday': {
          const startOfYesterday = startOfToday - 86400000;
          const endOfYesterday = startOfToday - 1;
          return t >= startOfYesterday && t <= endOfYesterday;
        }
        case 'week': {
          const sevenDaysAgo = startOfToday - 6 * 86400000;
          return t >= sevenDaysAgo && t <= endOfToday;
        }
        case 'month': {
          const thirtyDaysAgo = startOfToday - 29 * 86400000;
          return t >= thirtyDaysAgo && t <= endOfToday;
        }
        case 'last_month': {
          const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
          const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
          return t >= firstDayLastMonth && t <= lastDayLastMonth;
        }
        case 'custom': {
          if (!customStartDate && !customEndDate) return true;
          const start = customStartDate ? new Date(customStartDate).getTime() : 0;
          const end = customEndDate ? new Date(customEndDate).getTime() + 86400000 - 1 : Infinity;
          return t >= start && t <= end;
        }
        case 'all':
        default:
          return true;
      }
    });
  }, [bills, datePreset, customStartDate, customEndDate]);

  // Aggregate Metrics & 10 Indian Restaurant Specific Operational Ratios
  const analytics = useMemo(() => {
    let grossTotalPaise = 0;
    let taxableTotalPaise = 0;
    let cgstTotalPaise = 0;
    let sgstTotalPaise = 0;
    let discountTotalPaise = 0;
    let itemsCount = 0;

    let upiPaise = 0;
    let upiCount = 0;
    let cashPaise = 0;
    let cashCount = 0;
    let cardPaise = 0;
    let cardCount = 0;
    let otherPaymentPaise = 0;
    let otherPaymentCount = 0;

    let dineInCount = 0;
    let dineInPaise = 0;
    let takeawayCount = 0;
    let takeawayPaise = 0;
    let deliveryCount = 0;
    let deliveryPaise = 0;

    // Shift Tracking (Indian Meal Times)
    let lunchCount = 0; // 12 PM - 4 PM
    let lunchPaise = 0;
    let eveningChaiCount = 0; // 4 PM - 7 PM
    let eveningChaiPaise = 0;
    let dinnerCount = 0; // 7 PM - 11:30 PM
    let dinnerPaise = 0;
    let otherTimeCount = 0; // Morning / Late Night
    let otherTimePaise = 0;

    filteredBills.forEach((b) => {
      grossTotalPaise += b.grandTotal || 0;
      taxableTotalPaise += b.taxableAmount || 0;
      cgstTotalPaise += b.cgst || 0;
      sgstTotalPaise += b.sgst || 0;
      discountTotalPaise += b.discountAmount || 0;
      itemsCount += (b.items || []).reduce((acc, it) => acc + (it.qty || 1), 0);

      // Payment Breakdown
      const mode = (b.paymentMode || 'cash').toLowerCase();
      if (mode === 'upi') {
        upiPaise += b.grandTotal;
        upiCount++;
      } else if (mode === 'cash') {
        cashPaise += b.grandTotal;
        cashCount++;
      } else if (mode === 'card') {
        cardPaise += b.grandTotal;
        cardCount++;
      } else {
        otherPaymentPaise += b.grandTotal;
        otherPaymentCount++;
      }

      // Order Channel
      const oType = (b.orderType || 'dine_in').toLowerCase();
      if (oType.includes('dine') || oType.includes('table')) {
        dineInCount++;
        dineInPaise += b.grandTotal;
      } else if (oType.includes('delivery')) {
        deliveryCount++;
        deliveryPaise += b.grandTotal;
      } else {
        takeawayCount++;
        takeawayPaise += b.grandTotal;
      }

      // Shift Time
      const billDate = new Date(b.createdAt);
      const hours = billDate.getHours();
      if (hours >= 12 && hours < 16) {
        lunchCount++;
        lunchPaise += b.grandTotal;
      } else if (hours >= 16 && hours < 19) {
        eveningChaiCount++;
        eveningChaiPaise += b.grandTotal;
      } else if (hours >= 19 && hours < 24) {
        dinnerCount++;
        dinnerPaise += b.grandTotal;
      } else {
        otherTimeCount++;
        otherTimePaise += b.grandTotal;
      }
    });

    const totalTaxPaise = cgstTotalPaise + sgstTotalPaise;
    const invoiceCount = filteredBills.length;

    // 10 Key Indian Restaurant Ratios:
    // 1. Average Order Value (AOV / Ticket Size)
    const aovPaise = invoiceCount > 0 ? Math.round(grossTotalPaise / invoiceCount) : 0;

    // 2. UPI Bharat QR Settlement Ratio
    const upiSharePercent = grossTotalPaise > 0 ? ((upiPaise / grossTotalPaise) * 100).toFixed(1) : '0';

    // 3. Cash Velocity Ratio
    const cashSharePercent = grossTotalPaise > 0 ? ((cashPaise / grossTotalPaise) * 100).toFixed(1) : '0';

    // 4. Dine-in vs Takeaway Velocity
    const dineInSharePercent = grossTotalPaise > 0 ? ((dineInPaise / grossTotalPaise) * 100).toFixed(1) : '0';
    const takeawaySharePercent = grossTotalPaise > 0 ? ((takeawayPaise / grossTotalPaise) * 100).toFixed(1) : '0';

    // 5. Basket Density (Items per Ticket)
    const basketDensity = invoiceCount > 0 ? (itemsCount / invoiceCount).toFixed(1) : '0.0';

    // 6. Discount & Concession Leakage Ratio
    const discountLeakPercent =
      grossTotalPaise + discountTotalPaise > 0
        ? ((discountTotalPaise / (grossTotalPaise + discountTotalPaise)) * 100).toFixed(1)
        : '0';

    // 7. Average Realized Item Price (APU)
    const avgRealizedItemPaise = itemsCount > 0 ? Math.round(grossTotalPaise / itemsCount) : 0;

    // 8. Tax Collection Ratio to Turnover
    const effectiveTaxRate = taxableTotalPaise > 0 ? ((totalTaxPaise / taxableTotalPaise) * 100).toFixed(1) : '0';

    return {
      grossTotalPaise,
      taxableTotalPaise,
      cgstTotalPaise,
      sgstTotalPaise,
      totalTaxPaise,
      discountTotalPaise,
      invoiceCount,
      itemsCount,
      aovPaise,
      // Ratios
      upiPaise,
      upiCount,
      upiSharePercent,
      cashPaise,
      cashCount,
      cashSharePercent,
      cardPaise,
      cardCount,
      otherPaymentPaise,
      otherPaymentCount,
      dineInCount,
      dineInPaise,
      dineInSharePercent,
      takeawayCount,
      takeawayPaise,
      takeawaySharePercent,
      deliveryCount,
      deliveryPaise,
      basketDensity,
      discountLeakPercent,
      avgRealizedItemPaise,
      effectiveTaxRate,
      // Shifts
      lunchCount,
      lunchPaise,
      eveningChaiCount,
      eveningChaiPaise,
      dinnerCount,
      dinnerPaise,
      otherTimeCount,
      otherTimePaise,
    };
  }, [filteredBills]);

  // Item Sales Velocity Analytics (Ranked by volume & revenue)
  const itemAnalytics = useMemo(() => {
    const itemMap = new Map<string, { name: string; qty: number; revenuePaise: number }>();

    filteredBills.forEach((b) => {
      (b.items || []).forEach((it) => {
        const key = it.nameSnapshot || it.shortNameSnapshot || 'Unknown Item';
        const existing = itemMap.get(key) || { name: key, qty: 0, revenuePaise: 0 };
        existing.qty += it.qty || 1;
        existing.revenuePaise += it.lineTotal || (it.unitPrice || 0) * (it.qty || 1);
        itemMap.set(key, existing);
      });
    });

    const list = Array.from(itemMap.values());
    list.sort((a, b) => b.qty - a.qty);
    const maxQty = list.length > 0 ? Math.max(...list.map((i) => i.qty)) : 1;

    // Pareto 80/20 Law calculation
    const totalRev = analytics.grossTotalPaise;
    let runningRev = 0;
    let paretoTopCount = 0;
    for (const it of list) {
      runningRev += it.revenuePaise;
      paretoTopCount++;
      if (totalRev > 0 && runningRev >= totalRev * 0.8) break;
    }
    const paretoPercent = list.length > 0 ? ((paretoTopCount / list.length) * 100).toFixed(0) : '0';

    return { list, maxQty, paretoTopCount, paretoPercent };
  }, [filteredBills, analytics.grossTotalPaise]);

  // Daily Trend Analytics (for graph)
  const dailyTrend = useMemo(() => {
    const map = new Map<string, { dateStr: string; amountPaise: number; count: number }>();

    filteredBills.forEach((b) => {
      const d = new Date(b.createdAt);
      const dateKey = `${d.getMonth() + 1}/${d.getDate()}`;
      const entry = map.get(dateKey) || { dateStr: dateKey, amountPaise: 0, count: 0 };
      entry.amountPaise += b.grandTotal;
      entry.count += 1;
      map.set(dateKey, entry);
    });

    const entries = Array.from(map.values());
    const maxDayAmount = entries.length > 0 ? Math.max(...entries.map((e) => e.amountPaise)) : 1;
    return { entries, maxDayAmount };
  }, [filteredBills]);

  // GST Slabs Breakdown (Indian Statutory GSTR-1 Format)
  const gstBreakdown = useMemo(() => {
    const slabs: Record<number, { rate: number; taxablePaise: number; cgstPaise: number; sgstPaise: number; totalTaxPaise: number }> = {
      0: { rate: 0, taxablePaise: 0, cgstPaise: 0, sgstPaise: 0, totalTaxPaise: 0 },
      5: { rate: 5, taxablePaise: 0, cgstPaise: 0, sgstPaise: 0, totalTaxPaise: 0 },
      12: { rate: 12, taxablePaise: 0, cgstPaise: 0, sgstPaise: 0, totalTaxPaise: 0 },
      18: { rate: 18, taxablePaise: 0, cgstPaise: 0, sgstPaise: 0, totalTaxPaise: 0 },
    };

    filteredBills.forEach((b) => {
      const rate = profile.defaultGstPercent || 5;
      const targetRate = [0, 5, 12, 18].includes(rate) ? rate : 5;
      slabs[targetRate].taxablePaise += b.taxableAmount;
      slabs[targetRate].cgstPaise += b.cgst;
      slabs[targetRate].sgstPaise += b.sgst;
      slabs[targetRate].totalTaxPaise += b.cgst + b.sgst;
    });

    return Object.values(slabs);
  }, [filteredBills, profile.defaultGstPercent]);

  // 1. Formal Excel Export (With Save Prompt via saveAndShareFile)
  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportNotice('Preparing Excel workbook...');
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Executive Summary & Ratios
      const summaryData = [
        ['BILLING PRO POS - EXECUTIVE SALES & RATIOS AUDIT'],
        ['Establishment', profile.name],
        ['GSTIN', profile.gstin || 'Unregistered'],
        ['FSSAI License No.', profile.fssai || 'Not Specified'],
        ['UPI ID (VPA)', profile.upiVpa || 'N/A'],
        ['Report Period', datePreset.toUpperCase()],
        ['Generated At', new Date().toLocaleString()],
        [],
        ['FINANCIAL HEALTH & VOLUME METRICS', 'VALUE'],
        ['Gross Sales Turnover (₹)', (analytics.grossTotalPaise / 100).toFixed(2)],
        ['Net Taxable Turnover (₹)', (analytics.taxableTotalPaise / 100).toFixed(2)],
        ['Total Output GST (₹)', (analytics.totalTaxPaise / 100).toFixed(2)],
        ['Total Central GST (CGST) (₹)', (analytics.cgstTotalPaise / 100).toFixed(2)],
        ['Total State GST (SGST) (₹)', (analytics.sgstTotalPaise / 100).toFixed(2)],
        ['Discounts & Concessions (₹)', (analytics.discountTotalPaise / 100).toFixed(2)],
        ['Total Invoices Count', analytics.invoiceCount],
        ['Total Food Units Sold', analytics.itemsCount],
        [],
        ['KEY INDIAN RESTAURANT RATIOS', 'BENCHMARK / ACTUAL'],
        ['Average Order Value (AOV)', `₹${(analytics.aovPaise / 100).toFixed(2)}`],
        ['Digital UPI Settlement Share', `${analytics.upiSharePercent}%`],
        ['Cash Settlement Share', `${analytics.cashSharePercent}%`],
        ['Dine-In Revenue Share', `${analytics.dineInSharePercent}%`],
        ['Takeaway / Parcel Revenue Share', `${analytics.takeawaySharePercent}%`],
        ['Basket Density (Items / Order)', `${analytics.basketDensity} items/bill`],
        ['Discount Erosion Index', `${analytics.discountLeakPercent}% of revenue`],
        ['Avg Realized Item Price (ARIP)', `₹${(analytics.avgRealizedItemPaise / 100).toFixed(2)}`],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary & Ratios');

      // Sheet 2: Menu Items Sales Velocity
      const itemData = [
        ['Rank', 'Item / Dish Name', 'Units Sold', 'Revenue (₹)', 'Revenue Share (%)'],
        ...itemAnalytics.list.map((it, idx) => [
          idx + 1,
          it.name,
          it.qty,
          (it.revenuePaise / 100).toFixed(2),
          analytics.grossTotalPaise > 0 ? ((it.revenuePaise / analytics.grossTotalPaise) * 100).toFixed(1) + '%' : '0%',
        ]),
      ];
      const wsItems = XLSX.utils.aoa_to_sheet(itemData);
      XLSX.utils.book_append_sheet(wb, wsItems, 'Menu Item Velocity');

      // Sheet 3: GSTR-1 Statutory Tax Slabs
      const gstData = [
        ['GST Rate Slab', 'Taxable Turnover (₹)', 'CGST (₹)', 'SGST (₹)', 'Total Tax Collected (₹)'],
        ...gstBreakdown.map((s) => [
          `${s.rate}% GST`,
          (s.taxablePaise / 100).toFixed(2),
          (s.cgstPaise / 100).toFixed(2),
          (s.sgstPaise / 100).toFixed(2),
          (s.totalTaxPaise / 100).toFixed(2),
        ]),
      ];
      const wsGst = XLSX.utils.aoa_to_sheet(gstData);
      XLSX.utils.book_append_sheet(wb, wsGst, 'GSTR-1 Tax Slabs');

      // Sheet 4: Indian Shift Rush Analysis
      const shiftData = [
        ['Shift Window', 'Timing', 'Invoices', 'Revenue (₹)', 'Share (%)'],
        ['Lunch Rush', '12:00 PM - 04:00 PM', analytics.lunchCount, (analytics.lunchPaise / 100).toFixed(2), analytics.grossTotalPaise > 0 ? ((analytics.lunchPaise / analytics.grossTotalPaise) * 100).toFixed(1) + '%' : '0%'],
        ['Evening Chai & Snacks', '04:00 PM - 07:00 PM', analytics.eveningChaiCount, (analytics.eveningChaiPaise / 100).toFixed(2), analytics.grossTotalPaise > 0 ? ((analytics.eveningChaiPaise / analytics.grossTotalPaise) * 100).toFixed(1) + '%' : '0%'],
        ['Dinner Peak Rush', '07:00 PM - 11:30 PM', analytics.dinnerCount, (analytics.dinnerPaise / 100).toFixed(2), analytics.grossTotalPaise > 0 ? ((analytics.dinnerPaise / analytics.grossTotalPaise) * 100).toFixed(1) + '%' : '0%'],
        ['Breakfast / Other Hours', 'Late / Morning', analytics.otherTimeCount, (analytics.otherTimePaise / 100).toFixed(2), analytics.grossTotalPaise > 0 ? ((analytics.otherTimePaise / analytics.grossTotalPaise) * 100).toFixed(1) + '%' : '0%'],
      ];
      const wsShift = XLSX.utils.aoa_to_sheet(shiftData);
      XLSX.utils.book_append_sheet(wb, wsShift, 'Meal Shift Analysis');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const filename = `Sales_Report_${profile.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      await saveAndShareFile({
        blob,
        filename,
        title: 'Sales & GST Report',
        dialogTitle: 'Save Sales & GST Report Locally',
      });

      setExportNotice('Excel report exported successfully!');
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err: any) {
      setExportNotice(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Formal Minimalist Light-Mode PDF Report Export
  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportNotice('Generating Minimalist Light PDF Report...');
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Clean Light-Mode Header Palette
      const slateDark = [15, 23, 42]; // #0F172A
      const slateMuted = [100, 116, 139]; // #64748B
      const lineBorder = [226, 232, 240]; // #E2E8F0

      // Cafe Logo (Custom or Brand Emblem)
      const activeReportLogo = profile.logoUrl && !profile.logoUrl.startsWith('data:image/svg+xml') ? profile.logoUrl : './logo.png';
      let headerStartY = 16;
      try {
        doc.addImage(activeReportLogo, 'PNG', 14, 11, 18, 18);
        headerStartY = 14;
      } catch {
        // fallback cleanly without image
      }

      const textLeft = 36;

      // Cafe Name & Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text(profile.name.toUpperCase(), textLeft, headerStartY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(
        `${profile.address || 'India'} | Phone: ${profile.phone} | Email: ${profile.email || 'N/A'}`,
        textLeft,
        headerStartY + 9
      );

      // Statutory Cafe Details: GSTIN, FSSAI, UPI VPA
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(
        `GSTIN: ${profile.gstin || 'Unregistered'}   •   FSSAI: ${profile.fssai || 'N/A'}   •   UPI ID: ${profile.upiVpa || 'N/A'}`,
        textLeft,
        headerStartY + 14
      );

      // Subtle Divider
      doc.setDrawColor(lineBorder[0], lineBorder[1], lineBorder[2]);
      doc.setLineWidth(0.4);
      doc.line(14, 34, pageWidth - 14, 34);

      // Report Sub-Bar
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`EXECUTIVE SALES & STATUTORY GSTR AUDIT`, 14, 40);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(
        `Timeframe: ${datePreset.toUpperCase()} | Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        pageWidth - 14,
        40,
        { align: 'right' }
      );

      // Table 1: Financial Overview & Key Indian Restaurant Ratios
      autoTable(doc, {
        startY: 44,
        head: [['Financial Core Metric', 'Turnover / Count', 'Indian Restaurant Ratio', 'Value & Status']],
        body: [
          [
            'Gross Sales Turnover',
            `Rs. ${(analytics.grossTotalPaise / 100).toFixed(2)}`,
            'Average Order Value (AOV)',
            `Rs. ${(analytics.aovPaise / 100).toFixed(2)} / bill`,
          ],
          [
            'Taxable Base Turnover',
            `Rs. ${(analytics.taxableTotalPaise / 100).toFixed(2)}`,
            'UPI Bharat QR Share',
            `${analytics.upiSharePercent}% of sales`,
          ],
          [
            'Statutory Output GST',
            `Rs. ${(analytics.totalTaxPaise / 100).toFixed(2)}`,
            'Cash Collection Share',
            `${analytics.cashSharePercent}% of sales`,
          ],
          [
            'Total Customer Invoices',
            `${analytics.invoiceCount} orders`,
            'Basket Density',
            `${analytics.basketDensity} items / order`,
          ],
          [
            'Food Units Sold',
            `${analytics.itemsCount} dishes`,
            'Dine-in : Takeaway Ratio',
            `${analytics.dineInSharePercent}% : ${analytics.takeawaySharePercent}%`,
          ],
          [
            'Discount Concessions',
            `Rs. ${(analytics.discountTotalPaise / 100).toFixed(2)}`,
            'Discount Erosion Index',
            `${analytics.discountLeakPercent}% (Healthy < 5%)`,
          ],
        ],
        theme: 'plain',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 8.5,
          cellPadding: 2.8,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          cellPadding: 2.5,
          lineColor: [241, 245, 249],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [51, 65, 85] },
          1: { fontStyle: 'bold', textColor: [15, 23, 42] },
          2: { fontStyle: 'bold', textColor: [51, 65, 85] },
          3: { fontStyle: 'bold', textColor: [15, 23, 42] },
        },
      });

      // Table 2: Statutory GSTR-1 Tax Slabs
      const gstTableY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Statutory GSTR-1 Output Tax Breakdown', 14, gstTableY);

      autoTable(doc, {
        startY: gstTableY + 2.5,
        head: [['Rate Slab', 'Taxable Turnover (Rs.)', 'CGST (Rs.)', 'SGST (Rs.)', 'Total GST Output (Rs.)']],
        body: [
          ...gstBreakdown.map((s) => [
            `${s.rate}% GST`,
            (s.taxablePaise / 100).toFixed(2),
            (s.cgstPaise / 100).toFixed(2),
            (s.sgstPaise / 100).toFixed(2),
            (s.totalTaxPaise / 100).toFixed(2),
          ]),
          [
            'TOTAL STATUTORY TAX',
            (analytics.taxableTotalPaise / 100).toFixed(2),
            (analytics.cgstTotalPaise / 100).toFixed(2),
            (analytics.sgstTotalPaise / 100).toFixed(2),
            (analytics.totalTaxPaise / 100).toFixed(2),
          ],
        ],
        theme: 'striped',
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2.2,
        },
        bodyStyles: {
          fontSize: 7.8,
          cellPadding: 2.2,
        },
      });

      // Table 3: Meal Shift Rush Velocity
      const shiftTableY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Indian Meal Shift Velocity (Staffing & Prep Audit)', 14, shiftTableY);

      autoTable(doc, {
        startY: shiftTableY + 2.5,
        head: [['Shift Window', 'Timing Slot', 'Orders Count', 'Turnover (Rs.)', 'Revenue Share']],
        body: [
          ['Lunch Shift Rush', '12:00 PM - 04:00 PM', `${analytics.lunchCount}`, (analytics.lunchPaise / 100).toFixed(2), analytics.grossTotalPaise > 0 ? `${((analytics.lunchPaise / analytics.grossTotalPaise) * 100).toFixed(1)}%` : '0%'],
          ['Evening Chai & Snacks', '04:00 PM - 07:00 PM', `${analytics.eveningChaiCount}`, (analytics.eveningChaiPaise / 100).toFixed(2), analytics.grossTotalPaise > 0 ? `${((analytics.eveningChaiPaise / analytics.grossTotalPaise) * 100).toFixed(1)}%` : '0%'],
          ['Dinner Peak Rush', '07:00 PM - 11:30 PM', `${analytics.dinnerCount}`, (analytics.dinnerPaise / 100).toFixed(2), analytics.grossTotalPaise > 0 ? `${((analytics.dinnerPaise / analytics.grossTotalPaise) * 100).toFixed(1)}%` : '0%'],
          ['Breakfast / Late Night', 'Other Hours', `${analytics.otherTimeCount}`, (analytics.otherTimePaise / 100).toFixed(2), analytics.grossTotalPaise > 0 ? `${((analytics.otherTimePaise / analytics.grossTotalPaise) * 100).toFixed(1)}%` : '0%'],
        ],
        theme: 'plain',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2.2,
        },
        bodyStyles: {
          fontSize: 7.8,
          cellPadding: 2.2,
        },
      });

      // Table 4: Top Selling Menu Dishes
      const itemsTableY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Top Selling Menu Items & Velocity (Pareto Ranking)', 14, itemsTableY);

      autoTable(doc, {
        startY: itemsTableY + 2.5,
        head: [['#', 'Item / Dish Name', 'Units Sold', 'Revenue (Rs.)', 'Share of Revenue']],
        body: itemAnalytics.list.slice(0, 12).map((it, idx) => [
          idx + 1,
          it.name,
          it.qty,
          (it.revenuePaise / 100).toFixed(2),
          analytics.grossTotalPaise > 0 ? `${((it.revenuePaise / analytics.grossTotalPaise) * 100).toFixed(1)}%` : '0%',
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2,
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: 2,
        },
      });

      // Page 2: Visual Charts & Graphical Performance Summary (Real Canvas Rendered Graphs)
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text('VISUAL PERFORMANCE ANALYTICS & CHARTS', 14, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(`Graphical performance overview for ${profile.name} (${datePreset.toUpperCase()})`, 14, 21);

      try {
        // 1. Daily Trend Bar Chart
        const trendImg = renderRevenueTrendChart(dailyTrend.entries, 800, 260);
        if (trendImg) {
          doc.addImage(trendImg, 'PNG', 14, 26, 182, 60);
        }

        // 2. Payment Donut Chart
        const paymentImg = renderPaymentModeDonutChart([
          { mode: 'UPI', amountPaise: analytics.upiPaise, count: analytics.upiCount, color: '#2563EB' },
          { mode: 'Cash', amountPaise: analytics.cashPaise, count: analytics.cashCount, color: '#10B981' },
          { mode: 'Card', amountPaise: analytics.cardPaise, count: analytics.cardCount, color: '#8B5CF6' },
        ], 460, 260);
        if (paymentImg) {
          doc.addImage(paymentImg, 'PNG', 14, 90, 88, 52);
        }

        // 3. Top Dishes Velocity Chart
        const dishImg = renderDishVelocityChart(itemAnalytics.list, 460, 260);
        if (dishImg) {
          doc.addImage(dishImg, 'PNG', 108, 90, 88, 52);
        }
      } catch (chartErr) {
        console.warn('Charts skipped in PDF:', chartErr);
      }

      // Bottom Branding & Footer on All Pages
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(lineBorder[0], lineBorder[1], lineBorder[2]);
        doc.setLineWidth(0.3);
        doc.line(14, 284, pageWidth - 14, 284);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text('Confidential • Statutory GSTR Compliant Report', 14, 289);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('Powered by Billing Pro POS', pageWidth / 2, 289, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, 289, { align: 'right' });
      }

      const pdfBlob = doc.output('blob');
      const filename = `Executive_Report_${profile.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

      await saveAndShareFile({
        blob: pdfBlob,
        filename,
        title: 'Executive Sales Report',
        dialogTitle: 'Save PDF Report Locally',
      });

      setExportNotice('PDF report generated and saved successfully!');
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err: any) {
      setExportNotice(`PDF error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      ref={reportsContainerRef}
      id="reports-scroll-container"
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: isMobile ? '12px' : '20px',
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box',
          width: '100%',
          paddingBottom: '90px',
        }}
      >
        {/* 1. Header & Date Range Controls (Clean Light Mode) */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px solid #E2E8F0',
            padding: isMobile ? '14px' : '18px 24px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: '14px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BarChart3 size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2
                style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 850,
                  margin: 0,
                  color: '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Sales & Statutory GST Audit Report
              </h2>
              <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                GSTR-1 Tax Summary • Dish Velocity • Payment Breakdown
              </p>
            </div>
          </div>

          {/* Date Presets Carousel / Bar with Scroll Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '100%', minWidth: 0 }}>
            <button
              type="button"
              onClick={() => scrollDateBar('left')}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Scroll Date Presets Left"
            >
              <ChevronLeft size={14} />
            </button>

            <div
              ref={dateBarRef}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
                flexWrap: 'nowrap',
                paddingBottom: isMobile ? '4px' : '0',
                scrollbarWidth: 'none',
                scrollBehavior: 'smooth',
                maxWidth: '100%',
              }}
            >
              {(
                [
                  ['today', 'Today'],
                  ['yesterday', 'Yesterday'],
                  ['week', 'Last 7 Days'],
                  ['month', 'Last 30 Days'],
                  ['last_month', 'Last Month'],
                  ['all', 'All Time'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDatePreset(key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: datePreset === key ? '#2563EB' : '#F8FAFC',
                    color: datePreset === key ? '#FFFFFF' : '#475569',
                    border: `1px solid ${datePreset === key ? '#2563EB' : '#CBD5E1'}`,
                    fontSize: '11.5px',
                    fontWeight: 750,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollDateBar('right')}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Scroll Date Presets Right"
            >
              <ChevronRight size={14} />
            </button>
          </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting}
            style={{
              flex: isMobile ? 1 : 'initial',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              backgroundColor: '#F0FDF4',
              color: '#166534',
              border: '1px solid #BBF7D0',
              fontSize: '12px',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            <FileSpreadsheet size={15} color="#16A34A" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            style={{
              flex: isMobile ? 1 : 'initial',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#1E40AF',
              border: '1px solid #BFDBFE',
              fontSize: '12px',
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            <FileText size={15} color="#2563EB" />
            <span>PDF Dossier</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1E40AF',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Info size={16} />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Dedicated Mobile Segmented Navigation */}
      {isMobile && (
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            gap: '4px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {[
            { id: 'overview', label: 'Summary' },
            { id: 'ratios', label: '🇮🇳 10 Ratios' },
            { id: 'velocity', label: 'Top Dishes' },
            { id: 'gst', label: 'GSTR-1 Tax' },
            { id: 'shifts', label: 'Meal Shifts' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMobileTab(t.id as any)}
              style={{
                flex: '1 0 auto',
                padding: '7px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: mobileTab === t.id ? '#FFFFFF' : 'transparent',
                color: mobileTab === t.id ? '#0F172A' : '#64748B',
                fontWeight: mobileTab === t.id ? 800 : 600,
                fontSize: '11.5px',
                boxShadow: mobileTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* 2. Executive Metric KPI Cards */}
      {(!isMobile || mobileTab === 'overview') && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: isMobile ? '10px' : '14px',
            width: '100%',
          }}
        >
          {/* Gross Sales */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: isMobile ? '12px' : '16px 20px',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 750, color: '#64748B' }}>Gross Sales</span>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUp size={13} />
              </div>
            </div>
            <div
              style={{
                fontSize: isMobile ? '18px' : '22px',
                fontWeight: 850,
                color: '#0F172A',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {formatPaise(analytics.grossTotalPaise, profile.currencySymbol)}
            </div>
            <div style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: 700, marginTop: '3px' }}>
              {analytics.invoiceCount} invoices
            </div>
          </div>

          {/* Taxable Sales */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: isMobile ? '12px' : '16px 20px',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 750, color: '#64748B' }}>Taxable Base</span>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: '#F0FDF4',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DollarSign size={13} />
              </div>
            </div>
            <div
              style={{
                fontSize: isMobile ? '18px' : '22px',
                fontWeight: 850,
                color: '#0F172A',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {formatPaise(analytics.taxableTotalPaise, profile.currencySymbol)}
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginTop: '3px' }}>
              Pre-tax revenue
            </div>
          </div>

          {/* GST Output */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: isMobile ? '12px' : '16px 20px',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 750, color: '#64748B' }}>Output GST</span>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Percent size={13} />
              </div>
            </div>
            <div
              style={{
                fontSize: isMobile ? '18px' : '22px',
                fontWeight: 850,
                color: '#D97706',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {formatPaise(analytics.totalTaxPaise, profile.currencySymbol)}
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginTop: '3px' }}>
              CGST + SGST
            </div>
          </div>

          {/* Average Order Value (AOV) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: isMobile ? '12px' : '16px 20px',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 750, color: '#64748B' }}>Avg Ticket (AOV)</span>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: '#F3E8FF',
                  color: '#9333EA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Receipt size={13} />
              </div>
            </div>
            <div
              style={{
                fontSize: isMobile ? '18px' : '22px',
                fontWeight: 850,
                color: '#0F172A',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {formatPaise(analytics.aovPaise, profile.currencySymbol)}
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600, marginTop: '3px' }}>
              {analytics.basketDensity} items / order
            </div>
          </div>
        </div>
      )}

      {/* 3. 10 Indian Restaurant Operational Ratios Grid */}
      {(!isMobile || mobileTab === 'ratios' || mobileTab === 'overview') && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px solid #E2E8F0',
            padding: isMobile ? '14px' : '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Operational Ratios & Key Metrics</span>
              </h3>
              <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                Core performance ratios for sales tracking and financial health
              </p>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 750,
                backgroundColor: '#EFF6FF',
                color: '#1E40AF',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              Audited Metrics
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(1, 1fr)' : 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Ratio 1: UPI Bharat QR Share */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748B', fontWeight: 700 }}>
                <span>1. UPI Digital Settlement</span>
                <QrCode size={14} color="#2563EB" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 850, color: '#0F172A', marginTop: '4px' }}>
                {analytics.upiSharePercent}% <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>of revenue</span>
              </div>
              <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '2px', fontWeight: 650 }}>
                {formatPaise(analytics.upiPaise, profile.currencySymbol)} • {analytics.upiCount} txns (Zero cash shrinkage)
              </div>
            </div>

            {/* Ratio 2: Cash Collection Share */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748B', fontWeight: 700 }}>
                <span>2. Cash Drawer Share</span>
                <Banknote size={14} color="#16A34A" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 850, color: '#0F172A', marginTop: '4px' }}>
                {analytics.cashSharePercent}% <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>of revenue</span>
              </div>
              <div style={{ fontSize: '11px', color: '#16A34A', marginTop: '2px', fontWeight: 650 }}>
                {formatPaise(analytics.cashPaise, profile.currencySymbol)} • {analytics.cashCount} cash tickets
              </div>
            </div>

            {/* Ratio 3: Dine-In vs Takeaway Parcel */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748B', fontWeight: 700 }}>
                <span>3. Channel Velocity</span>
                <UtensilsCrossed size={14} color="#EA580C" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 850, color: '#0F172A', marginTop: '4px' }}>
                {analytics.dineInSharePercent}% Dine-in <span style={{ fontSize: '12px', color: '#94A3B8' }}>/</span> {analytics.takeawaySharePercent}% Parcel
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                {analytics.dineInCount} Dine-in vs {analytics.takeawayCount} Takeaway bills
              </div>
            </div>

            {/* Ratio 4: Discount & Concession Erosion */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748B', fontWeight: 700 }}>
                <span>4. Discount Leakage Ratio</span>
                <Percent size={14} color="#DC2626" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 850, color: Number(analytics.discountLeakPercent) > 5 ? '#DC2626' : '#16A34A', marginTop: '4px' }}>
                {analytics.discountLeakPercent}% <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>({Number(analytics.discountLeakPercent) <= 5 ? 'Target Met <5%' : 'High Discounting'})</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                {formatPaise(analytics.discountTotalPaise, profile.currencySymbol)} concessions given
              </div>
            </div>

            {/* Ratio 5: Basket Density */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748B', fontWeight: 700 }}>
                <span>5. Basket Density</span>
                <ShoppingBag size={14} color="#9333EA" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 850, color: '#0F172A', marginTop: '4px' }}>
                {analytics.basketDensity} dishes / order
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                Cross-sell target: {Number(analytics.basketDensity) >= 2.5 ? 'Excellent Cross-Selling' : 'Add Beverage Upsells'}
              </div>
            </div>

            {/* Ratio 6: Pareto 80/20 Menu Vitality */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748B', fontWeight: 700 }}>
                <span>6. Pareto 80/20 Law</span>
                <Award size={14} color="#D97706" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 850, color: '#0F172A', marginTop: '4px' }}>
                Top {itemAnalytics.paretoTopCount} dishes ({itemAnalytics.paretoPercent}%)
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                Drive 80% of entire restaurant turnover
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Two-Column Visual Analytics: Which Item is Selling (UI LEAK SOLVED) & Daily Trend */}
      {(!isMobile || mobileTab === 'velocity') && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: '16px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Item Sales Velocity Graph (WHICH ITEM IS SELLING - FULLY PROTECTED FROM TEXT LEAKS) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1.5px solid #E2E8F0',
              padding: isMobile ? '14px' : '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              minWidth: 0,
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
              <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Top Selling Menu Items & Velocity
                </h3>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>
                  Ranked by order volume & revenue contribution
                </p>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 750,
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  flexShrink: 0,
                }}
              >
                {itemAnalytics.list.length} Items Sold
              </span>
            </div>

            <div
              className="sleek-report-scroll"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '380px',
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarGutter: 'stable',
                paddingRight: '16px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {itemAnalytics.list.length > 0 ? (
                itemAnalytics.list.slice(0, 15).map((it, idx) => {
                  const percent = Math.round((it.qty / itemAnalytics.maxQty) * 100);
                  return (
                    <div
                      key={it.name}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        width: '100%',
                        boxSizing: 'border-box',
                        minWidth: 0,
                      }}
                    >
                      {/* Fixed row layout: No text leak */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          width: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            minWidth: 0,
                            flex: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#64748B',
                              flexShrink: 0,
                              width: '20px',
                            }}
                          >
                            #{idx + 1}
                          </span>
                          <span
                            style={{
                              fontSize: '12.5px',
                              fontWeight: 750,
                              color: '#1E293B',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0,
                            }}
                            title={it.name}
                          >
                            {it.name}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#2563EB',
                              backgroundColor: '#EFF6FF',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {it.qty} orders
                          </span>
                          <span
                            style={{
                              fontSize: '12.5px',
                              fontWeight: 800,
                              color: '#0F172A',
                              minWidth: '76px',
                              textAlign: 'right',
                              paddingRight: '6px',
                            }}
                          >
                            {formatPaise(it.revenuePaise, profile.currencySymbol)}
                          </span>
                        </div>
                      </div>

                      {/* Visual Bar with clean corporate blue gradient */}
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: '#F1F5F9',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          boxSizing: 'border-box',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(5, percent)}%`,
                            height: '100%',
                            backgroundColor: idx === 0 ? '#10B981' : idx === 1 ? '#2563EB' : idx === 2 ? '#6366F1' : '#94A3B8',
                            borderRadius: '999px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  No food items sold in this timeframe.
                </div>
              )}
            </div>
          </div>

          {/* Daily Sales Bar Chart */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1.5px solid #E2E8F0',
              padding: isMobile ? '14px' : '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              minWidth: 0,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
              <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Daily Revenue Curve & Velocity
                </h3>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>
                  Sales trend across active trading days
                </p>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 750,
                  backgroundColor: '#F0FDF4',
                  color: '#16A34A',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  flexShrink: 0,
                }}
              >
                {dailyTrend.entries.length} Active Days
              </span>
            </div>

            <div
              style={{
                height: '320px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: isMobile ? '4px' : '8px',
                padding: '10px 0',
                borderBottom: '1px solid #E2E8F0',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {dailyTrend.entries.length > 0 ? (
                dailyTrend.entries.slice(-14).map((d) => {
                  const heightPercent = Math.max(10, Math.round((d.amountPaise / dailyTrend.maxDayAmount) * 100));
                  return (
                    <div
                      key={d.dateStr}
                      style={{
                        flex: '1 0 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        height: '100%',
                        justifyContent: 'flex-end',
                        minWidth: '24px',
                      }}
                    >
                      <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        ₹{Math.round(d.amountPaise / 100)}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '22px',
                          height: `${heightPercent}%`,
                          backgroundColor: '#2563EB',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                        title={`${d.dateStr}: ₹${(d.amountPaise / 100).toFixed(2)} (${d.count} orders)`}
                      />
                      <span style={{ fontSize: '9.5px', color: '#475569', fontWeight: 600 }}>{d.dateStr}</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ width: '100%', textAlign: 'center', color: '#94A3B8', fontSize: '13px', margin: 'auto' }}>
                  No sales data recorded in this period.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Indian Meal Shift Velocity (Lunch vs Dinner Staffing Insight) */}
      {(!isMobile || mobileTab === 'shifts') && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px solid #E2E8F0',
            padding: isMobile ? '14px' : '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#2563EB" />
              <span>Indian Dining Shift Heatmap & Peak Rush</span>
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
              Analyzes revenue velocity by lunch, tea snacks, and dinner hours for mise en place & kitchen roster
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '12px',
            }}
          >
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#B45309' }}>
                <Sun size={14} /> Lunch Rush (12 - 4 PM)
              </div>
              <div style={{ fontSize: '18px', fontWeight: 850, color: '#92400E', marginTop: '6px' }}>
                {formatPaise(analytics.lunchPaise, profile.currencySymbol)}
              </div>
              <div style={{ fontSize: '10.5px', color: '#B45309', marginTop: '2px', fontWeight: 650 }}>
                {analytics.lunchCount} orders ({analytics.grossTotalPaise > 0 ? ((analytics.lunchPaise / analytics.grossTotalPaise) * 100).toFixed(1) : 0}% of sales)
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#FFEDD5', border: '1px solid #FED7AA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#C2410C' }}>
                <Coffee size={14} /> Chai & Snacks (4 - 7 PM)
              </div>
              <div style={{ fontSize: '18px', fontWeight: 850, color: '#9A3412', marginTop: '6px' }}>
                {formatPaise(analytics.eveningChaiPaise, profile.currencySymbol)}
              </div>
              <div style={{ fontSize: '10.5px', color: '#C2410C', marginTop: '2px', fontWeight: 650 }}>
                {analytics.eveningChaiCount} orders ({analytics.grossTotalPaise > 0 ? ((analytics.eveningChaiPaise / analytics.grossTotalPaise) * 100).toFixed(1) : 0}% of sales)
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#EDE9FE', border: '1px solid #DDD6FE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#6D28D9' }}>
                <Moon size={14} /> Dinner Peak (7 - 11:30 PM)
              </div>
              <div style={{ fontSize: '18px', fontWeight: 850, color: '#5B21B6', marginTop: '6px' }}>
                {formatPaise(analytics.dinnerPaise, profile.currencySymbol)}
              </div>
              <div style={{ fontSize: '10.5px', color: '#6D28D9', marginTop: '2px', fontWeight: 650 }}>
                {analytics.dinnerCount} orders ({analytics.grossTotalPaise > 0 ? ((analytics.dinnerPaise / analytics.grossTotalPaise) * 100).toFixed(1) : 0}% of sales)
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#475569' }}>
                <Clock size={14} /> Morning / Other
              </div>
              <div style={{ fontSize: '18px', fontWeight: 850, color: '#1E293B', marginTop: '6px' }}>
                {formatPaise(analytics.otherTimePaise, profile.currencySymbol)}
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', fontWeight: 650 }}>
                {analytics.otherTimeCount} orders
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. GST Tax Collection Breakdown (Formal Statutory GSTR-1 Compliant) */}
      {(!isMobile || mobileTab === 'gst') && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px solid #E2E8F0',
            padding: isMobile ? '14px' : '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Formal GST Tax Collection Summary (GSTR-Ready)
              </h3>
              <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                Statutory breakdown of Central GST (CGST) and State GST (SGST) collections
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 750,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  color: '#334155',
                }}
              >
                GSTIN: {profile.gstin || 'Not Configured'}
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', minWidth: '480px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                  <th style={{ padding: '10px 14px' }}>Tax Rate Slab</th>
                  <th style={{ padding: '10px 14px' }}>Taxable Turnover (₹)</th>
                  <th style={{ padding: '10px 14px' }}>CGST Rate & Amount (₹)</th>
                  <th style={{ padding: '10px 14px' }}>SGST Rate & Amount (₹)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Tax Collected (₹)</th>
                </tr>
              </thead>
              <tbody>
                {gstBreakdown.map((s) => (
                  <tr key={s.rate} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 750, color: '#0F172A' }}>
                      {s.rate}% GST Slab
                    </td>
                    <td style={{ padding: '10px 14px', color: '#334155' }}>
                      {formatPaise(s.taxablePaise, profile.currencySymbol)}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#334155' }}>
                      {s.rate > 0 ? `${s.rate / 2}% • ` : ''}
                      {formatPaise(s.cgstPaise, profile.currencySymbol)}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#334155' }}>
                      {s.rate > 0 ? `${s.rate / 2}% • ` : ''}
                      {formatPaise(s.sgstPaise, profile.currencySymbol)}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#D97706', textAlign: 'right' }}>
                      {formatPaise(s.totalTaxPaise, profile.currencySymbol)}
                    </td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 850, borderTop: '2px solid #CBD5E1' }}>
                  <td style={{ padding: '12px 14px', color: '#0F172A' }}>TOTAL STATUTORY TAX</td>
                  <td style={{ padding: '12px 14px', color: '#0F172A' }}>
                    {formatPaise(analytics.taxableTotalPaise, profile.currencySymbol)}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#0F172A' }}>
                    {formatPaise(analytics.cgstTotalPaise, profile.currencySymbol)}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#0F172A' }}>
                    {formatPaise(analytics.sgstTotalPaise, profile.currencySymbol)}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#16A34A', textAlign: 'right' }}>
                    {formatPaise(analytics.totalTaxPaise, profile.currencySymbol)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Floating Scroll Controls (Scroll to Top & Scroll to Bottom) */}
      <div
        style={{
          position: 'fixed',
          bottom: isMobile ? '70px' : '28px',
          right: isMobile ? '16px' : '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 40,
        }}
      >
        <button
          type="button"
          onClick={scrollToTop}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1E293B',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Scroll to Top"
        >
          <ChevronUp size={20} />
        </button>
        <button
          type="button"
          onClick={scrollToBottom}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#2563EB',
            border: 'none',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Scroll to Bottom"
        >
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  );
};
