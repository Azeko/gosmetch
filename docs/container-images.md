# Container images

GitHub Actions builds the production API, cron, FireHOL, status, and frontend
images. Pull requests build without pushing. Pushes to `main` and manual runs
publish both `sha-<full commit SHA>` and the movable `test` tag.
Deployments should pin the immutable SHA tag or the digest printed in the job
summary. Images are published to GitHub Container Registry as
`ghcr.io/<owner>/gosmetch-<component>`. The workflow authenticates with its
short-lived `GITHUB_TOKEN`; no registry username, password, or cloud service
account key is required.

The frontend build also consumes public repository variables named
`DUO_API_URL`, `DUO_CHAT_URL`, `DUO_IMAGES_URL`, `DUO_AUDIO_URL`,
`DUO_STATUS_URL`, `DUO_GOOGLE_WEB_CLIENT_ID`, `DUO_APPLE_WEB_CLIENT_ID`,
`DUO_APPLE_REDIRECT_URI`, and `DUO_WEB_PUSH_VAPID_PUBLIC_KEY`. Safe example
URLs are used when they are absent; set every value before deploying the image.

New GHCR packages are private by default. Make the application images public
if the Kubernetes cluster should pull anonymously. If they remain private,
create a Kubernetes `imagePullSecret` using a read-only GitHub token and attach
it to the workload service account. Deployments should still pin image digests.

```sh
docker build -f backend/api.Dockerfile -t gosmetch-api:dev backend
docker build --target production -f frontend/Dockerfile -t gosmetch-frontend:dev frontend
docker run --rm -p 8080:8080 gosmetch-frontend:dev
```

## PostgreSQL is supplied by CloudNativePG

The deployment does not build or publish `backend/postgres.Dockerfile`.
CloudNativePG manages PostgreSQL using its PostGIS operand image, and the CNPG
`Database` resource creates the application database and required extensions:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres
spec:
  instances: 1

  imageName: ghcr.io/cloudnative-pg/postgis:17-3-standard-trixie

  storage:
    size: 10Gi
---
apiVersion: postgresql.cnpg.io/v1
kind: Database
metadata:
  name: app-db
spec:
  name: app
  owner: app

  cluster:
    name: postgres

  extensions:
    - name: postgis
      ensure: present
    - name: vector
      ensure: present
    - name: pg_trgm
      ensure: present
    - name: btree_gist
      ensure: present
    - name: uuid-ossp
      ensure: present
```

The deployment must provide the `app` role credentials separately and point
the backend at the `app` database. Pin the operand image by digest before
promoting an environment.
