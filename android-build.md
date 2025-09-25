# Android APK Build Guide

## Prerequisites
- Node.js 18+ installed
- Android Studio with SDK tools
- Java JDK 17 or later
- Gradle 8.10.2 (latest version)

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
- Ensure Java JDK 17+ is installed and properly configured
- Clear Gradle cache: `./gradlew clean` or manually delete `~/.gradle/caches`
- Invalidate caches in Android Studio: File → Invalidate Caches and Restart
- Verify Gradle wrapper version is 8.10.2 in `gradle/wrapper/gradle-wrapper.properties`
- Check Android Gradle Plugin version compatibility (should be 8.7.2 or compatible)
- Ensure JAVA_HOME environment variable points to JDK 17+

### Memory Issues
- If builds fail with OutOfMemoryError, increase heap size in `gradle.properties`
- Current settings allocate 4GB RAM and 1GB MetaSpace
- For slower machines, reduce to: `org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m`

### Version Compatibility Issues
- Android Gradle Plugin 8.7.2 requires Gradle 8.9+
- Target SDK 35 requires Android Studio Ladybug or newer
- Build Tools 35.0.0 requires Android SDK Platform-Tools 35.0.0+

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
- **Gradle Version**: 8.10.2 (latest)
- **Android Gradle Plugin**: 8.7.2

## Additional Notes
- All configuration files have been optimized for the latest build tools
- Gradle performance settings are tuned for faster builds
- Configuration cache is enabled for improved build speeds
- Memory allocation is optimized for modern development machines