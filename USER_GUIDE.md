# Billing Pro POS™ — Complete Operational User Guide

Welcome to the **Billing Pro POS™ User Guide**. This manual covers standard operating procedures, hardware configuration, high-speed cashier workflows, inventory controls, and financial auditing for restaurants, cafes, QSRs, and retail outlets.

---

## 📋 Table of Contents

1. [Initial Setup & Business Profile](#1-initial-setup--business-profile)
2. [Thermal Printer Setup (58mm & 80mm)](#2-thermal-printer-setup-58mm--80mm)
3. [Cashier Station & High-Speed Order Punching](#3-cashier-station--high-speed-order-punching)
4. [Settlement, Dynamic UPI QR & Payments](#4-settlement-dynamic-upi-qr--payments)
5. [Held Bills & Table Order Management](#5-held-bills--table-order-management)
6. [Inventory & Menu Catalog Management](#6-inventory--menu-catalog-management)
7. [Executive Analytics & Financial Reports](#7-executive-analytics--financial-reports)
8. [End-of-Day Closing & Data Backup Procedures](#8-end-of-day-closing--data-backup-procedures)

---

## 1. Initial Setup & Business Profile

Upon launching Billing Pro POS for the first time:

1. Navigate to **Settings ⚙️** from the left navigation sidebar.
2. Complete your **Business Profile**:
   - **Outlet Name**: Name printed at the top of receipts (e.g., *Royal Chai & Cafe*).
   - **Tagline / Subtitle**: Optional marketing slogan (e.g., *Freshly Brewed Every Day*).
   - **Store Address & City**: Contact address for customer receipts.
   - **Phone Number**: Outlet helpline for delivery or inquiries.
   - **GSTIN & FSSAI Number**: Enter your 15-character GST registration number and 14-digit FSSAI license.
   - **Merchant UPI ID (VPA)**: Enter your business UPI handle (e.g., `merchantname@okicici` or `9876543210@paytm`). This is used for generating dynamic Bharat QR payment codes on receipts and screens.
   - **Brand Logo**: Upload your square ($1:1$) logo PNG or JPG. The built-in image cropper automatically optimizes the image for screens and 1-bit thermal print dither.
3. Set your **Tax Mode**: Select Flat Tax (e.g., 5% GST with 2.5% CGST + 2.5% SGST) or Item-Level Tax Slabs.
4. Click **Save Settings** to persist all parameters locally.

---

## 2. Thermal Printer Setup (58mm & 80mm)

Billing Pro POS features an ultra-optimized native ESC/POS thermal printing engine with support for 58mm (2-inch, 384 dots) and 80mm (3-inch, 576 dots) printers.

### Wireless Bluetooth Setup (Android & PC):
1. Power on your wireless Bluetooth thermal receipt printer and ensure paper roll is loaded correctly.
2. In Billing Pro POS, click the **Printer Icon 🖨️** in the top header or go to **Settings ⚙️ → Printer Settings**.
3. Click **"Scan for Bluetooth Printers"**.
4. Select your printer device from the discovered list (e.g., `MTP-II`, `RPP02N`, `POS-58`, `Bluetooth Printer`).
5. Once paired, click **"Test Print"** to verify text alignment, centered logo rendering, and paper feed.

### USB & System Dialog Print (Windows PC):
- On Windows PC, Billing Pro POS connects to installed Windows spooler printers or prints directly via high-speed ESC/POS USB emulation.
- Enable **"Show Print Preview Before Printing"** if you wish to review the digital receipt layout before physical paper feed.

---

## 3. Cashier Station & High-Speed Order Punching

The cashier billing station is designed for sub-10-second order fulfillment:

```
+-------------------------------------------------------------------------------+
|  [🔍 Search Menu (English / Hindi)]    [ALL]  [BEVERAGES]  [SNACKS]  [MEALS]   |
+-------------------------------------------------------------------------------+
|  +---------------------+ +---------------------+  |  CART DOCKET: DINE IN     |
|  | Masala Chai  ₹20    | | Paneer Tikka  ₹180  |  |  ------------------------ |
|  | 📦 Stock: 14 left   | | 📦 Stock: 8 left    |  |  1x Masala Chai      ₹20  |
|  +---------------------+ +---------------------+  |  2x Paneer Tikka    ₹360  |
|  +---------------------+ +---------------------+  |  ------------------------ |
|  | Veg Burger   ₹90    | | Cold Coffee   ₹70   |  |  Subtotal:          ₹380  |
|  | 🔴 OUT OF STOCK     | | 📦 Stock: Unlimited |  |  GST (5%):           ₹19  |
|  +---------------------+ +---------------------+  |  Grand Total:       ₹399  |
|                                                   |  [HOLD]  [SETTLE ₹399 ⚡] |
+-------------------------------------------------------------------------------+
```

- **Order Types**: Select **Dine In** (with Table Number), **Takeaway / Parcel** (with optional customer name & mobile), or **Delivery**.
- **Adding Items**: Tap any product card to add 1 unit to the active cart.
- **Stock Guard Logic**: If an item has limited stock (e.g., only 1 portion remaining), attempting to increment beyond available stock triggers an instant warning alert to prevent kitchen overselling.
- **Item Modifiers & Variants**: Click the modifier gear on items with multi-size options (e.g., Half / Full, Regular / Large) or add custom kitchen instructions (e.g., *"Less Spicy, Extra Ginger"*).
- **Custom Discounts**: Apply flat rupee discounts or percentage discounts with one click.

---

## 4. Settlement, Dynamic UPI QR & Payments

1. Click the large green **"SETTLE BILL ⚡"** button at the bottom of the cart docket.
2. The settlement modal opens with a **free, uncluttered cursor** so you can seamlessly review totals.
3. Select the desired **Payment Mode**:
   - **Cash 💵**: Enter cash tendered to calculate exact return change in real time.
   - **UPI / QR 📱**: Displays an instant dynamic Bharat QR code. The customer scans using Google Pay, PhonePe, Paytm, BHIM, or any banking app.
   - **Card 💳**: For POS swipe machine / EDC card payments.
   - **Split 🔀**: Split payments across multiple tenders (e.g., ₹200 Cash + ₹199 UPI).
4. Click **Complete Settlement**.
5. A Google Pay-style animated green confirmation appears with sound feedback, and the thermal receipt prints automatically!

---

## 5. Held Bills & Table Order Management

During peak counter rushes, cashiers often need to pause an order while a customer decides or fetches money:

- **Hold Order**: Tap the yellow **"Hold Bill"** button on the cart. The active order is safely parked, and the cart resets instantly for the next customer.
- **Recall Held Bill**: Tap the **"Held Bills (N)"** badge in the top header to view all parked tickets, their elapsed time, item counts, and restore them with one click.
- **Table Switching**: Easily assign or change table numbers for dine-in guests without losing punched items.

---

## 6. Inventory & Menu Catalog Management

Navigate to **Menu Manager 🍲** to maintain your food and beverage catalog:

- **Create Items**: Add Item Name, Hindi Name, Category, Base Price, Tax Slab, HSN Code, and Stock Quantity.
- **Veg / Non-Veg / Vegan Indicators**: Color-coded dietary badges for high-legibility menus.
- **Live Stock Toggles**: Toggle items to "Out of Stock" with a single click during kitchen stockouts.
- **Bulk Excel Import/Export**: Export your entire menu to an `.xlsx` spreadsheet, edit rates in bulk, and re-import in seconds.

---

## 7. Executive Analytics & Financial Reports

Navigate to **Reports 📊** for real-time business intelligence tailored to Indian food and retail businesses:

- **Key Performance Indicators (KPIs)**: Gross Sales, Net Taxable Value, CGST/SGST Collected, Average Order Value (AOV), and Total Guest Invoices.
- **Operational Ratios**: Table turnover velocity, peak revenue hour analysis, food cost percentages, and payment mode breakdown.
- **Visual Chart Dossiers**: Interactive bar charts and donut diagrams for revenue trends and dish popularity.
- **Dossier Exports**: Export full financial audit reports to Excel (`.xlsx`) and high-definition PDF (`.pdf`) with embedded analytics charts for chartered accountants and tax filing.

---

## 8. End-of-Day Closing & Data Backup Procedures

To guarantee 100% data safety and continuity:

1. At the end of every business shift, navigate to **Reports 📊** and generate the **Daily Sales Summary**.
2. Navigate to **Settings ⚙️ → Backup & Restore**.
3. Click **"Download Database Backup (.json)"**.
4. Save the generated `.json` backup file to a safe location (e.g., secondary hard drive, USB flash drive, or personal cloud folder).
5. In case of hardware replacement or system migration, click **"Restore Database"** to restore all invoices, menus, and business settings in less than 3 seconds!

---

*Billing Pro POS™ — The Fastest, Most Reliable Offline POS for Growing Businesses.*
