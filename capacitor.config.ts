import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dnovit.iurl',
  appName: 'iURL',
  webDir: 'dist',
  server: {
    url: 'https://193b71eb-3ad6-4c31-be3b-df652c7cc0c8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
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
    }
  }
};

export default config;
