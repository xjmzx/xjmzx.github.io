# Deployment Guide

This document explains how to deploy the Lightning Node Setup Guides to GitHub Pages with a custom domain.

## Prerequisites

- ✅ Repository renamed to `xjmzx.github.io`
- ✅ Custom domain `ln.fizx.uk` configured in GitHub repository settings
- ✅ CNAME DNS record pointing `ln.fizx.uk` to `xjmzx.github.io`
- ✅ CNAME file in `/public/CNAME` containing `ln.fizx.uk`

## GitHub Pages Configuration

### 1. Enable GitHub Pages

1. Go to your repository settings: `https://github.com/xjmzx/xjmzx.github.io/settings/pages`
2. Under "Build and deployment":
   - **Source**: GitHub Actions (should be automatically selected)
3. Under "Custom domain":
   - Enter: `ln.fizx.uk`
   - Click "Save"
4. Wait for DNS check to complete (may take a few minutes)
5. Enable "Enforce HTTPS" once DNS check passes

### 2. DNS Configuration

Ensure your DNS provider has these records for `ln.fizx.uk`:

```
Type: CNAME
Name: ln.fizx.uk (or @ if at root, or subdomain prefix)
Value: xjmzx.github.io
TTL: 3600 (or automatic)
```

**Note:** DNS changes can take up to 24-48 hours to propagate globally, but usually take only a few minutes.

### 3. Verify DNS Configuration

Check if DNS is configured correctly:

```bash
# Check CNAME record
dig ln.fizx.uk CNAME

# Should return:
# ln.fizx.uk.   3600   IN   CNAME   xjmzx.github.io.
```

Or use online tools:
- https://dnschecker.org
- https://whatsmydns.net

## Deployment Process

### Automatic Deployment (Recommended)

Every push to the `main` branch triggers automatic deployment:

```bash
# Make your changes
git add .
git commit -m "Your changes"
git push origin main

# GitHub Actions will automatically:
# 1. Install dependencies
# 2. Build the project
# 3. Deploy to GitHub Pages
# 4. Site will be live at ln.fizx.uk in ~1-2 minutes
```

### Manual Deployment Trigger

You can manually trigger deployment from GitHub:

1. Go to: `https://github.com/xjmzx/xjmzx.github.io/actions`
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" → "Run workflow"

### Check Deployment Status

1. Go to: `https://github.com/xjmzx/xjmzx.github.io/actions`
2. Click on the latest workflow run
3. Monitor the "deploy" job progress
4. Once complete (green checkmark), site is live

## Troubleshooting

### DNS Not Resolving

**Problem:** `ln.fizx.uk` doesn't load or shows wrong site

**Solution:**
1. Verify CNAME record in DNS: `dig ln.fizx.uk CNAME`
2. Check DNS propagation: https://dnschecker.org
3. Clear browser cache / try incognito mode
4. Wait up to 24 hours for DNS propagation

### 404 Errors on GitHub Pages

**Problem:** Site loads but shows 404

**Solution:**
1. Check `public/CNAME` file exists and contains `ln.fizx.uk`
2. Verify custom domain in repository settings matches `ln.fizx.uk`
3. Check GitHub Actions completed successfully
4. Ensure `dist/404.html` was created during build

### Build Failures

**Problem:** GitHub Actions workflow fails

**Solution:**
1. Check workflow logs: `https://github.com/xjmzx/xjmzx.github.io/actions`
2. Look for error messages in the build step
3. Common issues:
   - Missing dependencies: Check `package.json`
   - TypeScript errors: Run `npm run test` locally
   - Build errors: Run `npm run build` locally

### HTTPS Not Available

**Problem:** Can't enable "Enforce HTTPS"

**Solution:**
1. Wait for DNS check to complete (can take 24 hours)
2. Verify CNAME DNS record is correct
3. Check that GitHub detected your custom domain
4. Try removing and re-adding custom domain in settings

### Site Shows Old Content

**Problem:** Deployed site shows outdated content

**Solution:**
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check GitHub Actions completed recently
4. Verify `main` branch has latest commits

## Monitoring

### Check Site Status

- **Live Site:** https://ln.fizx.uk
- **GitHub Actions:** https://github.com/xjmzx/xjmzx.github.io/actions
- **Repository Settings:** https://github.com/xjmzx/xjmzx.github.io/settings/pages

### Deployment Times

- **Build Time:** ~1-2 minutes
- **DNS Propagation:** 5 minutes - 24 hours (usually < 1 hour)
- **GitHub Pages Update:** ~30 seconds after build completes
- **Total (after first setup):** ~2-3 minutes per deployment

## Best Practices

1. **Always test locally before pushing:**
   ```bash
   npm run build
   # Check dist folder
   ```

2. **Use meaningful commit messages:**
   ```bash
   git commit -m "Add troubleshooting section to LND guide"
   ```

3. **Monitor deployments:**
   - Watch GitHub Actions after pushing
   - Verify changes on live site

4. **Branch protection (optional):**
   - Set up pull requests for major changes
   - Require review before merging to `main`

## Repository Settings Summary

Current configuration:
- **Repository:** `xjmzx/xjmzx.github.io`
- **Branch:** `main`
- **Custom Domain:** `ln.fizx.uk`
- **HTTPS:** Enabled (after DNS verification)
- **Build:** GitHub Actions
- **Workflow:** `.github/workflows/deploy.yml`

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Verify DNS configuration
3. Review this deployment guide
4. Check GitHub Pages documentation: https://docs.github.com/pages

---

**Last Updated:** 2026-02-01
