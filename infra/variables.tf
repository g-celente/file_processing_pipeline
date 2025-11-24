variable "aws_region" {
  type        = string
  default     = "us-east-2"
  description = "description"
}

variable "s3_bucket_name" {
  type        = string
  default     = "gateway-s3-files"
  description = "S3 bucket name to store uploaded files"
}
