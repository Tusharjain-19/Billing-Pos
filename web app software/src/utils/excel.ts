import * as XLSX from 'xlsx';
import type { Bill, Item, Category } from '../types';
import { saveAndShareFile } from './fileExport';

export interface VerifiedExportResult {
  success: boolean;
  fileName: string;
  totalBills: number;
  totalSalesPaise: number;
  blob?: Blob;
  error?: string;
}

export interface MenuExportResult {
  success: boolean;
  fileName: string;
  totalItems: number;
  blob?: Blob;
  error?: string;
}

/**
 * Export Bills and Invoices to Excel (.xlsx) with multi-sheet audit summaries.
 * Works seamlessly on Web and Capacitor Native Android/iOS.
 */
export async function exportBillsToExcel(
  bills: Bill[],
  restaurantName: string,
  periodLabel: string = 'Export'
): Promise<VerifiedExportResult> {
  try {
    if (!bills || bills.length === 0) {
      return {
        success: false,
        fileName: '',
        totalBills: 0,
        totalSalesPaise: 0,
        error: 'No bills available in selected period to export.',
      };
    }

    const cleanRestro = (restaurantName || 'Restaurant').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${cleanRestro}_${periodLabel}_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // 1. Sheet: Bills
    const billsData = bills.map((b) => {
      const dt = new Date(b.createdAt);
      return {
        'Bill No': b.billNo,
        'Date': dt.toLocaleDateString('en-IN'),
        'Time': dt.toLocaleTimeString('en-IN'),
        'Order Type': (b.orderType || '').toUpperCase(),
        'Table / Ref': b.tableNo || '-',
        'Customer Name': b.customerName || '-',
        'Customer Phone': b.customerPhone || '-',
        'Items Count': b.items?.length || 0,
        'Subtotal (₹)': (b.subtotal / 100).toFixed(2),
        'Discount (₹)': (b.discountAmount / 100).toFixed(2),
        'Charges (₹)': (((b.serviceCharge || 0) + (b.packagingCharge || 0)) / 100).toFixed(2),
        'CGST (₹)': (b.cgst / 100).toFixed(2),
        'SGST (₹)': (b.sgst / 100).toFixed(2),
        'Round Off (₹)': (b.roundOff / 100).toFixed(2),
        'Grand Total (₹)': (b.grandTotal / 100).toFixed(2),
        'Payment Mode': (b.paymentMode || '').toUpperCase(),
        'Status': b.status,
        'Cancel Reason': b.cancelReason || '',
      };
    });

    // 2. Sheet: Items
    const itemsData: any[] = [];
    bills.forEach((b) => {
      const dtStr = new Date(b.createdAt).toLocaleDateString('en-IN');
      (b.items || []).forEach((item) => {
        itemsData.push({
          'Bill No': b.billNo,
          'Date': dtStr,
          'Item Name': item.nameSnapshot,
          'Variant': item.variantSnapshot || '-',
          'Quantity': item.qty,
          'Unit Price (₹)': (item.unitPrice / 100).toFixed(2),
          'Tax (%)': `${item.taxPercent || 0}%`,
          'Line Total (₹)': (item.lineTotal / 100).toFixed(2),
          'Note': item.note || '',
        });
      });
    });

    // 3. Sheet: Daily Summary
    const dailyMap = new Map<string, { count: number; total: number; cash: number; upi: number; card: number; tax: number }>();
    bills.forEach((b) => {
      if (b.status === 'CANCELLED') return;
      const dateKey = new Date(b.createdAt).toLocaleDateString('en-IN');
      const curr = dailyMap.get(dateKey) || { count: 0, total: 0, cash: 0, upi: 0, card: 0, tax: 0 };
      curr.count += 1;
      curr.total += b.grandTotal;
      curr.tax += (b.cgst + b.sgst);
      if (b.paymentMode === 'cash') curr.cash += b.grandTotal;
      else if (b.paymentMode === 'upi') curr.upi += b.grandTotal;
      else if (b.paymentMode === 'card') curr.card += b.grandTotal;
      dailyMap.set(dateKey, curr);
    });

    const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      'Date': date,
      'Bill Count': data.count,
      'Total Sales (₹)': (data.total / 100).toFixed(2),
      'Cash Sales (₹)': (data.cash / 100).toFixed(2),
      'UPI Sales (₹)': (data.upi / 100).toFixed(2),
      'Card Sales (₹)': (data.card / 100).toFixed(2),
      'Tax Collected (₹)': (data.tax / 100).toFixed(2),
    }));

    // 4. Sheet: Tax Summary
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    bills.forEach((b) => {
      if (b.status === 'CANCELLED') return;
      totalTaxable += (b.taxableAmount || 0);
      totalCgst += (b.cgst || 0);
      totalSgst += (b.sgst || 0);
    });

    const taxData = [
      {
        'Tax Description': 'GST on Restaurant Services',
        'Total Taxable Turnover (₹)': (totalTaxable / 100).toFixed(2),
        'CGST (₹)': (totalCgst / 100).toFixed(2),
        'SGST (₹)': (totalSgst / 100).toFixed(2),
        'Total GST (₹)': ((totalCgst + totalSgst) / 100).toFixed(2),
      },
    ];

    // 5. Sheet: Payment Summary
    const paymentMap = new Map<string, { count: number; total: number }>();
    bills.forEach((b) => {
      if (b.status === 'CANCELLED') return;
      const mode = (b.paymentMode || 'OTHER').toUpperCase();
      const curr = paymentMap.get(mode) || { count: 0, total: 0 };
      curr.count += 1;
      curr.total += b.grandTotal;
      paymentMap.set(mode, curr);
    });

    const paymentData = Array.from(paymentMap.entries()).map(([mode, data]) => ({
      'Payment Mode': mode,
      'Transactions': data.count,
      'Total Amount (₹)': (data.total / 100).toFixed(2),
    }));

    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(billsData), 'Bills');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemsData), 'Items Breakdown');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyData), 'Daily Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(taxData), 'GST Tax Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentData), 'Payment Summary');

    // Generate binary
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Verification step: Read back and verify count
    const readWb = XLSX.read(wbout, { type: 'array' });
    const verifiedBillsSheet = readWb.Sheets['Bills'];
    const verifiedBills = XLSX.utils.sheet_to_json(verifiedBillsSheet);

    if (verifiedBills.length !== bills.length) {
      return {
        success: false,
        fileName,
        totalBills: bills.length,
        totalSalesPaise: 0,
        error: `Export verification failed! Expected ${bills.length} bills, found ${verifiedBills.length}.`,
      };
    }

    // Save & Share across Web / Mobile Capacitor
    await saveAndShareFile({
      blob,
      filename: fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      title: `${restaurantName} Invoices Export`,
      dialogTitle: `Save or Share ${fileName}`,
    });

    const totalSalesPaise = bills
      .filter((b) => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + b.grandTotal, 0);

    return {
      success: true,
      fileName,
      totalBills: bills.length,
      totalSalesPaise,
      blob,
    };
  } catch (err: any) {
    console.error('Excel export error:', err);
    return {
      success: false,
      fileName: '',
      totalBills: 0,
      totalSalesPaise: 0,
      error: err.message || 'Export error',
    };
  }
}

/**
 * Export Products / Menu Catalogue to Excel (.xlsx).
 * Works seamlessly on Web and Capacitor Native Android/iOS.
 */
export async function exportMenuToExcel(
  items: Item[],
  categories: Category[],
  restaurantName: string = 'Restaurant'
): Promise<MenuExportResult> {
  try {
    if (!items || items.length === 0) {
      return {
        success: false,
        fileName: '',
        totalItems: 0,
        error: 'No products available to export.',
      };
    }

    const categoryMap = new Map<string, string>();
    categories.forEach((cat) => categoryMap.set(cat.id, cat.name));

    const cleanRestro = (restaurantName || 'Restaurant').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${cleanRestro}_Product_Catalogue_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // 1. Sheet: Products Catalog
    const productsData = items.map((item, idx) => {
      const catName = categoryMap.get(item.categoryId) || 'General';
      const variantStr = (item.variants && item.variants.length > 0)
        ? item.variants.map((v) => `${v.label}: ₹${(v.price / 100).toFixed(2)}`).join(' | ')
        : '-';

      return {
        'S.No': idx + 1,
        'Item Name': item.name,
        'Short Name (Print)': item.shortName || item.name,
        'Name (Hindi)': item.nameHindi || '',
        'Category': catName,
        'Food Type': item.isVeg ? 'Vegetarian' : 'Non-Vegetarian',
        'Selling Price (₹)': (item.basePrice / 100).toFixed(2),
        'GST Tax Rate (%)': `${item.taxPercent || 0}%`,
        'Stock Status': item.isOutOfStock ? 'OUT OF STOCK' : (item.isDeleted ? 'DELETED' : 'IN STOCK'),
        'Stock Quantity': item.stockQty !== undefined ? item.stockQty : 'Unlimited',
        'Variants': variantStr,
        'Status': item.isActive ? 'Active' : 'Disabled',
      };
    });

    // 2. Sheet: Category Summary
    const catCountMap = new Map<string, { total: number; inStock: number; outOfStock: number }>();
    items.forEach((item) => {
      const catName = categoryMap.get(item.categoryId) || 'General';
      const curr = catCountMap.get(catName) || { total: 0, inStock: 0, outOfStock: 0 };
      curr.total += 1;
      if (item.isOutOfStock) curr.outOfStock += 1;
      else curr.inStock += 1;
      catCountMap.set(catName, curr);
    });

    const categorySummaryData = Array.from(catCountMap.entries()).map(([catName, stats]) => ({
      'Category Name': catName,
      'Total Products': stats.total,
      'In Stock Products': stats.inStock,
      'Out of Stock Products': stats.outOfStock,
    }));

    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsData), 'Products Catalogue');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categorySummaryData), 'Category Summary');

    // Generate binary
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Save & Share across Web / Mobile Capacitor
    await saveAndShareFile({
      blob,
      filename: fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      title: `${restaurantName} Product Catalogue`,
      dialogTitle: `Save or Share ${fileName}`,
    });

    return {
      success: true,
      fileName,
      totalItems: items.length,
      blob,
    };
  } catch (err: any) {
    console.error('Menu Excel export error:', err);
    return {
      success: false,
      fileName: '',
      totalItems: 0,
      error: err.message || 'Menu export error',
    };
  }
}
