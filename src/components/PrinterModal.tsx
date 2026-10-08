import React, { useState, useEffect } from 'react';
import {
  Printer,
  Bluetooth,
  Usb,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  FileText,
  Smartphone,
  RefreshCw,
  Radio,
  Settings as SettingsIcon
} from 'lucide-react';
import type { RestaurantProfile, PaperWidth } from '../types';
import {
  printViaBluetooth,
  printViaSerial,
  printViaRawBt,
  isBluetoothPrinterConnected,
  disconnectBluetoothPrinter,
  getSavedPrinterName,
  isAndroidNative,
  startAndroidBluetoothScan,
  getAndroidScannedPrinters,
  connectToAndroidPrinter,
  openAndroidBluetoothSettings,
  connectBluetoothPrinter,
  type BluetoothDeviceInfo
} from '../utils/printer';

interface PrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RestaurantProfile;
  onUpdatePaperWidth: (width: PaperWidth) => void;
  printerConnected: boolean;
  setPrinterConnected: (connected: boolean) => void;
  onTestBrowserPrint?: () => void;
}

export const PrinterModal: React.FC<PrinterModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdatePaperWidth,
  printerConnected,
  setPrinterConnected,
  onTestBrowserPrint,
}) => {
  const [connecting, setConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [testPrintSuccess, setTestPrintSuccess] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<BluetoothDeviceInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingAddr, setConnectingAddr] = useState<string | null>(null);

  const isAndroid = isAndroidNative();
  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  const isSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  const refreshScannedDevices = () => {
    if (isAndroid) {
      const list = getAndroidScannedPrinters();
      setScannedDevices(list);
    }
  };

  const handleStartScan = () => {
    setIsScanning(true);
    setStatusMessage('Scanning nearby Bluetooth thermal printers...');
    if (isAndroid) {
      startAndroidBluetoothScan();
      refreshScannedDevices();
      const interval = setInterval(() => {
        refreshScannedDevices();
      }, 1200);

      setTimeout(() => {
        clearInterval(interval);
        setIsScanning(false);
        refreshScannedDevices();
      }, 7000);
    } else {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshScannedDevices();
      if (isAndroid) {
        handleStartScan();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectDevice = async (device: BluetoothDeviceInfo) => {
    setConnectingAddr(device.address);
    setStatusMessage(`Connecting to ${device.name}...`);
    try {
      if (isAndroid) {
        const ok = connectToAndroidPrinter(device.address, device.name);
        if (ok) {
          setPrinterConnected(true);
          setStatusMessage(`Connected to ${device.name}!`);
          setTestPrintSuccess(true);
        } else {
          setStatusMessage(`Could not connect to ${device.name}. Ensure printer is ON.`);
          setTestPrintSuccess(false);
        }
      } else {
        const res = await connectBluetoothPrinter(true);
        if (res.success) {
          setPrinterConnected(true);
          setStatusMessage(`Connected to ${res.deviceName || 'Printer'}!`);
          setTestPrintSuccess(true);
        } else {
          setStatusMessage(res.message || 'Bluetooth connection failed.');
          setTestPrintSuccess(false);
        }
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Connection error.');
      setTestPrintSuccess(false);
    } finally {
      setConnectingAddr(null);
    }
  };

  const handleDirectTestPrint = async () => {
    setConnecting(true);
    setStatusMessage('Sending test receipt to printer...');
    try {
      const testBuffer = new Uint8Array([
        0x1b, 0x40, // ESC @
        0x1b, 0x61, 0x01, // Center
        0x1b, 0x45, 0x01, // Bold ON
        ...Array.from('BILLING PRO POS\n').map((c) => c.charCodeAt(0)),
        0x1b, 0x45, 0x00,
        ...Array.from('PRINTER CONNECTED OK\n').map((c) => c.charCodeAt(0)),
        ...Array.from('READY TO BILL!\n\n\n').map((c) => c.charCodeAt(0)),
        0x1d, 0x56, 0x42, 0x00, // Paper Cut
      ]);

      const res = await printViaBluetooth(testBuffer, true);
      if (res.success) {
        setPrinterConnected(true);
        setStatusMessage('Test receipt printed successfully! Physical printer verified.');
        setTestPrintSuccess(true);
      } else {
        setStatusMessage(res.message || 'Print failed. Check printer paper & power.');
        setTestPrintSuccess(false);
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Bluetooth connection failed.');
      setTestPrintSuccess(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectUsb = async () => {
    setConnecting(true);
    setStatusMessage('Requesting USB Serial device...');
    try {
      const testBuffer = new Uint8Array([
        0x1b, 0x40,
        0x1b, 0x61, 0x01,
        0x1b, 0x45, 0x01,
        ...Array.from('*** USB PRINTER TEST ***\nREADY FOR BILLING\n\n\n\n').map((c) => c.charCodeAt(0)),
        0x1d, 0x56, 0x42, 0x00,
      ]);

      const res = await printViaSerial(testBuffer);
      if (res.success) {
        setPrinterConnected(true);
        setStatusMessage('Connected to USB printer and test print sent!');
        setTestPrintSuccess(true);
      } else {
        setStatusMessage(res.message || 'USB Serial connection failed.');
        setTestPrintSuccess(false);
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'USB connection failed.');
      setTestPrintSuccess(false);
    } finally {
      setConnecting(false);
    }
  };

  const activePrinterName = getSavedPrinterName() || 'MT580P';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '20px 24px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.14)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#64748B',
            padding: '6px',
            borderRadius: '50%',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: isBluetoothPrinterConnected() ? 'rgba(22, 163, 74, 0.12)' : 'rgba(37, 99, 235, 0.12)',
              color: isBluetoothPrinterConnected() ? '#16A34A' : '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Printer size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Thermal Printer Setup
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              Scan and connect real Bluetooth printer (MT580P / MPT-II)
            </p>
          </div>
        </div>

        {/* Paper Width Selector */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            marginBottom: '14px',
          }}
        >
          <label
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#64748B',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Paper Roll Width
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onUpdatePaperWidth(58)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: profile.paperWidth === 58 ? '#2563EB' : '#FFFFFF',
                color: profile.paperWidth === 58 ? '#FFFFFF' : '#334155',
                fontWeight: 750,
                fontSize: '12.5px',
                border: '1px solid #CBD5E1',
                cursor: 'pointer',
              }}
            >
              58 mm (Standard 2-inch)
            </button>
            <button
              onClick={() => onUpdatePaperWidth(80)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: profile.paperWidth === 80 ? '#2563EB' : '#FFFFFF',
                color: profile.paperWidth === 80 ? '#FFFFFF' : '#334155',
                fontWeight: 750,
                fontSize: '12.5px',
                border: '1px solid #CBD5E1',
                cursor: 'pointer',
              }}
            >
              80 mm (Wide 3-inch)
            </button>
          </div>
        </div>

        {/* Currently Connected Status */}
        {isBluetoothPrinterConnected() && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#16A34A" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#15803D' }}>
                  {activePrinterName} Ready
                </div>
                <div style={{ fontSize: '11px', color: '#166534' }}>
                  Direct print active — no re-pairing needed
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleDirectTestPrint}
                disabled={connecting}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#15803D',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Play size={12} />
                <span>Test Print</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  disconnectBluetoothPrinter(true);
                  setPrinterConnected(false);
                  setStatusMessage('Printer disconnected.');
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: '1px solid #FECACA',
                  cursor: 'pointer',
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* On Android Native: In-App Bluetooth Scanner */}
        {isAndroid ? (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                Nearby Bluetooth Devices
              </span>
              <button
                type="button"
                onClick={handleStartScan}
                disabled={isScanning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#2563EB',
                  fontSize: '11.5px',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} className={isScanning ? 'spin-animation' : ''} />
                <span>{isScanning ? 'Scanning...' : 'Scan Nearby'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {scannedDevices.length > 0 ? (
                scannedDevices.map((dev) => {
                  const isSelected = activePrinterName === dev.name && isBluetoothPrinterConnected();
                  return (
                    <div
                      key={dev.address}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${isSelected ? '#16A34A' : '#E2E8F0'}`,
                        backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bluetooth size={16} color="#2563EB" />
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#0F172A' }}>
                            {dev.name || 'Bluetooth Printer'}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                            {dev.address} {dev.isPaired ? '• Paired in Android' : '• Discovered'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConnectDevice(dev)}
                        disabled={connectingAddr === dev.address}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '7px',
                          backgroundColor: isSelected ? '#16A34A' : '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '11.5px',
                          fontWeight: 750,
                          cursor: 'pointer',
                        }}
                      >
                        {connectingAddr === dev.address
                          ? 'Connecting...'
                          : isSelected
                          ? 'Connected'
                          : 'Connect'}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    padding: '18px 12px',
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px dashed #CBD5E1',
                  }}
                >
                  <Radio size={22} color="#94A3B8" style={{ marginBottom: '4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    {isScanning ? 'Scanning for nearby printers...' : 'Click "Scan Nearby" to find Bluetooth printers'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* On Web / Desktop Browser: Real Web Bluetooth Connection */
          <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              Real Hardware Connection (Web Browser)
            </span>
            <button
              type="button"
              onClick={async () => {
                setConnecting(true);
                setStatusMessage('Opening browser Bluetooth pairing picker...');
                try {
                  const res = await connectBluetoothPrinter(true);
                  if (res.success) {
                    setPrinterConnected(true);
                    setStatusMessage(`Connected to ${res.deviceName || 'Thermal Printer'}!`);
                    setTestPrintSuccess(true);
                  } else {
                    setStatusMessage(res.message || 'Bluetooth connection failed.');
                  }
                } catch (err: any) {
                  setStatusMessage(err?.message || 'Bluetooth error.');
                } finally {
                  setConnecting(false);
                }
              }}
              disabled={connecting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                border: '1.5px solid #93C5FD',
                color: '#1E3A8A',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bluetooth size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800 }}>Connect Real Bluetooth Printer</div>
                  <div style={{ fontSize: '11.5px', color: '#3B82F6' }}>Scan & pair MT580P, MPT-II, POS-5802 via Chrome/Edge</div>
                </div>
              </div>
              <Play size={14} color="#2563EB" />
            </button>
          </div>
        )}

        {/* Other Connection Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>

          {/* Android Bluetooth Settings Helper */}
          {isAndroid && (
            <button
              onClick={() => openAndroidBluetoothSettings()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SettingsIcon size={18} color="#64748B" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Phone Bluetooth Settings</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Pair MT580P with PIN (0000 or 1234)</div>
                </div>
              </div>
              <Play size={14} color="#64748B" />
            </button>
          )}

          {/* USB Cable */}
          <button
            onClick={handleConnectUsb}
            disabled={connecting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Usb size={18} color="#10B981" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Connect USB Cable (OTG)</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Direct wired USB thermal printing</div>
              </div>
            </div>
            <Play size={14} color="#10B981" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: testPrintSuccess ? '#F0FDF4' : '#EFF6FF',
              border: `1px solid ${testPrintSuccess ? '#86EFAC' : '#BFDBFE'}`,
              color: testPrintSuccess ? '#15803D' : '#1D4ED8',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {testPrintSuccess ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
