import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dnovit.iurl',
  appName: 'iURL',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Camera: {
      permissions: ["camera", "photos"]
    },
    App: {
      // Deep link configuration for URL interception
      androidScheme: "https"
    }
  },
  // Android deep link configuration
  android: {
    allowMixedContent: true,
    appendUserAgent: "iURL-Security-Scanner"
  },
  // iOS deep link configuration  
  ios: {
    scheme: "iurl"
  }
};

export default config;
