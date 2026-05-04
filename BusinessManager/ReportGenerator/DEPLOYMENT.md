# Deployment Guide

## Prerequisites

- Node.js 16+
- npm or yarn
- Docker (optional)
- Git

## Local Deployment

### 1. Build
```bash
npm install
npm run build
```

### 2. Preview
```bash
npm run preview
```

Open http://localhost:3000

---

## Vercel Deployment

### 1. Connect Repository
- Sign up at [vercel.com](https://vercel.com)
- Connect GitHub repository

### 2. Configure
- Framework: Vite
- Build command: `npm run build`
- Output folder: `dist`
- Environment: Add if needed

### 3. Deploy
- Push to main branch
- Vercel auto-deploys

---

## Netlify Deployment

### 1. Connect Site
```bash
npm install -g netlify-cli
netlify init
```

### 2. Configure
- Build command: `npm run build`
- Publish directory: `dist`

### 3. Deploy
```bash
netlify deploy --prod
```

---

## Docker Deployment

### 1. Build Image
```bash
docker build -t report-generator .
```

### 2. Run Container
```bash
docker run -p 3000:3000 report-generator
```

### 3. Docker Compose
```bash
docker-compose up
```

---

## Azure Deployment

### Option 1: Static Web App
```bash
az staticwebapp create \
  --name report-generator \
  --resource-group mygroup \
  --source . \
  --build-folder dist
```

### Option 2: App Service
```bash
az webapp deployment source config-zip \
  --resource-group mygroup \
  --name report-generator \
  --src dist.zip
```

---

## AWS Deployment

### S3 + CloudFront
```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://my-bucket/

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id ID \
  --paths "/*"
```

---

## Environment Configuration

### Production .env
```
VITE_API_URL=https://api.example.com
VITE_SHAREPOINT_SITE_URL=https://tenant.sharepoint.com/sites/site
VITE_LOG_LEVEL=warn
```

### CI/CD Variables
Set in your deployment platform:
- `VITE_API_URL`
- `VITE_SHAREPOINT_*`
- `NODE_ENV=production`

---

## Monitoring & Logging

### Application Monitoring
- Use Sentry for error tracking
- New Relic for performance
- LogRocket for session replay

### Setup Sentry
```bash
npm install @sentry/react
```

Configure in `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "YOUR_DSN",
  environment: "production"
})
```

---

## Scaling

### For High Traffic
- Use CDN (CloudFlare, AWS CloudFront)
- Enable gzip compression
- Implement rate limiting
- Scale backend API

### For Large Teams
- Enable user authentication
- Add team workspace
- Implement row-level security
- Use database replication

---

Generated for Production Use ✅
