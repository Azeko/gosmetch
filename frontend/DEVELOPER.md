# Developer Guide

This guide helps you get the Duolicious frontend running locally fast, run tests, and ship high‑quality pull requests.

---

## Quickstart

```bash
# 1) Install dependencies
npm install

# 2) Apply repo patches (required after install)
npx patch-package

# 3) Run the app (pick one)
npm run web        # Web (recommended for first-time contributors)
npm run android    # Android (emulator or device required)
npm run ios        # iOS (macOS + Xcode required)
```

Optional: if you hit OpenSSL errors on some Node setups or file watch limits on Linux, see Troubleshooting below.

---

## Prerequisites

- Node.js and npm (LTS recommended)
- Git
- For native:
  - Android: Android Studio + SDK, an emulator or device
  - iOS: macOS with Xcode installed
- For end‑to‑end tests: Playwright browsers
  - Install once: `npx playwright install --with-deps`

You do not need to install the Expo CLI globally; commands are run via npm scripts or `npx`.

---

## Scripts you’ll use

- `npm run web` – start the app in the browser
- `npm run android` – run on Android
- `npm run ios` – run on iOS
- `npm test` – run unit tests (Jest)
- `npm run typecheck` – TypeScript type checks
- `npm run lint` – ESLint

When `./run-ios-device.sh` is already serving a physical iPhone, press `w` in
that Metro terminal to open the web app with the same local backend settings.
Do not start `npm run web` separately because both processes use port `8081`.

---

## Environment configuration

Runtime configuration is provided to the app through Expo `extra` values (see `app.config.ts`) and read in `env/env.tsx`. Sensible localhost defaults exist for development, so you can usually skip this section. If you want to point the app at different backends, set these environment variables before running the app:

- `DUO_STATUS_URL` – status service base URL
- `DUO_API_URL` – API base URL
- `DUO_CHAT_URL` – websocket chat URL
- `DUO_IMAGES_URL` – images CDN/base URL
- `DUO_AUDIO_URL` – audio CDN/base URL
- `DUO_PARTNER_URL` – partner portal URL
- `DUO_INVITE_URL` – invite landing page URL
- `DUO_WEB_VERSION` – web build/version identifier
- `DUO_KLIPY_API_KEY` – Klipy API key for GIFs
- `NOTIFICATION_ICON_URL` – desktop notification icon URL
- `NOTIFICATION_SOUND_URL` – desktop notification sound URL

### Use the production backend (optional)
```bash
export DUO_STATUS_URL=https://status.duolicious.app
export DUO_API_URL=https://api.duolicious.app
export DUO_CHAT_URL=wss://api.duolicious.app/chat
export DUO_IMAGES_URL=https://user-images.duolicious.app
export DUO_AUDIO_URL=https://user-audio.duolicious.app
export DUO_PARTNER_URL=${DUO_PARTNER_URL:-https://partner.duolicious.app}
```

### Use a local/docker backend (optional)
```bash
export DUO_STATUS_URL=http://localhost:8080
export DUO_API_URL=http://localhost:5000
export DUO_CHAT_URL=ws://localhost:5000/chat
export DUO_IMAGES_URL=http://localhost:9090/s3-mock-bucket
export DUO_AUDIO_URL=http://localhost:9090/s3-mock-audio-bucket
export DUO_PARTNER_URL=${DUO_PARTNER_URL:-https://partner.duolicious.app}
```

### Run on a physical iPhone with the backend on your Mac

For a concise end-to-end setup, including Xcode signing and first-launch device
trust, start with the repository's [local development quickstart](../LOCAL_DEVELOPMENT.md).

`localhost` on an iPhone refers to the iPhone, not the Mac. The device launcher
uses the Mac's Bonjour hostname at runtime so no personal hostname or LAN address
is stored in the repository.

1. Connect the Mac and iPhone to the same network. Keep the iPhone connected to
   Xcode and enable Developer Mode on the device.
2. From the repository root, start the backend and confirm it is healthy:

   ```bash
   docker compose -f backend/docker-compose.yml up -d
   curl -sf http://localhost:5000/health && echo API OK
   ```

   If macOS is already using port `5000` (commonly for AirPlay Receiver), use
   another host port in both terminals:

   ```bash
   export DUO_API_PORT=5001
   docker compose -f backend/docker-compose.yml up -d
   curl -sf http://localhost:${DUO_API_PORT}/health && echo API OK
   ```

3. Confirm the backend is reachable from Safari on the iPhone. On the Mac, print
   the URL to open:

   ```bash
   printf 'http://%s.local:%s/health\n' \
     "$(scutil --get LocalHostName)" "${DUO_API_PORT:-5000}"
   ```

   If it does not load, allow incoming connections for Docker and Node in macOS
   firewall settings and verify both devices are on a network that permits
   device-to-device traffic.

4. Install frontend dependencies, choose a unique bundle identifier owned by
   your Apple Developer account, and launch the app:

   ```bash
   cd frontend
   npm install
   npx patch-package
   export DUO_IOS_BUNDLE_IDENTIFIER=com.example.duolicious.dev
   # If the backend terminal uses a non-default port, export the same value:
   export DUO_API_PORT=${DUO_API_PORT:-5000}
   ./run-ios-device.sh
   ```

   Replace `com.example.duolicious.dev` with your own identifier. Keep it in the
   shell environment; do not commit it. Select the connected iPhone if Expo asks
   for a device. If Xcode asks for signing, select your development team for the
   generated `ios` project and retry the launcher.

The local iOS build opts into local-network access and permits plain HTTP only
for local-network hosts. It also omits Associated Domains, Sign in with Apple,
and Push Notifications so a free Apple Personal Team can sign the app. Those
features are unavailable in the local build. Normal builds keep the existing
production settings.

---

## Testing and quality

### Unit tests (Jest)
```bash
npm test
```

### Type checks (TypeScript)
```bash
npm run typecheck
```

### Linting (ESLint)
```bash
npm run lint
# Optional auto-fix
npx eslint . --fix
```

### End‑to‑end tests (Playwright)
First‑time setup:
```bash
npx playwright install --with-deps
```
Run tests and capture traces:
```bash
npx playwright test --trace on
```
Open a saved trace (example):
```bash
npx playwright show-trace -b firefox playwright-report/data/*.zip
```
Record a new test:
```bash
npx playwright codegen http://localhost:8081
```
Update screenshots for a specific spec (example):
```bash
npx playwright test --update-snapshots playwright-tests/onboarding.spec.ts
```

GitHub Actions will run Jest, Playwright, type checks, and ESLint on pull requests. Aim for green checks locally before opening a PR.

---

## Troubleshooting

- OpenSSL error on some Node versions:
  ```bash
  export NODE_OPTIONS=--openssl-legacy-provider
  ```
- Linux file watcher limits (large projects):
  ```bash
  echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
  ```
- After `npm install`, always run:
  ```bash
  npx patch-package
  ```
- Expo cache hiccups (rare):
  ```bash
  npx expo start -c
  ```

---

## Building the Android APK

Add this to `.credentials.json`:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "/path/to/duolicious.keystore",
      "keystorePassword": "REPLACE-WITH-KEYSTORE-PASSWORD",
      "keyAlias": "duolicious",
      "keyPassword": "REPLACE-WITH-KEY-PASSWORD"
    }
  }
}
```

Then to build a production release:

```bash
./build-apk.sh
```

Or to build an APK for local development:

```bash
./build-apk.sh --profile preview
```

If you want to install the APK:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## Building the iOS App

```bash
./build-ipa.sh
```

To generate an ad-hoc ipa file:

```bash
./build-ipa.sh --profile preview
```

---

## Sending Duolicious to Tim Apple

```bash
xcrun altool --upload-app -t ios -u "email@exmaple.com" -p "password" -f /path/to/duolicious-frontend/build-1720942386773.ipa
```
