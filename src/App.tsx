import React, { useState, useEffect, useCallback } from 'react';
import type {
  RestaurantProfile,
  Category,
  Item,
  Bill,
  HeldBill,
  PaperWidth,
  TabKey
} from './types';
import {
  db,
  initializeDatabase,
  DEFAULT_PROFILE
} from './db';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BillingScreen } from './components/BillingScreen';
import { BillHistory } from './components/BillHistory';
import { MenuManager } from './components/MenuManager';
import { SettingsScreen } from './components/SettingsScreen';
import { PrinterModal } from './components/PrinterModal';
import { HeldBillsModal } from './components/HeldBillsModal';
import { PinModal } from './components/PinModal';
import { CustomDialogHost } from './components/CustomDialog';
import { initializeCapacitor } from './utils/capacitor';
import { getDailyOrderKey } from './utils/numbering';
import { autoConnectSavedPrinter, isBluetoothPrinterConnected, subscribeToPrinterStatus } from './utils/printer';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<RestaurantProfile>(DEFAULT_PROFILE);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [latestOrderNo, setLatestOrderNo] = useState<number>(0);

  // Active navigation tab (Landing on Dashboard on App Launch)
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');

  // Omnisearch and punch from header
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [pendingItemToAdd, setPendingItemToAdd] = useState<Item | null>(null);
  const [activeCartCount, setActiveCartCount] = useState<number>(0);

  const handleAddItemFromSearch = (item: Item) => {
    setPendingItemToAdd(item);
    setCurrentTab('billing');
  };

  // Sidebar responsive states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Modals
  const [printerModalOpen, setPrinterModalOpen] = useState<boolean>(false);
  const [heldBillsModalOpen, setHeldBillsModalOpen] = useState<boolean>(false);
  const [printerConnected, setPrinterConnected] = useState<boolean>(false);

  // App Lock State (Owner PIN)
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load Database Records
  const loadDatabaseData = useCallback(async () => {
    try {
      await initializeDatabase();

      const loadedProfile = (await db.profile.get('default')) || DEFAULT_PROFILE;
      const loadedCategories = await db.categories.orderBy('sortOrder').toArray();
      const loadedItems = await db.items.orderBy('sortOrder').toArray();
      const loadedBills = await db.bills.orderBy('createdAt').reverse().toArray();
      const loadedHeld = await db.heldBills.orderBy('savedAt').reverse().toArray();

      // Latest Order Sequence for Today (Resets daily at 00:00)
      const todayOrderKey = getDailyOrderKey(new Date());
      const orderCounterRecord = await db.counters.get(todayOrderKey);
      const currentOrderSeq = orderCounterRecord?.value || 0;

      setProfile(loadedProfile);
      setCategories(loadedCategories);
      setItems(loadedItems);
      setBills(loadedBills);
      setHeldBills(loadedHeld);
      setLatestOrderNo(currentOrderSeq);
      setIsLoaded(true);
    } catch (err) {
      console.error('Error loading database:', err);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();
    initializeCapacitor();

    // Listen to real-time Bluetooth thermal printer connection/disconnection
    const unsubscribePrinter = subscribeToPrinterStatus((connected) => {
      setPrinterConnected(connected);
    });

    // Auto-connect to saved Bluetooth thermal printer in background (no dialog popups)
    autoConnectSavedPrinter();

    return () => {
      unsubscribePrinter();
    };
  }, [loadDatabaseData]);

  const handleUpdatePaperWidth = async (width: PaperWidth) => {
    const updated = { ...profile, paperWidth: width };
    await db.profile.put(updated);
    setProfile(updated);
  };

  const handleResumeHeldBill = async (heldBill: HeldBill) => {
    await db.heldBills.delete(heldBill.id);
    setHeldBillsModalOpen(false);
    setCurrentTab('billing');
    await loadDatabaseData();
  };

  if (!isLoaded) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          color: 'var(--text-main)',
          fontSize: '18px',
          fontWeight: 800,
        }}
      >
        Loading BillFlow POS...
      </div>
    );
  }

  // App Lock Screen
  if (isAppLocked) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
        }}
      >
        <PinModal
          isOpen={true}
          correctPin={profile.pin}
          title="App Locked"
          subtitle="Enter Owner PIN to unlock BillFlow POS"
          onSuccess={() => setIsAppLocked(false)}
          onClose={() => {}}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
      }}
    >
      {/* 1. LEFT SIDEBAR (Desktop Fixed, Tablet Compact, Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLockApp={() => setIsAppLocked(true)}
      />

      {/* 2. MAIN APP CONTAINER (Top Header + Dynamic View) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Bar Matching Reference Design */}
        <Header
          profile={profile}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          printerConnected={printerConnected}
          onOpenPrinterModal={() => setPrinterModalOpen(true)}
          latestOrderNo={latestOrderNo}
          heldBillsCount={heldBills.length}
          onOpenHeldBills={() => setHeldBillsModalOpen(true)}
          onLockApp={() => setIsAppLocked(true)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          onQuickCreate={(type) => {
            if (type === 'bill') setCurrentTab('billing');
            if (type === 'product') setCurrentTab('menu');
          }}
          activeCartCount={activeCartCount}
        />

        {/* View Switcher */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* We keep BillingScreen mounted so in-progress orders are never lost when checking other tabs */}
          <div style={{ display: currentTab === 'billing' ? 'block' : 'none', height: '100%', width: '100%' }}>
            <BillingScreen
              categories={categories}
              items={items}
              profile={profile}
              latestOrderNo={latestOrderNo}
              onRefreshData={loadDatabaseData}
              onOpenHeldBills={() => setHeldBillsModalOpen(true)}
              globalSearch={globalSearch}
              onClearGlobalSearch={() => setGlobalSearch('')}
              externalAddItem={pendingItemToAdd}
              onConsumeExternalAddItem={() => setPendingItemToAdd(null)}
              onCartChange={(count) => setActiveCartCount(count)}
            />
          </div>

          {currentTab === 'dashboard' && (
            <Dashboard
              bills={bills}
              items={items}
              categories={categories}
              profile={profile}
              latestOrderNo={latestOrderNo}
              heldBillsCount={heldBills.length}
              onNavigateTab={setCurrentTab}
              onOpenPrinterModal={() => setPrinterModalOpen(true)}
              onOpenHeldBills={() => setHeldBillsModalOpen(true)}
              onRefreshData={loadDatabaseData}
            />
          )}

          {currentTab === 'menu' && (
            <MenuManager
              categories={categories}
              items={items}
              profile={profile}
              onRefreshData={loadDatabaseData}
              globalSearch={globalSearch}
              onClearGlobalSearch={() => setGlobalSearch('')}
            />
          )}

          {(currentTab === 'history' || currentTab === 'reports') && (
            <BillHistory
              bills={bills}
              profile={profile}
              onRefreshData={loadDatabaseData}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsScreen
              profile={profile}
              bills={bills}
              onUpdateProfile={setProfile}
              onRefreshData={loadDatabaseData}
              onOpenPrinterModal={() => setPrinterModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly for smartphone screens) */}
      <nav
        className="mobile-bottom-nav no-print"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid #E2E8F0',
          display: 'none', // Controlled by media queries in index.css
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 50,
          boxShadow: '0 -4px 20px rgba(15, 23, 42, 0.08)',
          paddingLeft: '8px',
          paddingRight: '8px',
        }}
      >
        <button
          onClick={() => setCurrentTab('dashboard')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: currentTab === 'dashboard' ? '#EFF6FF' : 'transparent',
            border: 'none',
            borderRadius: '12px',
            color: currentTab === 'dashboard' ? '#2563EB' : '#64748B',
            padding: '6px 0',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentTab === 'dashboard' ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="2" fill={currentTab === 'dashboard' ? "rgba(37, 99, 235, 0.15)" : "none"} />
            <rect x="14" y="3" width="7" height="7" rx="2" fill={currentTab === 'dashboard' ? "rgba(37, 99, 235, 0.15)" : "none"} />
            <rect x="14" y="14" width="7" height="7" rx="2" fill={currentTab === 'dashboard' ? "rgba(37, 99, 235, 0.15)" : "none"} />
            <rect x="3" y="14" width="7" height="7" rx="2" fill={currentTab === 'dashboard' ? "rgba(37, 99, 235, 0.15)" : "none"} />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: currentTab === 'dashboard' ? 700 : 500, letterSpacing: '-0.01em' }}>Home</span>
        </button>

        <button
          onClick={() => setCurrentTab('billing')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: currentTab === 'billing' ? '#EFF6FF' : 'transparent',
            border: 'none',
            borderRadius: '12px',
            color: currentTab === 'billing' ? '#2563EB' : '#64748B',
            padding: '6px 0',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentTab === 'billing' ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" fill={currentTab === 'billing' ? "rgba(37, 99, 235, 0.15)" : "none"} />
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            <path d="M12 6v12" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: currentTab === 'billing' ? 700 : 500, letterSpacing: '-0.01em' }}>Billing</span>
        </button>

        <button
          onClick={() => setCurrentTab('menu')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: currentTab === 'menu' ? '#EFF6FF' : 'transparent',
            border: 'none',
            borderRadius: '12px',
            color: currentTab === 'menu' ? '#2563EB' : '#64748B',
            padding: '6px 0',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentTab === 'menu' ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" fill={currentTab === 'menu' ? "rgba(37, 99, 235, 0.15)" : "none"} />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: currentTab === 'menu' ? 700 : 500, letterSpacing: '-0.01em' }}>Products</span>
        </button>

        <button
          onClick={() => setCurrentTab('history')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: currentTab === 'history' ? '#EFF6FF' : 'transparent',
            border: 'none',
            borderRadius: '12px',
            color: currentTab === 'history' ? '#2563EB' : '#64748B',
            padding: '6px 0',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentTab === 'history' ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" fill={currentTab === 'history' ? "rgba(37, 99, 235, 0.15)" : "none"} />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: currentTab === 'history' ? 700 : 500, letterSpacing: '-0.01em' }}>Invoices</span>
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: currentTab === 'settings' ? '#EFF6FF' : 'transparent',
            border: 'none',
            borderRadius: '12px',
            color: currentTab === 'settings' ? '#2563EB' : '#64748B',
            padding: '6px 0',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentTab === 'settings' ? "2.3" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" fill={currentTab === 'settings' ? "rgba(37, 99, 235, 0.15)" : "none"} />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: currentTab === 'settings' ? 700 : 500, letterSpacing: '-0.01em' }}>Settings</span>
        </button>
      </nav>

      {/* 4. MODALS & GLOBAL OVERLAYS */}
      <PrinterModal
        isOpen={printerModalOpen}
        onClose={() => setPrinterModalOpen(false)}
        profile={profile}
        onUpdatePaperWidth={handleUpdatePaperWidth}
        printerConnected={printerConnected}
        setPrinterConnected={setPrinterConnected}
        onTestBrowserPrint={() => window.print()}
      />

      <HeldBillsModal
        isOpen={heldBillsModalOpen}
        onClose={() => setHeldBillsModalOpen(false)}
        heldBills={heldBills}
        profile={profile}
        onResumeHeldBill={handleResumeHeldBill}
        onRefreshData={loadDatabaseData}
      />

      {/* GLOBAL CUSTOM IN-APP DIALOG HOST */}
      <CustomDialogHost />
    </div>
  );
};

export default App;
