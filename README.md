# Billing Pro POS ⚡
### Enterprise Offline-First POS, Thermal Billing & Business Intelligence Platform

<p align="center">
  <img src="public/logo.png" alt="Billing Pro POS Logo" width="130" style="border-radius: 24px; box-shadow: 0 12px 32px rgba(0,0,0,0.18);" />
</p>

<p align="center">
  <b>100% Offline Point of Sale (POS) and invoicing powerhouse built for Restaurants, Cafés, QSRs, Cloud Kitchens, Food Trucks, and Retail Counters.</b><br>
  <i>Sub-10 second order punching, native ESC/POS Bluetooth & USB thermal printing, dynamic UPI Bharat QR code generation, Dexie IndexedDB offline storage engine, Google Pay-style settlement animation, and audited financial reporting.</i>
</p>

<p align="center">
  <a href="https://github.com/Tusharjain-19/Billing-Pos/releases"><img src="https://img.shields.io/badge/Download-Latest_Release-2563EB?style=for-the-badge&logo=windows&logoColor=white" alt="Download Windows" /></a>
  <a href="https://github.com/Tusharjain-19/Billing-Pos/releases"><img src="https://img.shields.io/badge/Android_APK-Direct_Download-10B981?style=for-the-badge&logo=android&logoColor=white" alt="Download Android" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5" /></a>
  <a href="https://electronjs.org/"><img src="https://img.shields.io/badge/Electron_44-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron 44" /></a>
  <a href="https://capacitorjs.com/"><img src="https://img.shields.io/badge/Capacitor_8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor" /></a>
  <a href="https://dexie.org/"><img src="https://img.shields.io/badge/Dexie.js-IndexedDB-F59E0B?style=for-the-badge&logo=database&logoColor=white" alt="Dexie IndexedDB" /></a>
  <img src="https://img.shields.io/badge/License-Proprietary%20Commercial-10B981?style=for-the-badge" alt="License" />
</p>

---

## 📥 Direct Download & Release Packages

Download the latest version for your platform directly from the releases:

| Platform | Package Format | Direct Download Link | Description |
| :--- | :--- | :--- | :--- |
| **Windows PC** | **NSIS Setup Wizard (.exe)** | [📥 Download Billing_Pro_POS_Setup_v1.0.0.exe](https://github.com/Tusharjain-19/Billing-Pos/releases/download/v1.0.0/Billing_Pro_POS_Setup_v1.0.0.exe) | **Recommended**: Full interactive installer with custom install directory selector (SSD/HDD), desktop shortcut, and clean uninstaller. |
| **Windows PC** | **Portable Standalone (.zip)** | [📥 Download Billing_Pro_POS_v1.0_Windows_x64.zip](https://github.com/Tusharjain-19/Billing-Pos/releases/download/v1.0.0/Billing_Pro_POS_v1.0_Windows_x64.zip) | Zero installation required. Extract anywhere (SSD, HDD, USB drive) and run `Billing-Pro-POS.exe`. |
| **Android Mobile** | **Universal APK (.apk)** | [📥 Download Billing_Pro_v1.0.apk](https://github.com/Tusharjain-19/Billing-Pos/releases/download/v1.0.0/Billing_Pro_v1.0.apk) | Direct installable APK for Android phones, tablets, and handheld POS terminals (Android 7.0+ / API 24+). |
| **Android Store** | **App Bundle (.aab)** | [📥 Download Billing_Pro_v1.0.aab](https://github.com/Tusharjain-19/Billing-Pos/releases/download/v1.0.0/Billing_Pro_v1.0.aab) | Google Play Store publication bundle with optimized split binaries. |

*For local offline builds, pre-compiled binaries are also available inside the `release/` and `release-pc/` directories.*

---

## 💻 Step-by-Step Installation Guides

### 🪟 Windows PC Setup (Recommended)

1. **Download**: Click [Billing_Pro_POS_Setup_v1.0.0.exe](release-pc/Billing_Pro_POS_Setup_v1.0.0.exe) (or locate it in `release-pc/`).
2. **Launch Setup**: Double-click `Billing_Pro_POS_Setup_v1.0.0.exe`.
3. **User Consent & Agreement**: Review the offline storage terms and operational consent, then click **"I Agree"**.
4. **Choose Destination Folder**: Keep default directory (`C:\Program Files\Billing Pro POS` or `%LOCALAPPDATA%\Programs\Billing Pro POS`) or click **"Browse..."** to select any preferred HDD/SSD partition.
5. **Install**: Click **"Install"**. The setup automatically generates your Desktop shortcut and Start Menu entry.
6. **Launch & Bill**: Check **"Run Billing Pro POS"** and click **Finish** to open the cashier station!

### 🗂️ Windows Portable Edition (No Install Needed)

1. **Download**: Click [Billing_Pro_POS_v1.0_Windows_x64.zip](release-pc/Billing_Pro_POS_v1.0_Windows_x64.zip).
2. **Extract**: Right-click the `.zip` file and select **Extract All...** to any location (SSD, HDD, or portable USB flash drive).
3. **Execute**: Open the extracted folder and double-click `Billing-Pro-POS.exe`.

### 📱 Android Mobile / POS Terminal Setup

1. **Download**: Transfer or download [Billing_Pro_v1.0.apk](release/Billing_Pro_v1.0.apk) to your Android smartphone or tablet.
2. **Install**: Tap the `.apk` file. If prompted by Android, toggle *"Allow from this source"* in Security settings.
3. **Open App**: Tap **"Install"** then open **BILLING POS**.
4. **Pair Hardware**: Open **Settings ⚙️** → **Bluetooth Thermal Printer** to connect your wireless 58mm/80mm receipt printer.

---

## 📸 Real Application Interface Showcase

<div align="center">

### 1. ⚡ High-Speed POS Cashier Station (Desktop & Tablet)
*Dual-pane cashier billing station featuring instant item search (English & Hindi), veg/non-veg filter, category matrix, stock counters, order fulfillment selector (Dine In / Takeaway / Delivery), custom discounts, and live cart summary.*
<br><br>
<img src="docs/screenshots/pos_billing.png" alt="POS Billing Screen" width="95%" style="border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />

<br><br>

### 2. 📊 Executive Analytics & Financial Audit Dashboard
*Real-time business intelligence visualizing gross revenue, daily order volume, average ticket size, payment mode split (Cash, UPI, Card), top-selling menu items, and instant Excel / PDF dossier reporting.*
<br><br>
<img src="docs/screenshots/pos_dashboard.png" alt="POS Analytics Dashboard" width="95%" style="border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />

<br><br>

### 3. 🍲 Menu & Inventory Catalog Manager
*Comprehensive product management interface with stock indicators, base rate vs selling price calculation, GST tax slab configuration (0%, 5%, 12%, 18%), HSN coding, and bulk Excel import/export.*
<br><br>
<img src="docs/screenshots/menu_manager.png" alt="Menu Manager Screen" width="95%" style="border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />

<br><br>

### 4. 🧾 Invoices & Bill History (Audit Trail & Revisions)
*Full audit log of settled, held, and cancelled invoices with date range filters, instant reprint triggers, payment status badges, and GST-compliant cancellation logging.*
<br><br>
<img src="docs/screenshots/invoices_history.png" alt="Invoices and History Screen" width="95%" style="border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />

<br><br>

### 5. 📱 Ergonomic Mobile Phone View (Handheld POS)
*Smart smartphone layout with bottom navigation, floating cart drawer, tactile touch targets, safe area insets, and full wireless Bluetooth hardware connectivity.*
<br><br>
<img src="docs/screenshots/mobile_pos.png" alt="Mobile Phone POS View" width="400" style="border-radius: 20px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />

</div>

---

## 🚀 Key Features & Architectural Highlights

### ⚡ Sub-10-Second High-Speed Billing
- **Tactile Touch Grid**: Designed with large touch targets ($48\text{px}$) for lightning-fast punching during high-rush counter shifts.
- **Bilingual Search**: Rapid search in both English and Hindi.
- **Multiple Order Types**: Full support for **Dine In** (with Table selection), **Takeaway / Parcel**, and **Delivery**.
- **Variants & Custom Modifiers**: Handle single and multi-size items (Regular, Medium, Large, Half, Full) with dynamic rate adjustments and special kitchen prep notes.
- **Held Bills / Parked Orders**: Park in-progress orders with one tap to serve next customers and restore active carts instantly.

### 📴 100% Offline-First (Zero Cloud Dependency)
- **Local Dexie.js (IndexedDB)**: Zero internet or server connection needed.
- **Zero Latency**: Instant data mutations and queries with zero cloud lag.
- **Total Privacy**: All financial and restaurant data stays strictly on your local machine / device storage.
- **Automated Daily Backups**: Performs automatic local backup dumps to keep your records safe without manual intervention.

### 🖨️ ESC/POS Thermal Receipt Printing
- **Bluetooth SPP & USB OTG Support**: Direct wireless and wired printer communication for standard 58mm (2-inch) and 80mm (3-inch) thermal printers.
- **Customized Receipts**: Prints restaurant logo, GSTIN, FSSAI number, order type, table number, itemized tax breakdowns, and custom footer notes.
- **High-Fidelity Rasterization**: Automatic conversion of logo images and regional font glyphs to 1-bit dithered thermal print bitmaps with zero CORS clipping.

### 💳 Dynamic UPI Bharat QR Code Generation
- **Integrated Scan & Pay**: Generates dynamic UPI QR codes containing merchant VPA, bill reference number, and exact payable balance.
- **Zero MDR Transaction Fees**: Customers pay directly via PhonePe, Google Pay, Paytm, BHIM, Navi, Cred, or any UPI app straight into merchant's bank account.
- **Google Pay-Style Confirmation**: Displays a celebratory animated green checkmark confirmation with concentric ripple waves upon bill settlement.

### 📊 Business Intelligence & Export Engine
- **Financial Analytics**: Real-time sales metrics, category performance, hourly peak traffic, and payment method distribution.
- **Real Graphs in PDF Export**: Automatically embeds visual daily revenue charts, payment mode distribution donuts, and dish velocity graphs into exported PDF dossiers.
- **Excel & PDF Exports**: One-click generation of `.xlsx` spreadsheets and formatted PDF audit summaries for accounts and CA tax filings.

---

## 🛠️ Technology Stack

| Component | Technology | Version | Description |
|---|---|---|---|
| **Frontend Framework** | **React** | `19.2` | Core UI component architecture & fast state reconciliation |
| **Language** | **TypeScript** | `5.8` | Type safety across POS workflows, models, and DB operations |
| **Bundler** | **Vite** | `6.2` | High-speed build pipeline and Instant HMR |
| **Desktop Shell** | **Electron** | `44.6` | 100% Offline desktop application with local file system & printer bridge |
| **Windows Packaging** | **NSIS / Electron Builder** | `26.15` | Multi-step interactive Windows installer with license consent & location picker |
| **Mobile Runtime** | **Capacitor JS** | `8.5` | Native Android bridge for Bluetooth, Haptics & Filesystem |
| **Local Database** | **Dexie.js** | `4.4` | IndexedDB database engine for persistent offline storage |
| **Spreadsheets** | **SheetJS (XLSX)** | `0.18` | In-browser Excel `.xlsx` report generator & menu importer |
| **Document Engine** | **jsPDF & AutoTable** | `4.2` | High-definition PDF invoice & settlement audit report generator |
| **Icons & Design** | **Lucide Icons** | `1.49` | Clean, high-legibility interface iconography |

---

## 💻 Developer Guide & Local Build

### 1. Clone & Install
```bash
git clone https://github.com/Tusharjain-19/Billing-Pos.git
cd Billing-Pos
npm install
```

### 2. Run Web Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build Production Web Bundle
```bash
npm run build
```

### 4. Build Windows Desktop Setup Installer (.exe)
```bash
npm run dist:exe
```
Generates `release-pc/Billing_Pro_POS_Setup_v1.0.0.exe` with interactive NSIS installer.

### 5. Build Android Release APK & AAB
```powershell
npm run cap:sync
cd mobile/android
./gradlew assembleRelease bundleRelease
```
Generates `app-release.apk` and `app-release.aab` ready for distribution.

## ⚖️ Legal, Licensing & Intellectual Property Protection

### 1. Proprietary Commercial License & Ownership
Copyright © 2026 **Billing Pro POS / BookMyDine QR**. All Rights Reserved Worldwide.

This software, its design systems, database architectures, thermal print raster formatting algorithms, and compiled release binaries (Windows `.exe`, Portable `.zip`, Android `.apk`, and Google Play `.aab`) are the exclusive intellectual property of the Billing Pro development team.

### 2. Terms of Use & Commercial Authorization
- **Authorized Usage**: You are granted a commercial license to run, operate, and utilize Billing Pro POS across unlimited active billing counters, restaurant cashier terminals, retail counters, and food outlet devices.
- **Zero Subscription Fees**: The core offline POS features carry zero recurring charges or mandatory cloud subscriptions.
- **Restrictions**: 
  - You may NOT reverse engineer, decompile, disassemble, or extract proprietary print engine algorithms from binary distributions.
  - You may NOT rebrand, resell, redistribute, or license this software as a competing commercial POS product without prior express written authorization.
  - All brand assets, trademarks, and logos remain the property of their respective owners.

### 3. Data Sovereignty & Offline Privacy Guarantee
- **100% Offline Local Storage**: All business transactions, sales receipts, customer details, and financial reports are saved exclusively in your local machine's encrypted browser / IndexedDB storage sandbox (`BookMyDineDB`).
- **No Data Harvesting**: The software does not transmit your financial transactions, invoices, or customer databases to any external servers or third-party trackers.

---

<p align="center">
  <b>Billing Pro POS</b> • Superfast • Reliable • 100% Offline • High Performance Point of Sale System
</p>
