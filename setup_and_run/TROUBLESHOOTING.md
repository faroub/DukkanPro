# Troubleshooting Guide

Common issues and solutions for the DukkanOS mobile app development setup.

## General Troubleshooting

### Clear Cache and Reset

```bash
# Clear Expo cache
npx expo start -c

# Or clear from within the project
rm -rf .expo
rm -rf node_modules
npm install

# Reset Metro bundler
npx expo r -c
```

### Reinstall Dependencies

```bash
rm -rf node_modules
rm -rf android/app/build/
rm -rf android/app/.gradle/
npm install
npx expo start -c
```

## Android-Specific Issues

### Issue: "Metro bundler not connecting"

**Symptoms**: App shows white screen, "Exp" logo, or "Connection to the development server is not trusted"

**Solutions**:
1. Accept the connection in the Expo Go app
2. Set `DEBUG=true` environment variable
3. Check if port 8081 is free: `lsof -i :8081`
4. Try: `npx expo start --clear`

### Issue: Emulator not launching or crashes

**Solutions**:
1. Verify AVD configuration matches API level requirements
2. Enable KVM acceleration: `sudo modprobe kvm_intel` (Intel) or `sudo modprobe kvm_amd` (AMD)
3. Increase AVD memory: Edit AVD → "Show Advanced Settings" → Memory and Storage
4. Try a different emulator image (ARM vs x86_64)
5. Use: `emulator -avd <name> -memory 2048`

### Issue: "Debug certificate expired"

**Solutions**:
```bash
rm -rf $ANDROID_HOME/.android/debug.keystore
./android/app/gradlew assembleDebug
```

### Issue: Gradle sync failed

**Solutions**:
1. Delete `.gradle/` folder and sync again
2. Ensure JDK 17 is set as `JAVA_HOME`
3: Update Gradle wrapper: `./gradlew wrapper --gradle-version 8.5`
4. Check `android/gradle/wrapper/gradle-wrapper.properties`

### Issue: "Resource linking failed"

**Solutions**:
1. Clean and rebuild: `./gradlew clean assembleDebug`
2. Verify all asset paths in `app.json` exist
3. Run `npm run check:no-rtl` to check for RTL issues
4. Ensure image assets are in the correct `assets/` directory

### Issue: Android API level compatibility

**Symptoms**: Build errors related to API levels or deprecated APIs

**Solutions**:
1. Update `android/app/build.gradle` to target API level 33
2. Ensure `compileSdkVersion` and `targetSdkVersion` are consistent
3. Update any native module dependencies

## iOS-Specific Issues

### Issue: iOS simulator not launching (macOS only)

**Solutions**:
1. Ensure Xcode is installed: `xcode-select --install`
2. Accept Xcode license: `sudo xcodebuild -license accept`
3. Verify simulator is available: `xcrun simctl list`
4. Reset simulators: `xcrun simctl delete unavailable`

### Issue: "Code signing error"

**Solutions**:
1. Open `ios/` in Xcode and follow the signing setup
2. Select the correct team in Xcode project settings
3. For development, use "Automatic signing"

## Docker-Specific Issues

### Issue: Container won't start

**Solutions**:
1. Verify Docker Desktop is running
2. Check disk space: `df -h`
3. Review logs: `docker compose logs dukkanos-dev`
4. Try: `docker compose down && docker compose up -d`

### Issue: Node modules not installing inside container

**Solutions**:
1. Check network connectivity (some registries may be blocked)
2. Try: `npm config set registry https://registry.npmjs.org/`
3. Use `--legacy-peer-deps` flag
4. Check if `package-lock.json` or `yarn.lock` is corrupted

### Issue: Slow performance inside Docker container

**Solutions**:
1. Allocate more resources to Docker Desktop (Settings → Resources)
2. Use `--privileged` only if necessary (security risk)
3. Consider using OS-level virtualization benefits
4. For file-heavy operations, consider bind-mounting specific directories

### Issue: Port conflicts in Docker

**Solutions**:
1. Modify `docker-compose.yml` to use different host ports
2. Kill existing processes: `lsof -i :19000`
3. Use environment variables to override ports

## Environment Variable Issues

### Common .env Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_URL` | From `app.json` extra | Custom API URL for the app |
| `EXPO_PUBLIC_` | N/A | Prefix for public environment variables |
| `NODE_ENV` | `development` | Affects build behavior |
| `CHOKIDAR_USEPOLLING` | `true` | Required for Docker file watching |

### Setting Environment Variables

```bash
# In .env file
APP_URL=http://localhost:8081
EXPO_PUBLIC_API=https://api.example.com
NODE_ENV=development

# Or override at runtime
APP_URL=http://localhost:8081 npm run android
```

## Debugging Tools

### React Native Debugger

```bash
# Enable JS remote debugging
# In the app: shake device (Cmd+M on iOS, Ctrl+M on Android)
# Then: "Debug JS Remotely"

# Or from command line
adb shell input keyevent 82  # M key to open dev menu
```

### Logcat Filtering

```bash
# View DukkanOS-specific logs
adb logcat -s DukkanOS

# Filter by priority
adb logcat *:E  # Only errors
adb logcat *:W  # Warnings and above

# Filter by tag
adb logcat "Expo*:V"  # Expo verbose logs
```

### Metro Bundler Reset

```bash
# Full reset of Metro bundler cache
npx expo start -c

# Or manually clear
rm -rf .expo-metro
```

## Performance Issues

### Slow App Startup

1. Check if too many fonts are loading - use `expo-font` with proper preloading
2. Verify images are optimized and cached
3. Check for synchronous network requests on startup
4. Review component rendering - avoid unnecessary re-renders

### High Memory Usage

1. Check for memory leaks in components
2. Verify images are properly sized and cached
3. Use `react-native-flipper` to inspect memory
4. In Docker, allocate more memory

## Getting Help

### Useful Commands for Debugging

```bash
# Check Node version
node --version

# Check npm/yarn version
npm --version

# Check Expo CLI version
npx expo --version

# Check React Native version
npx react-native --version

# Verify environment
echo "ANDROID_HOME: $ANDROID_HOME"
echo "PATH: $PATH" | tr ':' '\n' | grep -i android

# Check git status
git status

# View recent git changes
git log --oneline -5
```

### Logs and Error Reporting

1. Capture terminal output when issues occur
2. Take screenshots of error messages
3. Note the exact command being run when the error happened
4. Check `~/.expo/` for cached data issues
5. Review `node_modules/.cache/` for stale data

---