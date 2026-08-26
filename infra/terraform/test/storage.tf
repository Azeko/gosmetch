resource "random_id" "suffix" { byte_length = 4 }

resource "yandex_container_registry" "this" {
  name      = "gosmetch-${var.environment}"
  folder_id = var.folder_id
  labels    = var.labels
}

resource "yandex_storage_bucket" "images" {
  bucket                = "${var.bucket_prefix}-images-${random_id.suffix.hex}"
  folder_id             = var.folder_id
  default_storage_class = "STANDARD"
  force_destroy         = false
  max_size              = 10737418240
  anonymous_access_flags {
    read        = false
    list        = false
    config_read = false
  }
  versioning { enabled = true }
  lifecycle_rule {
    id      = "expire-old-versions"
    enabled = true
    noncurrent_version_expiration { days = 30 }
  }
  cors_rule {
    allowed_methods = ["GET", "HEAD", "PUT"]
    allowed_origins = ["https://test.example.com"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }
  tags = var.labels
}

resource "yandex_storage_bucket" "audio" {
  bucket                = "${var.bucket_prefix}-audio-${random_id.suffix.hex}"
  folder_id             = var.folder_id
  default_storage_class = "STANDARD"
  force_destroy         = false
  max_size              = 10737418240
  anonymous_access_flags {
    read        = false
    list        = false
    config_read = false
  }
  versioning { enabled = true }
  lifecycle_rule {
    id      = "expire-old-versions"
    enabled = true
    noncurrent_version_expiration { days = 30 }
  }
  cors_rule {
    allowed_methods = ["GET", "HEAD", "PUT"]
    allowed_origins = ["https://test.example.com"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }
  tags = var.labels
}
