# Container images

GitHub Actions builds the production API, cron, FireHOL, PostgreSQL, status,
and frontend images. Pull requests build without pushing. Pushes to `main` and
manual runs publish both `sha-<full commit SHA>` and the movable `test` tag.
Deployments should pin the immutable SHA tag or the digest printed in the job
summary.

Configure these repository or protected-environment values:

| Name | Kind | Example for Yandex Container Registry |
|---|---|---|
| `CONTAINER_REGISTRY` | variable | `cr.yandex` |
| `CONTAINER_IMAGE_PREFIX` | variable | `crp00000000000000000/gosmetch` |
| `CONTAINER_REGISTRY_USERNAME` | secret | `json_key` |
| `CONTAINER_REGISTRY_PASSWORD` | secret | Authorized service-account key JSON |

The frontend build also consumes public repository variables named
`DUO_API_URL`, `DUO_CHAT_URL`, `DUO_IMAGES_URL`, `DUO_AUDIO_URL`,
`DUO_STATUS_URL`, `DUO_GOOGLE_WEB_CLIENT_ID`, `DUO_APPLE_WEB_CLIENT_ID`,
`DUO_APPLE_REDIRECT_URI`, and `DUO_WEB_PUSH_VAPID_PUBLIC_KEY`. Safe example
URLs are used when they are absent; set every value before deploying the image.

The service account needs only permission to push to the selected registry.
Use protected secrets and rotate static keys. Never commit the key JSON.

Images are named `<registry>/<prefix>/<component>`. The variables can point to
any OCI registry accepted by `docker/login-action`.

```sh
docker build -f backend/api.Dockerfile -t gosmetch-api:dev backend
docker build --target production -f frontend/Dockerfile -t gosmetch-frontend:dev frontend
docker run --rm -p 8080:8080 gosmetch-frontend:dev
```
