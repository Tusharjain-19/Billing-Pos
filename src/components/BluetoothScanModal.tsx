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
  WifiOff
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
  const [scanning, setScanning] = useState(false);
  const [connectingAddress, setConnectingAddress] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [connectedName, setConnectedName] = useState<string>(getSavedPrinterName());
  const [isConnected, setIsConnected] = useState<boolean>(isBluetoothPrinterConnected());
  const [isTestPrinting, setIsTestPrinting] = useState<boolean>(false);

  const isAndroid = isAndroidNative();

  const refreshDeviceList = () => {
    if (isAndroid) {
      const list = getAndroidScannedPrinters();
      setDevices(list);
    }
  };

  const handleStartScan = () => {
    setScanning(true);
    setStatusMessage('Scanning for nearby Bluetooth thermal printers...');
    if (isAndroid) {
      startAndroidBluetoothScan();
      refreshDeviceList();
      const interval = setInterval(() => {
        refreshDeviceList();
      }, 1200);

      setTimeout(() => {
        clearInterval(interval);
        setScanning(false);
        refreshDeviceList();
        setStatusMessage(null);
      }, 7000);
    } else {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsConnected(isBluetoothPrinterConnected());
      setConnectedName(getSavedPrinterName());
      if (isAndroid) {
        handleStartScan();
      }
    }
  }, [isOpen]);

  const handleConnectDevice = async (device: BluetoothDeviceInfo) => {
    setConnectingAddress(device.address);
    setStatusMessage(`Connecting to ${device.name}...`);
    try {
      if (isAndroid) {
        const ok = connectToAndroidPrinter(device.address, device.name);
        if (ok) {
          setIsConnected(true);
          setConnectedName(device.name);
          setStatusMessage(`Connected to ${device.name}!`);
          if (onPrinterConnected) onPrinterConnected(device.name);

          if (pendingPrintBytes) {
            setStatusMessage(`Connected! Printing bill to ${device.name}...`);
            const pRes = await printViaBluetooth(pendingPrintBytes, false);
            if (pRes.success) {
              setStatusMessage(`Printed to ${device.name} successfully!`);
              if (onPrintCompleted) onPrintCompleted();
              setTimeout(() => {
                onClose();
              }, 1200);
            } else {
              setStatusMessage(`Connected, but print failed: ${pRes.message || 'Check printer'}`);
            }
          }
        } else {
          setStatusMessage(`Could not connect to ${device.name}. Ensure printer is turned ON and in range.`);
        }
      } else {
        const res = await connectBluetoothPrinter(true);
        if (res.success) {
          setIsConnected(true);
          setConnectedName(res.deviceName || 'Bluetooth Printer');
          setStatusMessage(`Connected to ${res.deviceName || 'Printer'}!`);
          if (onPrinterConnected) onPrinterConnected(res.deviceName || 'Printer');

          if (pendingPrintBytes) {
            setStatusMessage(`Printing bill to ${res.deviceName || 'Printer'}...`);
            await printViaBluetooth(pendingPrintBytes, false);
            if (onPrintCompleted) onPrintCompleted();
            setTimeout(() => {
              onClose();
            }, 1200);
          }
        } else {
          setStatusMessage(res.message || 'Connection failed.');
        }
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Bluetooth connection error.');
    } finally {
      setConnectingAddress(null);
    }
  };

  const handleTestPrint = async () => {
    setIsTestPrinting(true);
    setStatusMessage('Sending test receipt to printer...');
    try {
      const testBuffer = new Uint8Array([
        0x1b, 0x40, // ESC @
        0x1b, 0x61, 0x01, // Center
        0x1b, 0x45, 0x01, // Bold ON
        ...Array.from('*** BILLING PRO POS ***\n').map((c) => c.charCodeAt(0)),
        0x1b, 0x45, 0x00,
        ...Array.from('BLUETOOTH PRINT OK!\n\n').map((c) => c.charCodeAt(0)),
        ...Array.from('Device: ' + (connectedName || 'MT580P') + '\n').map((c) => c.charCodeAt(0)),
        ...Array.from('Ready for Instant Printing\n\n\n\n').map((c) => c.charCodeAt(0)),
        0x1d, 0x56, 0x42, 0x00, // Paper Cut
      ]);
      const res = await printViaBluetooth(testBuffer, true);
      if (res.success) {
        setStatusMessage('Test receipt printed successfully! Physical printer verified.');
      } else {
        setStatusMessage(res.message || 'Test print failed. Check printer paper & power.');
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Print error.');
    } finally {
      setIsTestPrinting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectBluetoothPrinter(true);
    setIsConnected(false);
    setConnectedName('');
    setStatusMessage('Printer disconnected.');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAFAFA',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: isConnected ? 'rgba(22, 163, 74, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                color: isConnected ? '#16A34A' : '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Printer size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                Bluetooth Thermal Printer
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                {isConnected ? `Connected: ${connectedName || 'MT580P'}` : 'Scan and connect 58mm/80mm printer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              borderRadius: '8px',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: statusMessage.includes('successfully') || statusMessage.includes('Connected')
                  ? 'rgba(22, 163, 74, 0.08)'
                  : 'rgba(37, 99, 235, 0.08)',
                border: `1px solid ${
                  statusMessage.includes('successfully') || statusMessage.includes('Connected')
                    ? '#BBF7D0'
                    : '#BFDBFE'
                }`,
                color: statusMessage.includes('successfully') || statusMessage.includes('Connected')
                  ? '#15803D'
                  : '#1D4ED8',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {statusMessage.includes('successfully') || statusMessage.includes('Connected') ? (
                <CheckCircle2 size={16} />
              ) : (
                <Radio size={16} />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Currently Connected Bar */}
          {isConnected && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#16A34A" />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#15803D' }}>
                    {connectedName || 'MT580P'} Ready
                  </div>
                  <div style={{ fontSize: '11px', color: '#166534' }}>
                    Paired for instant 1-click billing & printing
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleTestPrint}
                  disabled={isTestPrinting}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#15803D',
                    color: '#FFFFFF',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Play size={12} />
                  <span>{isTestPrinting ? 'Printing...' : 'Test Bill'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
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

          {/* Scan Actions & Device List Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>
              Nearby & Paired Printers
            </span>
            {isAndroid && (
              <button
                type="button"
                onClick={handleStartScan}
                disabled={scanning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  color: '#334155',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} className={scanning ? 'spin-animation' : ''} />
                <span>{scanning ? 'Scanning...' : 'Scan Again'}</span>
              </button>
            )}
          </div>

          {/* Discovered / Paired Devices List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px' }}>
            {devices.length > 0 ? (
              devices.map((dev) => {
                const isThisConnected = isConnected && connectedName === dev.name;
                return (
                  <div
                    key={dev.address}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: `1.5px solid ${isThisConnected ? '#16A34A' : '#E2E8F0'}`,
                      backgroundColor: isThisConnected ? '#F0FDF4' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#2563EB',
                        }}
                      >
                        <Bluetooth size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                          {dev.name || 'Bluetooth Printer'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {dev.address} {dev.isPaired ? '• Paired' : '• Nearby'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConnectDevice(dev)}
                      disabled={connectingAddress === dev.address}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '8px',
                        backgroundColor: isThisConnected ? '#16A34A' : '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {connectingAddress === dev.address
                        ? 'Connecting...'
                        : isThisConnected
                        ? 'Active'
                        : 'Connect'}
                    </button>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: '30px 16px',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '14px',
                  border: '1px dashed #CBD5E1',
                }}
              >
                <Radio size={28} color="#94A3B8" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  {scanning ? 'Scanning for MT580P / MPT-II printers...' : 'No Bluetooth printers listed'}
                </div>
                <p style={{ fontSize: '11.5px', color: '#64748B', margin: '4px 0 12px 0' }}>
                  Turn on your thermal printer and make sure Bluetooth is visible
                </p>
                <button
                  type="button"
                  onClick={handleStartScan}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Scan Nearby Devices
                </button>
              </div>
            )}
          </div>

          {/* Android Bluetooth Settings Fallback */}
          {isAndroid && (
            <div
              style={{
                marginTop: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
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
                  Need to pair PIN (0000 or 1234)?
                </span>
              </div>
              <button
                type="button"
                onClick={() => openAndroidBluetoothSettings()}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#2563EB',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Phone Bluetooth
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
