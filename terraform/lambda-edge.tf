# Lambda@Edge function for dynamic route handling
resource "aws_iam_role" "lambda_edge" {
  name               = "${var.bucket_name}-lambda-edge-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_edge_basic" {
  role       = aws_iam_role.lambda_edge.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Archive Lambda function code
data "archive_file" "lambda_edge" {
  type        = "zip"
  source_file = "${path.module}/lambda-edge/index.js"
  output_path = "${path.module}/lambda-edge/function.zip"
}

# Lambda@Edge function (must be in us-east-1)
resource "aws_lambda_function" "edge_router" {
  provider         = aws.us_east_1
  filename         = data.archive_file.lambda_edge.output_path
  function_name    = "${var.bucket_name}-edge-router"
  role            = aws_iam_role.lambda_edge.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_edge.output_base64sha256
  runtime         = "nodejs20.x"
  timeout         = 5
  publish         = true

  description = "Lambda@Edge function for handling dynamic routes in finEdSkywalkerClient"

  tags = {
    Name = "${var.bucket_name}-edge-router"
  }
}

# CloudWatch log group for Lambda@Edge
resource "aws_cloudwatch_log_group" "lambda_edge" {
  provider          = aws.us_east_1
  name              = "/aws/lambda/${aws_lambda_function.edge_router.function_name}"
  retention_in_days = 7

  tags = {
    Name = "${var.bucket_name}-lambda-edge-logs"
  }
}

