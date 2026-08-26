resource "yandex_vpc_network" "this" {
  name   = "gosmetch-${var.environment}"
  labels = var.labels
}

resource "yandex_vpc_subnet" "this" {
  name           = "gosmetch-${var.environment}-${var.zone}"
  zone           = var.zone
  network_id     = yandex_vpc_network.this.id
  v4_cidr_blocks = [var.network_cidr]
  labels         = var.labels
}

resource "yandex_vpc_security_group" "cluster" {
  name       = "gosmetch-${var.environment}-cluster"
  network_id = yandex_vpc_network.this.id
  labels     = var.labels

  ingress {
    protocol          = "ANY"
    description       = "Cluster-internal traffic"
    predefined_target = "self_security_group"
  }
  ingress {
    protocol       = "TCP"
    description    = "Kubernetes API"
    port           = 443
    v4_cidr_blocks = var.api_allowed_cidrs
  }
  ingress {
    protocol       = "TCP"
    description    = "Health checks from Yandex load balancers"
    from_port      = 30000
    to_port        = 32767
    v4_cidr_blocks = ["198.18.235.0/24", "198.18.248.0/24"]
  }
  egress {
    protocol       = "ANY"
    description    = "Test workloads and managed control-plane services"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
}
