resource "aws_ecr_repository" "repos" {
  for_each             = toset(var.repositories)
  name                 = "${var.project_name}-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true   # Auto-scan every image on push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = { Name = "${var.project_name}-${each.key}" }
}

# Lifecycle policy: keep last 10 images per repo
resource "aws_ecr_lifecycle_policy" "repos" {
  for_each   = aws_ecr_repository.repos
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
