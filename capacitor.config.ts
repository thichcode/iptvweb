import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.webphim.app',
  appName: 'WebPhim',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: '#0d0d0d',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  }
};

export default config;
