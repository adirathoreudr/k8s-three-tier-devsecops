variable "project_name" { type = string }
variable "vpc_cidr"     { type = string }
variable "aws_region"   { type = string }

output "vpc_id"             { value = aws_vpc.main.id }
output "public_subnet_ids"  { value = aws_subnet.public[*].id }
output "private_subnet_ids" { value = aws_subnet.private[*].id }
