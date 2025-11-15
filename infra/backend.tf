terraform {
  backend "s3" {
    bucket  = "terraform-state-gcelente"
    key     = "state/terraform.tfstate"
    region  = "us-east-2"
    encrypt = true
  }

}