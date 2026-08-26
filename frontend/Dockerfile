# Dev image for the Duolicious frontend (Expo web dev server).
#
# This serves the web build of the app with hot reload so new contributors
# can `docker compose up` from the repo root and get a working frontend that
# talks to the backend services on their published localhost ports. Browser
# requests originate on the host, so the frontend's default API URLs
# (http://localhost:5000 etc.) resolve to the published backend containers
# without any extra configuration.
FROM node:22-bookworm AS dependencies

WORKDIR /app

# Install dependencies first so this layer is cached across source changes.
# patch-package needs the patches/ directory present at install time.
COPY package.json package-lock.json ./
COPY patches ./patches
RUN npm ci && npx patch-package

# Copy the rest of the source. At runtime docker-compose bind-mounts the
# host source over /app (with an anonymous volume preserving node_modules),
# so edits hot-reload; this COPY keeps the image usable on its own too.
FROM dependencies AS development

COPY . .

# Expo/Metro web dev server.
EXPOSE 8081

# BROWSER=none stops Expo from trying to launch a browser inside the
# container; contributors open http://localhost:8081 on the host instead.
ENV BROWSER=none \
    EXPO_NO_TELEMETRY=1

CMD ["npx", "expo", "start", "--web", "--port", "8081"]

FROM dependencies AS build

ARG DUO_COMMIT_HASH=unknown
ARG DUO_API_URL=https://api.example.com
ARG DUO_CHAT_URL=wss://api.example.com/chat
ARG DUO_IMAGES_URL=https://images.example.com
ARG DUO_AUDIO_URL=https://audio.example.com
ARG DUO_STATUS_URL=https://status.example.com
ARG DUO_GOOGLE_WEB_CLIENT_ID=example.apps.googleusercontent.com
ARG DUO_APPLE_WEB_CLIENT_ID=app.example.web
ARG DUO_APPLE_REDIRECT_URI=https://api.example.com/auth/apple/callback
ARG DUO_WEB_PUSH_VAPID_PUBLIC_KEY
ENV DUO_WEB_VERSION=$DUO_COMMIT_HASH \
    DUO_API_URL=$DUO_API_URL \
    DUO_CHAT_URL=$DUO_CHAT_URL \
    DUO_IMAGES_URL=$DUO_IMAGES_URL \
    DUO_AUDIO_URL=$DUO_AUDIO_URL \
    DUO_STATUS_URL=$DUO_STATUS_URL \
    DUO_GOOGLE_WEB_CLIENT_ID=$DUO_GOOGLE_WEB_CLIENT_ID \
    DUO_APPLE_WEB_CLIENT_ID=$DUO_APPLE_WEB_CLIENT_ID \
    DUO_APPLE_REDIRECT_URI=$DUO_APPLE_REDIRECT_URI \
    DUO_WEB_PUSH_VAPID_PUBLIC_KEY=$DUO_WEB_PUSH_VAPID_PUBLIC_KEY \
    NODE_OPTIONS=--openssl-legacy-provider \
    EXPO_NO_TELEMETRY=1
COPY . .
RUN npx expo export --platform web \
    && patch -p0 < patches/index.html.patch \
    && if [ -d dist/assets/node_modules ]; then mv dist/assets/node_modules/* dist/assets/; fi \
    && find dist/_expo/static/js/web -type f -exec sed -i 's#assets/node_modules#assets#g' {} +

FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
