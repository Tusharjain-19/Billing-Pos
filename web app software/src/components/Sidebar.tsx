import React from 'react';
import {
  LayoutGrid,
  Package,
  Receipt,
  FileText,
  BarChart3,
  Settings,
  Users,
  Moon,
  Sun,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Lock,
  Smartphone,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { isElectronApp } from '../utils/electronStorage';
import { BrandLogo } from './BrandLogo';
import type { RestaurantProfile, TabKey } from '../types';
export type { TabKey };

interface SidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  profile: RestaurantProfile;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLockApp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  onLockApp,
}) => {
  const navItems: { key: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={19} /> },
    { key: 'billing', label: 'Billing', icon: <Receipt size={19} /> },
    { key: 'menu', label: 'Products', icon: <Package size={19} /> },
    { key: 'history', label: 'Invoices', icon: <FileText size={19} /> },
    { key: 'reports', label: 'Reports', icon: <BarChart3 size={19} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={19} /> },
  ];

  const sidebarContent = (
    <aside
      className="billflow-sidebar"
      style={{
        width: isCollapsed ? '72px' : '240px',
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Top Header & Brand */}
      <div>
        <div
          style={{
            minHeight: '62px',
            paddingLeft: isCollapsed ? '10px' : '16px',
            paddingRight: isCollapsed ? '10px' : '16px',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            borderBottom: '1px solid var(--border-color)',
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          {isCollapsed ? (
            <div
              onClick={onToggleCollapse}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Click to expand sidebar"
            >
              <BrandLogo size="sm" iconOnly />
            </div>
          ) : (
            <>
              <BrandLogo size="md" subtitle={profile.name} />

              {/* Desktop / Non-Mobile Close / Slide Button */}
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="desktop-sidebar-toggle-btn"
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid var(--border-color)',
                    color: '#475569',
                    padding: '6px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  title="Close / Slide Sidebar"
                  aria-label="Close / Slide Sidebar"
                >
                  <ChevronLeft size={16} strokeWidth={2.2} />
                </button>
              )}
            </>
          )}

          {/* Close for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="mobile-only-btn"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              padding: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  width: '100%',
                  padding: isCollapsed ? '12px 0' : '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                  color: isActive ? '#2563EB' : '#475569',
                  fontWeight: isActive ? 800 : 550,
                  fontSize: '13.5px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 2px rgba(37, 99, 235, 0.08)' : 'none',
                  border: isActive ? '1px solid #BFDBFE' : '1px solid transparent',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.color = '#0F172A';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#475569';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: isActive ? '#2563EB' : 'inherit', display: 'flex' }}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      backgroundColor: isActive ? '#DBEAFE' : 'rgba(16, 185, 129, 0.15)',
                      color: isActive ? '#1E40AF' : '#10B981',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Account Card */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--border-color)' }}>
        {/* Website Download App Button (Hidden in Native Android & Desktop PC) */}
        {!Capacitor.isNativePlatform() && !isElectronApp() && (
          <div style={{ marginBottom: '8px' }}>
            <a
              href="./billing-pro-pos-release.apk"
              download="billing-pro-pos-release.apk"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '8px',
                padding: isCollapsed ? '8px 0' : '9px 12px',
                borderRadius: '10px',
                backgroundColor: '#EFF6FF',
                border: '1.5px solid #BFDBFE',
                color: '#2563EB',
                fontSize: '12px',
                fontWeight: 750,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              title="Download Android App (APK)"
            >
              <Smartphone size={16} color="#2563EB" />
              {!isCollapsed && <span>Download Android App</span>}
            </a>
          </div>
        )}

        {/* User Account / Business Card */}
        <div
          onClick={() => {
            onSelectTab('settings');
            onCloseMobile();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '8px 0' : '8px 10px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            backgroundColor: '#FAFBFC',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F1F5F9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FAFBFC';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {/* Frameless Avatar Logo */}
            <div
              style={{
                width: '36px',
                height: '36px',
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src={profile.logoUrl && !profile.logoUrl.startsWith('data:image/svg+xml') ? profile.logoUrl : './logo.png'}
                alt={profile.name}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = './logo.png';
                }}
                style={{ width: '100%', height: '100%', aspectRatio: '1 / 1', objectFit: 'contain', display: 'block' }}
              />
            </div>

            {!isCollapsed && (
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {profile.name}
                </div>
                <div
                  style={{
                    fontSize: '10.5px',
                    color: '#64748B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  POS Settings
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <Settings size={15} color="#94A3B8" style={{ flexShrink: 0, marginLeft: '6px' }} />
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop / Tablet Sidebar (Hidden on Mobile) */}
      <div className="desktop-sidebar-container no-print">{sidebarContent}</div>

      {/* Slide-Over Drawer with animation */}
      {isMobileOpen && (
        <div
          className="mobile-drawer-backdrop no-print animate-fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
          }}
          onClick={onCloseMobile}
        >
          <div
            className="animate-drawer-in"
            style={{ width: '280px', height: '100%', boxShadow: '8px 0 30px rgba(0,0,0,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
