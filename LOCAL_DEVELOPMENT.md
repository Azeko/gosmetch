# Local development

This is the shortest path to a working Duolicious development environment.
No production secrets are required. Local services use test data and mock
integrations.

## Web: quickest setup

### Requirements

- Git
- Docker Desktop with Docker Compose v2.20 or newer

### Start

```bash
git clone https://github.com/Azeko/gosmetch.git
cd gosmetch
docker compose up --build
```

Wait for the API to become healthy, then open:

- App: <http://localhost:8081>
- API health: <http://localhost:5000/health>
- Test email inbox: <http://localhost:8025>
- Mock object storage: <http://localhost:9090>
- Status service: <http://localhost:8080>

Stop everything with `Ctrl-C`, then remove the containers with:

```bash
docker compose down
```

## Web from source with the backend in Docker

Use this workflow for frontend hot reload, or to run the web and iPhone apps
against the same backend. Start only the backend from the repository root:

```bash
export DUO_API_PORT=5001
docker compose -f backend/docker-compose.yml up -d --build
curl -sf "http://localhost:${DUO_API_PORT}/health" && echo "API OK"
```

Then start the web app from a second terminal:

```bash
cd frontend
npm install
npx patch-package
export DUO_STATUS_URL=http://localhost:8080
export DUO_API_URL=http://localhost:5001
export DUO_CHAT_URL=ws://localhost:5001/chat
export DUO_IMAGES_URL=http://localhost:9090/s3-mock-bucket
export DUO_AUDIO_URL=http://localhost:9090/s3-mock-audio-bucket
npm run web
```

Expo opens the app automatically. If it does not, open
<http://localhost:8081>. Verify the API independently at
<http://localhost:5001/health>; a healthy response is `status: ok`.

Keep the frontend terminal running. Saved JavaScript and TypeScript changes
reload in the browser. Stop it with `Ctrl-C`.

If `./run-ios-device.sh` is already running Metro for an iPhone, do not start a
second frontend process. Focus that terminal and press `w`; Expo builds and
opens the web app on the same port with the same runtime configuration.

## Physical iPhone with a backend on the Mac

### One-time requirements

- A Mac with Xcode and its command-line tools installed
- Docker Desktop
- Node.js and npm (LTS recommended)
- CocoaPods (`brew install cocoapods` when using Homebrew)
- An iPhone connected to the Mac and on the same local network
- Developer Mode enabled on the iPhone
- An Apple account added under **Xcode > Settings > Accounts**

A free Apple Personal Team is enough. Xcode creates the development certificate
and provisioning profile automatically; there is no need to create a
certificate manually.

### 1. Start the backend

Run from the repository root:

```bash
export DUO_API_PORT=5001
docker compose -f backend/docker-compose.yml up -d --build
curl -sf "http://localhost:${DUO_API_PORT}/health" && echo "API OK"
```

Port `5001` avoids the macOS service that commonly occupies port `5000`. To use
`5000`, omit `DUO_API_PORT` everywhere in this guide.

### 2. Check phone-to-Mac connectivity

Print the backend health URL without storing the Mac hostname in a file:

```bash
printf 'http://%s.local:%s/health\n' \
  "$(scutil --get LocalHostName)" "${DUO_API_PORT:-5000}"
```

Open the printed URL in Safari on the iPhone. It should display `status: ok`.
If it does not, confirm both devices are on the same network and allow incoming
connections for Docker and Node in the macOS firewall.

### 3. Install and launch the app

Choose a unique reverse-domain bundle identifier. Keep it in the shell; do not
commit it to this public repository.

```bash
cd frontend
npm install
npx patch-package
export DUO_API_PORT=5001
export DUO_IOS_BUNDLE_IDENTIFIER=com.example.duolicious.dev
./run-ios-device.sh
```

Replace `com.example.duolicious.dev` with an identifier you control. Select the
physical iPhone when prompted.

For the first build, open the generated `frontend/ios` project in Xcode if
signing needs attention. Select the **Duolicious** target, then under **Signing
& Capabilities**:

1. Enable **Automatically manage signing**.
2. Select your Personal Team.
3. Confirm the bundle identifier is unique.
4. Build or rerun `./run-ios-device.sh`.

On the iPhone, accept the Local Network prompt. If launch is blocked, open
**Settings > General > VPN & Device Management**, select the developer profile,
and tap **Trust**. Keep the device unlocked while installing or launching.

The launcher discovers the Mac's Bonjour hostname and supplies all local URLs
at runtime. It does not write the hostname, LAN address, Apple account, team ID,
or bundle identifier into tracked files.

### Personal Team limitations

Local iPhone builds omit these paid-team capabilities:

- Associated Domains
- Sign in with Apple
- Push Notifications

Those features are unavailable in a Personal Team build. Production builds keep
their normal capabilities.

### Daily startup after initial setup

Terminal 1, from the repository root:

```bash
export DUO_API_PORT=5001
docker compose -f backend/docker-compose.yml up -d
```

Terminal 2:

```bash
cd frontend
export DUO_API_PORT=5001
export DUO_IOS_BUNDLE_IDENTIFIER=com.example.duolicious.dev
./run-ios-device.sh
```

The launcher rebuilds the app when needed and starts Metro. Once Metro is
running, press `w` in its terminal to launch the web version alongside the
iPhone app. JavaScript changes reload without another native build.

### Stop and reset

Stop Metro with `Ctrl-C`. Stop the backend without deleting its data:

```bash
docker compose -f backend/docker-compose.yml stop
```

Remove local backend containers and volumes for a clean database reset:

```bash
docker compose -f backend/docker-compose.yml down --volumes
```

The volume command permanently deletes local development data.

## Common problems

- **Port 5000 is already in use:** use `DUO_API_PORT=5001` for both backend and
  frontend commands.
- **No provisioning profile:** enable automatic signing, select a team, use a
  unique bundle identifier, and retry while the Mac is online.
- **Personal Team capability error:** launch with `./run-ios-device.sh`; it
  enables the local configuration that removes unsupported capabilities.
- **Developer profile is not trusted:** trust it in the iPhone's VPN & Device
  Management settings.
- **Device tunnel timed out:** unlock the iPhone, reconnect its cable, confirm it
  appears in Xcode, and retry.
- **App cannot reach Metro or the API:** accept Local Network access, verify the
  Safari health check, and ensure VPN or guest Wi-Fi isolation is not blocking
  peer-to-peer traffic.
- **Port 8081 is already in use:** reuse the existing Expo terminal and press
  `w`, or stop the other Metro/web process before running `npm run web`.
- **Stale Expo/native configuration:** stop Metro and run
  `npx expo prebuild --clean --platform ios`, then rerun the launcher. The
  generated `frontend/ios` directory is local and must not be committed.

For deeper frontend and backend workflows, see
[`frontend/DEVELOPER.md`](frontend/DEVELOPER.md) and
[`backend/DEVELOPER.md`](backend/DEVELOPER.md).
