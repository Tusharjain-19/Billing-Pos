import React, { useState, useEffect } from 'react';
import {
  Printer,
  Bluetooth,
  RefreshCw,
  CheckCircle2,
  X,
  Play,
  Settings as SettingsIcon,
  Radio,
  WifiOff,
  Laptop,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  isAndroidNative,
  startAndroidBluetoothScan,
  getAndroidScannedPrinters,
  connectToAndroidPrinter,
  openAndroidBluetoothSettings,
  connectBluetoothPrinter,
  printViaBluetooth,
  isBluetoothPrinterConnected,
  getSavedPrinterName,
  disconnectBluetoothPrinter,
  type BluetoothDeviceInfo
} from '../utils/printer';
import { isElectronApp, getWindowsPrinters } from '../utils/electronStorage';
import type { ElectronSystemPrinter } from '../types';

interface BluetoothScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrinterConnected?: (name: string) => void;
  pendingPrintBytes?: Uint8Array | null;
  onPrintCompleted?: () => void;
}

export const BluetoothScanModal: React.FC<BluetoothScanModalProps> = ({
  isOpen,
  onClose,
  onPrinterConnected,
  pendingPrintBytes,
  onPrintCompleted,
}) => {
  const [devices, setDevices] = useState<BluetoothDeviceInfo[]>([]);
  const [systemPrinters, setSystemPrinters] = useState<ElectronSystemPrinter[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectingAddress, setConnectingAddress] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [connectedName, setConnectedName] = useState<string>(getSavedPrinterName());
  const [isConnected, setIsConnected] = useState<boolean>(isBluetoothPrinterConnected());
  const [isTestPrinting, setIsTestPrinting] = useState<boolean>(false);

  const isAndroid = isAndroidNative();
  const isDesktop = isElectronApp();

  const refreshDeviceList = () => {
    if (isAndroid) {
      const list = getAndroidScannedPrinters();
      setDevices(list);
    }
  };

  const loadSystemPrinters = async () => {
    if (isDesktop) {
      const list = await getWindowsPrinters();
      setSystemPrinters(list);
    }
  };

  // Main scan & pair handler
  const handleStartScan = async () => {
    setScanning(true);
    setStatusType('info');

    if (isAndroid) {
      setStatusMessage('Scanning nearby Bluetooth thermal printers...');
      startAndroidBluetoothScan();
      refreshDeviceList();
      const interval = setInterval(refreshDeviceList, 1200);

      setTimeout(() => {
        clearInterval(interval);
        setScanning(false);
        refreshDeviceList();
        setStatusMessage(null);
      }, 7000);
    } else {
      // Web Browser or Desktop Electron Web Bluetooth
      setStatusMessage('Opening Bluetooth pairing window. Turn on printer and select it from the list...');
      try {
        const res = await connectBluetoothPrinter(true);
        setScanning(false);
        if (res.success && res.deviceName) {
          setIsConnected(true);
          setConnectedName(res.deviceName);
          setStatusType('success');
          setStatusMessage(`Connected to ${res.deviceName}!`);
          if (onPrinterConnected) onPrinterConnected(res.deviceName);

          // Add to local device list
          setDevices((prev) => {
            const exists = prev.some((d) => d.name === res.deviceName);
            if (!exists) {
              return [{ name: res.deviceName || 'Thermal Printer', address: 'BT-LE', isConnected: true, isPaired: true }, ...prev];
            }
            return prev;
          });

          // If there were pending bytes to print, execute now
          if (pendingPrintBytes) {
            setStatusMessage(`Printing bill to ${res.deviceName}...`);
            const pRes = await printViaBluetooth(pendingPrintBytes, false);
            if (pRes.success) {
              setStatusMessage(`Printed to ${res.deviceName} successfully!`);
              if (onPrintCompleted) onPrintCompleted();
              setTimeout(() => onClose(), 1200);
            }
          }
        } else {
          setStatusType('error');
          setStatusMessage(res.message || 'Bluetooth connection was cancelled or printer not found.');
        }
      } catch (err: any) {
        setScanning(false);
        setStatusType('error');
        setStatusMessage(err?.message || 'Bluetooth connection error. Ensure Bluetooth is ON on your PC.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsConnected(isBluetoothPrinterConnected());
      setConnectedName(getSavedPrinterName());
      setStatusMessage(null);

      if (isAndroid) {
        handleStartScan();
      } else if (isDesktop) {
        loadSystemPrinters();
      }
    }
  }, [isOpen]);

  const handleConnectDevice = async (device: BluetoothDeviceInfo) => {
    setConnectingAddress(device.address);
    setStatusType('info');
    setStatusMessage(`Connecting to ${device.name}...`);
    try {
      if (isAndroid) {
        const ok = connectToAndroidPrinter(device.address, device.name);
        if (ok) {
          setIsConnected(true);
          setConnectedName(device.name);
          setStatusType('success');
          setStatusMessage(`Connected to ${device.name}!`);
          if (onPrinterConnected) onPrinterConnected(device.name);

          if (pendingPrintBytes) {
            setStatusMessage(`Connected! Printing bill to ${device.name}...`);
            const pRes = await printViaBluetooth(pendingPrintBytes, false);
            if (pRes.success) {
              setStatusMessage(`Printed to ${device.name} successfully!`);
              if (onPrintCompleted) onPrintCompleted();
              setTimeout(() => onClose(), 1200);
            }
          }
        } else {
          setStatusType('error');
          setStatusMessage(`Could not connect to ${device.name}. Ensure printer is turned ON and in range.`);
        }
      } else {
        const res = await connectBluetoothPrinter(true);
        if (res.success) {
          setIsConnected(true);
          setConnectedName(res.deviceName || device.name);
          setStatusType('success');
          setStatusMessage(`Connected to ${res.deviceName || device.name}!`);
          if (onPrinterConnected) onPrinterConnected(res.deviceName || device.name);

          if (pendingPrintBytes) {
            await printViaBluetooth(pendingPrintBytes, false);
            if (onPrintCompleted) onPrintCompleted();
            setTimeout(() => onClose(), 1200);
          }
        } else {
          setStatusType('error');
          setStatusMessage(res.message || 'Connection failed.');
        }
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err.message || 'Bluetooth connection error.');
    } finally {
      setConnectingAddress(null);
    }
  };

  const handleTestPrint = async () => {
    setIsTestPrinting(true);
    setStatusType('info');
    setStatusMessage('Sending test receipt...');
    try {
      const testBytes = new Uint8Array([
        0x1b, 0x40, // ESC @
        0x1b, 0x61, 0x01, // Center
        0x1b, 0x45, 0x01, // Bold ON
        ...Array.from('BILLING PRO POS\n').map((c) => c.charCodeAt(0)),
        0x1b, 0x45, 0x00,
        ...Array.from('PRINTER CONNECTED OK\n').map((c) => c.charCodeAt(0)),
        ...Array.from('READY TO BILL!\n\n\n').map((c) => c.charCodeAt(0)),
        0x1d, 0x56, 0x42, 0x00, // Paper Cut
      ]);

      const res = await printViaBluetooth(testBytes, false);
      if (res.success) {
        setStatusType('success');
        setStatusMessage('Test receipt printed successfully! Physical printer verified.');
      } else {
        setStatusType('error');
        setStatusMessage(res.message || 'Test print failed. Check printer paper & power.');
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err.message || 'Test print error.');
    } finally {
      setIsTestPrinting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectBluetoothPrinter(true);
    setIsConnected(false);
    setConnectedName('');
    setStatusType('info');
    setStatusMessage('Printer disconnected.');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 140,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1.5px solid #E2E8F0',
          padding: '24px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                color: isConnected ? '#10B981' : '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bluetooth size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Bluetooth Thermal Printer
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                Scan and connect 58mm / 80mm wireless receipt printers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#64748B',
              padding: '6px',
              borderRadius: '50%',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: statusType === 'success' ? '#F0FDF4' : statusType === 'error' ? '#FEF2F2' : '#EFF6FF',
              border: `1px solid ${statusType === 'success' ? '#86EFAC' : statusType === 'error' ? '#FECACA' : '#BFDBFE'}`,
              color: statusType === 'success' ? '#166534' : statusType === 'error' ? '#DC2626' : '#1E40AF',
              fontSize: '12.5px',
              fontWeight: 650,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {statusType === 'success' ? (
              <CheckCircle2 size={16} color="#16A34A" />
            ) : statusType === 'error' ? (
              <AlertCircle size={16} color="#DC2626" />
            ) : (
              <Radio size={16} color="#2563EB" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Currently Connected Device Badge (Responsive, Zero Button Overlap) */}
        {isConnected && (
          <div
            style={{
              padding: '14px',
              borderRadius: '14px',
              backgroundColor: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Printer size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#15803D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {connectedName || 'Thermal Printer'}
                </div>
                <div style={{ fontSize: '11px', color: '#166534', marginTop: '1px' }}>
                  Connected & Ready for instant receipt printing
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                type="button"
                onClick={handleTestPrint}
                disabled={isTestPrinting}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                <Play size={13} />
                <span>{isTestPrinting ? 'Printing...' : 'Test Print'}</span>
              </button>

              <button
                type="button"
                onClick={handleDisconnect}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Primary Action Button: Pair / Scan Device */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={handleStartScan}
            disabled={scanning}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '13px 20px',
              borderRadius: '12px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Bluetooth size={18} className={scanning ? 'spin-animation' : ''} />
            <span>{scanning ? 'Scanning for Printers...' : 'Pair & Connect Bluetooth Printer'}</span>
          </button>

          <p style={{ fontSize: '11.5px', color: '#64748B', margin: '0 4px', textAlign: 'center' }}>
            Supports MT580P, MPT-II, POS-5802, RPP02N, Everycom, TVS & standard 58mm/80mm ESC/POS printers.
          </p>
        </div>

        {/* Discovered / Paired Devices List */}
        {devices.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>
              Detected Printers
            </span>
            {devices.map((dev) => {
              const isThisConnected = isConnected && connectedName === dev.name;
              return (
                <div
                  key={dev.address + dev.name}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: `1.5px solid ${isThisConnected ? '#16A34A' : '#E2E8F0'}`,
                    backgroundColor: isThisConnected ? '#F0FDF4' : '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Printer size={16} color={isThisConnected ? '#16A34A' : '#2563EB'} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 750, color: '#0F172A' }}>
                        {dev.name || 'Bluetooth Printer'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {dev.address} {isThisConnected ? '• Active' : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConnectDevice(dev)}
                    disabled={connectingAddress === dev.address}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: isThisConnected ? '#16A34A' : '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    {connectingAddress === dev.address ? 'Connecting...' : isThisConnected ? 'Connected' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Windows Desktop System Printers (if on PC) */}
        {isDesktop && systemPrinters.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>
              Windows Installed Thermal Printers
            </span>
            <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {systemPrinters.map((p) => (
                <div
                  key={p.name}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Laptop size={14} color="#64748B" />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>{p.name}</div>
                      {p.isDefault && <div style={{ fontSize: '10px', color: '#16A34A', fontWeight: 700 }}>Default Printer</div>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('saved_ble_printer_name', p.name);
                      setConnectedName(p.name);
                      setIsConnected(true);
                      setStatusType('success');
                      setStatusMessage(`Selected Windows printer: ${p.name}`);
                      if (onPrinterConnected) onPrinterConnected(p.name);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: connectedName === p.name ? '#16A34A' : '#FFFFFF',
                      color: connectedName === p.name ? '#FFFFFF' : '#2563EB',
                      border: '1px solid #CBD5E1',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {connectedName === p.name ? 'Active' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Android PIN Instructions Helper */}
        {isAndroid && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingsIcon size={16} color="#64748B" />
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                First-time PIN pairing (0000 or 1234)?
              </span>
            </div>
            <button
              type="button"
              onClick={openAndroidBluetoothSettings}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#2563EB',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Open Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
