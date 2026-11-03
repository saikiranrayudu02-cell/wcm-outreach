import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.wcm.outreach',
  appName: 'WCM Outreach',
  webDir: 'public',
  server: {
    url: 'https://wcm-outreach.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
