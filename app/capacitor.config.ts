import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.billingpro.bookmydine',
  appName: 'BILLING POS',
  webDir: 'dist',
  android: {
    path: 'mobile/android',
  },
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FFFFFF',
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#FFFFFF',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'none',
      style: 'LIGHT',
    },
  },
};

export default config;
