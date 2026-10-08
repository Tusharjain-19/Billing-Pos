import React from 'react';
import {
  Menu,
  Receipt,
  UtensilsCrossed,
  FileText,
  BarChart3,
  Settings,
  LayoutGrid,
  PauseCircle,
  Smartphone,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { isElectronApp } from '../utils/electronStorage';
import { BrandLogo } from './BrandLogo';
import type { RestaurantProfile, TabKey } from '../types';

interface HeaderProps {
  profile: RestaurantProfile;
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  printerConnected: boolean;
  onOpenPrinterModal: () => void;
  latestOrderNo: number;
  heldBillsCount: number;
  onOpenHeldBills: () => void;
  onLockApp?: () => void;
  onToggleMobileMenu?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onQuickCreate?: (type: 'bill' | 'product') => void;
  activeCartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  currentTab,
  onSelectTab,
  heldBillsCount,
  onOpenHeldBills,
  onToggleMobileMenu,
  onToggleSidebar,
  isSidebarCollapsed = false,
  activeCartCount = 0,
}) => {
  const navModules = [
    { key: 'billing' as TabKey, label: 'Billing', icon: Receipt, badge: activeCartCount > 0 ? activeCartCount : null },
    { key: 'menu' as TabKey, label: 'Menu Items', icon: UtensilsCrossed, badge: null },
    { key: 'history' as TabKey, label: 'Invoices', icon: FileText, badge: null },
    { key: 'reports' as TabKey, label: 'Reports', icon: BarChart3, badge: null },
    { key: 'settings' as TabKey, label: 'Settings', icon: Settings, badge: null },
    { key: 'dashboard' as TabKey, label: 'Dashboard', icon: LayoutGrid, badge: null },
  ];

  return (
    <header
      className="billflow-header no-print"
      style={{
        minHeight: '64px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: '0px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        gap: '12px',
        userSelect: 'none',
        boxSizing: 'border-box',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* 1. LEFT: 3-Line Hamburger Menu & Segmented Top Navigation Modules */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
        {/* 3-Line Hamburger / Sidebar Slide Toggle Button with Animation */}
        <button
          onClick={() => {
            if (window.innerWidth <= 1024 && onToggleMobileMenu) {
              onToggleMobileMenu();
            } else if (onToggleSidebar) {
              onToggleSidebar();
            } else if (onToggleMobileMenu) {
              onToggleMobileMenu();
            }
          }}
          className="header-menu-toggle-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
          title="Open Navigation Menu / Sidebar"
          aria-label="Open Navigation Menu / Sidebar"
        >
          <Menu size={18} strokeWidth={2.2} />
        </button>

        {/* Segmented Top Navbar Modules */}
        <nav
          className="header-segmented-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F1F5F9',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            gap: '3px',
            overflowX: 'auto',
            maxWidth: '100%',
            flexShrink: 1,
          }}
          aria-label="POS Modules"
        >
          {navModules.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: isActive ? 750 : 600,
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#2563EB' : '#64748B',
                  boxShadow: isActive ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                  border: isActive ? '1px solid #E2E8F0' : '1px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#0F172A';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#64748B';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon size={14} color={isActive ? '#2563EB' : '#64748B'} strokeWidth={isActive ? 2.5 : 2} />
                <span className="header-nav-label">{tab.label}</span>
                {tab.badge !== null && tab.badge > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '999px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      marginLeft: '2px',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. RIGHT: Actions & "Billing Pro" Brand Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Parked / Held Bills Button (if any) */}
        {heldBillsCount > 0 && (
          <button
            onClick={onOpenHeldBills}
            style={{
              height: '36px',
              padding: '0 12px',
              borderRadius: '10px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FCD34D',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 750,
              cursor: 'pointer',
              animation: 'pulse 2s infinite',
            }}
            title="View Parked / Held Bills"
          >
            <PauseCircle size={15} color="#B45309" />
            <span>Parked</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: '#F59E0B',
                color: '#FFFFFF',
              }}
            >
              {heldBillsCount}
            </span>
          </button>
        )}

        {/* Website Download App Button (Hidden on Android & PC Desktop) */}
        {!Capacitor.isNativePlatform() && !isElectronApp() && (
          <a
            href="./billing-pro-pos-release.apk"
            download="billing-pro-pos-release.apk"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#2563EB',
              fontSize: '12px',
              fontWeight: 750,
              textDecoration: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            title="Download Billing Pro Android App (.apk)"
          >
            <Smartphone size={14} color="#2563EB" />
            <span className="header-quick-text">Download App</span>
          </a>
        )}

        {/* APP BRANDING: "Billing Pro by BookMyDine QR" with Geometric Emblem */}
        <div
          onClick={() => onSelectTab('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '2px 4px',
            cursor: 'pointer',
            transition: 'opacity 0.14s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          title="Billing Pro by BookMyDine QR | Settings & Profile"
        >
          <BrandLogo size="sm" subtitle="by BookMyDine QR" />
        </div>
      </div>
    </header>
  );
};
