# Testing GitHub Actions Locally

This guide shows you how to test your CI/CD pipeline locally before pushing to GitHub.

## Using `act` (Most Accurate)

`act` runs GitHub Actions in Docker containers locally - exactly like GitHub does.

### Step 1: Install act

```bash
# macOS
brew install act

# Or download from: https://github.com/nektos/act
```

### Step 2: First-time setup

When you run `act` for the first time, it will ask which Docker image to use:
- Choose **Medium** (recommended)

### Step 3: Create secrets file

```bash
cd /Users/sshetty/Workspace/PersonalProject/finEdSkywalkerClient

# Create .secrets file
cat > .secrets << 'EOF'
NEXT_PUBLIC_API_URL=https://wahujpr14a.execute-api.us-east-1.amazonaws.com
AWS_ROLE_ARN=arn:aws:iam::139306696183:role/github-actions-finedskywalker-client-dev
EOF

# Add to .gitignore
echo ".secrets" >> .gitignore
```

### Step 4: Run workflows

```bash
# List all jobs
act -l

# Run just the build job (no deployment)
act -j build --secret-file .secrets

# Run the entire workflow (including deploy)
act push --secret-file .secrets

# Run with verbose output
act -j build --secret-file .secrets -v

# Dry run (see what would happen)
act -j build --secret-file .secrets --dryrun
```

### Step 5: Common act commands

```bash
# Run on specific event
act pull_request --secret-file .secrets

# Run specific job
act -j build --secret-file .secrets

# Use specific platform
act -j build --container-architecture linux/amd64

# Debug mode (very verbose)
act -j build --secret-file .secrets -v
```

**Benefits:**
- Exact simulation of GitHub Actions environment
- Tests Docker container behavior
- Validates secrets handling
- Can test different platforms

**Limitations:**
- Requires Docker Desktop running
- Slower than manual testing
- Won't work with OIDC (AWS authentication) - will fail at deploy step

---

## Option 3: Test Individual Steps

### Test npm ci timeout issue specifically:

```bash
cd /Users/sshetty/Workspace/PersonalProject/finEdSkywalkerClient

# Remove node_modules
rm -rf node_modules

# Test npm ci with same flags as CI
time npm ci --prefer-offline --no-audit --loglevel verbose

# Check if it completes under 5 minutes
```

### Test build with production environment:

```bash
# Set production env var
export NEXT_PUBLIC_API_URL="https://wahujpr14a.execute-api.us-east-1.amazonaws.com"

# Build
npm run build

# Check output
ls -la out/
cat out/index.html | grep "wahujpr14a"  # Verify API URL is baked in
```

### Test caching behavior:

```bash
# First build (no cache)
rm -rf .next node_modules
time npm ci && npm run build

# Second build (with cache)
time npm run build

# Compare times - should be much faster
```

---

## Comparison

| Method | Speed | Accuracy | Docker Required | Best For |
|--------|-------|----------|-----------------|----------|
| **Manual Script** | ⚡ Fast | 🟡 Good | ❌ No | Quick debugging, npm issues |
| **act** | 🐌 Slow | ✅ Exact | ✅ Yes | Full workflow validation |
| **Individual Steps** | ⚡⚡ Very Fast | 🟡 Partial | ❌ No | Specific issue debugging |

---

## Recommended Workflow

### 1. Quick Check (Before Commit)
```bash
./test-ci-locally.sh
```

### 2. Full Validation (Before Push)
```bash
act -j build --secret-file .secrets
```

### 3. Debug Specific Issue
```bash
# If npm ci times out:
rm -rf node_modules
time npm ci --loglevel verbose

# If build fails:
npm run build
```

---

## Troubleshooting

### "act" not found
```bash
brew install act
```

### Docker errors with act
```bash
# Make sure Docker Desktop is running
open -a Docker

# Wait for Docker to start, then try again
act -j build --secret-file .secrets
```

### npm ci works locally but fails in CI
This could be:
- Network issues in GitHub Actions (transient)
- Different npm/node versions
- Registry timeout issues

**Fix:** Check the GitHub Actions logs for the verbose output we added.

### Build works but site doesn't work
```bash
# Test the built site locally
npx serve out

# Visit http://localhost:3000
# Open browser console and check for API calls
```

---

## Quick Reference

```bash
# Test everything locally
./test-ci-locally.sh

# Test with act (requires Docker)
act -j build --secret-file .secrets

# Test npm ci specifically
rm -rf node_modules && time npm ci --loglevel verbose

# Test build
export NEXT_PUBLIC_API_URL="https://your-api.com"
npm run build

# View logs
tail -f npm-ci-output.log
```

---

## Next Steps

1. **Run the manual test first:**
   ```bash
   ./test-ci-locally.sh
   ```

2. **If npm ci fails locally**, you've found the issue! Fix it.

3. **If npm ci works locally**, install `act` and test:
   ```bash
   brew install act
   act -j build --secret-file .secrets
   ```

4. **If both work locally but fail in CI**, it's likely:
   - Network/registry issues (transient)
   - GitHub Actions runner issues

Good luck! The verbose logging in the workflow should help identify the issue. 🚀

