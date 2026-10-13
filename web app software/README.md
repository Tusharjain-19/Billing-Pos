# Billing Pro POS — Web Application Software (PWA & Web POS)

> **High-Performance 100% Offline-First Web Point of Sale (POS)**  
> **Framework**: React 19 + TypeScript + Vite  
> **Database Engine**: Dexie.js (IndexedDB local sandbox, zero cloud latency)  
> **Printing Subsystem**: Web Print API + ESC/POS raw thermal driver emulation  
> **UI Architecture**: Industrial utility, 0px border-radius standard, high contrast, zero emojis

---

## 1. Quick Start / Development

From this directory:

```bash
# Install dependencies (if not already installed)
npm install

# Start local development server (Vite)
npm run dev

# Run Oxlint static code analysis
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 2. Key Architecture & Modules

- `src/App.tsx`: Main POS application orchestration and view router.
- `src/components/BillingScreen.tsx`: Industrial cashier workstation, fast item grid, cart docket, discount, tax, split tender.
- `src/components/Dashboard.tsx`: Real-time executive metrics, sales velocity, payment breakdowns.
- `src/components/MenuManager.tsx`: Catalog maintenance, stock adjustments, GST slabs, Excel bulk catalog import/export.
- `src/components/BillHistory.tsx`: Settled/parked invoice ledger, GST audit trail, duplicate receipt reprints.
- `src/components/ReceiptPreviewModal.tsx`: Realistic 58mm/80mm thermal receipt render with live paper feed animation and barcode/Bharat UPI QR.
- `src/db/index.ts`: Dexie.js IndexedDB schema v4, offline sandboxed storage, automated backup/restore JSON dumps.
- `src/utils/printer.ts`: ESC/POS direct thermal print dispatcher (58mm/80mm layout calculation, ESC/POS hardware cut commands).
- `src/utils/capacitor.ts`: Native hardware bridge detection (falls back gracefully to Web APIs in standard browsers).

---

## 3. Keyboard Cashier Accelerators

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `F2` | New Bill | Clears cart and resets docket for next customer |
| `F8` | Hold Order | Parks active bill into held queue |
| `F9` | Settle & Print | Opens quick settlement tender modal |
| `F12` | Instant Cash | Settles bill with exact cash, prints receipt, auto-resets in <1s |
| `ESC` | Dismiss | Closes active modal or dialog |

---

## 4. Real Software Screenshots

View the authentic interface screenshots in [`docs/screenshots/`](../docs/screenshots/):
- [**01. Rapid Billing Screen**](../docs/screenshots/01_rapid_billing.png)
- [**02. Menu & Inventory Catalog**](../docs/screenshots/02_menu_inventory.png)
- [**03. Sequential Invoices Ledger**](../docs/screenshots/03_invoices_ledger.png)
- [**04. Statutory GSTR-1 Reports**](../docs/screenshots/04_statutory_gst_reports.png)
- [**05. POS Dashboard & Velocity**](../docs/screenshots/05_pos_dashboard.png)
- [**06. Sales Leaderboard**](../docs/screenshots/06_sales_leaderboard.png)

