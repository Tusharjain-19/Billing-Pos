# Security Policy & Safe Operational Guidelines

**Product**: Billing Pro POS™  
**Security Standard**: Enterprise Offline-First Air-Gapped Architecture  
**Document Revision**: 1.0.0  

---

## 1. Security Architecture Overview

Billing Pro POS is engineered from the ground up as a **100% Offline-First / Air-Gapped** application. Unlike conventional cloud-dependent POS systems, Billing Pro POS operates without mandatory internet connections, eliminating the risk of cloud database breaches, external API intercept attacks, or remote telemetry leaks.

```
+-------------------------------------------------------------------------+
|                         Local Host Machine / Device                     |
|                                                                         |
|  +---------------------+      +------------------+      +------------+  |
|  |   UI / Web View     | <--> | Dexie IndexedDB  | <--> | Local File |  |
|  |  (React 19 Sandbox) |      | (BookMyDineDB)   |      | Backup JSON|  |
|  +---------------------+      +------------------+      +------------+  |
|            |                                                            |
|            v                                                            |
|  +---------------------+      +--------------------------------------+  |
|  | ESC/POS Thermal     |      | Dynamic Bharat QR (Offline Algorithm)|  |
|  | (Bluetooth / USB)   |      | (UPI String Spec RFC compliant)      |  |
|  +---------------------+      +--------------------------------------+  |
+-------------------------------------------------------------------------+
   [AIR GAP: ZERO EXTERNAL SERVER CALLS • ZERO CLOUD DATA TRANSMISSION]
```

---

## 2. Key Security Safeguards

### 🔒 1. Local Storage Sandboxing
- All business records, customer contact information, item menus, transaction logs, and invoice histories are stored locally in the browser/Electron `IndexedDB` sandbox (`BookMyDineDB`).
- No external HTTP requests are made during billing operations.
- Cross-Origin Resource Sharing (CORS) risks are mitigated through local bundling of all assets and fonts.

### 🛡️ 2. Offline Dynamic UPI QR Generation
- Dynamic UPI payment QR codes (Bharat QR / NPCI specification) are calculated entirely on the client CPU using mathematical string hashing.
- Merchant UPI ID (VPA) and bill amounts are never routed through third-party payment aggregator servers, ensuring zero MDR fees and zero risk of credential interception.

### 🖨️ 3. Isolated Hardware Bridges
- Bluetooth and USB thermal printer drivers communicate using raw byte arrays (`Uint8Array`) over direct hardware channels (Web Bluetooth API / Android Bluetooth SPP socket / Electron IPC).
- No printer data is transmitted across public network interfaces.

### 💾 4. Data Loss Prevention & Backup Integrity
- The system includes an automated local backup dump engine.
- Backups are formatted as human-verifiable and portable JSON dossiers (`billing_pro_backup_YYYY-MM-DD.json`).
- Merchants can store backup files on secondary physical media (USB flash drives, external hard drives, or encrypted NAS) to guarantee business continuity.

---

## 3. Recommended Cashier & Terminal Hardening

For maximum security on physical restaurant and retail counters, operators should implement the following best practices:

1. **Terminal Account Segregation**: On Windows POS PCs, run the POS application under a standard user account and use Windows Defender / BitLocker disk encryption.
2. **Kiosk Mode / App Pinning**: On Android POS tablets and phones, enable Android's native **Screen Pinning** or Kiosk Mode to prevent cashier staff from accessing other apps or device settings.
3. **Admin PIN Protection**: Configure a 4-digit Master PIN in **Settings ⚙️** to restrict access to financial reports, discount overrides, tax configuration, and menu item pricing.
4. **End-of-Day Data Backups**: Export a `.json` backup file at the close of every business day and store a weekly copy on an external encrypted USB drive.
5. **Clean Printer Pairing**: Only pair recognized receipt printer hardware. In the Bluetooth scanner modal, always confirm the MAC address of your thermal printer before connecting.

---

## 4. Reporting Security Vulnerabilities

If you discover a security vulnerability or unexpected behavior within Billing Pro POS, please report it responsibly:

- **Channel**: Submit an issue on the official GitHub repository with the prefix `[SECURITY]` or contact the development team through the official repository channels.
- **Scope**: Please provide detailed steps to reproduce the issue, the environment (Windows version, Android version, Electron build), and observed behavior.
- **Resolution**: Security-critical patches are prioritized and published in immediate maintenance releases.

---

*Billing Pro POS — Protecting Merchant Data Sovereignty with 100% Offline Security.*
