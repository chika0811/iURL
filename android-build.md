# Android APK Build Guide

## Prerequisites
- Node.js 18+ installed
- Android Studio with SDK tools
- Java JDK 17 or later

## Quick Setup Commands

1. **Clone and install dependencies**:
   ```bash
   git clone [your-repo-url]
   cd [project-name]
   npm install
   ```

2. **Add Android platform**:
   ```bash
   npx cap add android
   ```

3. **Build and sync**:
   ```bash
   npm run build
   npx cap sync android
   ```

4. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

## Building APK in Android Studio

1. **Build → Generate Signed Bundle/APK**
2. **Choose APK**
3. **Create or select keystore**
4. **Build release APK**

## Troubleshooting Common Issues

### Gradle Issues
- Ensure Java JDK 17+ is installed
- Clear Gradle cache: `./gradlew clean`
- Invalidate caches in Android Studio

### Build Failures
- Check `gradle.properties` configuration
- Verify Android SDK is properly installed
- Update Android Gradle Plugin if needed

### Permissions
The app includes these permissions:
- `INTERNET` - For URL verification
- `CAMERA` - For QR code scanning
- `FOREGROUND_SERVICE` - For background protection
- `RECEIVE_BOOT_COMPLETED` - Auto-start protection
- `SYSTEM_ALERT_WINDOW` - Security popups

## App Configuration
- **App ID**: `com.dnovit.iurl`
- **App Name**: iURL
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 35 (Android 15)