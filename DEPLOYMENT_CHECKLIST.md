# 🚀 Website2 → Render Deployment Checklist

## ✅ Pre-Deployment (Local)
- [x] App runs locally with `npm start`
- [x] All 4 apps work: Invoice, Report, Resume, TDS
- [x] `.env` files are gitignored
- [x] GitHub repo is up-to-date

## ⚙️ Render Setup (Do This Now)

### 1️⃣ Create Render Account
- [ ] Go to https://render.com
- [ ] Sign up with GitHub
- [ ] Authorize Render to access your repos

### 2️⃣ Create Web Service
- [ ] Click "New +" → "Web Service"
- [ ] Select `maheshuser3122/website2` repository
- [ ] Set name to `mcharv-website2`
- [ ] Runtime: Node
- [ ] Build: `npm install && npm run install:all`
- [ ] Start: `npm start`
- [ ] Plan: Free (for testing) or Starter ($7/month for production)

### 3️⃣ Add Environment Variables (Critical!)
Add these in Render dashboard → Environment tab:
```
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mcharv.techlabs.pvtltd@gmail.com
SMTP_PASS=<your-gmail-app-password>
EMAIL_USER=mcharv.techlabs.pvtltd@gmail.com
SMTP_SECURE=false
```

**⚠️ Important:** 
- Use Gmail App Password, not your account password
- Create at: https://myaccount.google.com/apppasswords

### 4️⃣ Deploy
- [ ] Click "Create Web Service"
- [ ] Wait 5-10 minutes for deployment
- [ ] Check logs for errors
- [ ] Note your Render URL: `https://mcharv-website2.onrender.com`

## 🌐 DNS Configuration (Hostinger)

### 5️⃣ Update DNS Records
1. Log in to Hostinger hPanel
2. Go to **Domains** → **mcharvtechlabs.com**
3. Click **Manage Domain** → **DNS**
4. **DELETE or DISABLE** all existing records pointing to Website Builder
5. **ADD new CNAME records:**

| Name | Type | Value |
|------|------|-------|
| @ | CNAME | mcharv-website2.onrender.com |
| www | CNAME | mcharv-website2.onrender.com |

6. Click **Save**
7. Wait 15-30 minutes for DNS propagation

**Check Status:** https://dnschecker.org (enter mcharvtechlabs.com)

## ✨ Verification (After DNS Propagates)

- [ ] Visit https://mcharvtechlabs.com - loads your admin portal
- [ ] Click each app tile - all load in modals
- [ ] Test invoice generation - email sends
- [ ] Test responsive design on mobile
- [ ] HTTPS works (lock icon visible)
- [ ] No console errors in browser DevTools

## 🎯 After Deployment

### Optional: Upgrade to Starter Plan
- Free plan spins down after 15 mins (slow first request)
- Starter ($7/month) keeps app running 24/7
- Render dashboard → Service settings → Change plan

### Set Up Monitoring (Optional)
- Use UptimeRobot.com to ping app every 15 mins
- Keeps free tier from spinning down
- Free account includes unlimited monitors

### Backup & Updates
- Your app auto-deploys when you push to GitHub
- Old versions are saved in Render (can rollback)
- Update dependencies locally, push to GitHub

## 📞 Need Help?

**If deployment fails:**
1. Check Render logs (Deployment logs tab)
2. Verify all env vars are set
3. Ensure GitHub repo has all latest changes
4. Check Invoice backend .env is correct

**If domain doesn't work:**
1. Wait 30 mins (DNS propagation)
2. Check DNS records on Hostinger (should see CNAME to render.com)
3. Use dnschecker.org to verify propagation
4. Clear browser cache (Ctrl+Shift+Delete)

**Invoice not sending:**
- Verify Gmail app password (not account password)
- Check SMTP credentials in Render env vars
- Enable "Less secure apps" in Gmail if using account password

---

**Timeline:**
- Render deployment: 5-10 minutes
- DNS propagation: 15-30 minutes
- **Total time: ~45 minutes** ⏱️
