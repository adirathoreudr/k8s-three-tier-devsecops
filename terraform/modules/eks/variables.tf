variable "project_name"       { type = string }
variable "cluster_name"       { type = string }
variable "kubernetes_version" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "vpc_id"             { type = string }
variable "node_instance_type" { type = string }
variable "node_desired_size"  { type = number }
variable "node_min_size"      { type = number }
variable "node_max_size"      { type = number }

output "cluster_name"     { value = aws_eks_cluster.main.name }
output "cluster_endpoint" { value = aws_eks_cluster.main.endpoint }
output "cluster_ca"       { value = aws_eks_cluster.main.certificate_authority[0].data }
