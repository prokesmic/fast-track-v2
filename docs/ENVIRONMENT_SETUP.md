# Environment Setup Guide

This guide explains how to set up Development, Staging (QA), and Production environments for Fast-Track.

## Overview

| Environment | Branch | Database | Purpose |
|-------------|--------|----------|---------|
| **Development** | `develop` | Dev database | Feature development, testing |
| **Staging/QA** | `staging` | Production database | Pre-production testing with real data |
| **Production** | `main` | Production database | Live users |

## Step 1: Create Development Database in Neon

1. Go to [Neon Console](https://console.neon.tech)
2. Open your project: `hidden-cake-82302964`
3. Create ONE new branch for development:

### Create Development Branch
- Click **Branches** → **Create Branch**
- Name: `development`
- Parent: `main`
- This creates an isolated copy for testing

4. Copy the connection string:
   - Click on the new `development` branch
   - Go to **Connection Details**
   - Copy the **Connection string** (pooled version ending in `-pooler`)

## Step 2: Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com) → Project: `fast-track-v2`
2. Navigate to **Settings** → **Environment Variables**

### Current Variables (keep as-is for Production)

Your existing `DATABASE_URL` and other variables are already set for Production. Don't change them.

### Add Development Database Override

1. Find `DATABASE_URL` (or `POSTGRES_URL`) in the list
2. Click on it to expand
3. Click **Add Override** or look for branch-specific settings
4. Add a **Preview** override for branch `develop`:
   - Branch: `develop`
   - Value: `postgresql://...` (your NEW development branch connection string from Neon)

### Add Environment Indicator Variable

Add a new variable `EXPO_PUBLIC_APP_ENV`:

| Environment | Value |
|-------------|-------|
| Production | `production` |
| Preview | `staging` |
| Development | `development` |

Or add branch overrides:
- Branch `develop` → `development`
- Branch `staging` → `staging`
- Default Preview → `staging`

## Step 3: Configure Branch Deployments

In Vercel **Settings** → **Git**:

1. **Production Branch**: `main`
2. Ensure **Preview Deployments** is enabled for all branches

### Custom Domains (Optional)

In **Settings** → **Domains**, you can add:
- `dev.fast-track.app` → branch: `develop`
- `staging.fast-track.app` → branch: `staging`
- `fast-track.app` → branch: `main` (production)

## Step 4: Set Up Branch Protection (GitHub)

In your GitHub repo settings:

1. Go to **Settings** → **Branches**
2. Add branch protection rules:

### For `main` (Production)
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date

### For `staging`
- Require pull request reviews (optional)
- Require status checks to pass

## Workflow

### Feature Development
```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature

# Work on feature...
git add .
git commit -m "feat: add my feature"
git push -u origin feature/my-feature

# Create PR to develop branch
```

### Promote to Staging
```bash
# After PR merged to develop, promote to staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# Vercel automatically deploys staging preview
```

### Deploy to Production
```bash
# After QA approval
git checkout main
git pull origin main
git merge staging
git push origin main

# Vercel automatically deploys to production
```

## Local Development

For local development, use the development database:

```bash
# In .env.local
DATABASE_URL="postgresql://...development-branch..."
EXPO_PUBLIC_APP_ENV=development
```

Run locally:
```bash
npm start
```

## Environment Indicators

The app shows visual indicators for non-production environments:

- **DEV badge** (red) - Development environment
- **QA badge** (amber) - Staging/QA environment
- No badge - Production

The footer in Profile screen also shows the environment name.

## Troubleshooting

### Database Not Switching
- Verify environment variables in Vercel dashboard
- Check branch overrides are configured correctly
- Redeploy after changing environment variables

### Wrong Environment Badge
- Ensure `EXPO_PUBLIC_APP_ENV` is set correctly
- Clear cache and redeploy: `vercel --force`

### Migrations
When you need to run migrations:
```bash
# Development database
DATABASE_URL="<dev-branch-url>" npm run db:push

# Production database (also used by staging)
DATABASE_URL="<prod-url>" npm run db:push
```
