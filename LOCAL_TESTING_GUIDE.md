# Local Testing Guide - Website2 Production Build

## Quick Start

### Prerequisites
- Node.js v18+ installed
- npm installed
- All subapp backends available

### 1. Install Dependencies

```bash
# Install root dependencies (includes rate-limiting)
npm install

# Install all backend and frontend dependencies
npm run install:all

# Or individually:
cd apps/invoice-generator/backend && npm install && cd ../../../
cd apps/report-generator/backend && npm install && cd ../../../
cd apps/resume-builder/backend && npm install && cd ../../../
cd apps/tds-manager/backend && npm install && cd ../../../
cd apps/report-generator/frontend && npm install && cd ../../../..
```

### 2. Start Development Server

```bash
# Option A: Start main server only
npm start

# Option B: Start with auto-reload on file changes
npm run dev

# Option C: Start all backends together (requires concurrently)
npm run start:all-backends
```

### 3. Test in Browser

```
Dashboard: http://localhost:3000/
Admin: http://localhost:3000/admin
Admin Password: mcharv2025

Invoice Generator: http://localhost:3000/apps/invoice-generator
Report Generator: http://localhost:3000/apps/report-generator
Resume Builder: http://localhost:3000/apps/resume-builder
TDS Manager: http://localhost:3000/apps/tds-manager
```

---

## Feature Testing Checklist

### Dashboard & Admin Navigation ✅
- [ ] Home page loads at http://localhost:3000/
- [ ] Admin button (⚙ icon) navigates to /admin page
- [ ] Footer admin link navigates to /admin page
- [ ] Login modal requires password: mcharv2025
- [ ] Can logout from admin panel

### Admin Features - Reviews ✅
- [ ] Reviews section loads with form
- [ ] Can invite reviewers (name + email)
- [ ] Pending reviews show in list
- [ ] Can approve reviews to go live
- [ ] Can delete reviews

### Admin Features - Documents ✅
- [ ] Documents section loads with upload form
- [ ] Can upload documents (PDF, images)
- [ ] Can toggle document visibility (Show/Hide)
- [ ] Can delete documents
- [ ] Visibility status persists

### Admin Features - Opportunities ✅
- [ ] Opportunities section loads with form
- [ ] Can create job opportunities
- [ ] Can select opportunity type, location, department
- [ ] Pending opportunities need approval
- [ ] Can approve to make live
- [ ] Can delete opportunities

### Admin Features - Team Management ✅
- [ ] Team section loads with form
- [ ] Can add team member (name, role required)
- [ ] Can upload team photo (JPG/PNG, max 5MB)
- [ ] Photo preview shows before submit
- [ ] Team member appears in pending list
- [ ] Can approve pending members
- [ ] Approved members show as "Live"
- [ ] Can remove members from site
- [ ] Form resets after submission

### Admin Features - Settings ✅
- [ ] Settings section loads
- [ ] Can update company name, tagline, phone, email
- [ ] Settings persist in localStorage
- [ ] Changes reflect across site

### Security Features (New in v2.0)
- [ ] Rate limiting active (test with rapid requests)
- [ ] CORS headers present in responses
- [ ] Security headers present:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
- [ ] No debug logs in console (server)
- [ ] Chat API validates input

---

## API Testing

### Health Check
```bash
curl http://localhost:3000/
# Should return dashboard HTML
```

### Rate Limiting Test
```bash
# Rapid requests should be throttled after limit
for i in {1..150}; do curl http://localhost:3000/; done
```

### Chat API Test
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
```

---

## Data Persistence Test

1. Add test data to each section:
   - Add review invitation
   - Upload document
   - Create opportunity
   - Add team member

2. Refresh browser (F5)
   - All data should persist from localStorage

3. Open Admin panel in new incognito window
   - Should NOT see data (sessionStorage for auth)

4. Clear browser data (Ctrl+Shift+Delete)
   - All admin data should be cleared
   - Need to re-login

---

## Troubleshooting

### Port 3000 Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### npm Install Fails
```bash
# Clear npm cache
npm cache clean --force
# Delete package-lock.json and node_modules
rm -rf package-lock.json node_modules
# Reinstall
npm install
```

### Express-rate-limit Not Found
```bash
# Verify it's installed
npm list express-rate-limit
# Reinstall if missing
npm install express-rate-limit
```

### Admin Features Not Loading
1. Check browser console for errors (F12)
2. Verify localStorage is enabled
3. Clear sessionStorage and re-login
4. Hard refresh (Ctrl+Shift+R)

### Photos Not Uploading in Team Section
- Check file size (max 5MB)
- Verify format (JPG, PNG only)
- Check browser console for errors
- Try a smaller test image

---

## Performance Testing

### Check Build Size
```bash
ls -lh apps/report-generator/frontend/dist/
```

### Monitor Memory Usage
```bash
# Start server and watch memory
node --max-old-space-size=512 server/app.js
```

### Load Test (needs artillery)
```bash
npm install -g artillery
artillery quick --count 100 --num 1000 http://localhost:3000/
```

---

## Production Readiness Checklist

Before deploying to production:

- [ ] All npm dependencies installed successfully
- [ ] No errors in server startup
- [ ] Dashboard loads without console errors
- [ ] Admin panel requires password
- [ ] All features tested and working
- [ ] Rate limiting preventing attacks
- [ ] Security headers configured
- [ ] HTTPS ready (awaiting Let's Encrypt rate limit)
- [ ] Environment variables prepared
- [ ] Backup procedures ready
- [ ] Monitoring configured
- [ ] Support contact information updated

---

## Next Steps

1. Complete local testing with checklist above
2. Fix any issues found in testing
3. Deploy to staging server for final validation
4. Once HTTPS configured, deploy to production
5. Monitor for errors and performance issues

For issues: See PRODUCTION_CHECKLIST.md
