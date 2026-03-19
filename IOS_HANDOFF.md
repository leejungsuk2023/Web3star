# iOS Test Handoff (for Mac/Xcode)

This project is prepared on Windows up to `npx cap sync ios`.
Use this guide on a Mac to run iOS tests quickly.

## 1) Required tools on Mac

- Xcode (latest stable)
- Node.js 20+ and npm
- Apple Developer account access (for real-device signing)

## 2) Project setup

Run in project root:

```bash
npm install
npm run build
npx cap sync ios
npx cap open ios
```

Open target project in Xcode:

- `ios/App/App.xcodeproj`

## 3) Xcode signing

In Xcode:

1. Select `App` target
2. Open `Signing & Capabilities`
3. Set `Team`
4. Keep or update `Bundle Identifier` (must match Google iOS OAuth setup)
5. Enable `Automatically manage signing`

## 4) Google login (iOS) required config

Create iOS OAuth Client in Google Cloud Console:

- Type: `iOS`
- Bundle ID: same as Xcode bundle identifier

Then update `ios/App/App/Info.plist`:

- Add `GIDClientID` = iOS OAuth Client ID
- Add URL scheme under `CFBundleURLTypes` using reversed client ID

Example (replace placeholders):

```xml
<key>GIDClientID</key>
<string>YOUR_IOS_CLIENT_ID.apps.googleusercontent.com</string>
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

## 5) Env values (must match project)

Set in local `.env.local` before build:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OAUTH_CALLBACK_URL`
- `VITE_GOOGLE_WEB_CLIENT_ID` (Web client ID, not iOS client ID)

## 6) Test checklist

1. Email/password login
2. Google login on simulator
3. Google login on real device
4. Logout and re-login
5. App restart session persistence

## 7) If Google login fails on iOS

- Check Bundle ID matches Google iOS OAuth client
- Check `GIDClientID` and URL scheme in `Info.plist`
- Check `VITE_GOOGLE_WEB_CLIENT_ID` uses Web client ID
- Clean build folder in Xcode and run again

