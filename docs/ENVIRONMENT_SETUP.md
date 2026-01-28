# Environment Setup Guide

This guide explains how to set up Development, Staging (QA), and Production environments for Fast-Track.

## Overview

| Environment | Branch | Purpose | Domain |
|-------------|--------|---------|--------|
| **Development** | `develop` | Feature development, testing | `*-git-develop-*.vercel.app` |
| **Staging/QA** | `staging` | Pre-production testing | `*-git-staging-*.vercel.app` |
| **Production** | `main` | Live users | `fast-track-v2.vercel.app` |

## Step 1: Create Database Branches in Neon

1. Go to [Neon Console](https://console.neon.tech)
2. Open your project: `hidden-cake-82302964`
3. Create two new branches:

### Create Development Branch
- Click **Branches** → **Create Branch**
- Name: `development`
- Parent: `main`
- This creates an isolated copy of your production database

### Create Staging Branch
- Click **Branches** → **Create Branch**
- Name: `staging`
- Parent: `main`
- This creates another isolated copy for QA testing

4. For each branch, copy the connection string:
   - Click on the branch
   - Go to **Connection Details**
   - Copy the **Connection string** (with pooling)

## Step 2: Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com) → Project: `fast-track-v2`
2. Navigate to **Settings** → **Environment Variables**

### Add Environment-Specific Variables

For each variable, you'll set different values per environment:

#### DATABASE_URL / POSTGRES_URL

| Environment | Value |
|-------------|-------|
| Production | `postgresql://...@ep-wild-union-agsda7da-pooler...` (current) |
| Preview | `postgresql://...@ep-xxx-development-pooler...` (dev branch) |
| Development | `postgresql://...@ep-xxx-development-pooler...` (dev branch) |

#### EXPO_PUBLIC_APP_ENV

| Environment | Value |
|-------------|-------|
| Production | `production` |
| Preview | (leave empty - will be set by branch) |
| Development | `development` |

### Branch-Specific Preview Settings

To give staging its own database:

1. In Vercel, go to **Settings** → **Environment Variables**
2. Click on your `DATABASE_URL` variable
3. Under **Preview**, click **Add Branch Override**
4. Add branch: `staging` with the staging database URL
5. Add branch: `develop` with the development database URL

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
# For each environment's database
DATABASE_URL="<env-specific-url>" npm run db:push
```
