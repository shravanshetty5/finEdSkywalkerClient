# finEdSkywalker Client

> **Stock Analysis Platform** - Modern frontend application for comprehensive financial analysis and education.

[![Deploy Frontend](https://github.com/shravanshetty5/finEdSkywalkerClient/actions/workflows/deploy.yml/badge.svg)](https://github.com/shravanshetty5/finEdSkywalkerClient/actions/workflows/deploy.yml)

## 🚀 Overview

finEdSkywalker Client is a Next.js 15 application providing a modern, responsive interface for stock analysis. Built with TypeScript and React, it offers real-time financial data visualization and analysis tools.

**Architecture:**
- **Frontend Framework:** Next.js 15 with App Router
- **Rendering:** Client-Side Rendering (CSR) with static export
- **Hosting:** AWS S3 + CloudFront CDN
- **Infrastructure:** Terraform (Infrastructure as Code)
- **CI/CD:** GitHub Actions with OIDC authentication

## 📋 Prerequisites

- **Node.js:** v20.x or later
- **npm:** v10.x or later
- **Terraform:** v1.0 or later
- **AWS CLI:** v2.x configured with appropriate credentials
- **Git:** For version control

## 🏗️ Project Structure

```
finEdSkywalkerClient/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   └── components/            # Reusable components (future)
├── terraform/
│   ├── main.tf                # Terraform main configuration
│   ├── variables.tf           # Input variables
│   ├── outputs.tf             # Output values
│   ├── s3-cloudfront.tf       # S3 and CloudFront resources
│   └── oidc.tf                # GitHub Actions OIDC setup
├── public/                    # Static assets
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

## 🛠️ Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/shravanshetty5/finEdSkywalkerClient.git
cd finEdSkywalkerClient
```

### 2. Install Dependencies
```bash
nvm use
```

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp env.example .env.local
```

Edit `.env.local` and configure your backend API URL

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
```

Static files will be generated in the `out/` directory.

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build production-ready static export |
| `npm start` | Start production server (not used with static export) |
| `npm run lint` | Run ESLint to check code quality |
| `npm run type-check` | Run TypeScript type checking without emitting files |

## ☁️ Infrastructure Setup

### Initial Terraform Deployment

See [SETUP.md](./SETUP.md) for detailed infrastructure setup instructions.

**Quick summary:**

```bash
cd terraform

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply infrastructure
terraform apply
```

### Infrastructure Components

- **S3 Bucket:** Static website hosting with versioning
- **CloudFront:** Global CDN with cost optimizations
  - PriceClass_100 (North America & Europe only)
  - Automatic compression (Gzip + Brotli)
  - Aggressive caching (1-year TTL for static assets)
- **Origin Access Control (OAC):** Secure S3 access
- **Response Headers Policy:** CSP security headers
- **IAM Role:** GitHub Actions OIDC for deployments

## 🔐 Security Features

### Content Security Policy (CSP)

CloudFront enforces strict CSP headers to protect against XSS attacks:

- **connect-src:** Only allows API calls to finEdSkywalkerClient backend
- **default-src:** Restricts resources to same origin
- **script-src/style-src:** Allows inline scripts/styles (required for Next.js)
- **Additional headers:** X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy

### OIDC Authentication

GitHub Actions uses OpenID Connect (OIDC) for secure AWS authentication without storing long-lived credentials.

## 🚢 Deployment

### Automated Deployment (CI/CD)

Deployments are automatically triggered on push to `main`/`master` branch:

1. **Lint & Type Check:** Validates code quality
2. **Build:** Compiles Next.js app to static files
3. **Deploy:** Syncs files to S3 and invalidates CloudFront cache

### Manual Deployment

```bash
# Build the application
npm run build

# Sync to S3 (requires AWS credentials)
aws s3 sync out/ s3://finedskywalker-client-dev/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

## 💰 Cost Optimization

Our infrastructure is designed to minimize AWS costs:

| Optimization | Monthly Savings | Details |
|--------------|-----------------|---------|
| **PriceClass_100** | ~50% on requests | Uses only NA & EU edge locations |
| **Aggressive Caching** | ~80% on origin requests | 1-year TTL for static assets, reduces S3 costs |
| **Automatic Compression** | ~70% on bandwidth | Gzip + Brotli compression reduces data transfer |
| **Minimal Headers** | ~10% on processing | Only necessary headers forwarded |

**Expected Costs:**
- **Free Tier (first 12 months):** 1TB transfer, 10M requests = $0/month for moderate traffic
- **After Free Tier:** ~$5-15/month for typical MVP usage
- **High Traffic (100K users):** ~$50-100/month (vs $200+ without optimizations)

## 🧪 Testing

### CSP Header Verification

After deployment, verify CSP headers in browser DevTools:

1. Open CloudFront URL
2. Open DevTools → Network tab
3. Check response headers for `content-security-policy`
4. Test that API calls to backend work
5. Verify calls to other domains are blocked

## 🔄 Dynamic Routes (SPA)

Client-side routing handles dynamic routes without server-side logic:

- `/stocks/AAPL` → Client fetches AAPL data from backend
- `/stocks/META` → Client fetches META data from backend

CloudFront serves `index.html` for all routes (404 → 200 redirect), then Next.js router takes over.

## 🔮 Future Enhancements

- [ ] Add Server-Side Rendering (SSR) with Lambda@Edge for SEO
- [ ] Implement custom domain with Route53 + ACM certificate
- [ ] Add comprehensive test suite (Jest + React Testing Library)
- [ ] Set up multiple environments (dev, staging, prod)
- [ ] Implement advanced analytics with CloudWatch
- [ ] Add WAF for DDoS protection

## 📚 Related Projects

- **Backend API:** [finEdSkywalker](https://github.com/shravanshetty5/finEdSkywalker) - Go Lambda backend with API Gateway

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues or questions:
- Open a GitHub issue
- Contact: [Your Email]

---

**Built with ❤️ using Next.js, React, and AWS**

