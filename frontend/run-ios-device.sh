#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${DUO_IOS_BUNDLE_IDENTIFIER:-}" ]]; then
  cat >&2 <<'EOF'
Set DUO_IOS_BUNDLE_IDENTIFIER to a unique identifier owned by your Apple
Developer account, for example:

  export DUO_IOS_BUNDLE_IDENTIFIER=com.example.duolicious.dev

Use your own domain-style prefix; do not commit it to this repository.
EOF
  exit 1
fi

local_hostname="${DUO_LOCAL_HOSTNAME:-$(scutil --get LocalHostName)}"
dev_host="${local_hostname}.local"
api_port="${DUO_API_PORT:-5000}"

export DUO_LOCAL_IOS_DEV=1
export DUO_STATUS_URL="${DUO_STATUS_URL:-http://${dev_host}:8080}"
export DUO_API_URL="${DUO_API_URL:-http://${dev_host}:${api_port}}"
export DUO_CHAT_URL="${DUO_CHAT_URL:-ws://${dev_host}:${api_port}/chat}"
export DUO_IMAGES_URL="${DUO_IMAGES_URL:-http://${dev_host}:9090/s3-mock-bucket}"
export DUO_AUDIO_URL="${DUO_AUDIO_URL:-http://${dev_host}:9090/s3-mock-audio-bucket}"

printf 'Using local backend at %s\n' "${DUO_API_URL}"

exec npx expo run:ios --device "$@"
