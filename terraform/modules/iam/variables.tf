variable "project_name"     { type = string }
variable "eks_cluster_name" { type = string }
variable "aws_region"       { type = string }
variable "account_id"       { type = string }
variable "eks_oidc_url"     { type = string  default = "" }

output "alb_controller_role_arn" {
  value = try(aws_iam_role.alb_controller.arn, "")
}
