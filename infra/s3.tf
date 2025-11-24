resource "aws_s3_bucket" "gateway-s3-files" {
  bucket = "gateway-s3-files"

  tags = {
    Name         = "Gateway S3 Files Bucket"
    Collaborator = "Gcelente"
    Environment  = "Dev"
  }
}