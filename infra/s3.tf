resource "aws_s3_bucket" "gateway-s3-images" {
  bucket = "gateway-s3-images"

  tags = {
    Name         = "Gateway S3 Images Bucket"
    Collaborator = "Gcelente"
    Environment  = "Dev"
  }
}