import React, { useState, useRef } from 'react';
import {
  Store,
  Printer,
  Bluetooth,
  Play,
  Usb,
  Shield,
  Database,
  Save,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
  FileText,
  Lock,
  QrCode,
  Crop,
  Camera,
  X,
  Power,
  Smartphone,
  ClipboardCopy,
  RotateCcw,
  FileCode,
  Check,
  FileUp,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import type { RestaurantProfile, Bill, PaperWidth, TaxMode, BillMode } from '../types';
import { db } from '../db';
import { exportBillsToExcel } from '../utils/excel';
import { exportBillsToPdf } from '../utils/pdfExport';
import { saveAndShareFile } from '../utils/fileExport';
import { DEFAULT_RESTAURANT_LOGO } from '../utils/constants';
import {
  isBluetoothPrinterConnected,
  getSavedPrinterName,
  disconnectBluetoothPrinter,
  connectBluetoothPrinter,
  autoConnectSavedPrinter,
  printViaBluetooth,
  subscribeToPrinterStatus,
  isAndroidNative,
  openAndroidBluetoothSettings,
} from '../utils/printer';
import { PinModal } from './PinModal';
import { ImageCropperModal } from './ImageCropperModal';
import { BluetoothScanModal } from './BluetoothScanModal';
import { customAlert, customConfirm } from './CustomDialog';

interface SettingsScreenProps {
  profile: RestaurantProfile;
  bills: Bill[];
  onUpdateProfile: (updated: RestaurantProfile) => void;
  onRefreshData: () => void;
  onOpenPrinterModal?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  profile,
  bills,
  onUpdateProfile,
  onRefreshData,
  onOpenPrinterModal,
}) => {
  // Form State
  const [name, setName] = useState(profile.name);
  const [tagline, setTagline] = useState(profile.tagline);
  const [address, setAddress] = useState(profile.address);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email || '');
  const [gstin, setGstin] = useState(profile.gstin || '');
  const [fssai, setFssai] = useState(profile.fssai || '');
  const [upiVpa, setUpiVpa] = useState(profile.upiVpa);
  const [upiPayeeName, setUpiPayeeName] = useState(profile.upiPayeeName);
  const [headerText, setHeaderText] = useState(profile.headerText);
  const [footerText, setFooterText] = useState(profile.footerText);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(profile.logoUrl);

  // Logo Cropper State
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoCropperOpen, setLogoCropperOpen] = useState<boolean>(false);
  const [logoCropSrc, setLogoCropSrc] = useState<string>('');

  const [paperWidth, setPaperWidth] = useState<PaperWidth>(profile.paperWidth);
  const [currencySymbol, setCurrencySymbol] = useState<'₹' | 'Rs'>(profile.currencySymbol);
  const [billPrefix, setBillPrefix] = useState(profile.billPrefix);
  const [taxMode, setTaxMode] = useState<TaxMode>(profile.taxMode);
  const [defaultGstPercent, setDefaultGstPercent] = useState<number>(profile.defaultGstPercent);
  const [defaultBillMode, setDefaultBillMode] = useState<BillMode>(profile.defaultBillMode);
  const [defaultBillFormat, setDefaultBillFormat] = useState<'token_bill' | 'bill_only'>(
    profile.defaultBillFormat || (profile.defaultBillMode === 'token' || profile.defaultBillMode === 'combined' ? 'token_bill' : 'bill_only')
  );
  const [showQrOnBill, setShowQrOnBill] = useState<boolean>(
    profile.showQrOnBill !== undefined ? profile.showQrOnBill : profile.defaultBillMode !== 'normal'
  );
  const [billLogoSize, setBillLogoSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>(profile.billLogoSize || 'medium');
  const [defaultPackagingCharge, setDefaultPackagingCharge] = useState<number>(profile.defaultPackagingCharge ?? 10);

  const [pin, setPin] = useState(profile.pin);
  const [requirePinForActions, setRequirePinForActions] = useState(profile.requirePinForActions);

  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Safe Delete & Verified Export State
  const [selectedExportMonth, setSelectedExportMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // e.g. "2026-10"
  );
  const [safeDeleteStep, setSafeDeleteStep] = useState<number>(0); // 0=idle, 1=verified, 2=confirm
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [safeDeleteNotice, setSafeDeleteNotice] = useState<string | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [btConnected, setBtConnected] = useState<boolean>(isBluetoothPrinterConnected());
  const [btPrinterName, setBtPrinterName] = useState<string>(getSavedPrinterName());
  const [btConnecting, setBtConnecting] = useState<boolean>(false);
  const [btStatusNotice, setBtStatusNotice] = useState<string | null>(null);
  const [scannerModalOpen, setScannerModalOpen] = useState<boolean>(false);

  // Backup Data Input & Reset Setup State
  const [backupTextInput, setBackupTextInput] = useState<string>('');
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupRestoreMode, setBackupRestoreMode] = useState<'full' | 'menu_only'>('full');
  const [isRestoringBackup, setIsRestoringBackup] = useState<boolean>(false);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  const parsedBackupInfo = React.useMemo(() => {
    const raw = backupTextInput.trim();
    if (!raw) {
      return { isValid: false, categories: [], items: [], bills: [] as Bill[], profile: undefined, detectedType: '', error: undefined };
    }

    try {
      const data = JSON.parse(raw);

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const categories = Array.isArray(data.categories) ? data.categories : [];
        const items = Array.isArray(data.items) ? data.items : [];
        const bills = Array.isArray(data.bills) ? data.bills : [];
        const foundProfile = data.profile && typeof data.profile === 'object' && data.profile.name ? data.profile : undefined;

        if (items.length > 0 || categories.length > 0 || foundProfile || bills.length > 0) {
          const type = data.version
            ? `Full Database Backup (v${data.version})`
            : data.type === 'MENU_CATALOGUE'
            ? 'Complete Menu Catalogue'
            : 'POS Setup Backup';

          return {
            isValid: true,
            detectedType: type,
            profile: foundProfile,
            categories,
            items,
            bills,
            error: undefined,
          };
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        return {
          isValid: true,
          detectedType: 'Products Array',
          categories: [],
          items: data,
          bills: [] as Bill[],
          profile: undefined,
          error: undefined,
        };
      }

      return {
        isValid: false,
        error: 'JSON structure does not contain recognizable profile, products, or categories.',
        categories: [],
        items: [],
        bills: [] as Bill[],
        profile: undefined,
        detectedType: '',
      };
    } catch (err: any) {
      return {
        isValid: false,
        error: `Invalid JSON syntax: ${err.message || 'Check quotes or format'}`,
        categories: [],
        items: [],
        bills: [] as Bill[],
        profile: undefined,
        detectedType: '',
      };
    }
  }, [backupTextInput]);

  React.useEffect(() => {
    const unsub = subscribeToPrinterStatus((connected, name) => {
      setBtConnected(connected);
      if (name) setBtPrinterName(name);
    });
    // Check background connection on mount
    autoConnectSavedPrinter().then((res) => {
      if (res.connected) {
        setBtConnected(true);
        if (res.deviceName) setBtPrinterName(res.deviceName);
      }
    });
    return () => unsub();
  }, []);

  const handleConnectPrinter = async (forcePrompt: boolean = true) => {
    if (isAndroidNative() && onOpenPrinterModal) {
      onOpenPrinterModal();
      return;
    }
    setBtConnecting(true);
    setBtStatusNotice(forcePrompt ? 'Opening Bluetooth pairing dialog...' : 'Connecting to paired printer...');
    try {
      const res = await connectBluetoothPrinter(forcePrompt);
      if (res.success) {
        setBtConnected(true);
        setBtPrinterName(res.deviceName || getSavedPrinterName());
        setBtStatusNotice(`Connected to ${res.deviceName || 'MT580P'}! Ready for 1-click printing.`);
      } else {
        setBtStatusNotice(res.message || 'Printer connection failed');
      }
    } catch (err: any) {
      setBtStatusNotice(err.message || 'Connection error');
    } finally {
      setBtConnecting(false);
    }
  };

  const handleTestPrint = async () => {
    setBtConnecting(true);
    setBtStatusNotice('Sending test receipt to printer...');
    try {
      const testBuffer = new Uint8Array([
        0x1b, 0x40, // ESC @
        0x1d, 0x4c, 0x00, 0x00, // GS L 0 0 (Zero Left Margin)
        0x1b, 0x20, 0x00, // ESC SP 0 (Zero Char Space)
        0x1b, 0x61, 0x01, // Center
        0x1b, 0x45, 0x01, // Bold ON
        0x1d, 0x21, 0x01, // Double height
        ...Array.from('ORDER : # 0 0 0 0 1\n').map((c) => c.charCodeAt(0)),
        0x1d, 0x21, 0x00,
        0x1b, 0x45, 0x00,
        0x1b, 0x61, 0x00, // Left
        ...Array.from('--------------------------------\n').map((c) => c.charCodeAt(0)),
        ...Array.from('Bill: TEST-001          12:00 PM\n').map((c) => c.charCodeAt(0)),
        ...Array.from('Date: TODAY             TAKEAWAY\n').map((c) => c.charCodeAt(0)),
        ...Array.from('================================\n').map((c) => c.charCodeAt(0)),
        ...Array.from('ITEM              QTY RATE TOTAL\n').map((c) => c.charCodeAt(0)),
        ...Array.from('--------------------------------\n').map((c) => c.charCodeAt(0)),
        ...Array.from('Kulhad Chai         1x20 = 20.00\n').map((c) => c.charCodeAt(0)),
        ...Array.from('Samosa Chaat        1x40 = 40.00\n').map((c) => c.charCodeAt(0)),
        ...Array.from('--------------------------------\n').map((c) => c.charCodeAt(0)),
        ...Array.from('Subtotal:                  60.00\n').map((c) => c.charCodeAt(0)),
        ...Array.from('================================\n').map((c) => c.charCodeAt(0)),
        0x1b, 0x45, 0x01,
        0x1d, 0x21, 0x01,
        ...Array.from('TOTAL:                     60.00\n').map((c) => c.charCodeAt(0)),
        0x1d, 0x21, 0x00,
        0x1b, 0x45, 0x00,
        ...Array.from('================================\n').map((c) => c.charCodeAt(0)),
        ...Array.from('Payment Mode:                UPI\n').map((c) => c.charCodeAt(0)),
        ...Array.from('Status:                     PAID\n').map((c) => c.charCodeAt(0)),
        ...Array.from('--------------------------------\n').map((c) => c.charCodeAt(0)),
        0x1b, 0x61, 0x01,
        0x1b, 0x45, 0x01,
        ...Array.from('THANK YOU!\nVISIT AGAIN\n').map((c) => c.charCodeAt(0)),
        0x1b, 0x45, 0x00,
        ...Array.from('Powered by bookmydineqr\n\n\n\n').map((c) => c.charCodeAt(0)),
        0x1d, 0x56, 0x42, 0x00, // Cut
      ]);
      const res = await printViaBluetooth(testBuffer, true);
      if (res.success) {
        setBtStatusNotice('Test print sent successfully!');
      } else {
        setBtStatusNotice(res.message || 'Print failed');
      }
    } catch (err: any) {
      setBtStatusNotice(err.message || 'Print error');
    } finally {
      setBtConnecting(false);
    }
  };

  const handleDisconnectPrinter = () => {
    disconnectBluetoothPrinter(false); // Disconnects Bluetooth radio, retains pairing in memory for 1-click reconnect
    setBtConnected(false);
    setBtStatusNotice(`Disconnected from ${btPrinterName || 'printer'}. Click "Reconnect" anytime.`);
  };

  const handleForgetPrinter = () => {
    disconnectBluetoothPrinter(true); // Completely unpairs and clears stored printer
    setBtConnected(false);
    setBtPrinterName('');
    setBtStatusNotice('Printer unpaired. Click "Connect Bluetooth Printer" to pair a printer.');
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoCropSrc(reader.result);
        setLogoCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleOpenLogoCropper = () => {
    if (logoUrl) {
      setLogoCropSrc(logoUrl);
      setLogoCropperOpen(true);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const updated: RestaurantProfile = {
      ...profile,
      name: name.trim(),
      tagline: tagline.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      gstin: gstin.trim().toUpperCase() || undefined,
      fssai: fssai.trim() || undefined,
      upiVpa: upiVpa.trim(),
      upiPayeeName: upiPayeeName.trim(),
      headerText: headerText.trim(),
      footerText: footerText.trim(),
      logoUrl: logoUrl,
      paperWidth,
      currencySymbol,
      billPrefix: billPrefix.trim().toUpperCase() || 'B',
      taxMode,
      defaultGstPercent,
      defaultBillMode,
      defaultBillFormat,
      showQrOnBill,
      billLogoSize,
      defaultPackagingCharge: Number(defaultPackagingCharge) >= 0 ? Number(defaultPackagingCharge) : 10,
      pin: pin.trim() || '1234',
      requirePinForActions,
    };

    await db.profile.put(updated);
    onUpdateProfile(updated);
    setSaveSuccessNotice('Settings saved successfully!');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  // Full Backup (.bmdbackup JSON export)
  const handleFullBackup = async () => {
    try {
      const allBills = await db.bills.toArray();
      const allCategories = await db.categories.toArray();
      const allItems = await db.items.toArray();
      const allLogs = await db.auditLogs.toArray();

      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        profile,
        categories: allCategories,
        items: allItems,
        bills: allBills,
        auditLogs: allLogs,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const fileName = `Billing_Pro_Backup_${new Date().toISOString().slice(0, 10)}.bmdbackup`;
      
      await saveAndShareFile({
        blob,
        filename: fileName,
        mimeType: 'application/json',
        title: 'Billing Pro Database Backup',
        dialogTitle: 'Save or Share Database Backup',
      });
    } catch (err: any) {
      customAlert(err?.message || 'Backup export failed', 'Backup Failed', 'error');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setBackupTextInput(text);
          return;
        }
      }
      customAlert('Clipboard access is restricted. Please tap into the input box and use Paste (or Ctrl+V).', 'Clipboard Notice', 'info');
    } catch (err) {
      customAlert('Please tap into the input box and press Ctrl+V (or hold and tap Paste).', 'Paste Manual', 'info');
    }
  };

  const handleBackupFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setBackupTextInput(text);
    } catch (err: any) {
      customAlert(`Could not read backup file: ${err.message || 'Unknown error'}`, 'File Read Error', 'error');
    }
    e.target.value = '';
  };

  const handleExecuteRestoreAndReset = async () => {
    if (!parsedBackupInfo.isValid) {
      customAlert('Please enter or paste valid JSON backup data before resetting setup.', 'Invalid Backup Data', 'warning');
      return;
    }

    const { profile: bProfile, categories: bCats, items: bItems, bills: bBills, detectedType } = parsedBackupInfo;

    const itemsSummary = `${bItems.length} Products`;
    const catsSummary = `${bCats.length} Categories`;
    const profileSummary = bProfile?.name ? `Restaurant: "${bProfile.name}"` : 'Keep current profile';
    const billsSummary = backupRestoreMode === 'full'
      ? `• Invoices: ${bBills.length} restored (Existing will be reset)`
      : '• Invoices: Current billing invoices will be preserved';

    const confirmed = await customConfirm(
      `Are you sure you want to RESET SETUP and restore from backup?\n\nDetected:\n• ${detectedType}\n• ${profileSummary}\n• ${itemsSummary}\n• ${catsSummary}\n${billsSummary}\n\n⚠️ This action will replace your active menu and setup!`,
      'Confirm Setup Reset & Restore',
      'Yes, Reset & Restore',
      'Cancel',
      true
    );

    if (!confirmed) return;

    setIsRestoringBackup(true);
    try {
      await db.transaction('rw', db.profile, db.categories, db.items, db.bills, db.auditLogs, async () => {
        // 1. Profile
        if (bProfile && bProfile.name) {
          const mergedProfile: RestaurantProfile = {
            ...profile,
            ...bProfile,
            id: 'default',
          };
          await db.profile.put(mergedProfile);
          onUpdateProfile(mergedProfile);
        }

        // 2. Categories
        if (bCats.length > 0) {
          await db.categories.clear();
          await db.categories.bulkAdd(bCats);
        }

        // 3. Items / Products
        if (bItems.length > 0) {
          await db.items.clear();
          await db.items.bulkAdd(bItems);
        }

        // 4. Bills / Invoices (If Full Restore Mode)
        if (backupRestoreMode === 'full') {
          await db.bills.clear();
          if (bBills.length > 0) {
            await db.bills.bulkAdd(bBills);
          }
        }

        // 5. Audit Log
        await db.auditLogs.add({
          id: `audit_${Date.now()}`,
          action: 'RESET',
          detail: `POS setup reset and restored from backup data input (${detectedType})`,
          timestamp: Date.now(),
        });
      });

      await onRefreshData();

      setRestoreNotice(
        `Setup reset successfully! Restored ${bItems.length} products, ${bCats.length} categories${backupRestoreMode === 'full' ? ` and ${bBills.length} bills` : ''}.`
      );
      setBackupTextInput('');
      setTimeout(() => setRestoreNotice(null), 6000);

      customAlert(
        `POS Setup has been completely restored!\n\n• ${bItems.length} Products with prices\n• ${bCats.length} Categories\n${bProfile?.name ? `• Profile: ${bProfile.name}\n` : ''}${backupRestoreMode === 'full' ? `• ${bBills.length} Bills restored` : '• Invoices preserved'}`,
        'Setup Reset & Restored!',
        'info'
      );
    } catch (err: any) {
      console.error('Failed to restore setup:', err);
      customAlert(`Failed to restore backup: ${err.message || 'Unknown database error'}`, 'Restore Error', 'error');
    } finally {
      setIsRestoringBackup(false);
    }
  };

  // Verified Monthly Export & Safe Delete
  const handleVerifiedMonthlyExport = async () => {
    // Filter bills of selected month
    const targetBills = bills.filter((b) => {
      const dtStr = new Date(b.createdAt).toISOString().slice(0, 7);
      return dtStr === selectedExportMonth;
    });

    if (targetBills.length === 0) {
      customAlert(`No bills found in ${selectedExportMonth} to export.`, 'No Bills Found', 'info');
      return;
    }

    const res = await exportBillsToExcel(targetBills, profile.name, selectedExportMonth);
    if (res.success) {
      setSafeDeleteNotice(`Export verified! ${res.totalBills} bills exported and verified.`);
      setSafeDeleteStep(1);
    } else {
      customAlert(`Export verification failed: ${res.error}`, 'Verification Failed', 'error');
    }
  };

  // Verified Monthly PDF Export
  const handleVerifiedMonthlyPdfExport = async () => {
    const targetBills = bills.filter((b) => {
      const dtStr = new Date(b.createdAt).toISOString().slice(0, 7);
      return dtStr === selectedExportMonth;
    });

    if (targetBills.length === 0) {
      customAlert(`No bills found in ${selectedExportMonth} to export.`, 'No Bills Found', 'info');
      return;
    }

    const res = await exportBillsToPdf(targetBills, profile, selectedExportMonth);
    if (res.success) {
      setSafeDeleteNotice(`PDF report exported for ${selectedExportMonth}!`);
    } else {
      customAlert(`PDF export failed: ${res.error}`, 'PDF Export Failed', 'error');
    }
  };

  const handleExecuteSafeDelete = async () => {
    if (deleteConfirmationText.trim() !== 'DELETE') {
      customAlert('Please type DELETE in capital letters to confirm.', 'Confirmation Required', 'warning');
      return;
    }

    const targetBills = bills.filter((b) => {
      const dtStr = new Date(b.createdAt).toISOString().slice(0, 7);
      return dtStr === selectedExportMonth;
    });

    const targetIds = targetBills.map((b) => b.id);
    await db.bills.bulkDelete(targetIds);

    await db.auditLogs.add({
      id: `audit_${Date.now()}`,
      action: 'DELETE',
      detail: `Safe deleted ${targetIds.length} bills of ${selectedExportMonth} after verified export.`,
      timestamp: Date.now(),
    });

    setSafeDeleteStep(0);
    setDeleteConfirmationText('');
    setSafeDeleteNotice(`Safely deleted ${targetIds.length} bills from database.`);
    onRefreshData();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100dvh - 60px)',
      backgroundColor: 'var(--bg-app)',
      padding: '14px',
      paddingBottom: '90px',
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            Restaurant Profile & POS Settings
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Configure thermal receipt, tax modes, UPI QR, and storage safety
          </p>
        </div>

        {saveSuccessNotice && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--accent-green)',
            color: 'var(--accent-green)',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <CheckCircle2 size={18} />
            <span>{saveSuccessNotice}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SECTION 1: Restaurant Info */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Store size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Restaurant & Business Profile
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {/* Logo Upload & Crop Block */}
              <div style={{
                gridColumn: '1 / -1',
                padding: '14px 16px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}>
                {/* Logo Image Preview */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '2px solid var(--primary)',
                  boxShadow: '0 4px 14px var(--primary-glow)',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  padding: '4px',
                }}>
                  <img
                    src={logoUrl || DEFAULT_RESTAURANT_LOGO}
                    alt="Store Logo"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                      Restaurant Brand Logo
                    </div>
                    {logoUrl === DEFAULT_RESTAURANT_LOGO && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 750,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                      }}>
                        DEFAULT LOGO
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 10px 0' }}>
                    Upload your shop logo or icon. Appears in app header and prints on the customer bill.
                  </p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogoFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      <Upload size={13} />
                      <span>{logoUrl && logoUrl !== DEFAULT_RESTAURANT_LOGO ? 'Change Logo' : 'Upload Custom Logo'}</span>
                    </button>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={handleOpenLogoCropper}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <Crop size={13} />
                        <span>Crop / Reposition</span>
                      </button>
                    )}

                    {logoUrl !== DEFAULT_RESTAURANT_LOGO && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl(DEFAULT_RESTAURANT_LOGO)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--primary)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Reset to default BookMyDine restaurant emblem"
                      >
                        Use Default Logo
                      </button>
                    )}

                    {logoUrl && logoUrl !== DEFAULT_RESTAURANT_LOGO && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl(undefined)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: 'var(--accent-rose)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Option for Size of Logo in Bill (Dedicated & Visual) */}
                <div style={{
                  width: '100%',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                        📏 Bill Logo Size
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Select the height of the brand logo on thermal customer receipts
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 750,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--primary-subtle)',
                      color: 'var(--primary-hover)',
                    }}>
                      Current: {billLogoSize === 'small' ? 'Small (36px)' : billLogoSize === 'large' ? 'Large (68px)' : billLogoSize === 'xlarge' ? 'Extra Large (84px)' : 'Medium (52px - Recommended)'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                    {[
                      { id: 'small', label: 'Small', height: '36px', desc: '36px • Compact' },
                      { id: 'medium', label: 'Medium', height: '52px', desc: '52px • Recommended' },
                      { id: 'large', label: 'Large', height: '68px', desc: '68px • Bold' },
                      { id: 'xlarge', label: 'X-Large', height: '84px', desc: '84px • Grand' },
                    ].map((sz) => {
                      const isSelected = billLogoSize === sz.id;
                      return (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => setBillLogoSize(sz.id as any)}
                          style={{
                            padding: '10px 8px',
                            borderRadius: '10px',
                            border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                            backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                            color: isSelected ? 'var(--primary-hover)' : 'var(--text-body)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '3px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ fontSize: '12.5px', fontWeight: 800 }}>{sz.label}</span>
                          <span style={{ fontSize: '10px', color: isSelected ? 'var(--primary)' : 'var(--text-dim)', fontWeight: 600 }}>
                            {sz.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Restaurant / Café Name
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Tagline / Subheading
                </label>
                <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Full Address (Prints on Thermal Bill)
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  GSTIN (15 Characters)
                </label>
                <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="07AAAAA0000A1Z5" style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  FSSAI License No (14 Digits)
                </label>
                <input type="text" value={fssai} onChange={(e) => setFssai(e.target.value)} placeholder="10019011000123" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* SECTION 2: Dynamic UPI QR Code Configuration */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <QrCode size={20} color="var(--accent-green)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Dynamic UPI QR Payment Settings
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Payee Display Name
                </label>
                <input
                  type="text"
                  value={upiPayeeName}
                  onChange={(e) => setUpiPayeeName(e.target.value)}
                  placeholder="e.g. BookMyDine Express"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Thermal Bill & Tax Preferences */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Printer size={20} color="var(--accent-amber)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Receipt & GST Preferences
              </h3>
            </div>

            {/* THERMAL PRINTER HARDWARE CONNECTION CARD */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: btConnected ? 'rgba(22, 163, 74, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: btConnected ? '#16A34A' : '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Printer size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                      Bluetooth Thermal Printer
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: btConnected ? '#16A34A' : btPrinterName ? '#D97706' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 700,
                        marginTop: '2px',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: btConnected ? '#16A34A' : btPrinterName ? '#F59E0B' : '#94A3B8',
                          display: 'inline-block',
                          boxShadow: btConnected ? '0 0 8px rgba(22, 163, 74, 0.6)' : 'none',
                        }}
                      />
                      {btConnected
                        ? `Connected: ${btPrinterName || 'MT580P'}`
                        : btPrinterName
                        ? `Saved: ${btPrinterName} (Offline)`
                        : 'No Printer Connected'}
                    </div>
                  </div>
                </div>

                {/* Scan Button on Header */}
                <button
                  type="button"
                  onClick={() => setScannerModalOpen(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 750,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <Bluetooth size={14} />
                  <span>Scan Nearby Printers</span>
                </button>
              </div>

              {btStatusNotice && (
                <div
                  style={{
                    fontSize: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    marginBottom: '12px',
                    fontWeight: 600,
                  }}
                >
                  {btStatusNotice}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                {btConnected ? (
                  <>
                    <button
                      type="button"
                      onClick={handleTestPrint}
                      disabled={btConnecting}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '9px',
                        backgroundColor: '#15803D',
                        color: '#FFFFFF',
                        fontWeight: 750,
                        fontSize: '12px',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Play size={14} />
                      <span>Print Test Bill</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnectPrinter}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '9px',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        fontWeight: 750,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} />
                      <span>Disconnect</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setScannerModalOpen(true)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '9px',
                        backgroundColor: '#16A34A',
                        color: '#FFFFFF',
                        fontWeight: 750,
                        fontSize: '12px',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Bluetooth size={14} />
                      <span>Connect Printer</span>
                    </button>

                    {btPrinterName && (
                      <button
                        type="button"
                        onClick={handleForgetPrinter}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '9px',
                          backgroundColor: 'transparent',
                          color: '#94A3B8',
                          border: '1px solid var(--border-color)',
                          fontWeight: 650,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                        }}
                      >
                        Forget Saved
                      </button>
                    )}
                  </>
                )}

                {isAndroidNative() && (
                  <button
                    type="button"
                    onClick={() => openAndroidBluetoothSettings()}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '9px',
                      backgroundColor: 'transparent',
                      color: '#2563EB',
                      border: '1px solid rgba(37, 99, 235, 0.25)',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    <Smartphone size={13} />
                    <span>Phone Bluetooth Settings</span>
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Thermal Paper Roll Width
                </label>
                <select value={paperWidth} onChange={(e) => setPaperWidth(Number(e.target.value) as PaperWidth)} style={{ width: '100%' }}>
                  <option value={58}>58 mm (Standard 2-inch roll)</option>
                  <option value={80}>80 mm (Wide 3-inch roll)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  GST Tax Mode
                </label>
                <select value={taxMode} onChange={(e) => setTaxMode(e.target.value as TaxMode)} style={{ width: '100%' }}>
                  <option value="exclusive">Tax Exclusive (Added on top)</option>
                  <option value="inclusive">Tax Inclusive (Included in price)</option>
                  <option value="none">No Tax / Bill of Supply (Composition)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Default GST Rate (%)
                </label>
                <select value={defaultGstPercent} onChange={(e) => setDefaultGstPercent(Number(e.target.value))} style={{ width: '100%' }}>
                  <option value={0}>0%</option>
                  <option value={5}>5% (Restaurant standard)</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Bill Prefix (GST compliant)
                </label>
                <input
                  type="text"
                  value={billPrefix}
                  onChange={(e) => setBillPrefix(e.target.value)}
                  maxLength={4}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Currency Symbol
                </label>
                <select value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value as '₹' | 'Rs')} style={{ width: '100%' }}>
                  <option value="₹">₹ (Rupee Symbol)</option>
                  <option value="Rs">Rs (Text fallback for basic printers)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Default Bill Type
                </label>
                <select
                  value={defaultBillFormat}
                  onChange={(e) => {
                    const val = e.target.value as 'token_bill' | 'bill_only';
                    setDefaultBillFormat(val);
                    if (val === 'token_bill') {
                      setDefaultBillMode(showQrOnBill ? 'combined' : 'token');
                    } else {
                      setDefaultBillMode(showQrOnBill ? 'qr' : 'normal');
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="token_bill">🎟️ Token + Bill (Top Kitchen Slip + Cut Line + Bill)</option>
                  <option value="bill_only">🧾 Bill Only (Clean Customer Receipt directly)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  UPI Payment QR Code on Bill
                </label>
                <select
                  value={showQrOnBill ? 'yes' : 'no'}
                  onChange={(e) => {
                    const withQr = e.target.value === 'yes';
                    setShowQrOnBill(withQr);
                    if (defaultBillFormat === 'token_bill') {
                      setDefaultBillMode(withQr ? 'combined' : 'token');
                    } else {
                      setDefaultBillMode(withQr ? 'qr' : 'normal');
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="yes">📱 Include Dynamic UPI QR Code (Scan with GPay/PhonePe/Paytm)</option>
                  <option value="no">🚫 Do Not Print QR Code (Clean Bill)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Bill Logo Size
                </label>
                <select
                  value={billLogoSize}
                  onChange={(e) => setBillLogoSize(e.target.value as any)}
                  style={{ width: '100%' }}
                >
                  <option value="small">Small (36px height) - Compact</option>
                  <option value="medium">Medium (52px height) - Standard (Recommended)</option>
                  <option value="large">Large (68px height) - Bold</option>
                  <option value="xlarge">Extra Large (84px height) - Big Brand Header</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  📦 Default Packaging Charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={defaultPackagingCharge}
                  onChange={(e) => setDefaultPackagingCharge(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="10"
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                  Auto-applied to Takeaway and Delivery orders (default ₹10)
                </span>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Footer Message (Prints at bottom of receipt)
                </label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Owner Security & PIN */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Shield size={20} color="var(--accent-rose)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Owner Security & App Lock
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Owner PIN (4 Digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{ width: '100%', fontSize: '18px', letterSpacing: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
                <input
                  type="checkbox"
                  id="requirePinCheckbox"
                  checked={requirePinForActions}
                  onChange={(e) => setRequirePinForActions(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="requirePinCheckbox" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                  Require PIN for Bill Cancel, Price Overrides & Settings
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="glow-btn-green"
            style={{
              padding: '16px',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Save size={18} />
            <span>Save All POS Settings</span>
          </button>
        </form>

        {/* SECTION 5: Storage Safety, Verified Export & Safe Delete */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '20px',
          marginTop: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Database size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Data Safety, Backup & Verified Monthly Export
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            BookMyDine Bill works 100% offline with on-device SQLite / IndexedDB. Your phone is the sole storage.
            Ensure you back up data periodically to Google Drive, SD Card, or WhatsApp.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button
              onClick={handleFullBackup}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              <Download size={16} />
              <span>Full App Backup (.bmdbackup)</span>
            </button>
          </div>

          {/* ENTER BACKUP DATA TO RESET SETUP */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '16px',
              padding: '18px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    Enter Backup Data to Reset Setup
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Paste backup JSON data or choose a backup file to reset and restore your POS setup.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Paste Clipboard & Choose File */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: '#1E293B',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Paste JSON from device clipboard"
                >
                  <ClipboardCopy size={14} />
                  <span>Paste from Clipboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#2563EB',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Upload .bmdbackup or .json file"
                >
                  <FileUp size={14} />
                  <span>Choose Backup File</span>
                </button>
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".bmdbackup,.json,application/json"
                  style={{ display: 'none' }}
                  onChange={handleBackupFileUpload}
                />

                {backupTextInput.trim() && (
                  <button
                    type="button"
                    onClick={() => setBackupTextInput('')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#FEE2E2',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Clear input text"
                  >
                    <X size={14} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification alert on success */}
            {restoreNotice && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  color: '#166534',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <CheckCircle2 size={16} color="#16A34A" />
                <span>{restoreNotice}</span>
              </div>
            )}

            {/* JSON Textarea */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <textarea
                value={backupTextInput}
                onChange={(e) => setBackupTextInput(e.target.value)}
                placeholder='Paste raw backup JSON text here... e.g. {"version":"1.0","profile":{...},"categories":[...],"items":[...]}'
                rows={5}
                style={{
                  width: '100%',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  padding: '12px',
                  borderRadius: '10px',
                  border: parsedBackupInfo.isValid
                    ? '1.5px solid #16A34A'
                    : parsedBackupInfo.error
                    ? '1.5px solid #EF4444'
                    : '1.5px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#0F172A',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Live Data Detection & Summary Card */}
            {backupTextInput.trim() && (
              <div style={{ marginBottom: '14px' }}>
                {parsedBackupInfo.isValid ? (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={16} /> Valid Backup Detected: {parsedBackupInfo.detectedType}
                      </span>
                      {parsedBackupInfo.profile?.name && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
                          Restaurant: {parsedBackupInfo.profile.name}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid #86EFAC', color: '#166534' }}>
                        🥗 {parsedBackupInfo.categories.length} Categories
                      </span>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid #86EFAC', color: '#166534' }}>
                        🍽️ {parsedBackupInfo.items.length} Products / Dishes
                      </span>
                      {parsedBackupInfo.bills.length > 0 && (
                        <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid #86EFAC', color: '#166534' }}>
                          🧾 {parsedBackupInfo.bills.length} Invoices
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertTriangle size={16} color="#DC2626" />
                    <span>{parsedBackupInfo.error || 'Invalid backup data format'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Restore Options & Action Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '6px',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="restoreMode"
                    value="full"
                    checked={backupRestoreMode === 'full'}
                    onChange={() => setBackupRestoreMode('full')}
                  />
                  <span>Full Setup Reset (Wipe & Restore All)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="restoreMode"
                    value="menu_only"
                    checked={backupRestoreMode === 'menu_only'}
                    onChange={() => setBackupRestoreMode('menu_only')}
                  />
                  <span>Menu & Profile Only (Keep Existing Invoices)</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleExecuteRestoreAndReset}
                disabled={!parsedBackupInfo.isValid || isRestoringBackup}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  borderRadius: '10px',
                  backgroundColor: parsedBackupInfo.isValid && !isRestoringBackup ? '#16A34A' : '#94A3B8',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: parsedBackupInfo.isValid && !isRestoringBackup ? 'pointer' : 'not-allowed',
                  boxShadow: parsedBackupInfo.isValid ? '0 4px 12px rgba(22, 163, 74, 0.3)' : 'none',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <RotateCcw size={16} />
                <span>{isRestoringBackup ? 'Resetting & Restoring...' : 'Reset Setup & Apply Backup'}</span>
              </button>
            </div>
          </div>

          {/* Safe Monthly Delete Routine (PRD Section 6.9) */}
          <div style={{
            backgroundColor: 'var(--bg-app)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)', marginBottom: '8px' }}>
              <AlertTriangle size={18} />
              <span style={{ fontSize: '14px', fontWeight: 800 }}>Verified Monthly Export & Safe Delete</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Compliant data retention: Bills can only be permanently purged after an Excel export is created and verified.
            </p>

            {safeDeleteNotice && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-green)',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '10px',
              }}>
                {safeDeleteNotice}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="month"
                value={selectedExportMonth}
                onChange={(e) => {
                  setSelectedExportMonth(e.target.value);
                  setSafeDeleteStep(0);
                }}
                style={{ fontSize: '13px', fontWeight: 700 }}
              />

              {safeDeleteStep === 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleVerifiedMonthlyExport}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid var(--primary)',
                      color: 'var(--primary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <FileSpreadsheet size={16} />
                    <span>Step 1: Export & Verify Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleVerifiedMonthlyPdfExport}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      border: '1px solid #DC2626',
                      color: '#DC2626',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <FileText size={16} />
                    <span>Export PDF Report</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    style={{ flex: 1, border: '1px solid var(--accent-rose)' }}
                  />
                  <button
                    type="button"
                    onClick={handleExecuteSafeDelete}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--accent-rose)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 800,
                    }}
                  >
                    Confirm Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 6: Web Users Direct App Download */}
        {!Capacitor.isNativePlatform() && (
          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              borderRadius: '20px',
              padding: '20px',
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Smartphone size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 800, color: '#1E3A8A' }}>
                  Install Billing Pro Android App
                </h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#3B82F6' }}>
                  Get real Bluetooth SPP thermal printing for MT580P, MPT-II, POS-5802, plus full offline POS.
                </p>
              </div>
            </div>

            <a
              href="/billing-pro-pos-release.apk"
              download="billing-pro-pos-release.apk"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '10px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Download size={16} />
              <span>Download Release APK</span>
            </a>
          </div>
        )}
      </div>
      {/* LOGO IMAGE CROPPER MODAL */}
      <ImageCropperModal
        isOpen={logoCropperOpen}
        imageSrc={logoCropSrc}
        title="Crop Restaurant Brand Logo"
        aspectRatio={1}
        isCircle={true}
        onCropComplete={(cropped) => setLogoUrl(cropped)}
        onClose={() => setLogoCropperOpen(false)}
      />

      {/* REAL BLUETOOTH PRINTER SCANNER MODAL */}
      <BluetoothScanModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onPrinterConnected={(name) => {
          setBtConnected(true);
          setBtPrinterName(name);
          setBtStatusNotice(`Connected to ${name}!`);
        }}
      />
    </div>
  );
};
