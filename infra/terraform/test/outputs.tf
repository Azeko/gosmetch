output "cluster_id" { value = yandex_kubernetes_cluster.this.id }
output "cluster_name" { value = yandex_kubernetes_cluster.this.name }
output "registry_id" { value = yandex_container_registry.this.id }
output "registry_prefix" { value = "cr.yandex/${yandex_container_registry.this.id}/gosmetch" }
output "images_bucket" { value = yandex_storage_bucket.images.bucket }
output "audio_bucket" { value = yandex_storage_bucket.audio.bucket }
output "s3_endpoint" { value = "https://storage.yandexcloud.net" }
output "app_storage_access_key" {
  value     = yandex_iam_service_account_static_access_key.app_storage.access_key
  sensitive = true
}
output "app_storage_secret_key" {
  value     = yandex_iam_service_account_static_access_key.app_storage.secret_key
  sensitive = true
}
output "registry_publisher_authorized_key" {
  description = "Set as CONTAINER_REGISTRY_PASSWORD; use json_key as the username."
  value = jsonencode({
    id                 = yandex_iam_service_account_key.registry_publisher.id
    service_account_id = yandex_iam_service_account.registry_publisher.service_account_id
    created_at         = yandex_iam_service_account_key.registry_publisher.created_at
    key_algorithm      = yandex_iam_service_account_key.registry_publisher.key_algorithm
    public_key         = yandex_iam_service_account_key.registry_publisher.public_key
    private_key        = yandex_iam_service_account_key.registry_publisher.private_key
  })
  sensitive = true
}
