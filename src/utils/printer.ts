import QRCode from 'qrcode';
import { Capacitor } from '@capacitor/core';
import type { Bill, RestaurantProfile, PaperWidth } from '../types';
import { DEFAULT_RESTAURANT_LOGO } from './constants';

export interface EscPosResult {
  bytes: Uint8Array;
  textPreview: string;
}

/**
 * Smart abbreviation helper for item variants on compact 57mm/58mm/80mm thermal receipts.
 * e.g. "Kulhad" -> "K", "Regular" -> "R", "Half" -> "H", "Full" -> "F", "Large" -> "L"
 */
export function getShortVariantCode(variant: string): string {
  if (!variant) return '';
  const trimmed = variant.trim();
  const lower = trimmed.toLowerCase();

  const map: Record<string, string> = {
    kulhad: 'K',
    kulad: 'K',
    kullad: 'K',
    'kulhad chai': 'K',
    'kulhad tea': 'K',
    regular: 'R',
    reg: 'R',
    small: 'S',
    sml: 'S',
    medium: 'M',
    med: 'M',
    large: 'L',
    lrg: 'L',
    full: 'F',
    half: 'H',
    hf: 'H',
    quarter: 'Q',
    qtr: 'Q',
    single: 'Sgl',
    double: 'Dbl',
    piece: 'Pc',
    pieces: 'Pcs',
    pc: 'Pc',
    pcs: 'Pcs',
    plate: 'Plt',
    cup: 'Cup',
    glass: 'Gls',
    bottle: 'Btl',
    btl: 'Btl',
    combo: 'Cmb',
    special: 'Spl',
    spcl: 'Spl',
    extra: 'Ex',
  };

  if (map[lower]) return map[lower];
  if (trimmed.length <= 3) return trimmed;

  const words = trimmed.split(/\s+/);
  if (words.length > 1) return words.map((w) => w[0].toUpperCase()).join('');

  return trimmed.slice(0, 3);
}

// ─── Money / String helpers (Strict 7-bit ASCII) ─────────────────────────────

export function formatAsciiMoney(paise: number): string {
  const absPaise = Math.abs(paise || 0);
  const rupees = Math.floor(absPaise / 100);
  const rem = absPaise % 100;
  const sign = paise < 0 ? '-' : '';
  return `${sign}${rupees}.${rem.toString().padStart(2, '0')}`;
}

export function padLine(left: string, right: string, width: number): string {
  const gap = width - (left.length + right.length);
  if (gap <= 0) {
    const maxL = Math.max(0, width - right.length - 1);
    return `${left.slice(0, maxL)} ${right}`;
  }
  return `${left}${' '.repeat(gap)}${right}`;
}

export function centerText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const lp = Math.floor((width - text.length) / 2);
  return `${' '.repeat(lp)}${text}`;
}

export function wrapWords(text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const result: string[] = [];
  let cur = '';

  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if (cur.length + 1 + w.length <= maxWidth) {
      cur += ' ' + w;
    } else {
      result.push(cur);
      cur = w;
    }
  }
  if (cur) result.push(cur);
  return result;
}

// ─── UPI Payment URI ────────────────────────────────────────────────────────

export function generateUpiString(
  vpa: string,
  payeeName: string,
  amountInPaise: number,
  billNo: string
): string {
  const r = (amountInPaise / 100).toFixed(2);
  return `upi://pay?pa=${encodeURIComponent(vpa.trim())}&pn=${encodeURIComponent(payeeName.trim())}&am=${r}&cu=INR&tn=${encodeURIComponent(`Bill ${billNo}`)}`;
}

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 180,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch {
    return '';
  }
}

// ─── ESC/POS Constants ──────────────────────────────────────────────────────

const ESC = 0x1b;
const GS = 0x1d;

export interface PrintOptions {
  includeTokenSlip?: boolean;
  includeQrCode?: boolean;
  logoRasterBytes?: Uint8Array | null;
  qrRasterBytes?: Uint8Array | null;
}

/**
 * Generates razor-sharp ESC/POS raster bitmap bytes (GS v 0) directly from QR matrix.
 * Synchronous, 100% deterministic, zero DOM/Image dependency, scaled to exact printer dots.
 * Centered automatically on 58mm (384 dots) or 80mm (576 dots) thermal paper.
 */
export function generateQrRasterBytes(
  upiUrl: string,
  paperWidth: PaperWidth = 58
): Uint8Array | null {
  try {
    const qr = QRCode.create(upiUrl, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size; // e.g. 29
    const margin = 2; // 2 modules quiet zone
    const totalModules = moduleCount + margin * 2; // e.g. 33

    // For 58mm (384 dots line): scale = 5 -> 33 * 5 = 165 dots wide
    // For 80mm (576 dots line): scale = 6 -> 33 * 6 = 198 dots wide
    const scale = paperWidth === 80 ? 6 : 5;
    const qrDots = totalModules * scale;
    const totalLineDots = paperWidth === 80 ? 576 : 384;
    const widthBytes = Math.ceil(totalLineDots / 8); // 48 bytes for 58mm, 72 bytes for 80mm
    const startX = Math.max(0, Math.floor((totalLineDots - qrDots) / 2));

    const raster = new Uint8Array(widthBytes * qrDots);

    for (let r = 0; r < totalModules; r++) {
      for (let c = 0; c < totalModules; c++) {
        const modR = r - margin;
        const modC = c - margin;
        const isDark =
          modR >= 0 && modR < moduleCount && modC >= 0 && modC < moduleCount
            ? !!qr.modules.get(modR, modC)
            : false;

        if (isDark) {
          for (let dy = 0; dy < scale; dy++) {
            const y = r * scale + dy;
            for (let dx = 0; dx < scale; dx++) {
              const x = startX + c * scale + dx;
              const byteIdx = y * widthBytes + (x >> 3);
              raster[byteIdx] |= 0x80 >> (x & 7);
            }
          }
        }
      }
    }

    const xL = widthBytes & 0xff;
    const xH = (widthBytes >> 8) & 0xff;
    const yL = qrDots & 0xff;
    const yH = (qrDots >> 8) & 0xff;

    const command = new Uint8Array(8 + raster.length);
    command[0] = 0x1d; // GS
    command[1] = 0x76; // v
    command[2] = 0x30; // 0
    command[3] = 0x00; // m
    command[4] = xL;
    command[5] = xH;
    command[6] = yL;
    command[7] = yH;
    command.set(raster, 8);

    return command;
  } catch (err) {
    console.error('Failed to generate ESC/POS QR raster bytes:', err);
    return null;
  }
}

/**
 * Converts custom uploaded restaurant logo into ESC/POS raster bitmap bytes (GS v 0).
 * Handles dark backgrounds with intelligent background inversion so it NEVER prints as a solid black blob!
 */
export async function convertImageToEscPosRaster(
  imageUrl: string,
  paperWidth: PaperWidth = 58,
  maxHeight: number = 60,
  isQrCode: boolean = false
): Promise<Uint8Array | null> {
  if (!imageUrl || typeof document === 'undefined') return null;

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image failed to load for thermal print'));
      img.src = imageUrl;
    });

    const totalDots = paperWidth === 80 ? 576 : 384;
    const widthBytes = Math.ceil(totalDots / 8);

    const targetLogoWidth = paperWidth === 80 ? 240 : 160;
    const aspect = img.naturalHeight / (img.naturalWidth || 1);
    let targetLogoHeight = Math.round(targetLogoWidth * aspect);

    if (targetLogoHeight > maxHeight) {
      targetLogoHeight = maxHeight;
    }

    if (targetLogoHeight <= 4) return null;

    const canvas = document.createElement('canvas');
    canvas.width = totalDots;
    canvas.height = targetLogoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, totalDots, targetLogoHeight);

    const offsetX = Math.floor((totalDots - targetLogoWidth) / 2);
    ctx.drawImage(img, offsetX, 0, targetLogoWidth, targetLogoHeight);

    const imgData = ctx.getImageData(0, 0, totalDots, targetLogoHeight);
    const pixels = imgData.data;

    // Check corners: if image corners are dark, invert so the background stays white paper (skip for QR codes)!
    const cornerIndices = [0, (totalDots - 1) * 4, ((targetLogoHeight - 1) * totalDots) * 4];
    let darkCorners = 0;
    for (const c of cornerIndices) {
      const a = pixels[c + 3];
      const lum = a < 128 ? 255 : (pixels[c] * 0.299 + pixels[c + 1] * 0.587 + pixels[c + 2] * 0.114);
      if (lum < 128) darkCorners++;
    }
    const invertBg = !isQrCode && darkCorners >= 2;

    const rasterData = new Uint8Array(widthBytes * targetLogoHeight);

    for (let y = 0; y < targetLogoHeight; y++) {
      for (let x = 0; x < totalDots; x++) {
        const idx = (y * totalDots + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const a = pixels[idx + 3];

        let lum = a < 128 ? 255 : (r * 0.299 + g * 0.587 + b * 0.114);
        if (invertBg) {
          lum = 255 - lum; // Invert dark background to prevent black blob
        }

        // Print black dot if dark
        if (lum < 150) {
          const byteIndex = y * widthBytes + (x >> 3);
          rasterData[byteIndex] |= (0x80 >> (x & 7));
        }
      }
    }

    const xL = widthBytes & 0xFF;
    const xH = (widthBytes >> 8) & 0xFF;
    const yL = targetLogoHeight & 0xFF;
    const yH = (targetLogoHeight >> 8) & 0xFF;

    const command = new Uint8Array(8 + rasterData.length);
    command[0] = 0x1d; // GS
    command[1] = 0x76; // v
    command[2] = 0x30; // 0
    command[3] = 0x00; // m
    command[4] = xL;
    command[5] = xH;
    command[6] = yL;
    command[7] = yH;
    command.set(rasterData, 8);

    return command;
  } catch (err) {
    console.warn('Thermal logo raster skipped:', err);
    return null;
  }
}

/**
 * Builds standard 57mm/58mm/80mm ESC/POS thermal receipt.
 * Strictly formatted to match the user's preferred layout (Image 1):
 * - Clean centered cafe header
 * - Centered "ORDER : #00001" box (daily resetting order number)
 * - Bill number and time
 * - ITEM | QTY RATE TOTAL with "1x30 = 30.00"
 * - Subtotal, CGST, SGST
 * - "TOTAL:   80.00" (Bold Double-Height, 100% distortion-free)
 * - Payment Mode & Status
 * - Thank you footer
 * - No black ink blobs
 */
export function buildEscPosBill(
  bill: Bill,
  profile: RestaurantProfile,
  isDuplicate: boolean = false,
  options?: PrintOptions
): EscPosResult {
  // Standard 58mm thermal printers (Font A 12x24 dots @ 384 dots) physically print 32 columns.
  // 80mm printers physically print 48 columns.
  const width = profile.paperWidth === 80 ? 48 : 32;
  const buf: number[] = [];
  const lines: string[] = [];

  const addText = (text: string) => {
    const s = text
      .replace(/₹/g, 'Rs.')
      .replace(/✂/g, '-')
      .replace(/[^\x20-\x7E]/g, '');
    lines.push(s);
    for (let i = 0; i < s.length; i++) {
      buf.push(s.charCodeAt(i) & 0x7f);
    }
  };

  const addLine = (text = '') => {
    addText(text);
    buf.push(0x0a); // LF
  };

  const sep = (char = '-') => {
    buf.push(ESC, 0x61, 0x00); // Always reset to left align before separator
    addLine(char.repeat(width));
  };

  // 1. Initialize printer (ESC @), Zero Left Margin (GS L 0 0), Zero Char Space (ESC SP 0)
  buf.push(ESC, 0x40);
  buf.push(GS, 0x4c, 0x00, 0x00);
  buf.push(ESC, 0x20, 0x00);

  const orderNum = (bill.orderNo || bill.tokenNo || 1).toString().padStart(5, '0');
  const billTime = new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const billDate = new Date(bill.createdAt).toLocaleDateString('en-IN');
  const orderType = (bill.orderType || 'DINE_IN').toUpperCase();

  // ── Duplicate Notice ──
  if (isDuplicate || (bill.printCount && bill.printCount > 1)) {
    buf.push(ESC, 0x61, 0x01, ESC, 0x45, 0x01);
    addLine('** DUPLICATE COPY **');
    buf.push(ESC, 0x45, 0x00, ESC, 0x61, 0x00);
  }

  // ── Optional Raster Logo (Only if custom uploaded and explicitly enabled) ──
  if (options?.logoRasterBytes && options.logoRasterBytes.length > 0) {
    for (let i = 0; i < options.logoRasterBytes.length; i++) {
      buf.push(options.logoRasterBytes[i]);
    }
    buf.push(0x0a);
  }

  // ── Header (Centered, clean) ──
  buf.push(ESC, 0x61, 0x01); // Center
  buf.push(ESC, 0x45, 0x01); // Bold ON
  buf.push(GS, 0x21, 0x01); // Double height only
  addLine((profile.name || 'RESTAURANT').trim().toUpperCase());
  buf.push(GS, 0x21, 0x00); // Normal size
  buf.push(ESC, 0x45, 0x00); // Bold OFF

  if (profile.tagline) {
    addLine(profile.tagline.trim());
  }

  if (profile.address) {
    profile.address.split('\n').forEach((a) => {
      const trimmed = a.trim();
      if (trimmed) {
        wrapWords(trimmed, width).forEach((wl) => addLine(wl));
      }
    });
  }

  if (profile.phone) {
    addLine(`Ph: ${profile.phone.trim()}`);
  }

  if (profile.gstin) {
    addLine(`GSTIN: ${profile.gstin.trim()}`);
  }

  if (profile.fssai) {
    addLine(`FSSAI: ${profile.fssai.trim()}`);
  }

  // ── Order Number Box (Centered, clean, bold & spaced for max visibility) ──
  const spacedOrderNum = orderNum.split('').join(' ');
  sep();
  buf.push(ESC, 0x61, 0x01); // Center
  buf.push(ESC, 0x45, 0x01); // Bold ON
  buf.push(GS, 0x21, 0x01);  // Double HEIGHT
  addLine(`ORDER : # ${spacedOrderNum}`);
  buf.push(GS, 0x21, 0x00);  // Normal size
  buf.push(ESC, 0x45, 0x00); // Bold OFF
  buf.push(ESC, 0x61, 0x00); // Reset Left
  sep();

  // ── Bill Meta (Left align, 30 chars, never wraps) ──
  buf.push(ESC, 0x61, 0x00); // Left align
  addLine(padLine(`Bill: ${bill.billNo}`, billTime, width));
  addLine(padLine(`Date: ${billDate}`, orderType, width));
  if (bill.tableNo) {
    addLine(padLine(`Table: ${bill.tableNo}`, bill.customerName ? `Cust: ${bill.customerName.slice(0, 10)}` : '', width));
  } else if (bill.customerName) {
    addLine(`Cust: ${bill.customerName.slice(0, width - 6)}`);
  }
  sep();

  // ── Items Table Header ──
  buf.push(ESC, 0x45, 0x01); // Bold ON
  addLine(padLine('ITEM', 'QTY RATE TOTAL', width));
  buf.push(ESC, 0x45, 0x00); // Bold OFF
  sep();

  // ── Items List ("Samosa Chaat     1x40 = 40.00" on 1 single line) ──
  bill.items.forEach((item) => {
    const baseName = (item.shortNameSnapshot || item.nameSnapshot || '').trim();
    const sv = item.variantSnapshot ? getShortVariantCode(item.variantSnapshot) : '';
    const itemTitle = sv ? `${baseName} (${sv})` : baseName;

    const rateRupees = (item.unitPrice / 100).toFixed(item.unitPrice % 100 === 0 ? 0 : 2);
    const lineTotalStr = formatAsciiMoney(item.lineTotal);

    // Right column: e.g. "1x40 = 40.00" (13 chars)
    const rightCol = `${item.qty}x${rateRupees} = ${lineTotalStr}`;

    if (itemTitle.length + rightCol.length < width) {
      addLine(padLine(itemTitle, rightCol, width));
    } else {
      addLine(itemTitle);
      addLine(padLine('', rightCol, width));
    }

    if (item.note) {
      addLine(`  *${item.note.trim()}`);
    }
  });

  sep();

  // ── Totals & Tax Breakdown (Fits on 1 line each) ──
  addLine(padLine('Subtotal:', formatAsciiMoney(bill.subtotal), width));

  if (bill.discountAmount > 0) {
    const dl = bill.discountType === 'percent' ? `Discount (${bill.discountValue}%):` : 'Discount:';
    addLine(padLine(dl, `-${formatAsciiMoney(bill.discountAmount)}`, width));
  }

  if (bill.packagingCharge && bill.packagingCharge > 0) {
    addLine(padLine('Packaging Charge:', formatAsciiMoney(bill.packagingCharge), width));
  }

  if (bill.serviceCharge && bill.serviceCharge > 0) {
    addLine(padLine('Service Charge:', formatAsciiMoney(bill.serviceCharge), width));
  }

  if (bill.cgst > 0 || bill.sgst > 0) {
    const halfRate = (profile.defaultGstPercent ? profile.defaultGstPercent / 2 : 2.5).toFixed(1);
    addLine(padLine(`CGST (${halfRate}%):`, formatAsciiMoney(bill.cgst), width));
    addLine(padLine(`SGST (${halfRate}%):`, formatAsciiMoney(bill.sgst), width));
  }

  if (bill.roundOff && bill.roundOff !== 0) {
    const rStr = (bill.roundOff > 0 ? '+' : '') + formatAsciiMoney(bill.roundOff);
    addLine(padLine('Round Off:', rStr, width));
  }

  // ── Grand Total (Double Height only, 30 chars, fits on 1 line) ──
  sep('=');
  buf.push(ESC, 0x45, 0x01); // Bold ON
  buf.push(GS, 0x21, 0x01); // Double HEIGHT only
  addLine(padLine('TOTAL:', formatAsciiMoney(bill.grandTotal), width));
  buf.push(GS, 0x21, 0x00); // Normal height
  buf.push(ESC, 0x45, 0x00); // Bold OFF
  sep('=');

  // ── Payment Mode & Status (Fits on 1 line each) ──
  addLine(padLine('Payment Mode:', (bill.paymentMode || 'CASH').toUpperCase(), width));
  addLine(padLine('Status:', (bill.paymentStatus || 'PAID').toUpperCase(), width));
  sep();

  // ── Optional Dynamic UPI QR Code (Crisp Raster Bitmap - Paper Saver, No extra text) ──
  if (options?.includeQrCode) {
    buf.push(ESC, 0x61, 0x01); // Center
    buf.push(ESC, 0x45, 0x01); // Bold ON
    addLine('SCAN & PAY');
    buf.push(ESC, 0x45, 0x00); // Bold OFF

    const vpa = profile.upiVpa?.trim() || 'bookmydine@upi';
    const payee = profile.upiPayeeName?.trim() || profile.name?.trim() || 'Store';
    const upiUrl = generateUpiString(vpa, payee, bill.grandTotal, bill.billNo);
    const qrBytes = options?.qrRasterBytes || generateQrRasterBytes(upiUrl, profile.paperWidth);

    if (qrBytes && qrBytes.length > 0) {
      for (let i = 0; i < qrBytes.length; i++) {
        buf.push(qrBytes[i]);
      }
      buf.push(0x0a);
    }

    buf.push(ESC, 0x61, 0x00); // Reset Left
    sep();
  }

  // ── Footer (Centered, Clean short lines, zero wrapping) ──
  buf.push(ESC, 0x61, 0x01); // Center
  buf.push(ESC, 0x45, 0x01); // Bold ON
  const customFooter = profile.footerText?.trim();
  if (customFooter && customFooter.toLowerCase() !== 'thanks for visiting') {
    customFooter.split('\n').forEach((l) => {
      wrapWords(l.trim(), width).forEach((wl) => addLine(wl));
    });
  } else {
    addLine('THANK YOU!');
    addLine('VISIT AGAIN');
  }
  buf.push(ESC, 0x45, 0x00); // Bold OFF
  addLine('Powered by bookmydineqr');
  buf.push(ESC, 0x61, 0x00); // Reset Left

  // ── Feed to Clear Tear Bar & Cut ──
  buf.push(0x0a, 0x0a, 0x0a, 0x0a);
  buf.push(GS, 0x56, 0x42, 0x00); // Cut

  return {
    bytes: new Uint8Array(buf),
    textPreview: lines.join('\n'),
  };
}

/**
 * Async bill builder:
 * Converts and prints custom logo and dynamic UPI QR code into ESC/POS raster bitmaps.
 * Never prints default app placeholder to avoid black blobs!
 */
export async function generateEscPosBill(
  bill: Bill,
  profile: RestaurantProfile,
  isDuplicate: boolean = false,
  options?: PrintOptions
): Promise<EscPosResult> {
  let logoRasterBytes: Uint8Array | null = null;

  const isCustomLogo =
    profile.printLogoOnThermal === true &&
    profile.logoUrl &&
    !profile.logoUrl.startsWith('data:image/svg+xml') &&
    profile.logoUrl !== DEFAULT_RESTAURANT_LOGO &&
    !profile.logoUrl.includes('billing-pro-logo');

  if (isCustomLogo && profile.logoUrl) {
    logoRasterBytes = await convertImageToEscPosRaster(profile.logoUrl, profile.paperWidth, 60, false);
  }

  let qrRasterBytes: Uint8Array | null = null;
  if (options?.includeQrCode) {
    const vpa = profile.upiVpa?.trim() || 'bookmydine@upi';
    const payee = profile.upiPayeeName?.trim() || profile.name?.trim() || 'Store';
    const upiUrl = generateUpiString(vpa, payee, bill.grandTotal, bill.billNo);
    qrRasterBytes = generateQrRasterBytes(upiUrl, profile.paperWidth);
  }

  return buildEscPosBill(bill, profile, isDuplicate, {
    ...options,
    logoRasterBytes,
    qrRasterBytes,
  });
}

/**
 * Builds compact, paper-saving Kitchen Order Ticket (KOT).
 * Prints full item names and bold quantities with zero financial clutter.
 */
export function buildEscPosKot(
  orderNo: number | string,
  orderType: string,
  tableNo?: string,
  items: Array<{
    nameSnapshot?: string;
    name?: string;
    shortNameSnapshot?: string;
    variantSnapshot?: string;
    selectedVariant?: { name: string };
    qty?: number;
    quantity?: number;
    note?: string;
    notes?: string;
  }> = [],
  paperWidth: PaperWidth = 58,
  customerName?: string,
  customerPhone?: string
): EscPosResult {
  const width = paperWidth === 80 ? 48 : 32;
  const buf: number[] = [];
  const lines: string[] = [];

  const addText = (text: string) => {
    const s = text.replace(/₹/g, 'Rs.').replace(/[^\x20-\x7E]/g, '');
    lines.push(s);
    for (let i = 0; i < s.length; i++) {
      buf.push(s.charCodeAt(i) & 0x7f);
    }
  };

  const addLine = (text = '') => {
    addText(text);
    buf.push(0x0a);
  };

  const sep = (char = '-') => {
    buf.push(ESC, 0x61, 0x00);
    addLine(char.repeat(width));
  };

  const isParcel = orderType === 'takeaway' || orderType === 'parcel';
  const isDelivery = orderType === 'delivery';

  // 1. Initialize printer (ESC @), Zero Left Margin (GS L 0 0), Zero Char Space (ESC SP 0)
  buf.push(ESC, 0x40);
  buf.push(GS, 0x4c, 0x00, 0x00);
  buf.push(ESC, 0x20, 0x00);

  // 2. KOT Header
  buf.push(ESC, 0x61, 0x01); // Center
  buf.push(ESC, 0x45, 0x01); // Bold ON
  addLine('*** KITCHEN ORDER (KOT) ***');
  buf.push(ESC, 0x45, 0x00); // Bold OFF
  buf.push(ESC, 0x61, 0x00); // Reset Left

  // ── Line above ORDER ──
  sep('-');

  // 3. Order Number (Double Height, Bold, Spaced for visibility)
  const spacedOrder = (orderNo || 1).toString().padStart(5, '0').split('').join(' ');
  buf.push(ESC, 0x61, 0x01); // Center
  buf.push(ESC, 0x45, 0x01); // Bold ON
  buf.push(GS, 0x21, 0x01);  // Double height
  addLine(`ORDER : # ${spacedOrder}`);
  buf.push(GS, 0x21, 0x00);  // Normal size
  buf.push(ESC, 0x45, 0x00); // Bold OFF
  buf.push(ESC, 0x61, 0x00); // Reset Left

  // 4. PARCEL / TAKEAWAY or DELIVERY STANDOUT BANNER
  if (isParcel) {
    sep('#');
    buf.push(ESC, 0x61, 0x01); // Center
    buf.push(ESC, 0x45, 0x01); // Bold ON
    buf.push(GS, 0x21, 0x01);  // Double height
    addLine('*** PARCEL / TAKEAWAY ***');
    buf.push(GS, 0x21, 0x00);  // Normal size
    buf.push(ESC, 0x45, 0x00); // Bold OFF
    buf.push(ESC, 0x61, 0x00); // Reset Left
    sep('#');
  } else if (isDelivery) {
    sep('#');
    buf.push(ESC, 0x61, 0x01); // Center
    buf.push(ESC, 0x45, 0x01); // Bold ON
    buf.push(GS, 0x21, 0x01);  // Double height
    addLine('*** HOME DELIVERY ***');
    buf.push(GS, 0x21, 0x00);  // Normal size
    buf.push(ESC, 0x45, 0x00); // Bold OFF
    buf.push(ESC, 0x61, 0x00); // Reset Left
    sep('#');
  } else {
    sep('-');
  }

  // 5. Order Type / Table / Time / Customer details
  buf.push(ESC, 0x61, 0x01); // Center
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const typeLabel = orderType === 'dine_in'
    ? `DINE IN [Table ${tableNo || 'T1'}]`
    : isParcel
    ? `[ PARCEL / TAKEAWAY ]`
    : isDelivery
    ? `[ HOME DELIVERY ]`
    : orderType.toUpperCase();
  addLine(`${typeLabel} | ${timeStr}`);

  if (customerName && customerName.trim()) {
    const custInfo = `Customer: ${customerName.trim()}${customerPhone && customerPhone.trim() ? ` (${customerPhone.trim()})` : ''}`;
    addLine(custInfo);
  }
  buf.push(ESC, 0x61, 0x00); // Reset Left

  // ── Double line above ITEM ──
  sep('=');
  // Header: ITEM                     QTY
  buf.push(ESC, 0x45, 0x01);
  addLine(padLine('ITEM', 'QTY', width));
  buf.push(ESC, 0x45, 0x00);
  sep('-');

  // 6. Items with Full Name and Quantity
  buf.push(ESC, 0x45, 0x01); // Bold items
  items.forEach((item) => {
    const rawName = (item.nameSnapshot || item.name || item.shortNameSnapshot || 'Item').trim();
    const variantName = item.variantSnapshot
      ? ` (${item.variantSnapshot})`
      : item.selectedVariant?.name
      ? ` (${item.selectedVariant.name})`
      : '';
    const fullName = `${rawName}${variantName}`;
    const qtyNum = item.qty !== undefined ? item.qty : item.quantity !== undefined ? item.quantity : 1;
    const qtyStr = `x${qtyNum}`;

    if (fullName.length + qtyStr.length + 1 <= width) {
      addLine(padLine(fullName, qtyStr, width));
    } else {
      const wrapped = wrapWords(fullName, width);
      wrapped.forEach((line, idx) => {
        if (idx === 0) {
          if (line.length + qtyStr.length + 1 <= width) {
            addLine(padLine(line, qtyStr, width));
          } else {
            addLine(line);
            if (wrapped.length === 1) {
              addLine(padLine('', qtyStr, width));
            }
          }
        } else if (idx === wrapped.length - 1) {
          if (wrapped[0].length + qtyStr.length + 1 > width) {
            addLine(padLine(line, qtyStr, width));
          } else {
            addLine(line);
          }
        } else {
          addLine(line);
        }
      });
    }

    const noteText = item.note || item.notes;
    if (noteText && noteText.trim()) {
      buf.push(ESC, 0x45, 0x00);
      addLine(` * Note: ${noteText.trim()}`);
      buf.push(ESC, 0x45, 0x01);
    }
  });
  buf.push(ESC, 0x45, 0x00); // Bold OFF

  // ── Double line below ITEM ──
  sep('=');

  // 7. Total items summary
  const totalItemCount = items.reduce((acc, it: any) => {
    const q = it.qty !== undefined ? it.qty : it.quantity !== undefined ? it.quantity : 1;
    return acc + q;
  }, 0);
  buf.push(ESC, 0x61, 0x01); // Center
  buf.push(ESC, 0x45, 0x01); // Bold ON
  addLine(`TOTAL ITEMS: ${totalItemCount}`);
  buf.push(ESC, 0x45, 0x00); // Bold OFF
  buf.push(ESC, 0x61, 0x00); // Reset Left

  // 8. Paper-saving 3 lines feed and Cut
  buf.push(0x0a, 0x0a, 0x0a);
  buf.push(GS, 0x56, 0x42, 0x00); // Cut

  return {
    bytes: new Uint8Array(buf),
    textPreview: lines.join('\n'),
  };
}

// ─── Persistent Web Bluetooth Manager ───────────────────────────────────────
// "Connect once, then working fine forever without re-pairing"

let _cachedDevice: any = null;
let _cachedServer: any = null;
let _cachedCharacteristic: any = null;
let _isConnecting = false;
let _intentionalDisconnect = false;

type StatusListener = (connected: boolean, deviceName?: string) => void;
const _statusListeners = new Set<StatusListener>();

export function subscribeToPrinterStatus(cb: StatusListener): () => void {
  _statusListeners.add(cb);
  cb(isBluetoothPrinterConnected(), getSavedPrinterName());
  return () => _statusListeners.delete(cb);
}

function notifyStatus(connected: boolean, deviceName?: string) {
  const name = deviceName || getSavedPrinterName();
  _statusListeners.forEach((cb) => {
    try {
      cb(connected, name);
    } catch {}
  });
}

const BLE_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS BLE Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // MPT-II / MT580P Printers
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent Serial
  '0000fee7-0000-1000-8000-00805f9b34fb', // MT580P / Tencent BLE POS
  '0000fee0-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb', // MT580P / Chinese Serial BLE
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '0000af30-0000-1000-8000-00805f9b34fb',
  '00001800-0000-1000-8000-00805f9b34fb',
  '00001801-0000-1000-8000-00805f9b34fb',
  '0000180a-0000-1000-8000-00805f9b34fb',
];

let _keepAliveTimer: any = null;

// Real-time ESC/POS status query ping: keeps Bluetooth LE radio active without printing anything
const DLE_EOT_PING = new Uint8Array([0x10, 0x04, 0x01]);

function startKeepAlive() {
  if (_keepAliveTimer) clearInterval(_keepAliveTimer);
  _keepAliveTimer = setInterval(async () => {
    if (_cachedCharacteristic && _cachedServer?.connected) {
      try {
        if (_cachedCharacteristic.properties.writeWithoutResponse) {
          await _cachedCharacteristic.writeValueWithoutResponse(DLE_EOT_PING);
        } else if (_cachedCharacteristic.properties.write) {
          await _cachedCharacteristic.writeValue(DLE_EOT_PING);
        }
      } catch (err) {
        console.warn('Keep-alive ping failed, connection may have dropped:', err);
      }
    }
  }, 12000); // 12 seconds keeps Windows BLE from sleeping
}

export function isBluetoothPrinterConnected(): boolean {
  if (isAndroidNative()) {
    const info = getAndroidConnectedPrinterInfo();
    if (info && info.connected) return true;
    return !!localStorage.getItem('saved_ble_printer_name') || !!localStorage.getItem('saved_ble_printer_id');
  }
  return !!_cachedCharacteristic && !!_cachedServer?.connected;
}

export function getSavedPrinterName(): string {
  if (isAndroidNative()) {
    const info = getAndroidConnectedPrinterInfo();
    if (info && info.name) return info.name;
    return localStorage.getItem('saved_ble_printer_name') || 'MT580P';
  }
  return _cachedDevice?.name || localStorage.getItem('saved_ble_printer_name') || '';
}

export function disconnectBluetoothPrinter(forget: boolean = false): void {
  _intentionalDisconnect = true;
  if (_keepAliveTimer) {
    clearInterval(_keepAliveTimer);
    _keepAliveTimer = null;
  }

  if (isAndroidNative()) {
    try {
      (window as any).AndroidPrinterBridge?.disconnectPrinter();
    } catch {}
  }
  try {
    if (_cachedServer && _cachedServer.connected) {
      _cachedServer.disconnect();
    }
  } catch {}
  _cachedServer = null;
  _cachedCharacteristic = null;

  if (forget) {
    _cachedDevice = null;
    localStorage.removeItem('saved_ble_printer_id');
    localStorage.removeItem('saved_ble_printer_name');
    localStorage.removeItem('saved_ble_service_uuid');
    localStorage.removeItem('saved_ble_char_uuid');
    notifyStatus(false, '');
  } else {
    notifyStatus(false, getSavedPrinterName());
  }
}

async function connectGattWithReset(device: any, maxAttempts = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (device.gatt?.connected) {
        return device.gatt;
      }
      try {
        device.gatt?.disconnect();
      } catch {}

      if (attempt > 1) {
        await new Promise((r) => setTimeout(r, 350 * attempt));
      }

      const server = await device.gatt.connect();
      if (server?.connected) {
        return server;
      }
    } catch (err) {
      console.warn(`GATT connect attempt ${attempt}/${maxAttempts} failed:`, err);
    }
  }
  return null;
}

async function findWritableCharacteristic(server: any): Promise<any> {
  // Method 0: Check saved service & char UUID from last successful connection for instant ~10ms discovery
  const savedService = localStorage.getItem('saved_ble_service_uuid');
  const savedChar = localStorage.getItem('saved_ble_char_uuid');
  if (savedService && savedChar) {
    try {
      const svc = await server.getPrimaryService(savedService);
      const c = await svc.getCharacteristic(savedChar);
      if (c && (c.properties.write || c.properties.writeWithoutResponse)) {
        return c;
      }
    } catch {}
  }

  // Method 1: Dynamically query all primary services on device
  try {
    const services = await server.getPrimaryServices();
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const c of characteristics) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            console.log('Discovered POS writable characteristic:', c.uuid, 'in service:', service.uuid);
            localStorage.setItem('saved_ble_service_uuid', service.uuid);
            localStorage.setItem('saved_ble_char_uuid', c.uuid);
            return c;
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('getPrimaryServices lookup error:', err);
  }

  // Method 2: Query individual known service UUIDs
  for (const uuid of BLE_SERVICE_UUIDS) {
    try {
      const svc = await server.getPrimaryService(uuid);
      const chars = await svc.getCharacteristics();
      for (const c of chars) {
        if (c.properties.write || c.properties.writeWithoutResponse) {
          localStorage.setItem('saved_ble_service_uuid', uuid);
          localStorage.setItem('saved_ble_char_uuid', c.uuid);
          return c;
        }
      }
    } catch {}
  }
  return null;
}

async function sendChunkedData(char: any, data: Uint8Array): Promise<void> {
  const CHUNK_SIZE = 64; // 64 bytes prevents buffer overflow on MT580P / MPT-II
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + CHUNK_SIZE);
    if (char.properties.write) {
      // Hardware-controlled write with ACK: prevents buffer overflow during QR bitmap printing
      await char.writeValue(chunk);
    } else if (char.properties.writeWithoutResponse) {
      await char.writeValueWithoutResponse(chunk);
      await new Promise((r) => setTimeout(r, 25));
    } else {
      await char.writeValue(chunk);
    }
  }
}

function attachDeviceListeners(device: any) {
  device.removeEventListener?.('gattserverdisconnected', onDeviceDisconnected);
  device.addEventListener('gattserverdisconnected', onDeviceDisconnected);
}

function onDeviceDisconnected() {
  console.log('BLE printer disconnected');
  _cachedServer = null;
  _cachedCharacteristic = null;
  notifyStatus(false, getSavedPrinterName());
}

/**
 * Auto-connects to previously paired Bluetooth printer in the background without any popups.
 */
export async function autoConnectSavedPrinter(): Promise<{ connected: boolean; deviceName?: string }> {
  try {
    if (isAndroidNative()) {
      const info = getAndroidConnectedPrinterInfo();
      if (info && info.connected) {
        return { connected: true, deviceName: info.name || getSavedPrinterName() };
      }
      return { connected: false, deviceName: getSavedPrinterName() };
    }

    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      return { connected: false };
    }

    if (isBluetoothPrinterConnected()) {
      return { connected: true, deviceName: getSavedPrinterName() };
    }

    const savedId = localStorage.getItem('saved_ble_printer_id');
    if (!savedId) {
      return { connected: false };
    }

    if (_isConnecting) return { connected: false };
    _isConnecting = true;

    // Try cached device first
    if (_cachedDevice && _cachedDevice.gatt) {
      attachDeviceListeners(_cachedDevice);
      const server = await connectGattWithReset(_cachedDevice, 2);
      if (server) {
        const char = await findWritableCharacteristic(server);
        if (char) {
          _cachedServer = server;
          _cachedCharacteristic = char;
          _intentionalDisconnect = false;
          startKeepAlive();
          _isConnecting = false;
          notifyStatus(true, _cachedDevice.name);
          return { connected: true, deviceName: _cachedDevice.name || 'Bluetooth Printer' };
        }
      }
    }

    // Try getDevices() from browser permissions
    if ((navigator as any).bluetooth.getDevices) {
      const grantedDevices: any[] = await (navigator as any).bluetooth.getDevices();
      if (grantedDevices && grantedDevices.length > 0) {
        const matched = grantedDevices.find((d) => d.id === savedId) || grantedDevices[0];
        if (matched?.gatt) {
          _cachedDevice = matched;
          attachDeviceListeners(matched);
          const server = await connectGattWithReset(matched, 2);
          if (server) {
            const char = await findWritableCharacteristic(server);
            if (char) {
              _cachedServer = server;
              _cachedCharacteristic = char;
              _intentionalDisconnect = false;
              localStorage.setItem('saved_ble_printer_id', matched.id);
              localStorage.setItem('saved_ble_printer_name', matched.name || 'Bluetooth Printer');
              startKeepAlive();
              _isConnecting = false;
              notifyStatus(true, matched.name);
              return { connected: true, deviceName: matched.name || 'Bluetooth Printer' };
            }
          }
        }
      }
    }

    _isConnecting = false;
    return { connected: false };
  } catch (err) {
    _isConnecting = false;
    console.warn('Auto-connect saved printer skipped:', err);
    return { connected: false };
  }
}

export interface BluetoothDeviceInfo {
  name: string;
  address: string;
  isPaired?: boolean;
  isConnected?: boolean;
}

export function startAndroidBluetoothScan(): boolean {
  if (typeof window !== 'undefined' && (window as any).AndroidPrinterBridge?.startDiscovery) {
    return (window as any).AndroidPrinterBridge.startDiscovery();
  }
  return false;
}

export function getAndroidScannedPrinters(): BluetoothDeviceInfo[] {
  if (typeof window !== 'undefined' && (window as any).AndroidPrinterBridge?.getScannedDevicesJson) {
    try {
      const json = (window as any).AndroidPrinterBridge.getScannedDevicesJson();
      return JSON.parse(json);
    } catch {
      return [];
    }
  }
  return [];
}

export function connectToAndroidPrinter(address: string, name: string): boolean {
  if (typeof window !== 'undefined' && (window as any).AndroidPrinterBridge?.connectPrinter) {
    const ok = (window as any).AndroidPrinterBridge.connectPrinter(address, name);
    if (ok) {
      localStorage.setItem('saved_ble_printer_name', name || 'MT580P');
      localStorage.setItem('saved_ble_printer_id', address);
      notifyStatus(true, name || 'MT580P');
      return true;
    }
  }
  return false;
}

export function getAndroidConnectedPrinterInfo(): { connected: boolean; name?: string; address?: string } {
  if (typeof window !== 'undefined' && (window as any).AndroidPrinterBridge?.getConnectedDeviceInfoJson) {
    try {
      const json = (window as any).AndroidPrinterBridge.getConnectedDeviceInfoJson();
      return JSON.parse(json);
    } catch {
      return { connected: false };
    }
  }
  return { connected: false };
}

export function isAndroidNative(): boolean {
  return (
    Capacitor.isNativePlatform() ||
    (typeof window !== 'undefined' && !!(window as any).AndroidPrinterBridge) ||
    (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || ''))
  );
}

export function openAndroidBluetoothSettings(): boolean {
  if (typeof window !== 'undefined' && (window as any).AndroidPrinterBridge?.openBluetoothSettings) {
    (window as any).AndroidPrinterBridge.openBluetoothSettings();
    return true;
  }
  return false;
}

/**
 * Dedicated Bluetooth Printer Connector:
 * Prompts user with browser device picker when forcePrompt = true (or when no device is paired).
 * If forcePrompt = false, attempts silent background reconnect to saved printer first.
 * Discovers writable POS characteristic, sets up keepalive, saves pairing info, and initializes printer with ESC @.
 */
export async function connectBluetoothPrinter(
  forcePrompt: boolean = true
): Promise<{ success: boolean; message?: string; deviceName?: string }> {
  try {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      if (isAndroidNative()) {
        localStorage.setItem('saved_ble_printer_name', 'Android Bluetooth Thermal Printer');
        notifyStatus(true, 'Android Bluetooth Thermal Printer');
        return {
          success: true,
          message: 'Android Bluetooth Thermal Printer service is connected & ready for 1-click printing!',
          deviceName: 'Android Bluetooth Thermal Printer',
        };
      }
      return {
        success: false,
        message: 'Web Bluetooth is not supported on this browser. Please use Chrome or Edge.',
      };
    }

    // 1. Fast path: already connected
    if (_cachedCharacteristic && _cachedServer?.connected) {
      _intentionalDisconnect = false;
      startKeepAlive();
      notifyStatus(true, getSavedPrinterName());
      return {
        success: true,
        message: `Connected to ${getSavedPrinterName()}`,
        deviceName: getSavedPrinterName(),
      };
    }

    const savedId = localStorage.getItem('saved_ble_printer_id');

    // 2. Silent reconnect attempt if not forcing prompt
    if (!forcePrompt && (savedId || _cachedDevice)) {
      const silentRes = await autoConnectSavedPrinter();
      if (silentRes.connected) {
        return {
          success: true,
          message: `Connected to ${silentRes.deviceName}`,
          deviceName: silentRes.deviceName,
        };
      }
    }

    // 3. Prompt user with device picker
    _isConnecting = true;
    _intentionalDisconnect = false;

    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLE_SERVICE_UUIDS,
    });

    if (!device?.gatt) {
      _isConnecting = false;
      return { success: false, message: 'Printer selection was cancelled.' };
    }

    _cachedDevice = device;
    attachDeviceListeners(device);
    localStorage.setItem('saved_ble_printer_id', device.id);
    localStorage.setItem('saved_ble_printer_name', device.name || 'Bluetooth Printer');

    const server = await connectGattWithReset(device, 3);
    if (!server) {
      _isConnecting = false;
      return { success: false, message: 'Could not connect to printer GATT server. Ensure printer is ON.' };
    }

    const char = await findWritableCharacteristic(server);
    if (!char) {
      server.disconnect();
      _cachedServer = null;
      _cachedCharacteristic = null;
      _isConnecting = false;
      return { success: false, message: 'Connected, but no writable POS characteristic found.' };
    }

    _cachedServer = server;
    _cachedCharacteristic = char;
    startKeepAlive();
    notifyStatus(true, device.name);
    _isConnecting = false;

    // Send ESC @ init command
    try {
      const initCmd = new Uint8Array([0x1b, 0x40]);
      if (char.properties.write) {
        await char.writeValue(initCmd);
      } else if (char.properties.writeWithoutResponse) {
        await char.writeValueWithoutResponse(initCmd);
      }
    } catch {}

    return {
      success: true,
      message: `Connected to ${device.name || 'Bluetooth Printer'}`,
      deviceName: device.name || 'Bluetooth Printer',
    };
  } catch (err: any) {
    _isConnecting = false;
    return {
      success: false,
      message: err?.message || 'Bluetooth connection failed.',
    };
  }
}

/**
 * Prints to Bluetooth Thermal Printer with persistent connection:
 * Reconnects silently if idle, NEVER prompts user if already paired.
 * Only prompts when forcePrompt is explicitly true or no printer has ever been paired.
 */
export async function printViaBluetooth(
  data: Uint8Array,
  forcePrompt: boolean = false
): Promise<{ success: boolean; message?: string }> {
  try {
    // 0. ANDROID NATIVE DIRECT RFCOMM BLUETOOTH BRIDGE
    // Bypasses Web Bluetooth completely and prints directly over real Android Bluetooth SPP socket!
    if (isAndroidNative()) {
      let bin = '';
      for (let i = 0; i < data.length; i++) {
        bin += String.fromCharCode(data[i]);
      }
      const base64 = btoa(bin);

      if (typeof window !== 'undefined' && (window as any).AndroidPrinterBridge?.printRawEscPos) {
        const ok = (window as any).AndroidPrinterBridge.printRawEscPos(base64);
        if (ok) {
          notifyStatus(true, getSavedPrinterName() || 'Bluetooth Thermal Printer');
          return { success: true, message: 'Printed to Bluetooth Thermal Printer' };
        }
      }

      // Try RawBT / Native intent fallback
      const okRawBt = printViaRawBt(data);
      if (okRawBt) {
        return { success: true, message: 'Sent via RawBT' };
      }

      return {
        success: false,
        message: 'Printer not connected. Please scan and connect nearby Bluetooth printer.',
      };
    }

    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      return {
        success: false,
        message: 'Web Bluetooth is not supported on this browser. Use Chrome or Edge.',
      };
    }

    const savedId = localStorage.getItem('saved_ble_printer_id');
    const savedName = localStorage.getItem('saved_ble_printer_name') || 'Bluetooth Printer';

    // 1. FAST PATH: Already connected in memory (Instant ~30ms print, 0 popups)
    if (_cachedCharacteristic && _cachedServer?.connected) {
      try {
        await sendChunkedData(_cachedCharacteristic, data);
        startKeepAlive();
        notifyStatus(true, getSavedPrinterName());
        return { success: true, message: 'Printed successfully' };
      } catch (writeErr) {
        console.warn('Cached BLE write failed, attempting silent reconnect...', writeErr);
        _cachedCharacteristic = null;
        _cachedServer = null;
      }
    }

    // 2. SILENT RECONNECT: Device already paired, reconnect silently without any popups!
    if (_cachedDevice || savedId) {
      if (_isConnecting) {
        await new Promise((r) => setTimeout(r, 600));
        if (_cachedCharacteristic && _cachedServer?.connected) {
          await sendChunkedData(_cachedCharacteristic, data);
          startKeepAlive();
          notifyStatus(true, getSavedPrinterName());
          return { success: true, message: 'Printed successfully' };
        }
      }

      _isConnecting = true;

      // Try _cachedDevice
      if (_cachedDevice?.gatt) {
        attachDeviceListeners(_cachedDevice);
        const server = await connectGattWithReset(_cachedDevice, 3);
        if (server) {
          const char = await findWritableCharacteristic(server);
          if (char) {
            _cachedServer = server;
            _cachedCharacteristic = char;
            _intentionalDisconnect = false;
            startKeepAlive();
            notifyStatus(true, _cachedDevice.name);
            await sendChunkedData(char, data);
            _isConnecting = false;
            return { success: true, message: 'Printed (reconnected silently)' };
          }
        }
      }

      // Try getDevices()
      if ((navigator as any).bluetooth.getDevices) {
        try {
          const grantedDevices: any[] = await (navigator as any).bluetooth.getDevices();
          if (grantedDevices && grantedDevices.length > 0) {
            const matched = grantedDevices.find((d) => d.id === savedId) || grantedDevices[0];
            if (matched?.gatt) {
              _cachedDevice = matched;
              attachDeviceListeners(matched);
              const server = await connectGattWithReset(matched, 3);
              if (server) {
                const char = await findWritableCharacteristic(server);
                if (char) {
                  _cachedServer = server;
                  _cachedCharacteristic = char;
                  _intentionalDisconnect = false;
                  startKeepAlive();
                  notifyStatus(true, matched.name);
                  await sendChunkedData(char, data);
                  _isConnecting = false;
                  return { success: true, message: `Printed to ${matched.name || 'Printer'}` };
                }
              }
            }
          }
        } catch (getDevErr) {
          console.warn('getDevices reconnect error:', getDevErr);
        }
      }

      _isConnecting = false;

      // If device was paired previously and forcePrompt is FALSE, DO NOT POP UP PAIRING DIALOG!
      if (!forcePrompt) {
        return {
          success: false,
          message: `Printer "${savedName}" is not responding. Ensure printer is turned ON and in range.`,
        };
      }
    }

    // 3. FIRST-TIME PAIRING ONLY: Prompt user if never paired, or if forcePrompt is true
    if (!forcePrompt && !savedId) {
      return {
        success: false,
        message: 'Printer not connected. Please connect printer once from Settings or top bar.',
      };
    }

    _isConnecting = true;

    // Use acceptAllDevices so ANY thermal printer (MT580P, MPT-II, etc.) appears in picker
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLE_SERVICE_UUIDS,
    });

    if (!device?.gatt) {
      _isConnecting = false;
      return { success: false, message: 'Printer selection was cancelled.' };
    }

    _cachedDevice = device;
    attachDeviceListeners(device);
    localStorage.setItem('saved_ble_printer_id', device.id);
    localStorage.setItem('saved_ble_printer_name', device.name || 'Bluetooth Printer');

    const server = await connectGattWithReset(device, 3);
    if (!server) {
      _isConnecting = false;
      return { success: false, message: 'Could not connect to printer GATT server.' };
    }

    const char = await findWritableCharacteristic(server);
    if (!char) {
      server.disconnect();
      _cachedServer = null;
      _cachedCharacteristic = null;
      _isConnecting = false;
      return { success: false, message: 'Connected, but no writable POS characteristic found.' };
    }

    _cachedServer = server;
    _cachedCharacteristic = char;
    _intentionalDisconnect = false;
    startKeepAlive();
    notifyStatus(true, device.name);

    await sendChunkedData(char, data);
    _isConnecting = false;
    return {
      success: true,
      message: `Connected to ${device.name || 'Bluetooth Printer'}`,
    };
  } catch (err: any) {
    _isConnecting = false;
    return {
      success: false,
      message: err?.message || 'Bluetooth printing failed. Please check printer.',
    };
  }
}

// ─── Android RawBT & Native Intent Helper ────────────────────────────────────

export function printViaRawBt(data: Uint8Array): boolean {
  try {
    let bin = '';
    for (let i = 0; i < data.length; i++) {
      bin += String.fromCharCode(data[i]);
    }
    const base64 = btoa(bin);

    // 1. Try Native Android Bridge first
    if (typeof window !== 'undefined' && (window as any).AndroidPrinterBridge?.printRawEscPos) {
      const ok = (window as any).AndroidPrinterBridge.printRawEscPos(base64);
      if (ok) return true;
    }

    // 2. Direct URI scheme for RawBT
    window.location.href = `rawbt:data:application/octet-stream;base64,${base64}`;
    return true;
  } catch (err) {
    console.error('RawBT error:', err);
    return false;
  }
}

// ─── USB Serial Host Helper ─────────────────────────────────────────────────

export async function printViaSerial(
  data: Uint8Array
): Promise<{ success: boolean; message?: string }> {
  try {
    if (typeof navigator === 'undefined' || !('serial' in navigator)) {
      return { success: false, message: 'Web Serial API is not supported on this browser.' };
    }

    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    const writer = port.writable.getWriter();
    await writer.write(data);
    writer.releaseLock();
    await port.close();
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'USB Serial printing failed.' };
  }
}

