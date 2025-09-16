# Mobile App Build Instructions

## Prerequisites
- Node.js and npm installed
- For iOS: macOS with Xcode
- For Android: Android Studio

## Steps to build APK

1. **Export project to GitHub** using the "Export to Github" button
2. **Clone and setup**:
   ```bash
   git clone [your-repo-url]
   cd [project-name]
   npm install
   ```

3. **Add platforms**:
   ```bash
   npx cap add android
   npx cap add ios  # if building for iOS
   ```

4. **Update native dependencies**:
   ```bash
   npx cap update android
   npx cap update ios  # if building for iOS
   ```

5. **Build the web app**:
   ```bash
   npm run build
   ```

6. **Sync to native platforms**:
   ```bash
   npx cap sync
   ```

7. **Run on device/emulator**:
   ```bash
   npx cap run android  # Opens Android Studio
   npx cap run ios      # Opens Xcode (macOS only)
   ```

## Building APK
In Android Studio:
1. Build → Generate Signed Bundle/APK
2. Choose APK
3. Follow the signing process
4. Build the APK

## App Permissions
The app includes permissions for:
- Internet access for URL verification
- Camera for QR code scanning
- Background processing for real-time protection
- System alert window for security popups
- Storage access for caching results

Read more about mobile development: https://lovable.dev/blogs/TODO