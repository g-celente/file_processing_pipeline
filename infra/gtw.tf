resource "aws_api_gateway_rest_api" "gtw_api_images" {
  name = "gtw_api_images"

  binary_media_types = [ # Defines/Handles binary requests appropriately
    "image/png",
    "application/pdf",
    "application/octet-stream"
  ]

  endpoint_configuration {
    types = ["REGIONAL"] # Defines that the api gateway is regional
  }
}

# =========================
# IAM ROLE E POLICY FOR API GATEWAY
# =========================
resource "aws_iam_role" "apigw_s3_role" {
  name = "apigw_s3_upload_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "apigateway.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "apigw_s3_policy" {
  role = aws_iam_role.apigw_s3_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:CreateBucket"],
        Resource = "*"
      }
    ]
  })
}

# =========================
# ENDPOINTS API GATEWAY
# =========================

#Defines path /images
resource "aws_api_gateway_resource" "images_resource" {
  rest_api_id = aws_api_gateway_rest_api.gtw_api_images.id
  parent_id   = aws_api_gateway_rest_api.gtw_api_images.root_resource_id
  path_part   = "images"
}

#Defines childern path of images /{imageName}
resource "aws_api_gateway_resource" "images_resource_object" {
  rest_api_id = aws_api_gateway_rest_api.gtw_api_images.id
  parent_id   = aws_api_gateway_resource.images_resource.id
  path_part   = "{imageName}"
}

#Defines POST method for /images/{imageName}
resource "aws_api_gateway_method" "post_image_method" {
  rest_api_id   = aws_api_gateway_rest_api.gtw_api_images.id
  resource_id   = aws_api_gateway_resource.images_resource_object.id
  http_method   = "POST"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.imageName" = true
  }
}

#Integrates the POST method with S3 service
resource "aws_api_gateway_integration" "post_image_integration" {
  rest_api_id             = aws_api_gateway_rest_api.gtw_api_images.id
  resource_id             = aws_api_gateway_resource.images_resource_object.id
  http_method             = aws_api_gateway_method.post_image_method.http_method
  type                    = "AWS"
  integration_http_method = "PUT"
  uri                     = "arn:aws:apigateway:${var.aws_region}:s3:path/${var.s3_bucket_name}/{imageName}"

  credentials = aws_iam_role.apigw_s3_role.arn

  request_parameters = {
    "integration.request.path.imageName" = "method.request.path.imageName"
  }

  content_handling     = "CONVERT_TO_BINARY"
  passthrough_behavior = "WHEN_NO_MATCH"
}

resource "aws_api_gateway_method_response" "post_image_method_response" {
  rest_api_id = aws_api_gateway_rest_api.gtw_api_images.id
  resource_id = aws_api_gateway_resource.images_resource_object.id
  http_method = aws_api_gateway_method.post_image_method.http_method
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "post_image_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.gtw_api_images.id
  resource_id = aws_api_gateway_resource.images_resource_object.id
  http_method = aws_api_gateway_method.post_image_method.http_method
  status_code = aws_api_gateway_method_response.post_image_method_response.status_code

  response_templates = {
    "application/json" = ""
  }

  depends_on = [aws_api_gateway_method_response.post_image_method_response]
}

# =========================
# DEPLOYMENT AND STAGE CONFIG
# =========================
resource "aws_api_gateway_deployment" "gtw_api_images" {
  rest_api_id = aws_api_gateway_rest_api.gtw_api_images.id

  triggers = {
    redeployment = sha1(jsonencode(aws_api_gateway_rest_api.gtw_api_images.body))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "gtw-images-stage" {
  deployment_id = aws_api_gateway_deployment.gtw_api_images.id
  rest_api_id   = aws_api_gateway_rest_api.gtw_api_images.id
  stage_name    = "gtw-images-stage"
}
