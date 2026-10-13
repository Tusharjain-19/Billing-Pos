const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  selectStorageFolder: () => ipcRenderer.invoke('select-storage-folder'),
  saveBackupFile: (opts) => ipcRenderer.invoke('save-backup-file', opts),
  loadBackupFile: () => ipcRenderer.invoke('load-backup-file'),
  getStorageInfo: () => ipcRenderer.invoke('get-storage-info'),
  getSystemPrinters: () => ipcRenderer.invoke('get-system-printers'),
  printToPrinter: (opts) => ipcRenderer.invoke('print-to-printer', opts),
  cancelBluetoothRequest: () => ipcRenderer.send('cancel-bluetooth-request'),
});
