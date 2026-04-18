variable "project_name"     { type = string }
variable "public_subnet_id" { type = string }
variable "vpc_id"           { type = string }
variable "instance_type"    { type = string }
variable "key_pair_name"    { type = string }
variable "eks_cluster_name" { type = string }
variable "aws_region"       { type = string }

output "public_ip"  { value = aws_eip.jenkins.public_ip }
output "instance_id"{ value = aws_instance.jenkins.id }
