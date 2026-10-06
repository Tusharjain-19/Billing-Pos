# PRD : Billing Pro POS by BookMyDine QR

Offline-first Android billing app for restaurants, cafés, food stalls and cloud kitchens.
Version: 1.0 draft | Platform: Android (APK for testing, AAB for Play Store)

---

## 1. Product summary

**One line:** Tap items, get a bill in under 10 seconds, print it on a real thermal printer, and keep every record safely on the phone, with no internet and no server.

**Target user:** Small restaurant owner or counter staff in India. Low patience, busy rush hours, often a cheap 2–4 GB Android phone and a 58mm or 80mm thermal printer.

**Core principles**
1. **Speed first.** Fewest taps possible during rush.
2. **Works offline forever.** No account, no login, no internet permission needed.
3. **Data safety.** The phone is the only storage, so backup and export are first-class features.
4. **Real printing.** Native Bluetooth, USB, and (bonus) LAN printing using ESC/POS. No browser print dialog.
5. **Compliance-friendly.** Sequential bill numbers, GST fields, audit trail.

### Name recommendation
| Name | Why |
|---|---|
| **BookMyDine Bill** (recommended) | Fits your existing BookMyDine QR brand; one product family |
| BillEasy | Short, clear, easy to remember |
| TapBill | Describes the tap-to-add idea |

Check Play Store and trademark availability before final choice. Suggested package id: `com.bookmyslot.bill`.

---

## 2. Idea analysis: loopholes found and fixes

| # | Loophole in the original idea | Fix in this PRD |
|---|---|---|
| 1 | "No database, use phone storage" — raw files or localStorage get corrupted, are slow, and can be wiped by the OS | "No database" must mean *no server*. Use **on-device SQLite** (Room). Fast, safe, transactional |
| 2 | Phone lost, broken, or app uninstalled = all bills gone | **Backup/Restore** file, scheduled reminder, optional auto-backup to a folder the owner picks (Drive/SD/WhatsApp share) |
| 3 | No menu management mentioned — where do items and prices come from? | Add **Menu Manager**: categories, items, prices, variants, Excel/CSV import |
| 4 | Deleting and editing bills breaks GST rules (bill numbers must be consecutive and unique) | **Cancel/Void with reason** instead of silent delete. Edits create a **revision with audit log**. Hard delete only after export (see 6.9) |
| 5 | Item price changes would change old bills | Bill stores a **snapshot** of name, price, tax at the time of sale |
| 6 | Dynamic UPI QR cannot confirm payment without a server | QR is generated with amount and bill no. Staff taps **"Mark Paid"** manually. Be honest in the UI: "Check your UPI app for payment" |
| 7 | Printers have no Hindi/regional fonts, and many cannot print ₹ | Render text as a **bitmap (raster)** when needed, or fall back to "Rs" |
| 8 | Logo printing | Auto-convert to **1-bit dithered bitmap** at the correct paper width |
| 9 | Bluetooth reliability: pairing, disconnects, Android 12+ permissions | Saved default printer, auto-reconnect, **print queue with retry**, test-print button, clear error messages |
| 10 | Wired printer: Android has no standard driver | Use **USB Host API** with OTG cable, ESC/POS raw bytes, remember vendor/product id |
| 11 | Anyone holding the phone can edit/delete or wipe data | **Owner PIN / biometric** for settings, edit, cancel, delete, clear data |
| 12 | Exporting to Excel then deleting can lose data if the export silently fails | **Verified export**: file written, re-read, row count checked, then typed confirmation before delete |
| 13 | Large Excel libraries (Apache POI) make the app heavy and slow on cheap phones | Use a lightweight xlsx writer (e.g. FastExcel) and also offer CSV |
| 14 | Multiple phones/staff would each have separate data | **Out of scope for v1**, stated clearly. Optional sync later |
| 15 | "Token" is unclear | Defined below: **Token = daily-resetting order number** printed on a small slip or at the top of the bill |
| 16 | Lost signing keystore = can never update the app on Play Store | Use **Play App Signing**, and keep the upload keystore backed up in two places |
| 17 | Rush-hour accidents: wrong tap, duplicate print, closing app mid-bill | **Draft/held bills auto-saved**, undo last action, confirm before cancel |
| 18 | GST invoice number rules | Max **16 characters**, consecutive, unique per financial year (April–March). Confirm details with a CA |

---

## 3. Technology decision

Printing, USB, file saving, and SQLite are all native features. This decides the stack.

| Option | Pros | Cons |
|---|---|---|
| **A. Native Kotlin + Jetpack Compose + Room** (recommended) | Best Bluetooth/USB reliability, fastest UI, smallest APK, direct AAB, no bridge bugs | Kotlin learning curve (AI IDE helps a lot) |
| B. React + Capacitor | Web skills reused, quick UI | Needs a **custom Kotlin plugin** for printing anyway; USB support in community plugins is weak or unmaintained; WebView slower on cheap phones |
| C. Flutter | One codebase, good UI speed | Printer plugins vary in quality, USB again needs native code |

**Recommendation:** Option A. If you prefer web UI, Option B is acceptable only if you write a small native Kotlin printer plugin (Bluetooth SPP + USB host) instead of trusting random community plugins. Verify any plugin is maintained before depending on it.

**Final stack (Option A)**
- Kotlin, Jetpack Compose (Material 3), single-activity
- Room (SQLite), DataStore for simple settings
- Hilt or manual DI, Kotlin Coroutines/Flow
- ESC/POS encoder (own small module, unit tested)
- Bluetooth Classic (SPP/RFCOMM), USB Host, LAN socket (port 9100, bonus)
- ZXing/QR-code encoder for QR bitmap, `androidx.biometric`
- FastExcel (xlsx) + CSV
- minSdk 24 (Android 7), targetSdk = latest required by Play at publish time
- No `INTERNET` permission in v1 (also helps Play "Data safety": no data collected)

---

## 4. Scope

### MVP (v1.0)
- Fast billing screen (tap to add, qty, remove)
- Menu manager (categories, items, price, tax, variants)
- Restaurant profile and settings (name, address, phone, GSTIN, FSSAI, logo, footer text, UPI ID)
- Bill modes: Normal, With Token, With UPI QR (combinable)
- Bluetooth and USB thermal printing (58mm and 80mm)
- Bill history with filters, view, reprint, edit (revision), cancel
- Payment mode: Cash / UPI / Card / Split
- Discount, packaging/service charge, GST (inclusive or exclusive), rounding
- Held bills / multiple open tables
- Verified monthly Excel export then safe delete
- Backup and Restore
- App lock (PIN/biometric)
- Hindi + English UI

### v1.1
- Kitchen Order Ticket (KOT) printing
- LAN/WiFi printer
- Daily closing report (Z-report) print
- Sales reports (top items, hour-wise, payment-wise)
- Cash drawer kick
- Staff roles (Owner / Cashier)
- Share bill as PDF/image via WhatsApp

### Later
- Optional cloud sync and multi-device
- Inventory, customer ledger, loyalty
- Online order integrations

### Non-goals (v1)
Online payments gateway, server, user accounts, delivery tracking.

---

## 5. User flows

**First launch:** Welcome → Restaurant details (name, address, GSTIN optional) → Add logo (optional) → Set owner PIN → Connect printer (skippable) → Add first items (or import) → Billing screen.

**Make a bill (target: 3 to 6 taps):** Open app → tap items → (optional) table/token/discount → **Print & Save** → new bill ready automatically.

**Reprint:** History → tap bill → Reprint (prints with "DUPLICATE COPY" mark).

**Month end:** Settings → Storage → Export month → choose folder → verification → confirm → delete exported month's bills.

---

## 6. Functional requirements

### 6.1 Billing screen (home)
- Layout: left/top = categories and item grid, right/bottom = current bill. Tablet and landscape supported.
- **Tap item = add 1**. Each further tap = quantity +1. Show quantity badge on the item tile.
- Bill line has **− / +** buttons and swipe-to-remove. Long-press line for note (e.g. "less spicy") or price override (needs permission setting).
- Search bar (type to filter items, supports Hindi and English). Favorites/"most sold" row at top.
- Variants (Half/Full, Small/Large) via a bottom sheet on tap, remembering last choice.
- Running total always visible at bottom with big **PRINT & SAVE** button.
- Secondary actions: Hold bill, Clear bill (with confirm), Save without printing.
- Undo last action (snackbar).
- Order type: Dine-in (table no.), Takeaway, Delivery (optional customer name/phone/address).
- Totals: subtotal, discount (flat or %), service/packaging charge, tax breakup (CGST/SGST), round-off, grand total.
- Tax mode per restaurant: **Tax inclusive**, **Tax exclusive**, **No tax / Bill of Supply** (composition scheme or unregistered).

### 6.2 Menu manager
- Category CRUD, item CRUD (name, short name for printing, price, tax %, category, veg/non-veg, active toggle, sort order, optional image or color).
- Variants/price options per item.
- Import/Export menu via Excel/CSV (provide a template).
- Item price change affects only **future** bills.
- Do not hard delete an item used in bills: archive it instead.

### 6.3 Restaurant profile and settings
- Name, tagline, address (multi-line), phone, email (optional), GSTIN (validate 15-character format), FSSAI (14 digits), PAN (optional), custom extra fields (label + value, printed on bill), header and footer message (e.g. "Thank you, visit again").
- Logo upload with preview of the thermal result.
- UPI ID (VPA) and payee name; validate format `name@bank`.
- Bill settings: number prefix, financial-year reset, token start number and reset time (daily at chosen hour, e.g. 4 AM so late-night sales stay in one day), currency symbol mode (₹ or Rs), paper width, font size, copies, auto-open next bill, show/hide fields.
- Printer settings (see section 7).
- Security: PIN, biometric, auto-lock timeout.
- Language: English / Hindi.
- Backup and storage tools.

### 6.4 Bill modes
| Mode | Behavior |
|---|---|
| **Normal bill** | Standard bill, no token |
| **With token** | Token number (1, 2, 3 … resets daily) printed large at top of the bill and optionally as a separate small slip for the customer or kitchen |
| **With dynamic UPI QR** | QR generated per bill with exact amount, printed at bottom plus "Scan to pay ₹X" |
| **Combined** | Token + QR together |

Mode can be set as default in settings and switched per bill on the billing screen.

**UPI QR format:** `upi://pay?pa=<VPA>&pn=<Name>&am=<Amount>&cu=INR&tn=<BillNo>` (URL-encoded). Also show the QR on screen so the customer can scan from the phone without printing. After payment, staff taps **Mark Paid** and selects mode.

### 6.5 Payments
- Payment mode: Cash, UPI, Card, Other, **Split** (e.g. 200 cash + 150 UPI).
- Status: Paid / Unpaid (pay later) / Cancelled.
- Cash received and change due calculator (optional).

### 6.6 Bill numbering
- Format: `PREFIX + FY + running number`, **maximum 16 characters**, e.g. `B2627-000123`.
- Continuous with no gaps. Cancelled bills keep their number and show as CANCELLED.
- Counter updated inside the same database transaction as the bill save.
- Resets at the start of each financial year (1 April), configurable.
- Token counter separate and resets daily.

### 6.7 Bill history
- List grouped by date with bill no., time, amount, payment mode, status.
- **Filters:** Today, Yesterday, Last 7 days, This month, Last month, **Custom date range (calendar)**, All. Also filter by payment mode, status, and order type.
- Search by bill number, table, customer name or phone, amount.
- Summary strip for the selected filter: total sales, bill count, cash vs UPI vs card, tax collected.
- Bill detail screen: items, taxes, payment, audit history.
- Actions: **Reprint, Edit, Cancel, Share (v1.1)**.

### 6.8 Edit, cancel and delete rules (safe by design)
- **Edit:** requires owner PIN (configurable). Original is saved as a revision. Edited bill shows "Revised" tag. Audit log records who, when, and what changed. Option to restrict edits to the same day.
- **Cancel (void):** requires reason, PIN. Bill stays in history as CANCELLED, number not reused, excluded from sales totals.
- **Reprint:** allowed anytime, prints a "DUPLICATE" marker, logs the print count.
- **Hard delete:** not available on individual bills in normal view. Bills can only be permanently removed through the **verified monthly export and delete** flow below. (Some owners may want single delete. If so, allow it only for cancelled or unpaid test bills with PIN, and log it.)

### 6.9 Storage, monthly export and safe delete
**Storage screen** shows: number of bills, database size, free phone storage, last export date, last backup date.

**Export month (Excel .xlsx, also CSV):**
- Sheets: **Bills** (one row per bill), **Items** (one row per line item), **Daily Summary**, **Tax Summary (GST)**, **Payment Summary**.
- Saved through Android's folder picker (Storage Access Framework) into a folder the owner chooses. No broad storage permission needed.
- File name: `RestroName_2026-09_Bills.xlsx`.

**Safe delete flow (cannot be skipped):**
1. Select a month (current month is blocked until it ends, unless owner overrides with warning).
2. App exports the file.
3. App **re-opens the file and verifies** row counts and total amount against the database.
4. Offer "Also save full backup".
5. Show summary: "Delete 1,284 bills (₹4,82,310) from September 2026?"
6. Require **PIN + typing DELETE**.
7. Delete in one transaction. Keep a compact **monthly archive record** (month, bill count, number range, totals, export file name) so reports, number continuity, and audit remain.
8. If any step fails, nothing is deleted.

**Clear all data (factory reset)** is separate, hidden under advanced settings, requires a backup prompt, PIN and typed confirmation.

**Retention reminder:** GST records generally need to be kept for several years (commonly 6). Show a note recommending keeping exported files safe. Confirm requirements with a CA.

### 6.10 Backup and restore
- **Backup** produces one file (`.bmdbackup`, zipped DB + settings + logo), shareable to Drive, WhatsApp, email, or saved in a chosen folder.
- **Restore** validates file version and integrity, then asks to replace or merge (v1: replace only).
- Optional reminder: "Last backup 7 days ago".
- Android Auto Backup rules set carefully so restore on a new phone does not create duplicate or inconsistent counters.
- Data not synced anywhere: state this on a one-time info screen.

### 6.11 Security
- Owner PIN (4–6 digits) and optional biometric.
- App lock on launch and after timeout.
- PIN required for: settings, price override, edit, cancel, export-delete, clear data.
- Optional encrypted database (SQLCipher) in v1.1. At minimum exclude app data from insecure backup paths.
- No analytics, no ads, no network.

---

## 7. Printing specification

### 7.1 Supported connections
| Type | How | Notes |
|---|---|---|
| **Bluetooth Classic** (most thermal printers) | RFCOMM/SPP socket with UUID `00001101-0000-1000-8000-00805F9B34FB` | Pair in Android settings or via in-app scan |
| **USB wired** | Android USB Host API + OTG cable | App asks USB permission; remember device |
| **LAN/WiFi** (v1.1) | TCP socket to port 9100 | Needs IP |
| BLE printers | Optional later | Fewer budget printers use it |

**Android 12+ permissions:** `BLUETOOTH_CONNECT` and `BLUETOOTH_SCAN` (declare `neverForLocation`). Android 11 and below: `BLUETOOTH`, `BLUETOOTH_ADMIN`, and location for scanning. Ask permissions at the moment they are needed, with a friendly explanation.

### 7.2 Paper and layout
| Paper | Printable width | Characters (Font A) |
|---|---|---|
| 58mm | 384 dots | 32 |
| 80mm | 576 dots | 48 |

- Layout engine builds lines: centered header, left-aligned item name, right-aligned qty/rate/amount columns, dashed separators, totals right-aligned.
- Long item names wrap to the next line.
- Fonts: normal, bold, double height/width (for token number and grand total).

### 7.3 Content to print (in order)
1. Logo (optional)
2. Restaurant name, address, phone, GSTIN, FSSAI, custom fields
3. Bill no., date/time, order type/table, cashier (optional)
4. **Token number** (large, if enabled)
5. Items table: Item | Qty | Rate | Amount
6. Subtotal, discount, charges, CGST/SGST, round-off, **Grand total (large)**
7. Payment mode / status
8. **UPI QR** (if enabled) with "Scan to pay"
9. Footer message
10. Paper feed + auto cut (if printer supports it)
11. "DUPLICATE COPY" marker on reprints

### 7.4 Technical details
- ESC/POS commands: init `ESC @`, align `ESC a`, bold `ESC E`, size `GS !`, raster bitmap `GS v 0`, QR `GS ( k` (fall back to bitmap QR if the printer rejects it), cut `GS V`, cash drawer `ESC p`.
- **Raster fallback for non-Latin text (Hindi etc.) and ₹:** draw the receipt line to a bitmap with Android Canvas, then send as an image. This guarantees correct text on any printer.
- Logo: scale to paper width, convert to monochrome with dithering, cache the converted bytes.
- Send data in small chunks with a short delay to avoid Bluetooth buffer overflow on cheap printers.
- Printer profile: name, connection type, address/USB ids, paper width, codepage, cut support, chars per line, copies.
- **Print queue:** if printing fails, the bill is already saved; show "Print failed — Retry". Never lose the bill because the printer is off.
- **Test print** button (prints sample receipt with QR and Hindi text).
- Auto-reconnect on app start; show a printer status chip on the billing screen (Connected / Not connected).
- Fallback sharing: Save bill as PDF/image (v1.1), but this is not the main path.

### 7.5 Printer compatibility test list
Test on at least: one cheap 58mm Bluetooth printer, one 80mm Bluetooth printer, one 80mm USB printer. Common brands to test: Rongta, Epson TM series, Xprinter, TVS, Zebra/Zonerich-type generics. Confirm which codepages and QR commands work on each.

---

## 8. Data model (Room / SQLite)

All money stored as **integer paise** (no floating point).

- **RestaurantProfile**: id, name, address, phone, gstin, fssai, pan, logoPath, upiVpa, upiPayeeName, headerText, footerText, taxMode, defaultBillMode, paperWidth, language
- **ExtraField**: id, label, value, printOnBill, sortOrder
- **Category**: id, name, sortOrder, isActive
- **Item**: id, categoryId, name, shortName, basePrice, taxPercent, isVeg, isActive, sortOrder
- **ItemVariant**: id, itemId, label, price
- **Bill**: id, billNo, financialYear, tokenNo, createdAt, updatedAt, orderType, tableNo, customerName, customerPhone, subtotal, discountType, discountValue, discountAmount, serviceCharge, packagingCharge, cgst, sgst, roundOff, grandTotal, paymentStatus, status (ACTIVE / CANCELLED), cancelReason, revisionNo, printCount
- **BillItem**: id, billId, itemId (nullable), nameSnapshot, variantSnapshot, qty, unitPrice, taxPercent, lineTotal, note
- **Payment**: id, billId, mode, amount, paidAt (supports split)
- **BillRevision**: id, billId, revisionNo, snapshotJson, changedAt, reason
- **AuditLog**: id, action (EDIT, CANCEL, REPRINT, EXPORT, DELETE, RESET, PRICE_OVERRIDE), billId, detail, timestamp
- **Counters**: key (BILL_SEQ_<FY>, TOKEN_SEQ_<date>), value
- **MonthlyArchive**: id, month, billCount, firstBillNo, lastBillNo, totalSales, totalTax, exportFileName, archivedAt
- **PrinterProfile**: id, name, type, address, usbVendorId, usbProductId, paperWidth, codepage, supportsCut, isDefault

Indexes on `Bill.createdAt`, `Bill.billNo`, `Bill.status`, `BillItem.billId`.

---

## 9. Screens

1. Splash / PIN lock
2. Onboarding (profile, PIN, printer, menu)
3. **Billing (home)**
4. Held bills / tables
5. Checkout sheet (discount, payment, QR)
6. Bill preview and print
7. Bill history (filters + calendar)
8. Bill detail (revisions, audit)
9. Menu manager (categories, items, variants, import)
10. Settings (profile, bill, tax, printer, security, language)
11. Printer setup (scan, pair, test, USB)
12. Storage and backup (export month, safe delete, backup, restore)
13. Reports (v1.1)
14. About / help / data-safety info

Bottom navigation: **Bill | History | Menu | Settings**.

---

## 10. Non-functional requirements

| Area | Requirement |
|---|---|
| Speed | Item tap response under 100 ms. Save + start print under 1.5 s. App cold start under 2 s on 2 GB RAM phone |
| Scale | Smooth with 50,000 bills (use paging in history, indexed queries) |
| Reliability | Bill save is atomic. App crash or phone restart must not lose a bill. Held bills auto-restored |
| Offline | 100% functional with no internet. No INTERNET permission in v1 |
| Size | APK under 20 MB |
| Devices | Android 7+ (API 24+), phones and small tablets, portrait and landscape |
| Usability | Touch targets at least 48 dp, high contrast, usable in bright shops, large-font option |
| Language | English and Hindi (string resources ready for more) |
| Privacy | No data leaves device. No analytics or ads |
| Accessibility | Screen-reader labels on main actions |

---

## 11. Edge cases to handle

- Printer turns off or goes out of range mid-print → bill saved, retry button.
- Paper runs out → printer may report nothing; offer "Reprint last".
- Two taps on Print very quickly → debounce, prevent duplicate bills.
- Phone date/time changed manually → warn when the new date is earlier than the last bill; bill numbers stay sequential regardless.
- Low storage → warn before saving, export, or backup.
- App killed during export/delete → delete only runs after verified export; resumes safely.
- Item with price 0 or negative → blocked unless "open item" is enabled.
- Discount larger than subtotal → blocked.
- Financial year rollover on 1 April → new bill sequence starts.
- Tax rate change → applies to new bills only (snapshots protect old ones).
- Very long item names, Hindi text, emojis → handled by wrapping and raster fallback.
- Restore backup from an older app version → migration support.
- Logo too large or non-square → auto-resize with preview.

---

## 12. Release plan (APK and AAB)

**Testing (APK):** debug/release APK shared directly for pilot restaurants.

**Play Store (AAB):**
1. Create Play Console developer account (one-time registration fee). New personal accounts currently need a **closed test with a minimum number of testers for about 14 days** before production, so check current Play rules and plan time for it.
2. Use **Play App Signing**. Generate the upload keystore, back it up in at least two safe places, never lose the password.
3. Set `targetSdk` to the version Play currently requires.
4. Fill Data safety form: no data collected or shared, no network.
5. Privacy policy page (even for an offline app, Play usually requires a URL).
6. Prepare listing: name, short and full description, screenshots (phone), feature graphic, icon.
7. Build with `./gradlew bundleRelease` (AAB) and `assembleRelease` (APK). Enable R8/minify and test the release build, especially printing.
8. Version scheme: `versionCode` increments every release.

**If you choose Capacitor instead:** `npx cap add android`, `npx cap sync`, then build APK/AAB from Android Studio or Gradle. The same signing and Play steps apply, plus your custom Kotlin printer plugin must be tested on release builds.

---

## 13. Acceptance criteria (MVP)

- [ ] A bill with 5 items can be created and printed in 10 seconds or less by a new user.
- [ ] Tapping the same item 3 times gives quantity 3. Minus reduces it, and 0 removes the line.
- [ ] Bill prints correctly on 58mm and 80mm Bluetooth printers and an 80mm USB printer, including logo, token, and scannable UPI QR.
- [ ] Hindi item name and ₹ print correctly on at least two tested printers.
- [ ] Bill numbers are consecutive, with no gaps even after cancel, edit, or app restart.
- [ ] Editing a bill keeps the original as a revision and the audit log shows it.
- [ ] History filters (Today, Yesterday, custom calendar range) return correct bills and totals.
- [ ] Monthly export produces an Excel file whose totals match the app exactly.
- [ ] Delete runs only after verified export and PIN plus typed confirmation. A forced failure at any step deletes nothing.
- [ ] Backup then restore on another phone recreates all bills, menu, and settings.
- [ ] App works fully in airplane mode.
- [ ] No crash while killing the app mid-bill: the held bill is recovered.

---

## 14. Milestones (suggested)

| Phase | Days | Deliverable |
|---|---|---|
| 1. Foundation | 1–3 | Project setup, Room schema, navigation, theme, PIN lock |
| 2. Menu + billing | 4–8 | Menu manager, billing screen, totals, tax, hold bills |
| 3. Settings + numbering | 9–11 | Profile, logo, bill/token numbering, UPI QR on screen |
| 4. Printing | 12–18 | ESC/POS engine, Bluetooth, USB, raster text, logo, QR, queue, test print |
| 5. History | 19–22 | Filters, calendar, reprint, edit with revisions, cancel, audit |
| 6. Storage safety | 23–26 | Excel export, verified delete, backup/restore |
| 7. Hardening | 27–30 | Hindi, edge cases, performance, real-printer testing, pilot with 2 restaurants |
| 8. Release | 31–33 | AAB, Play listing, closed test |

---

## 15. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Printer compatibility differences | High | Test list in 7.5, raster fallback, configurable codepage and chunk delay |
| Data loss from phone loss | High | Backup reminders, easy backup sharing, clear first-run warning |
| GST/legal misunderstanding | Medium | Keep bill rules conservative, consult a CA, show disclaimers |
| Play Store policy for new accounts | Medium | Start closed testing early |
| Cheap phones killing background apps / Bluetooth | Medium | Reconnect on foreground, test on low-end devices |
| Scope creep | Medium | Stick to the MVP list; push the rest to v1.1 |

---

## 16. Open questions for the owner/pilot users

1. Which printers do your target restaurants actually use (brand, 58 or 80 mm, Bluetooth or USB)?
2. Do most customers need GST bills, or simple bills only?
3. Do owners want single-bill hard delete, or is cancel/void enough?
4. Is a kitchen slip (KOT) needed in v1?
5. Will more than one staff phone be used at the same restaurant? (This would require sync.)

---

## 17. Instructions for building with Antigravity

Give Antigravity this PRD and build **one phase at a time** (section 14), not everything at once.

Suggested rules to give the agent:
- Use Kotlin, Jetpack Compose, Room, and keep money as integer paise.
- Write the ESC/POS encoder as a separate module with unit tests (compare generated bytes).
- Never block the UI thread for printing, Bluetooth, or export. Use coroutines.
- Every bill save, cancel, edit, and delete must run in a database transaction.
- Do not request the INTERNET permission or broad storage permission.
- After each phase, run the app on a real device. Test printing on a real printer before moving on.
- Keep a `CHANGELOG.md` and update this PRD when decisions change.
