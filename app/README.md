# 📱 Billing Pro POS — Android Mobile, Tablet & Handheld POS

> **Enterprise Android POS Workstation Edition**  
> **Target OS**: Android 7.0+ (API Level 24 through 35)  
> **Engine**: Capacitor 8 + React 19 + Dexie IndexedDB Offline Engine  
> **Hardware**: Handheld Smart POS (Sunmi V2/V2 Pro, iMin, Pax), Tablets & Smartphones

---

## 1. Production Release Packages (APK & AAB)

| Package | Format | File Name | Size | Target / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Universal Release APK** | `.apk` | `Billing_Pro_v1.0.apk` | 12.5 MB | **Direct Sideloading**: Phones, tablets, and handheld smart POS terminals (Sunmi, iMin, Posiflex). Zero store account needed. |
| **Android App Bundle** | `.aab` | `Billing_Pro_v1.0.aab` | 12.3 MB | **Google Play Console**: Production bundle optimized for dynamic feature delivery and Google Play publishing. |

---

## 2. Direct Sideloading & Installation Steps

1. **Transfer or Download**:
   - Transfer `Billing_Pro_v1.0.apk` to the Android device via USB cable, local network, or direct browser download from the website.
2. **Permission**:
   - Tap the APK file in Files / Downloads. Allow "Install unknown apps" if prompted by Android.
3. **Launch & Punch**:
   - Open Billing Pro POS and immediately begin counter billing. All data is cached locally in IndexedDB.

---

## 3. Handheld Smart POS & Tablet Optimization

- **Handheld Smart POS (Sunmi V2, iMin Swift)**:
  - Ergonomic bottom navigation bar with floating tactile cart drawer.
  - Automatic detection of internal or Bluetooth ESC/POS 58mm thermal printers.
  - High-contrast touch buttons designed for one-handed operation.
- **Tablet Counter Station (7" to 12.9")**:
  - Dual-pane landscape cashier layout with sticky order docket.
  - High-speed 80mm wireless Bluetooth thermal printing with paper cut.
  - Dynamic on-screen Bharat UPI QR code generation.

---

## 4. Native Project & Build Commands

The native Android Gradle project is located in `android/`:
- `android/app/src/main/AndroidManifest.xml`: Permissions for Bluetooth, Storage, and Camera.
- `android/app/build.gradle`: Target SDK 35, Min SDK 24.
- `capacitor.config.ts`: Capacitor configuration.

To build fresh APK / AAB from source:
```bash
# Sync web assets to Android project
npm run cap:sync

# Open Android Studio
npm run cap:open

# Build Release APK via CLI
cd android && ./gradlew assembleRelease

# Build Release AAB Bundle via CLI
cd android && ./gradlew bundleRelease
```
