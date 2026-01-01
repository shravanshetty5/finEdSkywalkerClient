terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  backend "s3" {
    bucket         = "finedskywalker-terraform-state"
    key            = "finEdSkywalkerClient/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "finedskywalker-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "finEdSkywalkerClient"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}

# Additional provider for Lambda@Edge (must be in us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "finEdSkywalkerClient"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}

