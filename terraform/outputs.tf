output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.frontend.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

output "lambda_edge_function_name" {
  description = "Lambda@Edge function name"
  value       = aws_lambda_function.edge_router.function_name
}

output "lambda_edge_function_arn" {
  description = "Lambda@Edge function ARN"
  value       = aws_lambda_function.edge_router.qualified_arn
}
