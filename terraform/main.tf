terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "REPLACE-WITH-YOUR-TF-STATE-BUCKET"
    key            = "three-tier/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ── VPC ───────────────────────────────────────────────────────────
module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  vpc_cidr     = var.vpc_cidr
  aws_region   = var.aws_region
}

# ── EKS Cluster ───────────────────────────────────────────────────
module "eks" {
  source              = "./modules/eks"
  project_name        = var.project_name
  cluster_name        = var.cluster_name
  kubernetes_version  = var.kubernetes_version
  private_subnet_ids  = module.vpc.private_subnet_ids
  vpc_id              = module.vpc.vpc_id
  node_instance_type  = var.node_instance_type
  node_desired_size   = var.node_desired_size
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size

  depends_on = [module.vpc]
}

# ── Jenkins Server ────────────────────────────────────────────────
module "jenkins" {
  source            = "./modules/jenkins"
  project_name      = var.project_name
  public_subnet_id  = module.vpc.public_subnet_ids[0]
  vpc_id            = module.vpc.vpc_id
  instance_type     = var.jenkins_instance_type
  key_pair_name     = var.key_pair_name
  eks_cluster_name  = var.cluster_name
  aws_region        = var.aws_region

  depends_on = [module.vpc]
}

# ── ECR Repositories ──────────────────────────────────────────────
module "ecr" {
  source       = "./modules/ecr"
  project_name = var.project_name
  repositories = ["frontend", "backend"]
}

# ── IAM Roles ─────────────────────────────────────────────────────
module "iam" {
  source           = "./modules/iam"
  project_name     = var.project_name
  eks_cluster_name = var.cluster_name
  aws_region       = var.aws_region
  account_id       = data.aws_caller_identity.current.account_id
}

data "aws_caller_identity" "current" {}
