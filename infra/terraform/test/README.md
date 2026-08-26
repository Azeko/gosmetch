# Yandex Cloud test environment

This root creates a zonal Managed Kubernetes cluster, two small preemptible
workers by default, a private Container Registry, private versioned image and
audio buckets, and dedicated service accounts. It expects a dedicated Yandex
Cloud folder so the application storage role cannot reach unrelated buckets.

## Bootstrap and state

Create the state bucket outside this root, enable versioning, and set
`force_destroy = false`. GitHub uses an S3-compatible static key only for the
backend (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`). The backend uses
Terraform S3 lockfiles plus workflow concurrency. Keep state credentials
separate from the Yandex provider service account key.

Copy `backend.hcl.example` and `terraform.tfvars.example` to ignored local
files, replace examples, then:

```sh
terraform init -backend-config=backend.hcl
terraform fmt -check -recursive
terraform validate
terraform plan -var-file=terraform.tfvars
```

Authenticate the provider through `YC_SERVICE_ACCOUNT_KEY_FILE` or another
supported Yandex provider mechanism. The CI workflow documents its required
variables and secrets inline.

The application S3 key is a sensitive Terraform output and therefore resides
in encrypted remote state. Retrieve it only to load a Kubernetes secret; never
commit it or print it in CI. Rotate it after exposure or staff changes.

## Deployment handoff

Use `registry_prefix`, `images_bucket`, `audio_bucket`, and `s3_endpoint` to
populate the image pipeline and Kustomize overlay. Install an ingress
controller, cert-manager, and CloudNativePG operator before applying the app.
DNS records should target the ingress controller's public load balancer after
it is provisioned; domain ownership is intentionally an input to that layer.

## Cost and teardown

The cluster control plane, public IP/load balancer, SSD disks, Object Storage,
and egress are the main cost drivers. Preemptible nodes reduce test cost but can
be interrupted. Review `terraform plan -destroy` explicitly before teardown.
Buckets have `force_destroy = false`; empty and delete them only after backups
are no longer required. Never automate destroy from GitHub Actions.
