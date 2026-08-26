resource "yandex_kubernetes_cluster" "this" {
  name        = "gosmetch-${var.environment}"
  description = "Gosmetch ${var.environment} environment"
  network_id  = yandex_vpc_network.this.id

  master {
    version   = var.kubernetes_version
    public_ip = true
    zonal {
      zone      = var.zone
      subnet_id = yandex_vpc_subnet.this.id
    }
    security_group_ids = [yandex_vpc_security_group.cluster.id]
    maintenance_policy {
      auto_upgrade = true
      maintenance_window {
        day        = "sunday"
        start_time = "03:00"
        duration   = "3h"
      }
    }
  }

  service_account_id      = yandex_iam_service_account.cluster.id
  node_service_account_id = yandex_iam_service_account.nodes.id
  release_channel         = "STABLE"
  network_policy_provider = "CALICO"
  labels                  = var.labels

  depends_on = [
    yandex_resourcemanager_folder_iam_member.cluster,
    yandex_resourcemanager_folder_iam_member.nodes,
  ]
}

resource "yandex_kubernetes_node_group" "this" {
  cluster_id  = yandex_kubernetes_cluster.this.id
  name        = "gosmetch-${var.environment}-workers"
  description = "Cost-conscious test workers"
  version     = var.kubernetes_version
  labels      = var.labels

  instance_template {
    platform_id = "standard-v3"
    resources {
      cores         = 2
      memory        = 4
      core_fraction = 100
    }
    boot_disk {
      type = "network-ssd"
      size = 64
    }
    network_interface {
      nat                = true
      subnet_ids         = [yandex_vpc_subnet.this.id]
      security_group_ids = [yandex_vpc_security_group.cluster.id]
    }
    scheduling_policy { preemptible = var.node_preemptible }
  }

  scale_policy {
    fixed_scale {
      size = var.node_count
    }
  }
  allocation_policy {
    location {
      zone = var.zone
    }
  }
  maintenance_policy {
    auto_upgrade = true
    auto_repair  = true
    maintenance_window {
      day        = "sunday"
      start_time = "04:00"
      duration   = "3h"
    }
  }
}
