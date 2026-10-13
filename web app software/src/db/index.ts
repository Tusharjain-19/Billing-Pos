import Dexie, { type Table } from 'dexie';
import type {
  RestaurantProfile,
  Category,
  Item,
  Bill,
  HeldBill,
  AuditLog,
  MonthlyArchive,
  BillRevision
} from '../types';
import { getFinancialYearCode, formatBillNumber, formatOrderNumber, getDailyOrderKey } from '../utils/numbering';

export interface CounterRecord {
  key: string;
  value: number;
}

export class BookMyDineDB extends Dexie {
  profile!: Table<RestaurantProfile, string>;
  categories!: Table<Category, string>;
  items!: Table<Item, string>;
  bills!: Table<Bill, string>;
  heldBills!: Table<HeldBill, string>;
  auditLogs!: Table<AuditLog, string>;
  monthlyArchives!: Table<MonthlyArchive, string>;
  billRevisions!: Table<BillRevision, string>;
  counters!: Table<CounterRecord, string>;

  constructor() {
    super('BookMyDineBillDB');
    this.version(1).stores({
      profile: 'id',
      categories: 'id, sortOrder, isActive',
      items: 'id, categoryId, name, isActive, sortOrder',
      bills: 'id, billNo, financialYear, orderNo, tokenNo, createdAt, orderType, paymentMode, paymentStatus, status, grandTotal',
      heldBills: 'id, savedAt, tableNo',
      auditLogs: 'id, action, billId, timestamp',
      monthlyArchives: 'id, month, archivedAt',
      billRevisions: 'id, billId, revisionNo, changedAt',
      counters: 'key',
    });
  }
}

import { DEFAULT_RESTAURANT_LOGO } from '../utils/constants';

export const db = new BookMyDineDB();

// Default initial data
export const DEFAULT_PROFILE: RestaurantProfile = {
  id: 'default',
  name: 'BookMyDine Express',
  tagline: 'Fresh • Fast • Delicious',
  address: 'Shop 12, Food Galleria, Central Market',
  phone: '+91 98765 43210',
  email: 'orders@bookmydine.local',
  gstin: '07AAAAA0000A1Z5',
  fssai: '10019011000123',
  logoUrl: DEFAULT_RESTAURANT_LOGO,
  billLogoSize: 'medium',
  upiVpa: 'bookmydine@upi',
  upiPayeeName: 'BookMyDine Express',
  headerText: 'WELCOME TO BOOKMYDINEQR',
  footerText: 'Thanks for visiting',
  taxMode: 'exclusive',
  defaultGstPercent: 5,
  defaultBillMode: 'normal',
  defaultBillFormat: 'bill_only',
  showQrOnBill: false,
  paperWidth: 58,
  language: 'en',
  billPrefix: 'B',
  currencySymbol: '₹',
  copies: 1,
  autoOpenNextBill: true,
  defaultPackagingCharge: 10,
  pin: '1234',
  requirePinForActions: false,
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-bev', name: 'Beverages', nameHindi: 'पेय और चाय', sortOrder: 1, isActive: true, color: '#f59e0b', icon: 'Coffee' },
  { id: 'cat-south', name: 'South Indian', nameHindi: 'दक्षिण भारतीय', sortOrder: 2, isActive: true, color: '#10b981', icon: 'Utensils' },
  { id: 'cat-snack', name: 'Snacks', nameHindi: 'नाश्ता और चाट', sortOrder: 3, isActive: true, color: '#ef4444', icon: 'Flame' },
  { id: 'cat-north', name: 'North Indian', nameHindi: 'उत्तर भारतीय भोजन', sortOrder: 4, isActive: true, color: '#8b5cf6', icon: 'Soup' },
  { id: 'cat-sweet', name: 'Desserts', nameHindi: 'मिठाइयाँ', sortOrder: 5, isActive: true, color: '#ec4899', icon: 'IceCream' },
];

// Exactly 5 default starter items as requested
export const INITIAL_ITEMS: Item[] = [
  {
    id: 'item-1',
    categoryId: 'cat-bev',
    name: 'Special Masala Chai',
    shortName: 'Masala Chai',
    nameHindi: 'मसाला चाय',
    basePrice: 2000, // ₹20.00
    taxPercent: 5,
    isVeg: true,
    isActive: true,
    sortOrder: 1,
    variants: [
      { id: 'var-1a', label: 'Regular', price: 2000 },
      { id: 'var-1b', label: 'Kulhad', price: 3000 },
    ],
  },
  {
    id: 'item-2',
    categoryId: 'cat-south',
    name: 'Crispy Masala Dosa',
    shortName: 'Masala Dosa',
    nameHindi: 'मसाला डोसा',
    basePrice: 9000, // ₹90.00
    taxPercent: 5,
    isVeg: true,
    isActive: true,
    sortOrder: 2,
    variants: [
      { id: 'var-2a', label: 'Plain Masala', price: 9000 },
      { id: 'var-2b', label: 'Butter Cheese', price: 13000 },
    ],
  },
  {
    id: 'item-3',
    categoryId: 'cat-snack',
    name: 'Mumbai Pav Bhaji',
    shortName: 'Pav Bhaji',
    nameHindi: 'पाव भाजी',
    basePrice: 11000, // ₹110.00
    taxPercent: 5,
    isVeg: true,
    isActive: true,
    sortOrder: 3,
    variants: [
      { id: 'var-3a', label: 'Regular', price: 11000 },
      { id: 'var-3b', label: 'Extra Butter', price: 14000 },
    ],
  },
  {
    id: 'item-4',
    categoryId: 'cat-north',
    name: 'Paneer Butter Masala',
    shortName: 'Paneer Butter',
    nameHindi: 'पनीर बटर मसाला',
    basePrice: 18000, // ₹180.00
    taxPercent: 5,
    isVeg: true,
    isActive: true,
    sortOrder: 4,
    variants: [
      { id: 'var-4a', label: 'Half', price: 12000 },
      { id: 'var-4b', label: 'Full', price: 21000 },
    ],
  },
  {
    id: 'item-5',
    categoryId: 'cat-sweet',
    name: 'Hot Gulab Jamun (2 Pcs)',
    shortName: 'Gulab Jamun',
    nameHindi: 'गुलाब जामुन',
    basePrice: 5000, // ₹50.00
    taxPercent: 5,
    isVeg: true,
    isActive: true,
    sortOrder: 5,
  },
];

export async function initializeDatabase() {
  const profileCount = await db.profile.count();
  if (profileCount === 0) {
    await db.profile.add(DEFAULT_PROFILE);
    await db.categories.bulkAdd(INITIAL_CATEGORIES);
    await db.items.bulkAdd(INITIAL_ITEMS);
    await db.auditLogs.add({
      id: 'init-log',
      action: 'RESET',
      detail: 'Initial BookMyDine database initialized with 5 starter menu items',
      timestamp: Date.now(),
    });
  } else {
    // Ensure profile has default values for logo and bill settings
    const existing = await db.profile.get('default');
    if (existing) {
      let needsUpdate = false;
      const updates: Partial<RestaurantProfile> = {};
      if (!existing.logoUrl || existing.logoUrl.startsWith('data:image/svg+xml')) {
        updates.logoUrl = DEFAULT_RESTAURANT_LOGO;
        needsUpdate = true;
      }
      if (!existing.billLogoSize) {
        updates.billLogoSize = 'medium';
        needsUpdate = true;
      }
      if (!existing.defaultBillFormat) {
        updates.defaultBillFormat = 'bill_only';
        needsUpdate = true;
      }
      if (existing.showQrOnBill === undefined) {
        updates.showQrOnBill = false;
        needsUpdate = true;
      }
      if (existing.defaultPackagingCharge === undefined) {
        updates.defaultPackagingCharge = 10;
        needsUpdate = true;
      }
      if (needsUpdate) {
        await db.profile.update('default', updates);
      }
    }

    // If the database has older items or no items, ensure exactly 5 default items exist
    const itemsCount = await db.items.count();
    if (itemsCount === 0) {
      await db.items.bulkAdd(INITIAL_ITEMS);
    }
  }
}

export async function getNextOrderNo(): Promise<number> {
  const nowDate = new Date();
  const orderCounterKey = getDailyOrderKey(nowDate);
  const orderCounterRecord = await db.counters.get(orderCounterKey);
  if (orderCounterRecord?.value !== undefined) {
    return orderCounterRecord.value + 1;
  }
  const startOfDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const todayBillsCount = await db.bills.where('createdAt').aboveOrEqual(startOfDay).count();
  return todayBillsCount + 1;
}

/**
 * Atomic bill creation with consecutive 5-digit order numbering
 */
export async function saveNewBill(
  billData: Omit<Bill, 'id' | 'billNo' | 'financialYear' | 'orderNo' | 'tokenNo' | 'createdAt' | 'updatedAt' | 'revisionNo' | 'printCount'> & {
    forcedOrderNo?: number;
  }
): Promise<Bill> {
  return await db.transaction('rw', db.bills, db.counters, db.auditLogs, db.profile, db.items, async () => {
    const profile = (await db.profile.get('default')) || DEFAULT_PROFILE;
    const now = Date.now();
    const nowDate = new Date(now);
    const fyCode = getFinancialYearCode(nowDate);
    const fyCounterKey = `BILL_SEQ_${fyCode}`;
    // 5-digit Order Number Sequence (Resets every day at 00:00 midnight)
    const orderCounterKey = getDailyOrderKey(nowDate);
    const orderCounterRecord = await db.counters.get(orderCounterKey);
    let nextOrderNo: number;

    if (billData.forcedOrderNo && billData.forcedOrderNo > 0) {
      nextOrderNo = billData.forcedOrderNo;
      const currentHighest = Math.max(orderCounterRecord?.value || 0, nextOrderNo);
      await db.counters.put({ key: orderCounterKey, value: currentHighest });
    } else {
      if (orderCounterRecord?.value !== undefined) {
        nextOrderNo = orderCounterRecord.value + 1;
      } else {
        const startOfDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
        const todayBillsCount = await db.bills.where('createdAt').aboveOrEqual(startOfDay).count();
        nextOrderNo = todayBillsCount + 1;
      }
      await db.counters.put({ key: orderCounterKey, value: nextOrderNo });
    }

    // Continuous FY Bill Sequence (Increases throughout financial year, NEVER resets daily)
    const billCounterRecord = await db.counters.get(fyCounterKey);
    const nextBillSeq = (billCounterRecord?.value || 0) + 1;
    await db.counters.put({ key: fyCounterKey, value: nextBillSeq });

    // Bill Number (e.g. B2627-000023)
    const billNo = formatBillNumber(profile.billPrefix, fyCode, nextBillSeq);

    const { forcedOrderNo, ...cleanBillData } = billData;

    const newBill: Bill = {
      ...cleanBillData,
      id: `bill_${now}_${Math.random().toString(36).substring(2, 7)}`,
      billNo,
      financialYear: fyCode,
      orderNo: nextOrderNo,
      tokenNo: nextOrderNo,
      createdAt: now,
      updatedAt: now,
      revisionNo: 1,
      printCount: 0,
    };

    await db.bills.add(newBill);

    // Auto-deduct inventory stock for items tracking stock quantity
    for (const snap of newBill.items) {
      if (snap.itemId) {
        const itemRecord = await db.items.get(snap.itemId);
        if (itemRecord && itemRecord.stockQty !== undefined && itemRecord.stockQty !== null) {
          const updatedStock = Math.max(0, itemRecord.stockQty - (snap.qty || 1));
          await db.items.update(snap.itemId, {
            stockQty: updatedStock,
            isOutOfStock: updatedStock <= 0,
          });
        }
      }
    }

    await db.auditLogs.add({
      id: `audit_${now}`,
      action: 'REPRINT',
      billId: newBill.id,
      detail: `Created Order #${formatOrderNumber(nextOrderNo)} (${billNo}) for ₹${(newBill.grandTotal / 100).toFixed(2)} (${newBill.orderType})`,
      timestamp: now,
    });

    return newBill;
  });
}
