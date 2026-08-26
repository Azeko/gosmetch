# Kubernetes deployment

The base contains the application, a single-instance CloudNativePG cluster,
an `app` database with its required extensions, and persistent Redis. The
database uses the CNPG-compatible
`ghcr.io/cloudnative-pg/postgis:17-3-standard-trixie` operand instead of the
repository's custom PostgreSQL image. The `test` overlay supplies test hosts and Yandex
Container Registry image names. Replace every `CHANGE_ME`, `REGISTRY_ID`, and
`example.com` value before applying.

Install the pinned CloudNativePG operator first (the cluster must already have
an ingress controller and cert-manager):

```sh
kubectl apply --server-side -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.25/releases/cnpg-1.25.1.yaml
kustomize build deploy/kustomize/overlays/test | kubectl apply --dry-run=server -f -
kustomize build deploy/kustomize/overlays/test | kubectl diff -f -
kustomize build deploy/kustomize/overlays/test | kubectl apply -f -
kubectl -n gosmetch-test rollout status deployment/api
```

Do not deploy the placeholder generated secrets. In CI or CD, replace them
with encrypted/external secret material before apply. Provision the `app`
PostgreSQL role and password before the `Database` resource reconciles; its
password must match `DUO_DB_PASS`. The application does not
currently support Redis authentication, so Redis is reachable only inside the
namespace and is protected by network policy. Add password/TLS support to the
client before enabling Redis `requirepass`.

CloudNativePG owns the database PVC. Removing application Deployments does not
remove it. Treat deletion of the `Cluster` or its PVCs as a separate,
destructive operation. Configure object-store backups and test restore before
using this beyond an ephemeral test environment.
