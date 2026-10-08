// All monetary amounts are stored as integer paise (1 Rupee = 100 Paise)

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type PaymentMode = 'cash' | 'upi' | 'card' | 'split' | 'other';
export type PaymentStatus = 'paid' | 'unpaid' | 'cancelled';
export type BillStatus = 'ACTIVE' | 'CANCELLED';
export type TaxMode = 'inclusive' | 'exclusive' | 'none';
export type BillMode = 'normal' | 'token' | 'qr' | 'combined';
export type PaperWidth = 58 | 80;
export type Language = 'en' | 'hi';
export type TabKey = 'dashboard' | 'billing' | 'menu' | 'history' | 'reports' | 'settings';

export interface RestaurantProfile {
  id: string; // 'default'
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email?: string;
  gstin?: string;
  fssai?: string;
  pan?: string;
  logoUrl?: string; // base64 or object URL
  printLogoOnThermal?: boolean; // Default false to prevent burning black blobs on thermal receipts
  billLogoSize?: 'small' | 'medium' | 'large' | 'xlarge';
  upiVpa: string; // e.g. restro@okhdfcbank
  upiPayeeName: string;
  headerText: string;
  footerText: string;
  taxMode: TaxMode;
  defaultGstPercent: number; // e.g. 5
  defaultBillMode: BillMode;
  defaultBillFormat?: 'token_bill' | 'bill_only';
  showQrOnBill?: boolean;
  paperWidth: PaperWidth;
  language: Language;
  billPrefix: string; // e.g. 'B'
  currencySymbol: '₹' | 'Rs';
  copies: number;
  autoOpenNextBill: boolean;
  defaultPackagingCharge?: number; // In Rupees (e.g. 10)
  pin: string; // 4-6 digit owner PIN
  requirePinForActions: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameHindi?: string;
  sortOrder: number;
  isActive: boolean;
  color?: string;
  icon?: string;
}

export interface ItemVariant {
  id: string;
  label: string; // e.g. 'Regular', 'Half', 'Full', 'Large'
  price: number; // in paise
}

export type ProductStockStatus = 'in_stock' | 'out_of_stock';

export interface Item {
  id: string;
  categoryId: string;
  name: string;
  shortName: string; // concise for 32/48 char thermal print
  nameHindi?: string;
  basePrice: number; // in paise
  taxPercent: number; // e.g. 5, 12, 18 or 0
  isVeg: boolean;
  isActive: boolean;
  isOutOfStock?: boolean; // true when item runs out of stock
  isDeleted?: boolean; // true when item is soft-deleted to trash
  deletedAt?: number; // timestamp when deleted
  stockQty?: number; // optional stock quantity count
  sortOrder: number;
  imageUrl?: string;
  variants?: ItemVariant[];
}

export interface BillItemSnapshot {
  id: string;
  itemId?: string;
  nameSnapshot: string;
  nameHindiSnapshot?: string;
  shortNameSnapshot: string;
  variantSnapshot?: string;
  qty: number;
  unitPrice: number; // in paise
  taxPercent: number;
  lineTotal: number; // in paise (qty * unitPrice)
  note?: string; // e.g. "less spicy", "no onion"
}

export interface SplitPaymentDetail {
  mode: 'cash' | 'upi' | 'card' | 'other';
  amount: number; // in paise
}

export interface Bill {
  id: string; // UUID or timestamp
  billNo: string; // e.g. B2627-000123
  financialYear: string; // e.g. 2627
  orderNo: number; // 5-digit order number e.g. 1 -> 00001
  tokenNo?: number;
  createdAt: number; // epoch ms
  updatedAt: number;
  orderType: OrderType;
  tableNo?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: BillItemSnapshot[];
  
  // Financial breakdown in integer paise
  subtotal: number;
  discountType: 'flat' | 'percent';
  discountValue: number; // % or paise
  discountAmount: number; // in paise
  serviceCharge: number; // in paise
  packagingCharge: number; // in paise
  taxableAmount: number; // in paise
  cgst: number; // in paise
  sgst: number; // in paise
  roundOff: number; // in paise (+/-)
  grandTotal: number; // in paise
  
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  splitPayments?: SplitPaymentDetail[];
  
  status: BillStatus;
  cancelReason?: string;
  cancelledAt?: number;
  revisionNo: number;
  printCount: number;
}

export interface HeldBill {
  id: string;
  title: string; // e.g. "Table 4" or "Takeaway #3"
  orderType: OrderType;
  tableNo?: string;
  customerName?: string;
  customerPhone?: string;
  items: BillItemSnapshot[];
  savedAt: number;
  note?: string;
}

export interface BillRevision {
  id: string;
  billId: string;
  revisionNo: number;
  snapshotJson: string; // full json of previous state
  changedAt: number;
  reason: string;
}

export interface AuditLog {
  id: string;
  action: 'EDIT' | 'CANCEL' | 'REPRINT' | 'EXPORT' | 'DELETE' | 'RESET' | 'PRICE_OVERRIDE' | 'HOLD';
  billId?: string;
  detail: string;
  timestamp: number;
}

export interface MonthlyArchive {
  id: string;
  month: string; // YYYY-MM
  billCount: number;
  firstBillNo: string;
  lastBillNo: string;
  totalSales: number; // in paise
  totalTax: number; // in paise
  exportFileName: string;
  archivedAt: number;
}

export interface PrinterDevice {
  id: string;
  name: string;
  type: 'bluetooth' | 'serial' | 'system';
  paperWidth: PaperWidth;
  deviceHandle?: any;
  isConnected: boolean;
}

export interface ElectronStorageInfo {
  userDataPath: string;
  documentsPath: string;
  desktopPath: string;
  appPath: string;
  platform: string;
  arch: string;
  version: string;
  isPackaged: boolean;
}

export interface ElectronSystemPrinter {
  name: string;
  displayName: string;
  description?: string;
  isDefault: boolean;
  status: number;
}

export interface ElectronAPI {
  isElectron: boolean;
  selectStorageFolder: () => Promise<string | null>;
  saveBackupFile: (opts: { folderPath?: string; fileName: string; data: any }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  loadBackupFile: () => Promise<{ filePath: string; content: string } | null>;
  getStorageInfo: () => Promise<ElectronStorageInfo>;
  getSystemPrinters: () => Promise<ElectronSystemPrinter[]>;
  printToPrinter: (opts: { printerName?: string; silent?: boolean; pageSize?: string }) => Promise<{ success: boolean; error?: string }>;
  cancelBluetoothRequest: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

