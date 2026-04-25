import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'mozy',
  plugins: [
    appsInToss({
      brand: {
        displayName: 'mozy',
        primaryColor: '#3182F6',
        icon: 'https://static.toss.im/icons/png/4x/icon-toss-logo.png',
      },
      permissions: [],
    }),
  ],
});
