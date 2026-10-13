import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Initialize native Capacitor features when running as an Android or iOS application
 */
export async function initializeCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // 1. Configure Android / iOS Status Bar (Crisp Light Mode with dark icons on white bar)
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.debug('StatusBar initialization skipped:', err);
  }

  try {
    // 2. Hide Splash Screen smoothly once UI is ready
    await SplashScreen.hide();
  } catch (err) {
    console.debug('SplashScreen hide skipped:', err);
  }

  try {
    // 3. Hardware Back Button handler on Android (prevents accidental app exit)
    CapApp.addListener('backButton', ({ canGoBack }) => {
      // Check if any modal is open
      const closeButtons = document.querySelectorAll<HTMLButtonElement>('[data-modal-close], .custom-dialog-close, button[title="Close"]');
      if (closeButtons.length > 0) {
        closeButtons[closeButtons.length - 1].click();
        return;
      }

      if (canGoBack) {
        window.history.back();
      }
    });
  } catch (err) {
    console.debug('BackButton listener skipped:', err);
  }
}

/**
 * Trigger subtle mechanical tactile haptic feedback on button presses
 */
export async function triggerHapticFeedback(style: ImpactStyle = ImpactStyle.Light): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  try {
    await Haptics.impact({ style });
  } catch {
    // Haptics unavailable on browser
  }
}
