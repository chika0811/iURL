# Packaging for Android and iOS

This application uses [Capacitor](https://capacitorjs.com/) to package the React web app into native Android and iOS apps.

## Prerequisites

- Node.js and npm
- **Android:** Android Studio with Android SDK installed.
- **iOS:** Xcode (macOS only) with CocoaPods installed.

## Building the App

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Build the Web App:**
    ```bash
    npm run build
    ```

## Android Packaging

1.  **Add Android Platform:**
    If the `android` folder is missing, run:
    ```bash
    npx cap add android
    ```

2.  **Sync Changes:**
    Copy the built web assets to the Android platform folder:
    ```bash
    npm run android:prepare
    ```

3.  **Open in Android Studio:**
    ```bash
    npm run android:open
    ```

4.  **Build APK:**
    - In Android Studio, go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
    - Once the build finishes, locate the APK in `android/app/build/outputs/apk/debug/` (for debug) or follow the instructions for a signed release build.

## iOS Packaging (macOS only)

1.  **Add iOS Platform:**
    If the `ios` folder is missing, run:
    ```bash
    npx cap add ios
    ```

2.  **Sync Changes:**
    Copy the built web assets to the iOS platform folder:
    ```bash
    npm run ios:prepare
    ```

3.  **Open in Xcode:**
    ```bash
    npm run ios:open
    ```

4.  **Build IPA:**
    - In Xcode, select your target device (or "Any iOS Device").
    - Go to `Product > Archive`.
    - Follow the prompts to distribute/export the app as an `.ipa` file.

## Configuration

The Capacitor configuration is located in `capacitor.config.ts`.

- **App ID:** `com.dnovit.iurl`
- **App Name:** `iURL`
- **Web Directory:** `dist` (This is where the built React app lives)

## Troubleshooting

- **Gradle Errors:** Ensure your Android Studio and Gradle versions are up to date.
- **CocoaPods Errors:** Run `pod install` inside the `ios/App` directory if dependencies are missing.
- **Permissions:** Check `android/app/src/main/AndroidManifest.xml` and `ios/App/App/Info.plist` for required permissions (Camera, Internet, etc.).
