resource "yandex_iam_service_account" "cluster" {
  name        = "gosmetch-${var.environment}-cluster"
  description = "Managed Kubernetes control plane"
}

resource "yandex_iam_service_account" "nodes" {
  name        = "gosmetch-${var.environment}-nodes"
  description = "Managed Kubernetes nodes"
}

resource "yandex_iam_service_account" "app_storage" {
  name        = "gosmetch-${var.environment}-storage"
  description = "Application access to its test Object Storage buckets"
}

locals {
  cluster_roles = toset(["k8s.clusters.agent", "vpc.publicAdmin"])
  node_roles    = toset(["container-registry.images.puller", "k8s.tunnelClusters.agent"])
}

resource "yandex_resourcemanager_folder_iam_member" "cluster" {
  for_each  = local.cluster_roles
  folder_id = var.folder_id
  role      = each.value
  member    = "serviceAccount:${yandex_iam_service_account.cluster.id}"
}

resource "yandex_resourcemanager_folder_iam_member" "nodes" {
  for_each  = local.node_roles
  folder_id = var.folder_id
  role      = each.value
  member    = "serviceAccount:${yandex_iam_service_account.nodes.id}"
}

resource "yandex_resourcemanager_folder_iam_member" "app_storage" {
  folder_id = var.folder_id
  role      = "storage.editor"
  member    = "serviceAccount:${yandex_iam_service_account.app_storage.id}"
}

resource "yandex_iam_service_account_static_access_key" "app_storage" {
  service_account_id = yandex_iam_service_account.app_storage.id
  description        = "S3-compatible application credentials; stored only in encrypted Terraform state"
  depends_on         = [yandex_resourcemanager_folder_iam_member.app_storage]
}
