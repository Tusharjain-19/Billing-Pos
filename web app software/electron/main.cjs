const { app, BrowserWindow, ipcMain, dialog, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Set Application User Model ID for Windows Taskbar pinning & large crisp icon
if (process.platform === 'win32') {
  app.setAppUserModelId('com.billingpro.pos');
}

let mainWindow = null;
let selectBluetoothCallback = null;

// Ensure single instance lock so multiple POS instances don't clash on local database
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Enable Web Bluetooth, Web Serial & Hardware Acceleration flags
app.commandLine.appendSwitch('enable-web-bluetooth', 'true');
app.commandLine.appendSwitch('enable-experimental-web-platform-features', 'true');

function getAppIcon() {
  const icoPath = path.join(__dirname, '../build/icon.ico');
  const favIcoPath = path.join(__dirname, '../public/favicon.ico');
  const pngPath = path.join(__dirname, '../public/logo.png');

  if (fs.existsSync(icoPath)) return icoPath;
  if (fs.existsSync(favIcoPath)) return favIcoPath;
  return pngPath;
}

function createWindow() {
  const appIcon = getAppIcon();
  const iconImg = nativeImage.createFromPath(appIcon);

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Billing Pro POS - Offline Desktop Edition',
    icon: !iconImg.isEmpty() ? iconImg : appIcon,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true,
    },
  });

  if (!iconImg.isEmpty()) {
    mainWindow.setIcon(iconImg);
  }

  // Handle Web Bluetooth device selection for real Bluetooth thermal printers
  mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();
    selectBluetoothCallback = callback;

    if (!deviceList || deviceList.length === 0) return;

    // 1. Auto-select printer if recognized by thermal printer name
    const printerDevice = deviceList.find(
      (device) =>
        device.deviceName &&
        (device.deviceName.toLowerCase().includes('printer') ||
          device.deviceName.toLowerCase().includes('pos') ||
          device.deviceName.toLowerCase().includes('mpt') ||
          device.deviceName.toLowerCase().includes('mt58') ||
          device.deviceName.toLowerCase().includes('mt80') ||
          device.deviceName.toLowerCase().includes('bt') ||
          device.deviceName.toLowerCase().includes('58') ||
          device.deviceName.toLowerCase().includes('80') ||
          device.deviceName.toLowerCase().includes('thermal') ||
          device.deviceName.toLowerCase().includes('rpp') ||
          device.deviceName.toLowerCase().includes('inner') ||
          device.deviceName.toLowerCase().includes('blue'))
    );

    if (printerDevice) {
      callback(printerDevice.deviceId);
      selectBluetoothCallback = null;
    } else if (deviceList.length > 0) {
      callback(deviceList[0].deviceId);
      selectBluetoothCallback = null;
    }
  });

  // Handle Bluetooth request cancellation
  ipcMain.on('cancel-bluetooth-request', () => {
    if (selectBluetoothCallback) {
      selectBluetoothCallback('');
      selectBluetoothCallback = null;
    }
  });

  // In production load local compiled bundle (100% Offline)
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── IPC Handlers for HDD/SSD Storage Allocation & Backups ──────────────────

// 1. Native folder picker for HDD/SSD storage selection
ipcMain.handle('select-storage-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select HDD / SSD Folder for Billing Pro Data & Backups',
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Select Storage Folder',
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// 2. Save backup file directly to chosen HDD/SSD folder
ipcMain.handle('save-backup-file', async (event, { folderPath, fileName, data }) => {
  try {
    const targetDir = folderPath || app.getPath('userData');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const finalPath = path.join(targetDir, fileName);
    fs.writeFileSync(finalPath, typeof data === 'string' ? data : JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath: finalPath };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to save file to drive' };
  }
});

// 3. Load backup file from HDD/SSD
ipcMain.handle('load-backup-file', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Backup File (.json) to Restore',
    filters: [{ name: 'JSON Backup Files', extensions: ['json'] }, { name: 'All Files', extensions: ['*'] }],
    properties: ['openFile'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { filePath: result.filePaths[0], content };
  }
  return null;
});

// 4. Get System Storage info & default application paths
ipcMain.handle('get-storage-info', async () => {
  return {
    userDataPath: app.getPath('userData'),
    documentsPath: app.getPath('documents'),
    desktopPath: app.getPath('desktop'),
    appPath: app.getAppPath(),
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    isPackaged: app.isPackaged,
  };
});

// 5. Get List of all Windows Installed Local / USB / Network Printers
ipcMain.handle('get-system-printers', async () => {
  if (!mainWindow) return [];
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers.map((p) => ({
      name: p.name,
      displayName: p.displayName || p.name,
      description: p.description,
      isDefault: p.isDefault,
      status: p.status,
    }));
  } catch (err) {
    console.error('Failed to get printers:', err);
    return [];
  }
});

// 6. Direct Silent Print to Windows Printer (Thermal 58mm / 80mm or A4)
ipcMain.handle('print-to-printer', async (event, { printerName, silent = true, pageSize = '80mm' }) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  try {
    return new Promise((resolve) => {
      mainWindow.webContents.print(
        {
          silent: silent !== false,
          printBackground: true,
          deviceName: printerName,
          margins: { marginType: 'none' },
        },
        (success, failureReason) => {
          if (success) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: failureReason });
          }
        }
      );
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// App Lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
