# Setup Guide - finEdSkywalker Client

This guide walks you through the complete setup process for deploying the finEdSkywalker frontend to AWS.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] AWS Account with administrative access
- [ ] AWS CLI v2.x installed and configured
- [ ] Terraform v1.0+ installed
- [ ] Node.js v20.x+ and npm v10.x+ installed
- [ ] Git installed
- [ ] GitHub repository created (`finEdSkywalkerClient`)
- [ ] Existing S3 bucket `finedskywalker-terraform-state` (from backend setup)
- [ ] Existing DynamoDB table `finedskywalker-terraform-locks` (from backend setup)

## 🚀 Step-by-Step Setup

### Step 1: Clone and Setup Local Development

```bash
# Clone the repository
git clone https://github.com/shravanshetty5/finEdSkywalkerClient.git
cd finEdSkywalkerClient

# Install dependencies
npm install

# Create environment file
cp env.example .env.local

# Test local development
npm run dev
```

Visit `http://localhost:3000` to verify the app runs locally.

### Step 2: Verify AWS Configuration

```bash
# Check AWS CLI is configured
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/..."
# }

# Verify Terraform state backend exists
aws s3 ls s3://finedskywalker-terraform-state/

# Verify DynamoDB lock table exists
aws dynamodb describe-table --table-name finedskywalker-terraform-locks
```

### Step 3: Initialize Terraform

```bash
cd terraform

# Initialize Terraform (downloads providers and configures backend)
terraform init

# Expected output:
# Initializing the backend...
# Successfully configured the backend "s3"!
# ...
# Terraform has been successfully initialized!
```

**Troubleshooting:**

If you get an error about the S3 bucket not existing, create it:

```bash
aws s3 mb s3://finedskywalker-terraform-state --region us-east-1
aws s3api put-bucket-versioning \
  --bucket finedskywalker-terraform-state \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name finedskywalker-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 4: Review Terraform Plan

```bash
# Create terraform.tfvars from example
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars and set your backend API URL
# backend_api_url = "https://your-api-id.execute-api.us-east-1.amazonaws.com"

# Review what Terraform will create
terraform plan

# You should see:
# - aws_s3_bucket.frontend
# - aws_cloudfront_distribution.frontend
# - aws_cloudfront_origin_access_control.frontend
# - aws_cloudfront_response_headers_policy.security_headers
# - aws_iam_role.github_actions
# - aws_iam_role_policy.github_actions
# - (possibly) aws_iam_openid_connect_provider.github_actions
```

**Review the plan carefully** to ensure:
- S3 bucket name is correct (`finedskywalker-client-dev`)
- Region is `us-east-1`
- All resources are properly configured

### Step 5: Apply Terraform Configuration

```bash
# Apply the configuration
terraform apply

# Type 'yes' when prompted

# This will take 5-10 minutes (CloudFront is slow to provision)
```

**Expected output:**
```
Apply complete! Resources: 7 added, 0 changed, 0 destroyed.

Outputs:

cloudfront_distribution_id = "E1234567890ABC"
cloudfront_distribution_url = "https://d1234567890abc.cloudfront.net"
github_actions_role_arn = "arn:aws:iam::123456789012:role/github-actions-finedskywalker-client-dev"
s3_bucket_name = "finedskywalker-client-dev"
response_headers_policy_id = "a1234567-89ab-cdef-0123-456789abcdef"
```

**Save these outputs!** You'll need them for GitHub configuration.

### Step 6: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Name | Value | Description |
|------|-------|-------------|
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/github-actions-finedskywalker-client-dev` | From Terraform output `github_actions_role_arn` |
| `NEXT_PUBLIC_API_URL` | `https://your-api-id.execute-api.us-east-1.amazonaws.com` | Your backend API URL |

**Screenshot guide:**
```
Settings → Secrets and variables → Actions → New repository secret

Secret 1:
Name: AWS_ROLE_ARN
Secret: arn:aws:iam::123456789012:role/github-actions-finedskywalker-client-dev

Secret 2:
Name: NEXT_PUBLIC_API_URL
Secret: https://your-api-id.execute-api.us-east-1.amazonaws.com
```

### Step 7: Test Manual Deployment

Before relying on CI/CD, test a manual deployment:

```bash
# Build the application
cd .. # back to project root
npm run build

# Verify build output
ls -la out/

# Manually sync to S3 (using AWS credentials)
aws s3 sync out/ s3://finedskywalker-client-dev/ --delete

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(terraform -chdir=terraform output -raw cloudfront_distribution_id)

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# Get CloudFront URL
terraform -chdir=terraform output cloudfront_distribution_url
```

Visit the CloudFront URL in your browser. You should see the "Hello World" page!

### Step 8: Test CI/CD Pipeline

```bash
# Make a small change to trigger deployment
echo "<!-- CI/CD test -->" >> src/app/page.tsx

# Commit and push
git add .
git commit -m "Test CI/CD pipeline"
git push origin main
```

**Monitor the deployment:**
1. Go to GitHub → **Actions** tab
2. Watch the "Deploy Frontend" workflow
3. Verify all jobs complete successfully:
   - ✅ Lint and Type Check
   - ✅ Build Next.js App
   - ✅ Deploy to AWS

### Step 9: Verify Deployment

After successful deployment, verify:

```bash
# Get CloudFront URL
cd terraform
CLOUDFRONT_URL=$(terraform output -raw cloudfront_distribution_url)
echo "CloudFront URL: $CLOUDFRONT_URL"

# Test with curl
curl -I $CLOUDFRONT_URL
```

**Check in browser:**
1. Open CloudFront URL
2. Open DevTools → Network tab
3. Reload page
4. Click on the main document request
5. Check **Response Headers** for:
   - `content-security-policy` (should include your backend URL)
   - `x-frame-options: DENY`
   - `x-content-type-options: nosniff`
   - `strict-transport-security`

### Step 10: Verify CSP Security

Test that CSP is working correctly:

```javascript
// Open browser console on your CloudFront URL
// Try to make a request to an unauthorized domain (should fail)
fetch('https://evil.com/data')
  .then(r => console.log('❌ CSP Failed - request allowed'))
  .catch(e => console.log('✅ CSP Working - request blocked:', e))

// Try to make a request to your backend (should succeed)
fetch('<enter backend api url>')
  .then(r => console.log('✅ Backend request allowed:', r.status))
  .catch(e => console.log('Response:', e))
```

## 🎉 Setup Complete!

Your frontend is now deployed and accessible via CloudFront!

## 📊 Next Steps

### Add Custom Domain (Optional)

To use a custom domain like `app.finedskywalker.com`:

1. **Register domain** in Route53 (or use existing domain)
2. **Request SSL certificate** in ACM (us-east-1 region for CloudFront)
3. **Update Terraform** to add:
   ```hcl
   # In s3-cloudfront.tf
   viewer_certificate {
     acm_certificate_arn = "arn:aws:acm:us-east-1:..."
     ssl_support_method  = "sni-only"
     minimum_protocol_version = "TLSv1.2_2021"
   }
   
   aliases = ["app.finedskywalker.com"]
   ```
4. **Create Route53 record** pointing to CloudFront distribution
5. **Apply Terraform changes**

### Monitor Costs

```bash
# Check S3 storage costs
aws s3 ls s3://finedskywalker-client-dev --summarize --recursive

# Monitor CloudFront metrics in AWS Console
# CloudFront → Your Distribution → Monitoring
```

### Multiple Environments

To create staging/production environments:

```bash
# Create terraform workspaces
terraform workspace new staging
terraform workspace new prod

# Or use separate tfvars files
terraform apply -var-file="prod.tfvars"
```

## 🔧 Troubleshooting

### Issue: Terraform state locking error

**Error:** `Error acquiring the state lock`

**Solution:**
```bash
# Check DynamoDB for stuck locks
aws dynamodb scan --table-name finedskywalker-terraform-locks

# Force unlock (only if you're sure no other terraform is running)
terraform force-unlock <LOCK_ID>
```

### Issue: CloudFront serves 403 errors

**Cause:** S3 bucket policy or OAC misconfigured

**Solution:**
```bash
# Verify S3 bucket policy
aws s3api get-bucket-policy --bucket finedskywalker-client-dev

# Re-apply Terraform
terraform apply -replace=aws_s3_bucket_policy.frontend
```

### Issue: GitHub Actions fails with permission denied

**Cause:** OIDC role not configured correctly

**Solution:**
1. Verify `AWS_ROLE_ARN` secret is correct in GitHub
2. Check trust policy in IAM role includes your repository
3. Ensure OIDC provider thumbprints are current

### Issue: CSP blocks legitimate requests

**Solution:** Update CSP in `terraform/s3-cloudfront.tf`:
```hcl
content_security_policy = join("; ", [
  "connect-src 'self' ${var.backend_api_url} https://another-allowed-domain.com",
  # ... other directives
])
```

Then apply:
```bash
terraform apply
```

### Issue: Build fails with memory error

**Solution:** Increase Node.js memory:
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/cloudfront/)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

## 💡 Tips

1. **Always run `terraform plan`** before `apply` to review changes
2. **Enable CloudWatch alarms** for unusual traffic patterns
3. **Regularly update dependencies:** `npm audit fix`
4. **Monitor AWS costs** in Cost Explorer
5. **Use git tags** for production releases
6. **Enable S3 versioning** for easy rollbacks (already configured)

---

**Need help?** Open a GitHub issue or contact the team.

