# Quick Reference - finEdSkywalker Client

> **Fast commands and common tasks** - Keep this handy for day-to-day development.

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/shravanshetty5/finEdSkywalkerClient.git
cd finEdSkywalkerClient
npm install
cp env.example .env.local
npm run dev
```

## 📦 Common Commands

### Development
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run lint         # Run linter
npm run type-check   # Check TypeScript types
```

### Makefile Shortcuts
```bash
make help            # Show all available commands
make install         # Install dependencies
make dev             # Start development server
make build           # Build application
make deploy-manual   # Build and deploy to S3 + invalidate cache
make terraform-init  # Initialize Terraform
make terraform-plan  # Preview infrastructure changes
make terraform-apply # Apply infrastructure changes
```

## 🏗️ Infrastructure

### Terraform Quick Commands
```bash
cd terraform
terraform init                    # First time setup
terraform plan                    # Preview changes
terraform apply                   # Apply changes
terraform output                  # Show outputs
terraform output -raw cloudfront_distribution_url  # Get CloudFront URL
```

### Get Important Values
```bash
# CloudFront URL
terraform -chdir=terraform output -raw cloudfront_distribution_url

# Distribution ID
terraform -chdir=terraform output -raw cloudfront_distribution_id

# GitHub Actions Role ARN
terraform -chdir=terraform output -raw github_actions_role_arn

# S3 Bucket Name
terraform -chdir=terraform output -raw s3_bucket_name
```

## 🚢 Deployment

### Automatic (CI/CD)
```bash
git add .
git commit -m "Your changes"
git push origin main    # Triggers automatic deployment
```

### Manual Deployment
```bash
# Build
npm run build

# Deploy to S3
aws s3 sync out/ s3://finedskywalker-client-dev/ --delete

# Invalidate CloudFront
DIST_ID=$(terraform -chdir=terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

### Using Makefile
```bash
make deploy-manual   # Does all of the above
```

## 🔍 Debugging

### Check Build Output
```bash
npm run build
ls -la out/
cat out/index.html
```

### Test S3 Sync
```bash
aws s3 ls s3://finedskywalker-client-dev/ --recursive
```

### Check CloudFront Status
```bash
DIST_ID=$(terraform -chdir=terraform output -raw cloudfront_distribution_id)
aws cloudfront get-distribution --id $DIST_ID
```

### View CloudFront Logs
```bash
# Enable logging in s3-cloudfront.tf first, then:
aws s3 ls s3://your-cloudfront-logs-bucket/
```

### Test CSP Headers
```bash
CLOUDFRONT_URL=$(terraform -chdir=terraform output -raw cloudfront_distribution_url)
curl -I $CLOUDFRONT_URL | grep -i "content-security-policy"
```

## 🐛 Troubleshooting

### Clean Install
```bash
rm -rf node_modules .next out package-lock.json
npm install
npm run build
```

### Terraform State Lock
```bash
# View locks
aws dynamodb scan --table-name finedskywalker-terraform-locks

# Force unlock (use cautiously!)
terraform -chdir=terraform force-unlock <LOCK_ID>
```

### Cache Issues
```bash
# Clear CloudFront cache
DIST_ID=$(terraform -chdir=terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

# Clear local Next.js cache
rm -rf .next
npm run build
```

### GitHub Actions Failed
```bash
# Check logs at: https://github.com/shravanshetty5/finEdSkywalkerClient/actions

# Verify secrets
# GitHub → Settings → Secrets → Actions
# AWS_ROLE_ARN should be set

# Test AWS credentials locally
aws sts get-caller-identity
```

## 📊 Monitoring

### Check S3 Bucket Size
```bash
aws s3 ls s3://finedskywalker-client-dev --recursive --summarize --human-readable
```

### CloudFront Metrics
```bash
# Get request count (last 1 day)
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=$(terraform -chdir=terraform output -raw cloudfront_distribution_id) \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

### Estimated Costs
```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

## 🔐 Security

### Update CSP Policy
Edit `terraform/s3-cloudfront.tf`:
```hcl
content_security_policy = join("; ", [
  "connect-src 'self' ${var.backend_api_url} https://new-allowed-domain.com",
  # ...
])
```

Then apply:
```bash
terraform -chdir=terraform apply
```

### Rotate GitHub Actions Credentials
```bash
# Update OIDC thumbprints if needed
terraform -chdir=terraform apply -replace=aws_iam_openid_connect_provider.github_actions
```

## 🔄 Environment Variables

### Local Development
```bash
# Edit .env.local
NEXT_PUBLIC_API_URL=<enter local or prod backend api url>
```

### Production (GitHub Actions)
Set in `.github/workflows/deploy.yml`:
```yaml
env:
  NEXT_PUBLIC_API_URL: <enter backend api url>
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Homepage |
| `src/app/layout.tsx` | Root layout |
| `next.config.js` | Next.js config (static export) |
| `terraform/s3-cloudfront.tf` | S3 & CloudFront infrastructure |
| `terraform/oidc.tf` | GitHub Actions authentication |
| `.github/workflows/deploy.yml` | CI/CD pipeline |

## 🌐 URLs

```bash
# Local dev
http://localhost:3000

# CloudFront (production)
terraform -chdir=terraform output -raw cloudfront_distribution_url

# GitHub Actions
https://github.com/shravanshetty5/finEdSkywalkerClient/actions
```

## 💡 Pro Tips

1. **Use Makefile**: `make help` shows all available commands
2. **Watch mode**: `npm run dev` for hot reload during development
3. **Type safety**: Run `npm run type-check` before committing
4. **Cost monitoring**: Check AWS Cost Explorer monthly
5. **Git tags**: Tag production releases (`git tag v1.0.0`)
6. **Branch protection**: Enable in GitHub for main branch
7. **CloudFront cache**: Remember to invalidate after manual deploys

## 🆘 Emergency Commands

### Rollback Deployment
```bash
# List S3 versions
aws s3api list-object-versions --bucket finedskywalker-client-dev

# Rollback specific file
aws s3api copy-object \
  --copy-source finedskywalker-client-dev/index.html?versionId=<VERSION_ID> \
  --bucket finedskywalker-client-dev \
  --key index.html
```

### Disable CloudFront Distribution
```bash
DIST_ID=$(terraform -chdir=terraform output -raw cloudfront_distribution_id)
aws cloudfront get-distribution-config --id $DIST_ID > /tmp/dist-config.json
# Edit JSON to set "Enabled": false
aws cloudfront update-distribution --id $DIST_ID --if-match <ETAG> --distribution-config file:///tmp/dist-config.json
```

### Quick Health Check
```bash
CLOUDFRONT_URL=$(terraform -chdir=terraform output -raw cloudfront_distribution_url)
curl -s -o /dev/null -w "%{http_code}\n" $CLOUDFRONT_URL
# Should return: 200
```

---

**Keep this document updated as the project evolves!**

