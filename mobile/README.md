# 📱 Billing Pro POS — Native Android App

<p align="center">
  <img src="../public/billing-pro-logo.png" alt="Billing Pro POS Logo" width="100" style="border-radius: 20px;" />
</p>

<p align="center">
  <b>Native Android Mobile & Tablet POS package for Billing Pro powered by Capacitor JS</b>
</p>

<p align="center">
  <a href="https://tusharjain.in"><img src="https://img.shields.io/badge/Author-Tushar%20Jain-6366F1?style=for-the-badge&logo=safari&logoColor=white" alt="Author Tushar Jain" /></a>
  <a href="https://tusharjain.in"><img src="https://img.shields.io/badge/Portfolio-tusharjain.in-10B981?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Portfolio" /></a>
  <a href="../release/Billing_Pro_v1.0.apk"><img src="https://img.shields.io/badge/Download-Android%20APK-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Download APK" /></a>
  <a href="https://capacitorjs.com/"><img src="https://img.shields.io/badge/Capacitor_8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor" /></a>
  <a href="https://developer.android.com/"><img src="https://img.shields.io/badge/Android_SDK-min24_target35-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android SDK" /></a>
</p>

---

## 📦 Direct App Downloads

| Build Target | File Type | Size | Direct Download |
|---|---|---|---|
| **Billing Pro Production APK** | `.apk` | 20.4 MB | [⬇️ Download `Billing_Pro_v1.0.apk`](../release/Billing_Pro_v1.0.apk) |
| **Billing Pro Play Bundle** | `.aab` | 20.3 MB | [⬇️ Download `Billing_Pro_v1.0.aab`](../release/Billing_Pro_v1.0.aab) |
| **Lightweight POS Release APK** | `.apk` | 16.4 MB | [⬇️ Download `billing-pro-pos-release.apk`](../release/billing-pro-pos-release.apk) |

---

## 📱 Features & Dual Device Architecture

- **Tablet POS Optimization ($768\text{px} - 1280\text{px}$)**:
  - Dual-pane layout: Fast dish selection on the left, sticky live order sidebar on the right.
  - Large tactile touch targets ($44\text{px} - 48\text{px}$) designed for high-speed cashier shifts.
  - Full landscape and portrait auto-rotation support.

- **Mobile Phone Optimization ($320\text{px} - 767\text{px}$)**:
  - Ergonomic bottom navigation bar.
  - Bottom sheet floating cart drawer with one-tap checkout.
  - Native status bar and navigation notch safe area handling.

- **Hardware & Device Capabilities**:
  - Bluetooth permissions for ESC/POS 58mm / 80mm wireless thermal receipt printers.
  - Android hardware back button handling to safely dismiss modals without quitting active orders.
  - Pure offline-first architecture with instant Dexie IndexedDB storage.
  - Dynamic UPI QR code generation on bill receipts.
  - Excel (.xlsx) sales and invoice report generation.

---

## 🛠️ Build & Run Commands

### 1. Build and Sync Web Assets to Android
```bash
npm run cap:sync
```

### 2. Open Project in Android Studio
```bash
npm run cap:open
```

### 3. Build Debug APK via Gradle Command Line
```powershell
cd mobile/android
./gradlew assembleDebug
```
The output APK will be generated at:
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## ⚙️ Configuration Files
- **Capacitor Config**: `capacitor.config.ts`
- **Android Manifest**: `mobile/android/app/src/main/AndroidManifest.xml`
- **Native Platform Bridge**: `src/utils/capacitor.ts`
- **Main Documentation**: [Root README.md](../README.md)

---

## 👨‍💻 Created By
- **Tushar Jain**
- 🌐 Website / Portfolio: [**tusharjain.in**](https://tusharjain.in)
