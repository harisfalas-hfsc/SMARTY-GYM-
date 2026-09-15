import type { CapacitorConfig } from "@capacitor/cli";

/** Native wrappers render the same live mobile site as Chrome and the PWA. */
const config: CapacitorConfig = {
  appId: "com.smartygym.app",
  appName: "SMARTYGYM",
  webDir: "dist/client",
  server: {
    url: "https://smartygym.com",
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
  },
  ios: {
    contentInset: "never",
    scrollEnabled: true,
    backgroundColor: "#000000",
    preferredContentMode: "mobile",
  },
  android: {
    backgroundColor: "#000000",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#000000",
      showSpinner: false,
      launchAutoHide: false,
      launchFadeOutDuration: 120,
      androidScaleType: "CENTER",
    },
    StatusBar: {
      overlaysWebView: true,
      backgroundColor: "#000000",
    },
  },
};

export default config;
