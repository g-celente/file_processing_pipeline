resource "aws_s3_bucket" "gateway-s3-files" {
  bucket = "gateway-s3-files"

  tags = {
    Name         = "Gateway S3 Files Bucket"
    Collaborator = "Gcelente"
    Environment  = "Dev"
  }
}

# Enables versioning for the S3 bucket
resource "aws_s3_bucket_versioning" "gateway_s3_files_versioning" {
  bucket = aws_s3_bucket.gateway-s3-files.id

  versioning_configuration {
    status = "Enabled"
  }
}

##Configures lifecycle rule to expire non-current object versions after 10 days
resource "aws_s3_bucket_lifecycle_configuration" "gateway_s3_files_lifecycle" {
  bucket = aws_s3_bucket.gateway-s3-files.id

  rule {
    id     = "Expire old versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 10
    }
  }

  depends_on = [
    aws_s3_bucket_versioning.gateway_s3_files_versioning
  ]
}