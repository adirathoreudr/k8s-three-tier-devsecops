output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "jenkins_public_ip" {
  description = "Jenkins server public IP address"
  value       = module.jenkins.public_ip
}

output "jenkins_url" {
  description = "Jenkins web UI URL"
  value       = "http://${module.jenkins.public_ip}:8080"
}

output "ecr_frontend_url" {
  description = "ECR repository URL for frontend image"
  value       = module.ecr.repository_urls["frontend"]
}

output "ecr_backend_url" {
  description = "ECR repository URL for backend image"
  value       = module.ecr.repository_urls["backend"]
}

output "kubectl_config_command" {
  description = "Command to configure kubectl for this cluster"
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
}
