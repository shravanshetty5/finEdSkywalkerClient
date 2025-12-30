.PHONY: help install dev build lint type-check clean deploy-manual terraform-init terraform-plan terraform-apply terraform-destroy

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development Commands
install: ## Install npm dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build Next.js application
	npm run build

lint: ## Run ESLint
	npm run lint

type-check: ## Run TypeScript type checking
	npm run type-check

clean: ## Clean build artifacts and dependencies
	rm -rf node_modules .next out
	npm install

# Deployment Commands
deploy-manual: build ## Build and manually deploy to S3
	@echo "Syncing to S3..."
	aws s3 sync out/ s3://finedskywalker-client-dev/ --delete
	@echo "Creating CloudFront invalidation..."
	@DIST_ID=$$(cd terraform && terraform output -raw cloudfront_distribution_id 2>/dev/null); \
	if [ -n "$$DIST_ID" ]; then \
		aws cloudfront create-invalidation --distribution-id $$DIST_ID --paths "/*"; \
	else \
		echo "Error: Could not get CloudFront distribution ID"; \
		exit 1; \
	fi
	@echo "✅ Deployment complete!"

# Terraform Commands
terraform-init: ## Initialize Terraform
	cd terraform && terraform init

terraform-plan: ## Show Terraform execution plan
	cd terraform && terraform plan

terraform-apply: ## Apply Terraform configuration
	cd terraform && terraform apply

terraform-destroy: ## Destroy Terraform resources (use with caution!)
	@echo "⚠️  WARNING: This will destroy all infrastructure!"
	@read -p "Are you sure? Type 'yes' to continue: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		cd terraform && terraform destroy; \
	else \
		echo "Aborted."; \
	fi

terraform-output: ## Show Terraform outputs
	cd terraform && terraform output

# Testing Commands
test-local: build ## Test the build locally
	@echo "Testing build output..."
	@if [ -d "out" ]; then \
		echo "✅ Build directory exists"; \
		ls -lh out/; \
	else \
		echo "❌ Build directory not found"; \
		exit 1; \
	fi

test-deployment: ## Test deployed site
	@echo "Testing deployment..."
	@URL=$$(cd terraform && terraform output -raw cloudfront_distribution_url 2>/dev/null); \
	if [ -n "$$URL" ]; then \
		echo "Testing $$URL"; \
		curl -I $$URL; \
	else \
		echo "Error: Could not get CloudFront URL"; \
		exit 1; \
	fi

