# BookMyDine POS (Billing Pro) — System Design & UI/UX Architecture (`DESIGN.md`)

> **Architect**: Principal POS Systems Architect (40-Year Systems Architecture Paradigm)  
> **Target Hardware**: Industrial Touch Terminals, NCR/Toshiba POS, Sunmi/iMin Handheld Android Terminals, Dual-Screen Counter Displays, Desktop Browsers.  
> **Philosophy**: **Industrial Utility over Toy SaaS Aesthetics**. Zero latency, zero bubbly radiuses, sharp rectangular precision, maximum contrast, native typography, and zero-friction cashier turnover.

---

## 1. Core Engineering Principles

### 1.1 The Industrial POS Paradigm
Point-of-Sale (POS) systems are mission-critical industrial software operated 10–14 hours daily in harsh, fast-paced restaurant environments. Cashiers and kitchen staff do not want bubbly pastel pills, slow spring animations, or low-contrast AI gradients. They require:

1. **Instantaneous Tactile Response**: Immediate state feedback (<50ms). Zero layout thrashing.
2. **Sharp Rectangular Geometry**: 0px border-radius standard (`border-radius: 0px`). Clean 1px structural dividers. Every pixel serves a spatial purpose.
3. **Tabular Information Density**: Strict column alignment using tabular numerals (`tabular-nums`) and fixed-width monospace receipts.
4. **Zero-Friction Transaction Loop**: Order punched → Instant Settle → Hardware Print → Automatic Reset to fresh bill in under 1 second.

---

## 2. Visual Identity & Non-AI Color System

We eliminate hyper-saturated AI gradients, fluorescent purples, and artificial pastel candy tones. The system uses a disciplined, high-contrast industrial palette calibrated for visibility under intense counter lighting and varied display angles.

### 2.1 Industrial Color Tokens

| Token | Hex Value | Role | Practical Application |
| :--- | :--- | :--- | :--- |
| `--bg-app` | `#F3F4F6` | Master Canvas | Neutral, glare-free architectural background |
| `--bg-surface` | `#FFFFFF` | Work Surface | Bill ledger, category matrix, dish grid |
| `--bg-surface-elevated`| `#F9FAFB` | Controls & Trays | Input fields, search bars, toolbar containers |
| `--border-color` | `#D1D5DB` | Primary Divider | Sharp 1px structural borders between panes |
| `--border-subtle` | `#E5E7EB` | Inner Divider | Line-item row separators, subtotal dividers |
| `--text-main` | `#111827` | High-Contrast Ink | Item titles, prices, headings, store name |
| `--text-body` | `#374151` | Body Text | Item details, tax percentages, category names |
| `--text-muted` | `#6B7280` | Metadata | Timestamps, bill prefixes, order counts |
| `--primary` | `#1E293B` | Industrial Charcoal | Primary actions, selected tabs, confirm buttons |
| `--primary-hover` | `#0F172A` | Deep Charcoal | Button press / hover state |
| `--accent-green` | `#15803D` | Transaction Green | Paid status, Print Receipt, Settle confirmation |
| `--accent-green-hover` | `#166534` | Forest Green Dark | Active Print button hover |
| `--accent-green-light` | `#F0FDF4` | Success Surface | Paid badge, tender change return box |
| `--accent-amber` | `#B45309` | Warning / Hold | Parked bills, out of stock, pending orders |
| `--accent-rose` | `#DC2626` | Danger / Void | Cancel order, delete line item, close modal |
| `--accent-rose-light` | `#FEF2F2` | Danger Surface | Delete confirmation card, void receipts |

---

## 3. Native Non-AI Typography Stack

We eliminate bloated external Google webfonts (`Plus Jakarta Sans`, `Poppins`, `Outfit`) which introduce network latency, layout shifts (CLS), and blurry subpixel anti-aliasing. We rely on **proven, battle-tested native operating system typography**:

### 3.1 Primary UI Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```
- Blazing-fast instant render with zero network requests.
- Optimal legibility at small sizes (11px – 13px) on lower-resolution POS counter displays.
- Strict numeric alignment: `font-variant-numeric: tabular-nums`.

### 3.2 Monospace / Thermal Print Font Stack
```css
font-family: "SF Mono", "Consolas", "Courier New", Courier, monospace;
```
- Rigid fixed-width character pitch for 58mm (32 chars/line) and 80mm (48 chars/line) thermal heads.
- Deterministic column widths for: `ITEM (left) | QTY (center) | AMOUNT (right)`.

---

## 4. Geometric Architecture: Rectangles Over Bubbly Pills

### 4.1 Strict 0px Border-Radius Standard
```css
/* Industrial Standard: Pure Rectangular Geometry */
button,
input,
select,
textarea,
.card,
.modal,
.badge,
.pill,
.sheet {
  border-radius: 0px !important;
}
```
- **Buttons**: Sharp rectangular blocks with 1px solid borders.
- **Inputs & Selects**: Clean rectangular input boxes with high-contrast active borders.
- **Dish & Product Cards**: Crisp grid rectangles displaying Name, Veg indicator, and Price in ₹.
- **Receipt Preview & Printer Cap**: Architectural, crisp rectangular paper simulation with realistic feed slit.
- **Segmented Controls**: Rectangular tab strip with inverted active fill (`#1E293B` or `#15803D`).

---

## 5. Micro-Animations: Mechanical Tactile Feedback

Animations must be purposeful, snappy, and mechanical. No cartoonish bouncy spring physics (`scale(0.96)`) that make buttons feel sluggish.

### 5.1 Mechanical Button Depression
```css
button:active {
  transform: translateY(1px);
  transition: transform 0.05s ease;
}
```
Emulates physical mechanical microswitch travel on POS hardware keyboards and industrial touchscreens.

### 5.2 Thermal Paper Feed Simulation
Downward paper dispense from the printer slot using clean vertical translation (`@keyframes thermalPaperFeed`):
```css
@keyframes thermalPaperFeed {
  from {
    transform: translateY(-24px);
    opacity: 0.85;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

---

## 6. End-to-End Cashier Flow: Settle → Print → Auto-Reset

A 40-year veteran POS developer designs for the **queue at 8:30 PM on a Friday evening**. Every second saved per transaction directly increases restaurant throughput and revenue.

```
┌─────────────────┐      ┌─────────────────────────┐      ┌───────────────────────────┐
│ 1. PUNCH ITEMS  │ ───► │ 2. SETTLE & CONFIRM     │ ───► │ 3. INSTANT AUTO-RESET     │
│ Quick clicks on │      │ Click [Settle] or [F9]  │      │ Modal closes immediately, │
│ rectangular     │      │ Cash/UPI selected       │      │ Cart cleared (₹0.00),     │
│ menu cards      │      │ Hardware cut triggered  │      │ Order # incremented       │
└─────────────────┘      └─────────────────────────┘      └───────────────────────────┘
                                                                       │
                                                                       ▼
                                                          Ready for Next Customer!
```

1. **One-Touch Settle & Print**:
   - When the cashier clicks `Settle` → selects Cash/UPI → clicks `Confirm & Print`:
   - Payment status is immediately committed to IndexedDB (`paid`, `paymentMode`).
   - Thermal receipt / print job is dispatched to hardware.
   - The preview modal **closes automatically**.
   - The cart is **instantly cleared**, table/customer inputs are reset, and the cashier is ready to punch the next customer's order without touching the mouse again.
2. **Keyboard Accelerators**:
   - `F2`: Start New Bill / Clear Cart
   - `F8`: Hold Current Bill (Park order)
   - `F9`: Quick Print & Settle
   - `F12`: Instant Cash Settlement
   - `Enter`: Confirm / Submit
   - `Esc`: Dismiss / Back

---

## 7. Thermal Printing Specifications (Indian Restaurant Standard)

1. **Width Standards**:
   - `58mm` (2-inch roll, 384 dots, 32 monospace characters/line).
   - `80mm` (3-inch roll, 576 dots, 48 monospace characters/line).
2. **Strict Receipt Layout**:
   - **Header**: Centered Brand Logo (scaled according to Settings: 36px, 52px, 68px, or 84px), Store Name, Address, Phone, GSTIN, FSSAI.
   - **Bill Metadata**: Bill No, Date & Time, Order Type, Table / Order #.
   - **Item Table**: QTY, Item Name with variant, Amount.
   - **Tax Breakup**: CGST + SGST line items.
   - **Grand Total**: BOLD large font (`RS XXX.XX`).
   - **Payment Confirmation**: `PAYMENT (CASH/UPI) RS XXX.XX`.
   - **Dynamic QR**: ONLY included when user explicitly selects `With QR`. Defaults strictly to `No QR`.
   - **Footer**: `THANK YOU, VISIT AGAIN!`.
3. **Iframe Isolation**: Browser prints via detached hidden iframe with `@page { margin: 0; }` to eliminate browser page headers, footers, URL prints, and margin overlaps.
