# Android Studio Guide

Building and running the DukkanOS app directly in Android Studio.

## Prerequisites

- **Android Studio**: Latest stable version (2024.1.2 or newer recommended)
- **JDK**: JDK 17 (Android Studio installation typically includes this)
- **Android SDK**: API level 33 (recommended) or 34
- **Android NDK**: May be required for some native modules
- **Git**: For cloning/syncing the repository

## Setting Up Android Studio

### 1. Install Android Studio

Download and install from: https://developer.android.com/studio

During installation, ensure these components are selected:
- Android SDK
- Android SDK Command-line Tools
- Android NDK (Side by side)
- SDK Build-tools (version 33.0.0 or latest)

### 2. Accept Licenses

Open a terminal and run:

```bash
cd /home/faroub/Documents/Projects/DukkanOS/DukkanOS
./android/app/gradlew acceptLicenses
```

### 3. Set Up ANDROID_HOME

Ensure ANDROID_HOME is set in your environment. Add to `~/.bashrc` or `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# or
export ANDROID_HOME=$HOME/Android/sdk  # Linux
export PATH=$ANDROID_HOME/emulator:$PATH
export PATH=$ANDROID_HOME/platform-tools:$PATH
```

Then reload your shell:

```bash
source ~/.bashrc
```

### 4. Verify SDK Installation

```bash
echo $ANDROID_HOME
ls $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager
```

### 5. Create an AVD (Android Virtual Device)

1. Open Android Studio → More → Device Manager
2. Click "Create Device"
3. Select a phone hardware profile (e.g., Pixel 7)
4. Select system image with API level 33 or 34 (e.g., "R", "S", "Tiramisu")
5. Click "Next" then "Finish"

Alternatively, via command line:

```bash
# Create AVD
avdmanager create avd -n dukkanos_avd -p ~/.android/avd/dukkanos_avd.conf -k "system-images;android-33;google_apis;x86_64"

# Start AVD
emulator -avd dukkanos_avd -netdelay 0 -netspeed full
```

## Running in Android Studio

### Option A: Run via Gradle

```bash
# From the project root
cd DukkanOS
./android/app/gradlew assembleDebug
# Then open android/app/build/outputs/apk/debug/app-debug.apk and install

# Or directly run:
./android/app/gradlew installDebug
```

### Option B: Run from Terminal with Expo

```bash
npm run android
```

This uses the Expo CLI to build and launch the app on an emulator or connected device.

### Option C: Direct Android Studio UI

1. Open `android/app/` in Android Studio
2. Wait for Gradle sync to complete
3. Click the green "Run" triangle button (or press `Shift+F10`)
4. Select the AVD or connected physical device
5. The app will build and launch

## Configuring app.json for Android

The `app.json` file contains Expo's Android configuration. Key settings:

```json
"android": {
  "adaptiveIcon": {
    "backgroundColor": "#E6F4FE",
    "foregroundImage": "./assets/images/android-icon-foreground.png",
    "backgroundImage": "./assets/images/android-icon-background.png",
    "monochromeImage": "./assets/images/android-icon-monochrome.png"
  },
  "predictiveBackGestureEnabled": false,
  "package": "com.oubfar.DukkanOS",
  "projectId": "your-expo-project-id-if-required"
}
```

### Important Android Settings

- **package**: Must match the Gradle `defaultConfig.applicationId` in `android/app/build.gradle`
- **predictiveBackGestureEnabled**: Disables swipe-back gesture if set to `false` (currently set in app.json)
- **adaptiveIcon**: Required for Android 12+ - ensures proper display of app icon

### Verifying package name consistency

Check that `app.json`'s `android.package` matches `android/app/build.gradle`'s `applicationId`:

```bash
# Check build.gradle
grep -A2 "applicationId" /home/faroub/Documents/Projects/DukkanOS/DukkanOS/android/app/build.gradle
```

Expected output should show `applicationId "com.oubfar.DukkanOS"`.

## Troubleshooting Android Studio

### Common Issues

1. **"Could not find method" or Gradle sync errors**
   - Run: `./gradlew --stop` then `./gradwel sync`
   - Ensure JDK 17 is installed and `JAVA_HOME` is set
   - Delete `android/` folder's `.gradle/` and run `./gradlew clean`

2. **Emulator not starting**
   - Ensure KVM acceleration is enabled in BIOS
   - Try: `chmod 777 $ANDROID_HOME/emulator/qemu/linux-x86_64/qemu-system-i386`
   - Try: `emulator -avd <name> -use-true-type-bitmaps -gpu guest`

3. **Metro bundler port conflict**
   - The default Expo port is 8081. If conflicting, set a different port:
     ```bash
     APP_PORT=3000 npm run android
     ```

4. **`node_modules` out of sync**
   - Remove and reinstall: `rm -rf node_modules && npm install`
   - Clear Expo cache: `npx expo start -c`

5. **"Debug certificate expired"**
   - Delete debug keystore: `rm -rf $ANDROID_HOME/.android/debug.keystore`
   - Rebuild: `./gradlew assembleDebug`

### Logs and Debugging

- **Logcat**: View in Android Studio → `View → Tool Windows → Logcat`
- **Expo dev tools**: Access at `http://localhost:19002` when running with `npm run android`
- **React Native debugger**: `Ctrl+M` (or `Cmd+M` on Mac) → "Debug JS Remotely"

## Customizing for Your Use case

To change the Android package name:

1. Update `app.json` → `android.package`
2. Update `android/app/build.gradle` → `defaultConfig.applicationId`
3. Update `AndroidManifest.xml` → `package` attribute (located in `android/app/src/main/AndroidManifest.xml`)
4. Update any intent filters or references to the old package name

---