import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'subway',
  plugins: [
    appsInToss({
      brand: {
        displayName: 'subway',
        primaryColor: '#3182F6',
        icon: '',
      },
      permissions: [],
    }),
  ],
});
