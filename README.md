# Billing Pro POS ⚡
### High-Performance Offline-First POS & Restaurant Management System

<p align="center">
  <img src="public/billing-pro-logo.png" alt="Billing Pro POS Logo" width="120" style="border-radius: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />
</p>

<p align="center">
  <b>Enterprise-grade, offline-first Point of Sale (POS) and billing platform designed for Restaurants, Cafés, QSRs, Cloud Kitchens, Food Trucks, and Retail stores.</b><br>
  <i>Sub-10 second billing, ESC/POS Bluetooth & USB thermal receipt printing, dynamic UPI Bharat QR code generation, Dexie IndexedDB offline storage, and real-time business intelligence.</i>
</p>

<p align="center">
  <a href="https://tusharjain.in"><img src="https://img.shields.io/badge/Author-Tushar%20Jain-6366F1?style=for-the-badge&logo=safari&logoColor=white" alt="Author Tushar Jain" /></a>
  <a href="https://tusharjain.in"><img src="https://img.shields.io/badge/Portfolio-tusharjain.in-10B981?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Portfolio" /></a>
  <a href="https://github.com/Tusharjain-19/Billing-Pos"><img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repo" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://capacitorjs.com/"><img src="https://img.shields.io/badge/Capacitor_8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor" /></a>
  <a href="https://dexie.org/"><img src="https://img.shields.io/badge/Dexie.js-IndexedDB-F59E0B?style=for-the-badge&logo=database&logoColor=white" alt="Dexie IndexedDB" /></a>
</p>

---

## 🎬 Application Demo Video

<div align="center">
  <video src="https://github.com/Tusharjain-19/Billing-Pos/raw/main/docs/demo/billing_pos_demo.mp4" width="95%" controls style="border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
    <a href="./docs/demo/billing_pos_demo.mp4">▶️ Click to Watch / Download Billing Pro POS Demo Video (MP4)</a>
  </video>
  <p><i>Live walk-through demonstration: High-speed order punching, dish category navigation, live cart modifiers, ESC/POS thermal printing preview, and dashboard analytics.</i></p>
</div>

---

## 📸 Real Application Screenshots & Interface Showcase

<div align="center">

### 1. ⚡ High-Speed POS Billing Screen (Desktop & Tablet)
*Dual-pane cashier billing station featuring instant item search (English & Hindi), veg/non-veg filter, category matrix, stock counters, order fulfillment selector (Dine In / Takeaway / Delivery), custom discounts, and live cart summary.*
<br><br>
<img src="docs/screenshots/pos_billing.png" alt="POS Billing Screen" width="95%" style="border-radius: 10px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />

<br><br>

### 2. 📊 Real-Time Analytics & Financial Dashboard
*Executive dashboard visualizing gross sales, daily order volume, average ticket size, payment mode split (Cash, UPI, Card), top-selling menu items, and instant Excel / PDF reporting.*
<br><br>
<img src="docs/screenshots/pos_dashboard.png" alt="POS Analytics Dashboard" width="95%" style="border-radius: 10px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />

<br><br>

### 3. 🍲 Menu & Inventory Catalog Manager
*Comprehensive product management interface with stock indicators, base rate vs selling price calculation, GST tax slab configuration, HSN coding, and bulk Excel import/export.*
<br><br>
<img src="docs/screenshots/menu_manager.png" alt="Menu Manager Screen" width="95%" style="border-radius: 10px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />

<br><br>

### 4. 🧾 Invoices & Bill History (Audit Trail & Revisions)
*Full audit log of settled, held, and cancelled invoices with date range filters, instant reprint triggers, payment status badges, and GST-compliant cancellation logging.*
<br><br>
<img src="docs/screenshots/invoices_history.png" alt="Invoices and History Screen" width="95%" style="border-radius: 10px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />

<br><br>

### 5. 📱 Mobile POS Phone Experience (320px - 767px)
*Ergonomic smartphone layout with bottom navigation, floating cart drawer, tactile touch targets, and full hardware thermal printer connectivity.*
<br><br>
<img src="docs/screenshots/mobile_pos.png" alt="Mobile Phone POS View" width="400" style="border-radius: 18px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />

</div>

---

## 🚀 Key Features & Highlights

### ⚡ Sub-10-Second High-Speed Billing
- **Tactile Touch Grid**: Designed with large touch targets ($44\text{px} - 48\text{px}$) for lightning-fast punching during high-rush counter shifts.
- **Bilingual Search**: Rapid search in both English and Hindi.
- **Multiple Order Types**: Full support for **Dine In** (with Table selection), **Takeaway / Parcel**, and **Delivery**.
- **Variants & Custom Modifiers**: Handle single and multi-size items (Regular, Medium, Large, Half, Full) with dynamic rate adjustments and special prep notes.
- **Held Bills / Parked Orders**: Park in-progress orders with one tap to serve next customers and restore active carts instantly.

### 📴 100% Offline-First (Zero Cloud Dependency)
- **Local Dexie.js (IndexedDB)**: Zero internet or server connection needed.
- **Zero Latency**: Instant data mutations and queries with zero cloud lag.
- **Total Privacy**: All financial and restaurant data stays on the local device storage.

### 🖨️ ESC/POS Thermal Receipt Printing
- **Bluetooth SPP & USB OTG Support**: Direct wireless and wired printer communication for standard 58mm and 80mm thermal printers.
- **Customized Receipts**: Prints restaurant logo, GSTIN, FSSAI number, order type, table number, itemized tax breakdowns, and custom footer notes.
- **High-Fidelity Rasterization**: Automatic conversion of logo images and regional font glyphs to 1-bit dithered thermal print bitmaps.

### 💳 Dynamic UPI Bharat QR Code Generation
- **Integrated Scan & Pay**: Generates dynamic UPI QR codes containing the merchant VPA, bill reference number, and exact payable balance.
- **Zero MDR Transaction Fees**: Customers pay directly via PhonePe, Google Pay, Paytm, BHIM, Navi, Cred, or any UPI app straight into merchant's bank account.

### 📊 Business Intelligence & Export Engine
- **Financial Analytics**: Real-time sales metrics, category performance, hourly peak traffic, and payment method distribution.
- **Excel & PDF Exports**: One-click generation of `.xlsx` spreadsheets and formatted PDF audit summaries for accounts and CA tax filings.

### 🔒 Owner Security & Data Integrity
- **Master PIN Protection**: Safeguard Settings, Database reset, Menu price adjustments, and Invoice voids behind a secure PIN.
- **One-Click Backup & Restore**: Full JSON database backup and restoration.

---

## 🛠️ Technology Stack & Badges

| Technology | Badge | Description |
|---|---|---|
| **React 19** | <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" /> | Core UI component architecture & fast state reconciliation |
| **TypeScript 5** | <img src="https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white" /> | Type safety across POS workflows, models, and DB operations |
| **Vite 6** | <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" /> | High-speed build pipeline and Instant HMR |
| **Capacitor JS 8** | <img src="https://img.shields.io/badge/Capacitor-119EFF?style=flat-square&logo=capacitor&logoColor=white" /> | Native Android bridge for Bluetooth, Haptics & Filesystem |
| **Android SDK** | <img src="https://img.shields.io/badge/Android-3DDC84?style=flat-square&logo=android&logoColor=white" /> | Native Android compilation target (`minSdk 24`, `targetSdk 35`) |
| **Dexie.js 4** | <img src="https://img.shields.io/badge/Dexie.js-F59E0B?style=flat-square&logo=database&logoColor=white" /> | IndexedDB database engine for persistent offline storage |
| **SheetJS (XLSX)** | <img src="https://img.shields.io/badge/SheetJS-217346?style=flat-square&logo=microsoftexcel&logoColor=white" /> | In-browser Excel `.xlsx` report generator & menu importer |
| **jsPDF & AutoTable**| <img src="https://img.shields.io/badge/jsPDF-EC1C24?style=flat-square&logo=adobeacrobatreader&logoColor=white" /> | High-definition PDF invoice & settlement generator |
| **QRCode.js** | <img src="https://img.shields.io/badge/QRCode-000000?style=flat-square&logo=qrcode&logoColor=white" /> | Dynamic UPI payment QR generator |
| **Lucide Icons** | <img src="https://img.shields.io/badge/Lucide-F56565?style=flat-square&logo=feather&logoColor=white" /> | Clean and modern interface iconography |

---

## 📐 Dual-Device Responsive Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BILLING PRO DUAL LAYOUT                         │
├──────────────────────────────────┬─────────────────────────────────────┤
│ 📱 Mobile Phone (320px - 767px)  │ 📟 Tablet / POS Terminal (768px+)   │
├──────────────────────────────────┼─────────────────────────────────────┤
│ • Ergonomic bottom navigation    │ • Split-view dual-pane layout       │
│ • Floating cart pill & drawer    │ • Sticky persistent live order cart │
│ • Swipe-to-dismiss actions       │ • 48px tactile cashier touch grid   │
│ • Safe area insets (notch/bar)   │ • Auto-rotation landscape & portrait│
└──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 📂 Project Structure

```
billing-pro/
├── docs/
│   └── screenshots/           # Real high-resolution UI screen captures
├── mobile/                    # Native Android Capacitor wrapper
│   └── android/               # Native Android Studio project & Gradle configuration
├── public/                    # Static assets, branding logo & icons
├── src/
│   ├── assets/                # App images & icons
│   ├── components/            # React UI components
│   │   ├── BillingScreen.tsx      # Main cashier billing screen & cart
│   │   ├── Dashboard.tsx          # Real-time analytics & graphs
│   │   ├── MenuManager.tsx        # Menu, stock, category & pricing manager
│   │   ├── BillHistory.tsx        # Invoices, reprint, audit log & cancellations
│   │   ├── SettingsScreen.tsx     # Printer configuration, restaurant profile & backup
│   │   ├── ReceiptPreviewModal.tsx# Thermal receipt renderer & ESC/POS parser
│   │   ├── PrinterModal.tsx       # Bluetooth & USB hardware discovery
│   │   ├── CheckoutModal.tsx      # Payment settlement modal (Cash/UPI/Card/Split)
│   │   └── ExportModal.tsx        # Excel (.xlsx) and PDF export engine
│   ├── db/                    # Dexie.js database schema and seed data
│   ├── types/                 # TypeScript type definitions & interfaces
│   ├── utils/                 # Printer bridges, UPI QR generator, Excel tools
│   ├── App.tsx                # Main application navigation & routing
│   ├── index.css              # Styling tokens & responsive design rules
│   └── main.tsx               # Application bootstrap
├── capacitor.config.ts        # Native Capacitor bridge settings
├── package.json               # Node packages & build scripts
└── vite.config.ts             # Vite configuration
```

---

## 💻 Getting Started (Development Setup)

### Prerequisites
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **Android Studio** *(Optional, only required for building native Android APK / AAB)*

### 1. Clone & Install
```bash
git clone https://github.com/Tusharjain-19/Billing-Pos.git
cd Billing-Pos
npm install
```

### 2. Run Web App Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build Production Web Bundle
```bash
npm run build
```

---

## 🤖 Android Native Build Instructions

### 1. Synchronize Web Build to Native Android
```bash
npm run cap:sync
```

### 2. Open Project in Android Studio
```bash
npm run cap:open
```

### 3. Build Debug APK via Gradle
```powershell
cd mobile/android
./gradlew assembleDebug
```
The output APK will be generated at:
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 👨‍💻 Author & Creator

<table style="border: none;">
  <tr>
    <td width="100" align="center" style="border: none;">
      <img src="https://tusharjain.in/assets/profile.jpg" onerror="this.src='https://avatars.githubusercontent.com/u/10000000?v=4'" width="90" style="border-radius: 50%;" alt="Tushar Jain" />
    </td>
    <td style="border: none;">
      <h3>Made with ❤️ by <b>Tushar Jain</b></h3>
      <p>
        Full-Stack Engineer & Product Builder passionate about building intuitive, robust, and high-speed web and mobile systems.
      </p>
      <p>
        🌐 <b>Portfolio Website:</b> <a href="https://tusharjain.in"><b>https://tusharjain.in</b></a><br>
        🐙 <b>GitHub:</b> <a href="https://github.com/Tusharjain-19"><b>@Tusharjain-19</b></a><br>
        📧 <b>Email / Contact:</b> <a href="https://tusharjain.in">Visit Portfolio & Contact</a>
      </p>
    </td>
  </tr>
</table>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use and customize it.
