variable "cloud_id" {
  description = "Yandex Cloud ID."
  type        = string
}

variable "folder_id" {
  description = "Dedicated test-environment folder ID."
  type        = string
}

variable "zone" {
  description = "Availability zone for the zonal test cluster."
  type        = string
  default     = "ru-central1-a"
}

variable "environment" {
  type    = string
  default = "test"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,15}$", var.environment))
    error_message = "environment must be a short DNS-compatible name"
  }
}

variable "network_cidr" {
  type    = string
  default = "10.20.0.0/24"
}

variable "kubernetes_version" {
  type    = string
  default = "1.32"
}

variable "api_allowed_cidrs" {
  description = "CIDRs allowed to reach the public Kubernetes API; narrow this before apply."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "node_count" {
  type    = number
  default = 2
  validation {
    condition     = var.node_count >= 1 && var.node_count <= 3
    error_message = "The test node_count must be between 1 and 3."
  }
}

variable "node_preemptible" {
  type    = bool
  default = true
}

variable "bucket_prefix" {
  description = "Globally unique bucket prefix; a random suffix is appended."
  type        = string
  default     = "gosmetch-test"
}

variable "labels" {
  type    = map(string)
  default = { project = "gosmetch", environment = "test", managed-by = "terraform" }
}
