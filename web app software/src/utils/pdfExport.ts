import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Bill, Item, Category, RestaurantProfile } from '../types';
import { saveAndShareFile } from './fileExport';
import { renderRevenueTrendChart, renderPaymentModeDonutChart } from './chartRenderer';

export interface PdfExportResult {
  success: boolean;
  fileName: string;
  blob?: Blob;
  error?: string;
}

/**
 * Generates and exports a comprehensive Sales & Invoice Audit Report PDF.
 */
export async function exportBillsToPdf(
  bills: Bill[],
  profile: RestaurantProfile,
  periodLabel: string = 'Report'
): Promise<PdfExportResult> {
  try {
    if (!bills || bills.length === 0) {
      return {
        success: false,
        fileName: '',
        error: 'No invoices available in selected period to export.',
      };
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const cleanRestro = (profile.name || 'Restaurant').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${cleanRestro}_${periodLabel}_Sales_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Metrics Calculation
    let totalSalesPaise = 0;
    let totalTaxPaise = 0;
    let totalCgstPaise = 0;
    let totalSgstPaise = 0;
    let cashPaise = 0;
    let upiPaise = 0;
    let cardPaise = 0;
    let otherPaise = 0;
    let activeCount = 0;
    let cancelledCount = 0;

    bills.forEach((b) => {
      if (b.status === 'CANCELLED') {
        cancelledCount++;
        return;
      }
      activeCount++;
      totalSalesPaise += b.grandTotal;
      totalTaxPaise += (b.cgst + b.sgst);
      totalCgstPaise += b.cgst;
      totalSgstPaise += b.sgst;

      if (b.paymentMode === 'cash') cashPaise += b.grandTotal;
      else if (b.paymentMode === 'upi') upiPaise += b.grandTotal;
      else if (b.paymentMode === 'card') cardPaise += b.grandTotal;
      else if (b.paymentMode === 'split') {
        cashPaise += (b.splitPayments?.[0]?.amount || 0);
        upiPaise += (b.splitPayments?.[1]?.amount || 0);
      } else {
        otherPaise += b.grandTotal;
      }
    });

    // 1. Header Banner
    doc.setFillColor(30, 41, 59); // #1E293B
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text(profile.name || 'RESTAURANT / BUSINESS', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const addressLine = [profile.address, profile.phone ? `Phone: ${profile.phone}` : '']
      .filter(Boolean)
      .join(' | ');
    if (addressLine) {
      doc.text(addressLine.slice(0, 85), 14, 21);
    }

    const taxLine = [
      profile.gstin ? `GSTIN: ${profile.gstin}` : '',
      profile.fssai ? `FSSAI: ${profile.fssai}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
    if (taxLine) {
      doc.text(taxLine, 14, 27);
    }

    // Right Side: Report Title & Period
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SALES AUDIT REPORT', 196, 14, { align: 'right' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${periodLabel}`, 196, 21, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`, 196, 27, { align: 'right' });

    // 2. Summary KPI Cards (Y: 42)
    let curY = 42;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, curY, 182, 22, 2, 2, 'FD');

    // Total Revenue
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL REVENUE', 20, curY + 7);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${(totalSalesPaise / 100).toFixed(2)}`, 20, curY + 16);

    // Invoices Count
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL BILLS', 68, curY + 7);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`${activeCount} Active (${cancelledCount} Void)`, 68, curY + 16);

    // Tax Collected
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('GST COLLECTED', 118, curY + 7);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${(totalTaxPaise / 100).toFixed(2)}`, 118, curY + 16);

    // Payment Modes Split
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('PAYMENT SUMMARY', 160, curY + 7);
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`Cash: Rs. ${(cashPaise / 100).toFixed(0)}`, 160, curY + 12);
    doc.text(`UPI: Rs. ${(upiPaise / 100).toFixed(0)}`, 160, curY + 16);
    doc.text(`Card: Rs. ${(cardPaise / 100).toFixed(0)}`, 160, curY + 20);

    curY += 28;

    // 2.5 Visual Performance Charts (Real Canvas Rendered Graphs)
    try {
      const dateMap = new Map<string, { dateStr: string; amountPaise: number; count: number }>();
      bills.forEach((b) => {
        if (b.status === 'CANCELLED') return;
        const d = new Date(b.createdAt);
        const k = `${d.getMonth() + 1}/${d.getDate()}`;
        const e = dateMap.get(k) || { dateStr: k, amountPaise: 0, count: 0 };
        e.amountPaise += b.grandTotal;
        e.count += 1;
        dateMap.set(k, e);
      });
      const dayEntries = Array.from(dateMap.values());
      const trendImg = renderRevenueTrendChart(dayEntries, 620, 220);
      if (trendImg) {
        doc.addImage(trendImg, 'PNG', 14, curY, 110, 42);
      }

      const payEntries = [
        { mode: 'UPI', amountPaise: upiPaise, count: bills.filter((b) => b.paymentMode === 'upi').length, color: '#2563EB' },
        { mode: 'Cash', amountPaise: cashPaise, count: bills.filter((b) => b.paymentMode === 'cash').length, color: '#10B981' },
        { mode: 'Card', amountPaise: cardPaise, count: bills.filter((b) => b.paymentMode === 'card').length, color: '#8B5CF6' },
      ];
      const donutImg = renderPaymentModeDonutChart(payEntries, 420, 220);
      if (donutImg) {
        doc.addImage(donutImg, 'PNG', 128, curY, 68, 42);
      }
      curY += 46;
    } catch {
      // Continue cleanly if canvas is unavailable
    }

    // 3. Invoices Table
    const tableBody = bills.map((b, index) => {
      const dt = new Date(b.createdAt);
      const isCancelled = b.status === 'CANCELLED';
      const dateFormatted = `${dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })} ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      
      return [
        (index + 1).toString(),
        b.billNo,
        dateFormatted,
        (b.customerName ? `${b.customerName}` : (b.tableNo ? `T: ${b.tableNo}` : (b.orderType || '-'))).slice(0, 18),
        b.items?.length?.toString() || '0',
        (b.paymentMode || '-').toUpperCase(),
        (b.subtotal / 100).toFixed(2),
        ((b.cgst + b.sgst) / 100).toFixed(2),
        isCancelled ? 'VOID' : (b.grandTotal / 100).toFixed(2),
        b.status,
      ];
    });

    autoTable(doc, {
      startY: curY,
      head: [['#', 'Bill No', 'Date & Time', 'Customer / Ref', 'Qty', 'Mode', 'Subtotal', 'GST', 'Total (Rs.)', 'Status']],
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [15, 23, 42],
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 26, fontStyle: 'bold' },
        2: { cellWidth: 24 },
        3: { cellWidth: 28 },
        4: { cellWidth: 10, halign: 'center' },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 18, halign: 'right' },
        7: { cellWidth: 16, halign: 'right' },
        8: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
        9: { cellWidth: 16, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const rowStatus = data.row.raw ? (data.row.raw as any)[9] : '';
          if (rowStatus === 'CANCELLED') {
            data.cell.styles.textColor = [220, 38, 38]; // Red for void
            data.cell.styles.fontStyle = 'italic';
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    // 4. GST Breakdown Table at end of document
    const finalY = (doc as any).lastAutoTable?.finalY || 180;
    if (finalY + 35 < 280) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('GST TAX BREAKDOWN', 14, finalY + 10);

      autoTable(doc, {
        startY: finalY + 13,
        head: [['Tax Description', 'CGST Amount (Rs.)', 'SGST Amount (Rs.)', 'Total Tax (Rs.)']],
        body: [[
          'GST on Restaurant / Food Services',
          (totalCgstPaise / 100).toFixed(2),
          (totalSgstPaise / 100).toFixed(2),
          (totalTaxPaise / 100).toFixed(2),
        ]],
        theme: 'plain',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [51, 65, 85],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
        },
        margin: { left: 14, right: 14 },
      });
    }

    // Page Numbers & Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Billing Pro — Sequential Audit Report • Page ${i} of ${totalPages}`,
        105,
        290,
        { align: 'center' }
      );
    }

    const pdfBlob = doc.output('blob');

    await saveAndShareFile({
      blob: pdfBlob,
      filename: fileName,
      mimeType: 'application/pdf',
      title: `${profile.name} Sales Report`,
      dialogTitle: `Save or Share ${fileName}`,
    });

    return {
      success: true,
      fileName,
      blob: pdfBlob,
    };
  } catch (err: any) {
    console.error('PDF export error:', err);
    return {
      success: false,
      fileName: '',
      error: err?.message || 'PDF export failed',
    };
  }
}

/**
 * Generates and exports a beautifully formatted Restaurant Menu / Products Catalogue PDF.
 */
export async function exportMenuToPdf(
  items: Item[],
  categories: Category[],
  profile: RestaurantProfile
): Promise<PdfExportResult> {
  try {
    if (!items || items.length === 0) {
      return {
        success: false,
        fileName: '',
        error: 'No products available in catalogue to export.',
      };
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const cleanRestro = (profile.name || 'Restaurant').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${cleanRestro}_Product_Catalogue_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Map Category IDs to Names
    const categoryMap = new Map<string, string>();
    categories.forEach((cat) => categoryMap.set(cat.id, cat.name));

    // 1. Header Banner
    doc.setFillColor(30, 41, 59); // #1E293B
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text(profile.name || 'RESTAURANT MENU', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const contactLine = [profile.address, profile.phone ? `Phone: ${profile.phone}` : '']
      .filter(Boolean)
      .join(' | ');
    if (contactLine) {
      doc.text(contactLine.slice(0, 85), 14, 21);
    }

    const licenseLine = [
      profile.gstin ? `GSTIN: ${profile.gstin}` : '',
      profile.fssai ? `FSSAI: ${profile.fssai}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
    if (licenseLine) {
      doc.text(licenseLine, 14, 27);
    }

    // Right Side: Title
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCT CATALOGUE', 196, 14, { align: 'right' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Items: ${items.length}`, 196, 21, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 196, 27, { align: 'right' });

    // Table Data
    const tableBody = items.map((item, idx) => {
      const catName = categoryMap.get(item.categoryId) || 'General';
      const foodType = item.isVeg ? 'VEG' : 'NON-VEG';
      const variantStr = (item.variants && item.variants.length > 0)
        ? item.variants.map((v) => `${v.label}: Rs. ${(v.price / 100).toFixed(0)}`).join(', ')
        : '-';

      const statusStr = item.isOutOfStock ? 'OUT OF STOCK' : (item.isDeleted ? 'DELETED' : (item.isActive ? 'ACTIVE' : 'INACTIVE'));

      return [
        (idx + 1).toString(),
        item.name,
        catName,
        foodType,
        `Rs. ${(item.basePrice / 100).toFixed(2)}`,
        `${item.taxPercent || 0}%`,
        statusStr,
        variantStr,
      ];
    });

    autoTable(doc, {
      startY: 42,
      head: [['#', 'Item Name', 'Category', 'Type', 'Price (Rs.)', 'GST', 'Stock Status', 'Variants']],
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [15, 23, 42],
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 26 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 12, halign: 'center' },
        6: { cellWidth: 24, halign: 'center' },
        7: { cellWidth: 30 },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          // Food type green / red
          if (data.column.index === 3) {
            const val = data.cell.raw;
            if (val === 'VEG') data.cell.styles.textColor = [22, 101, 52];
            else data.cell.styles.textColor = [185, 28, 28];
          }
          // Stock status
          if (data.column.index === 6) {
            const status = data.cell.raw;
            if (status === 'OUT OF STOCK' || status === 'DELETED') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'ACTIVE') {
              data.cell.styles.textColor = [22, 101, 52];
            }
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    // Page Numbers & Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Billing Pro — Product Catalogue • Page ${i} of ${totalPages}`,
        105,
        290,
        { align: 'center' }
      );
    }

    const pdfBlob = doc.output('blob');

    await saveAndShareFile({
      blob: pdfBlob,
      filename: fileName,
      mimeType: 'application/pdf',
      title: `${profile.name} Product Catalogue`,
      dialogTitle: `Save or Share ${fileName}`,
    });

    return {
      success: true,
      fileName,
      blob: pdfBlob,
    };
  } catch (err: any) {
    console.error('Menu PDF export error:', err);
    return {
      success: false,
      fileName: '',
      error: err?.message || 'Menu PDF export failed',
    };
  }
}

/**
 * Generates and exports a single Bill / Tax Invoice as a clean PDF.
 */
export async function exportSingleBillToPdf(
  bill: Bill,
  profile: RestaurantProfile
): Promise<PdfExportResult> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200], // 80mm thermal slip format height adapts
    });

    const fileName = `Invoice_${bill.billNo}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(profile.name || 'RESTAURANT INVOICE', 40, 10, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    let curY = 15;
    if (profile.address) {
      doc.text(profile.address.slice(0, 45), 40, curY, { align: 'center' });
      curY += 4;
    }
    if (profile.phone) {
      doc.text(`Tel: ${profile.phone}`, 40, curY, { align: 'center' });
      curY += 4;
    }
    if (profile.gstin) {
      doc.text(`GSTIN: ${profile.gstin}`, 40, curY, { align: 'center' });
      curY += 4;
    }

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(4, curY, 76, curY);
    curY += 4;

    // Bill Info
    const dt = new Date(bill.createdAt);
    doc.setFontSize(7.5);
    doc.text(`Bill No: ${bill.billNo}`, 5, curY);
    doc.text(`Date: ${dt.toLocaleDateString('en-IN')}`, 75, curY, { align: 'right' });
    curY += 4;
    doc.text(`Order: #${(bill.orderNo || 1).toString().padStart(5, '0')} (${(bill.orderType || '').toUpperCase()})`, 5, curY);
    doc.text(`Time: ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, 75, curY, { align: 'right' });
    curY += 4;

    if (bill.customerName || bill.customerPhone || bill.tableNo) {
      const custInfo = [
        bill.tableNo ? `Table: ${bill.tableNo}` : '',
        bill.customerName ? `Cust: ${bill.customerName}` : '',
        bill.customerPhone ? `Ph: ${bill.customerPhone}` : '',
      ].filter(Boolean).join(' | ');
      doc.text(custInfo.slice(0, 45), 5, curY);
      curY += 4;
    }

    // Items Table
    const itemRows = (bill.items || []).map((it) => [
      it.nameSnapshot + (it.variantSnapshot ? ` (${it.variantSnapshot})` : ''),
      it.qty.toString(),
      (it.unitPrice / 100).toFixed(2),
      (it.lineTotal / 100).toFixed(2),
    ]);

    autoTable(doc, {
      startY: curY,
      head: [['Item', 'Qty', 'Rate', 'Amount']],
      body: itemRows,
      theme: 'plain',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontSize: 7,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 8, halign: 'center' },
        2: { cellWidth: 14, halign: 'right' },
        3: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 4, right: 4 },
    });

    curY = (doc as any).lastAutoTable?.finalY + 4 || curY + 20;

    // Financial Totals
    doc.setDrawColor(200, 200, 200);
    doc.line(4, curY, 76, curY);
    curY += 4;

    doc.setFontSize(7.5);
    doc.text('Subtotal:', 40, curY, { align: 'right' });
    doc.text(`Rs. ${(bill.subtotal / 100).toFixed(2)}`, 75, curY, { align: 'right' });
    curY += 3.5;

    if (bill.discountAmount > 0) {
      doc.text('Discount:', 40, curY, { align: 'right' });
      doc.text(`-Rs. ${(bill.discountAmount / 100).toFixed(2)}`, 75, curY, { align: 'right' });
      curY += 3.5;
    }

    if (bill.cgst > 0 || bill.sgst > 0) {
      doc.text(`CGST + SGST:`, 40, curY, { align: 'right' });
      doc.text(`Rs. ${((bill.cgst + bill.sgst) / 100).toFixed(2)}`, 75, curY, { align: 'right' });
      curY += 3.5;
    }

    if (bill.serviceCharge > 0 || bill.packagingCharge > 0) {
      doc.text('Charges:', 40, curY, { align: 'right' });
      doc.text(`Rs. ${(((bill.serviceCharge || 0) + (bill.packagingCharge || 0)) / 100).toFixed(2)}`, 75, curY, { align: 'right' });
      curY += 3.5;
    }

    // Grand Total
    doc.setDrawColor(0, 0, 0);
    doc.line(30, curY, 76, curY);
    curY += 4.5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('GRAND TOTAL:', 40, curY, { align: 'right' });
    doc.text(`Rs. ${(bill.grandTotal / 100).toFixed(2)}`, 75, curY, { align: 'right' });
    curY += 4.5;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment: ${(bill.paymentMode || 'PAID').toUpperCase()}`, 75, curY, { align: 'right' });
    curY += 6;

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your visit!', 40, curY, { align: 'center' });

    const pdfBlob = doc.output('blob');

    await saveAndShareFile({
      blob: pdfBlob,
      filename: fileName,
      mimeType: 'application/pdf',
      title: `Bill #${bill.billNo}`,
      dialogTitle: `Save or Share Invoice ${bill.billNo}`,
    });

    return {
      success: true,
      fileName,
      blob: pdfBlob,
    };
  } catch (err: any) {
    console.error('Single bill PDF export error:', err);
    return {
      success: false,
      fileName: '',
      error: err?.message || 'Invoice PDF export failed',
    };
  }
}
