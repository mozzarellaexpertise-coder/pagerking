import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myapp.pager',
  appName: 'PagerApp',
  webDir: 'build', // make sure this matches Svelte build output
  bundledWebRuntime: false
};

export default config;
