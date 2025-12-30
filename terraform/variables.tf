variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "bucket_name" {
  description = "S3 bucket name for static website hosting"
  type        = string
  default     = "finedskywalker-client-dev"
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
  default     = "shravanshetty5"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "finEdSkywalkerClient"
}

variable "backend_api_url" {
  description = "Backend API URL for CSP policy"
  type        = string
  # No default - must be provided via tfvars or environment variable
}

