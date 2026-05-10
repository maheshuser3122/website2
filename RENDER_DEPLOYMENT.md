# Deploy Website2 to Render with mcharvtechlabs.com

## 🚀 Step-by-Step Deployment Guide

### Step 1: Create Render Account & Connect GitHub
1. Go to https://render.com (click "Get Started")
2. Sign up with GitHub account
3. Authorize Render to access your GitHub repos

### Step 2: Create New Web Service on Render
1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Select repository: `maheshuser3122/website2`
3. Configure as follows:

| Setting | Value |
|---------|-------|
| **Name** | `mcharv-website2` |
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run install:all` |
| **Start Command** | `npm start` |
| **Plan** | `Free` (or Starter for better reliability) |

4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `SMTP_HOST`: `smtp.gmail.com` (from .env)
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `mcharv.techlabs.pvtltd@gmail.com`
   - `SMTP_PASS`: (your Gmail app password)
   - `EMAIL_USER`: `mcharv.techlabs.pvtltd@gmail.com`
   - `SMTP_SECURE`: `false`

5. Click **"Create Web Service"**

### Step 3: Wait for Deployment
- Render will automatically:
  - Clone your GitHub repo
  - Run build commands
  - Start your app
  - Deploy to `https://mcharv-website2.onrender.com`
- Check deployment logs (should take 5-10 minutes)

### Step 4: Connect Your Domain (mcharvtechlabs.com)

#### Option A: Using Render's Domain Management
1. In your Render service → Settings → Custom Domain
2. Add domain: `mcharvtechlabs.com`
3. Note the CNAME value Render provides

#### Option B: Using Hostinger's DNS (Recommended)
1. Go to **Hostinger hPanel** → **Domains** → **mcharvtechlabs.com**
2. Click **"Manage Domain"** → **"DNS"**
3. Delete or comment out existing DNS records
4. Add new CNAME record:
   - **Name**: `@` (root domain)
   - **Type**: `CNAME`
   - **Value**: `mcharv-website2.onrender.com`

   And for www:
   - **Name**: `www`
   - **Type**: `CNAME`
   - **Value**: `mcharv-website2.onrender.com`

5. Save changes (DNS propagation takes 15-30 minutes)

### Step 5: Verify Deployment
After DNS propagates (15-30 min):
- Visit https://mcharvtechlabs.com
- Should load your Website2 admin portal
- Test all applications (Invoice, Report, Resume, TDS)

### Step 6: SSL Certificate
Render automatically provides SSL for custom domains. Once DNS propagates:
- HTTPS works automatically
- Redirect HTTP to HTTPS is automatic

## ⚠️ Important Notes

### Free Plan Limitations
- App spins down after 15 mins of inactivity
- First request after spin-down takes 30+ seconds
- 0.5GB RAM, limited storage
- For production, upgrade to **Starter Plan** ($7/month)

### To Fix Spin-Down Issues
1. Upgrade to **Starter** plan ($7/month) - won't spin down
2. Or use a monitoring service like **UptimeRobot** to ping your app every 15 mins

### Environment Variables on Render
- All .env variables must be set in Render dashboard
- Don't commit `.env` to GitHub for security
- Update variables if credentials change

### Invoice Generation
- Gmail SMTP credentials required
- Enable "Less secure app access" OR use Gmail App Password
- Recommended: Use Gmail App Password for security

### GitHub Auto-Deploy
- When you push to `main`/`master` branch, Render auto-deploys
- Monitor deployments in Render dashboard

## 🔗 Useful Links
- **Render Dashboard**: https://dashboard.render.com
- **Your Deployment**: https://mcharv-website2.onrender.com
- **Domain Configuration**: https://mcharvtechlabs.com

## ❓ Troubleshooting

### App not loading after domain change?
- Wait 30 minutes for DNS propagation
- Clear browser cache (Ctrl+Shift+Delete)
- Check Render logs for errors

### Invoice sending fails?
- Verify SMTP credentials in Render env vars
- Check Gmail app password is correct
- Ensure sender email is authorized in Gmail

### Apps not loading in iframe?
- Check browser console for CORS errors
- Verify all proxy routes in server/app.js
- Test with direct URLs first

## 📞 Support
For issues, check:
1. Render dashboard logs
2. Browser console errors
3. Network tab in DevTools
4. DNS propagation status (dnschecker.org)
