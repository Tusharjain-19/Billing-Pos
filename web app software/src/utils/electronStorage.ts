import { db } from '../db';
import type { ElectronStorageInfo, ElectronSystemPrinter } from '../types';

const STORAGE_FOLDER_KEY = 'billing_pro_hdd_storage_path';
const AUTO_BACKUP_KEY = 'billing_pro_auto_backup_enabled';
const LAST_AUTO_BACKUP_DATE_KEY = 'billing_pro_last_auto_backup_date';

export function isElectronApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
}

export function getSavedHddStoragePath(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_FOLDER_KEY) || '';
}

export function setSavedHddStoragePath(path: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_FOLDER_KEY, path);
}

export function isAutoBackupEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(AUTO_BACKUP_KEY);
  return val === null ? true : val === 'true';
}

export function setAutoBackupEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTO_BACKUP_KEY, enabled ? 'true' : 'false');
}

export async function pickHddStorageFolder(): Promise<string | null> {
  if (!isElectronApp() || !window.electronAPI) return null;
  const folder = await window.electronAPI.selectStorageFolder();
  if (folder) {
    setSavedHddStoragePath(folder);
  }
  return folder;
}

export async function getDesktopStorageInfo(): Promise<ElectronStorageInfo | null> {
  if (!isElectronApp() || !window.electronAPI) return null;
  try {
    return await window.electronAPI.getStorageInfo();
  } catch (err) {
    console.error('Failed to get electron storage info:', err);
    return null;
  }
}

/**
 * Creates a full standalone database snapshot of profile, categories, items, bills, archives, etc.
 */
export async function generateFullDatabaseSnapshot(): Promise<Record<string, any>> {
  const profile = await db.profile.get('default');
  const categories = await db.categories.toArray();
  const items = await db.items.toArray();
  const bills = await db.bills.toArray();
  const heldBills = await db.heldBills.toArray();
  const auditLogs = await db.auditLogs.toArray();
  const monthlyArchives = await db.monthlyArchives.toArray();
  const billRevisions = await db.billRevisions.toArray();
  const counters = await db.counters.toArray();

  return {
    version: '1.0.0',
    app: 'Billing Pro POS',
    exportedAt: new Date().toISOString(),
    timestamp: Date.now(),
    stats: {
      itemsCount: items.length,
      categoriesCount: categories.length,
      billsCount: bills.length,
    },
    profile,
    categories,
    items,
    bills,
    heldBills,
    auditLogs,
    monthlyArchives,
    billRevisions,
    counters,
  };
}

/**
 * Saves a full snapshot file directly to the configured HDD/SSD storage folder
 */
export async function saveDatabaseBackupToDrive(customPath?: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const targetFolder = customPath || getSavedHddStoragePath();
  const snapshot = await generateFullDatabaseSnapshot();
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
  const fileName = `Billing_Pro_Backup_${dateStr}_${timeStr}.json`;

  if (isElectronApp() && window.electronAPI) {
    const res = await window.electronAPI.saveBackupFile({
      folderPath: targetFolder || undefined,
      fileName,
      data: snapshot,
    });
    if (res.success) {
      localStorage.setItem(LAST_AUTO_BACKUP_DATE_KEY, dateStr);
    }
    return res;
  } else {
    // Web / Browser fallback download
    try {
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, filePath: fileName };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

/**
 * Performs daily auto-backup if enabled and not performed today
 */
export async function checkAndPerformDailyAutoBackup(): Promise<void> {
  if (!isAutoBackupEnabled()) return;
  const today = new Date().toISOString().slice(0, 10);
  const lastBackup = localStorage.getItem(LAST_AUTO_BACKUP_DATE_KEY);
  if (lastBackup !== today) {
    try {
      const res = await saveDatabaseBackupToDrive();
      if (res.success) {
        console.log('Daily auto-backup saved successfully to HDD/SSD:', res.filePath);
      }
    } catch (err) {
      console.warn('Auto backup skipped or failed:', err);
    }
  }
}

/**
 * Fetch list of Windows Installed USB / Thermal / Virtual Printers in Electron
 */
export async function getWindowsPrinters(): Promise<ElectronSystemPrinter[]> {
  if (isElectronApp() && window.electronAPI) {
    try {
      return await window.electronAPI.getSystemPrinters();
    } catch (err) {
      console.error('Error fetching Windows printers:', err);
    }
  }
  return [];
}
