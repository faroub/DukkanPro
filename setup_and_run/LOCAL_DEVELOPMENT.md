# Local Development Guide

Running the DukkanOS app locally using Expo Go and the Expo development server.

## Prerequisites

- Node.js >= 20 (recommended: nvm or fnm for version management)
- npm >= 10 or yarn >= 1.22
- [Expo CLI](https://docs.expo.dev/get-started/installation/) installed globally or via `npx`
- [Git](https://git-scm.com/)

## Installation

```bash
# 1. Clone the repository (if not already done)
git clone <repository-url>
cd DukkanOS

# 2. Install dependencies
npm install
# or
yarn install
```

## Running the App

### Start the Development Server

```bash
npm run dev
# or
npx expo start --web --port 3000
```

This starts the Expo development server at `http://localhost:3000`.

### Running on Different Platforms

#### Web Browser

```bash
npm run web
# or
npx expo start --web
```

The web version will open in your default browser at `http://localhost:3000`.

#### Android Device/Emulator

**Option 1: Using Expo Go (recommended for quick testing)**

1. Install [Expo Go](https://expo.dev/go) from the Google Play Store on your Android device, or use an Android emulator
2. Run: `npm run android`
3. A QR code will appear in the terminal
4. Scan the QR code with the Expo Go app on your device, OR
5. Press `a` in the terminal to automatically launch on an connected emulator

**Option 2: Direct Android Studio**

1. Open the Android project in Android Studio:
   `android/app/`
2. Click "Run" green triangle button or press `Shift+F10`
3. Select an emulator or connected device

#### iOS Device/Emulator

1. Run: `npm run ios`
2. A QR code will appear in the terminal
3. Scan with the Expo Go app on your iOS device, or
4. Press `i` in the terminal to launch on iOS simulator (macOS only)

## Development Workflow

1. **Hot Relocation**: Changes to React Native/Expo components are reflected instantly
2. **Fast Refresh**: Most JavaScript changes trigger Fast Refresh
3. **Full Reload**: Some changes (e.g., component structure, hooks) require full reload (`Ctrl+R` / `Cmd+R`)
4. **Environment Variables**: Create a `.env` file in the root if needed. Refer to `.env.example` or the `extra` section in `app.json`

## Common Local Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with web preview |
| `npm run android` | Run on Android (emulator or device) |
| `npm run ios` | Run on iOS (simulator or device) |
| `npm run web` | Start web version |
| `npm test` | Run Jest tests |
| `npm run lint` | Run ESLint |
| `npm run build` | Export as static web app |

## Notes

- The first run will install development dependencies and may take several minutes
- If using a physical device, ensure your computer and phone are on the same Wi-Fi network, or use a USB connection
- For Android emulator, we recommend API level 33+ for best compatibility with Expo 57
- Metro bundler cache is stored in `.expo/` directory - clearing it may resolve odd issues: `rm -rf .expo`