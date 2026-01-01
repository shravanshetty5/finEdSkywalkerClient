# Lambda@Edge Deployment Guide

Quick reference for deploying the Lambda@Edge function and CloudFront updates.

## Initial Setup

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Review the Plan

```bash
terraform plan
```

Expected new resources:
- `aws_lambda_function.edge_router` - Lambda function
- `aws_iam_role.lambda_edge` - IAM role for Lambda
- `aws_iam_role_policy_attachment.lambda_edge_basic` - Policy attachment
- `aws_cloudwatch_log_group.lambda_edge` - CloudWatch logs
- CloudFront distribution update with Lambda association

### 3. Apply the Changes

```bash
terraform apply
```

Type `yes` when prompted.

⏱️ **Wait time:** 15-30 minutes for CloudFront to propagate Lambda@Edge globally

## Updating Lambda Function

When you modify `lambda-edge/index.js`:

```bash
cd terraform
terraform apply
```

Terraform will:
1. Create new ZIP file from updated code
2. Update Lambda function
3. Publish new version
4. Update CloudFront association
5. Propagate to all edge locations (15-30 min)

## Verification Steps

### 1. Check Lambda Function

```bash
aws lambda get-function \
  --function-name finedskywalker-client-dev-edge-router \
  --region us-east-1
```

### 2. Check CloudFront Distribution

```bash
# Get distribution ID from Terraform output
terraform output cloudfront_distribution_id

# Check distribution status
aws cloudfront get-distribution \
  --id <DISTRIBUTION_ID> \
  --query 'Distribution.Status'
```

Status should be `Deployed` before testing.

### 3. Test Routes

```bash
# Get CloudFront domain
DOMAIN=$(terraform output -raw cloudfront_domain_name)

# Test static pages
curl -I "https://${DOMAIN}/"
curl -I "https://${DOMAIN}/login"
curl -I "https://${DOMAIN}/search"

# Test dynamic route
curl -I "https://${DOMAIN}/ticker/AAPL"
curl -I "https://${DOMAIN}/ticker/GOOGL"
```

All should return `200 OK`.

### 4. Check Lambda Logs

```bash
# View recent logs
aws logs tail /aws/lambda/us-east-1.finedskywalker-client-dev-edge-router \
  --follow \
  --format short

# Generate test requests to see logs
curl "https://${DOMAIN}/ticker/TSLA"
```

Look for log entries like:
```
Request URI: /ticker/TSLA
Matched Route: /ticker/:ticker -> /ticker/[ticker].html
Extracted params: {"ticker":"TSLA"}
```

## Troubleshooting

### Lambda Not Executing

**Symptoms:** Routes return 404, no Lambda logs

**Solution:**
1. Verify Lambda is published:
   ```bash
   aws lambda list-versions-by-function \
     --function-name finedskywalker-client-dev-edge-router \
     --region us-east-1
   ```

2. Check CloudFront association:
   ```bash
   aws cloudfront get-distribution-config \
     --id <DISTRIBUTION_ID> \
     --query 'DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations'
   ```

3. Wait for propagation (check `Status: Deployed`)

### 403 Forbidden

**Cause:** File doesn't exist in S3

**Solution:**
1. Verify Next.js build created the file:
   ```bash
   ls -la out/ticker/
   # Should see [ticker].html
   ```

2. Check S3 bucket:
   ```bash
   aws s3 ls s3://finedskywalker-client-dev/ticker/
   ```

3. Upload if missing:
   ```bash
   npm run build
   aws s3 sync out/ s3://finedskywalker-client-dev/
   ```

### Wrong File Served

**Cause:** CloudFront cache serving old version

**Solution:**
1. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id <DISTRIBUTION_ID> \
     --paths "/ticker/*"
   ```

2. Or wait for TTL to expire (default: 86400s = 24 hours)

### Lambda Execution Errors

**Symptoms:** 500/502 errors, error logs in CloudWatch

**Solution:**
1. Check error logs:
   ```bash
   aws logs tail /aws/lambda/us-east-1.finedskywalker-client-dev-edge-router \
     --follow \
     --filter-pattern ERROR
   ```

2. Common fixes:
   - Syntax error in index.js → Fix and redeploy
   - Timeout (5s limit) → Optimize function
   - Memory limit → Increase in lambda-edge.tf

## Rollback Procedure

If Lambda@Edge causes issues:

### Option 1: Remove Lambda Association

```bash
# Edit s3-cloudfront.tf
# Comment out the lambda_function_association block

terraform apply
```

### Option 2: Previous Version

```bash
# List versions
aws lambda list-versions-by-function \
  --function-name finedskywalker-client-dev-edge-router \
  --region us-east-1

# Update CloudFront to use previous version
# Edit lambda-edge.tf, change lambda_arn to specific version
# Then: terraform apply
```

### Option 3: Full Rollback

```bash
# Restore from git
git checkout HEAD~1 terraform/

# Apply previous state
terraform apply
```

## Monitoring

### Set Up CloudWatch Alarms

```bash
# Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name "LambdaEdge-Errors" \
  --alarm-description "Alert on Lambda@Edge errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold

# Lambda duration
aws cloudwatch put-metric-alarm \
  --alarm-name "LambdaEdge-HighDuration" \
  --alarm-description "Alert on slow Lambda executions" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold
```

### View Metrics

```bash
# Recent invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=finedskywalker-client-dev-edge-router \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Error rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=finedskywalker-client-dev-edge-router \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## Best Practices

1. **Test locally first:**
   - Modify function code
   - Test with sample CloudFront events
   - Use AWS SAM for local testing

2. **Deploy during low traffic:**
   - CloudFront propagation takes time
   - Schedule deployments for off-peak hours

3. **Monitor after deployment:**
   - Watch CloudWatch logs for 1-2 hours
   - Check error rates
   - Verify expected behavior

4. **Version control:**
   - Commit Lambda function changes
   - Tag releases
   - Document changes in git commit messages

5. **Keep function simple:**
   - Minimize dependencies
   - Optimize for speed (< 50ms target)
   - Cache regex compilations

## Quick Commands

```bash
# Deploy Lambda update
cd terraform && terraform apply -auto-approve

# Watch logs
aws logs tail /aws/lambda/us-east-1.finedskywalker-client-dev-edge-router --follow

# Test route
curl -I "https://$(terraform output -raw cloudfront_domain_name)/ticker/AAPL"

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/*"

# Check distribution status
aws cloudfront get-distribution \
  --id $(terraform output -raw cloudfront_distribution_id) \
  --query 'Distribution.Status'
```

