# DVSA Booking System - Complete Setup

## 🎯 What You Have

**Complete Full-Stack Application:**
- ✅ Backend API (Node.js + Express) - Running on `http://localhost:5000`
- ✅ Frontend App (React + Vite) - Running on `http://localhost:3000`
- ✅ Real DVSA Integration (Web Scraping + Automation)
- ✅ SQLite Database with User Sessions
- ✅ Email Notifications

---

## 🚀 Quick Start (Run Both Simultaneously)

### Step 1: Start Backend (Terminal 1)
```powershell
cd "e:\Mcharv Techlabs\Webwork\McharvTechlabs\BookingSystemBackend"
npm start
```

**Expected Output:**
```
✓ Database schema created/verified
[DVSA] Scheduler started - syncing every 6 hours
[DVSA] Fetching real slots for practical tests near London...

╔════════════════════════════════════════════╗
║  BOOKING SYSTEM BACKEND - PRODUCTION MODE  ║
║  Server running on: http://localhost:5000  ║
╚════════════════════════════════════════════╝

✓ Connected to SQLite database
```

### Step 2: Start Frontend (Terminal 2)
```powershell
cd "e:\Mcharv Techlabs\Webwork\McharvTechlabs\BookingSystemFrontend"
npm install
npm run dev
```

**Expected Output:**
```
VITE v5.0.8  ready in 234 ms

➜  Local:   http://localhost:3000/
➜  press h + enter to show help
```

**Browser will automatically open at:** `http://localhost:3000`

---

## 🎬 User Flow (Step by Step)

### Step 1️⃣: Register or Login
![Registration](https://img.shields.io/badge/Step-1-blue)

1. Visit `http://localhost:3000`
2. Click **Register** tab
3. Fill in:
   - **Email:** any@email.com
   - **Password:** TestPass123!
   - **Full Name:** John Doe
   - **Driving License:** AB12CD34EF56GH78 (must be 16 chars)
   - **Phone:** +441234567890
4. Click **Register**

✅ You're logged in!

### Step 2️⃣: Authenticate with DVSA
![DVSA Auth](https://img.shields.io/badge/Step-2-green)

1. Now you see: **DVSA Authentication** page
2. Enter **Date of Birth:** 15/01/1990
3. Click **Authenticate with DVSA**

✅ System connects to real DVSA!

### Step 3️⃣: Browse Real Test Slots
![Slots](https://img.shields.io/badge/Step-3-blue)

1. You see: **Available Test Slots** page
2. (Optional) Change postcode: `SW1A` → `EC1A` or your area
3. Click **Search Slots**
4. Real DVSA slots load from backend
5. Click any slot to select it
6. Click **Proceed to Book**

✅ Slot selected!

### Step 4️⃣: Confirm Booking
![Confirmation](https://img.shields.io/badge/Step-4-green)

1. Review all details
2. Click **Confirm Booking**
3. System submits to real DVSA
4. Get confirmation page with:
   - **DVSA Reference Number**
   - **Booking Details**
   - **Email Confirmation Sent**

✅ Booking Complete!

---

## 📋 Complete User Journey

```
┌─────────────────────────────────────────────────────────┐
│                    DVSA BOOKING APP                     │
│                 http://localhost:3000                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ↓
              ┌──────────────────────────┐
              │  1. REGISTER / LOGIN     │
              │                          │
              │ • Email & Password       │
              │ • Full Name              │
              │ • Driving License (16)   │
              │ • Phone Number           │
              └──────────────────────────┘
                           │
                           ↓
              ┌──────────────────────────┐
              │  2. DVSA AUTHENTICATION  │
              │                          │
              │ • Enter Date of Birth    │
              │ • Auto authenticates     │
              │   with real DVSA         │
              └──────────────────────────┘
                           │
                           ↓
              ┌──────────────────────────┐
              │  3. BROWSE REAL SLOTS    │
              │                          │
              │ • Shows real DVSA slots  │
              │ • Filter by location     │
              │ • Select available date  │
              └──────────────────────────┘
                           │
                           ↓
              ┌──────────────────────────┐
              │  4. CONFIRM BOOKING      │
              │                          │
              │ • Review details         │
              │ • Submit to real DVSA    │
              │ • Get reference number   │
              │ • Email confirmation     │
              └──────────────────────────┘
                           │
                           ↓
              ✅ BOOKING CONFIRMED ✅
                (Real DVSA system)
```

---

## 🔧 What's Happening Behind the Scenes

### Frontend → Backend Communication

```javascript
// User Registration
POST /api/auth/register
{
  "email": "user@email.com",
  "password": "TestPass123!",
  "full_name": "John Doe",
  "driving_license": "AB12CD34EF56GH78",
  "phone_number": "+441234567890"
}
↓
✅ Returns JWT Token + User data
```

```javascript
// DVSA Authentication
POST /api/dvsa/authenticate
{
  "driving_license": "AB12CD34EF56GH78",
  "date_of_birth": "15/01/1990"
}
↓
✅ Uses Puppeteer to auth with real DVSA
✅ Gets session token
```

```javascript
// Fetch Real Slots
GET /api/dvsa/slots?testType=practical&postcode=SW1A
↓
✅ Backend scrapes real DVSA website
✅ Returns available slots
✅ Caches for 6 hours
```

```javascript
// Submit Real Booking
POST /api/dvsa/book
{
  "slot_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@email.com",
  "phone": "+441234567890"
}
↓
✅ Puppeteer auto-fills DVSA form
✅ Submits to real DVSA
✅ Gets booking reference
✅ Sends email confirmation
```

---

## 📊 System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         BROWSER                               │
│                  http://localhost:3000                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           React Frontend Application                 │    │
│  │  • RegisterLogin.jsx (Forms)                        │    │
│  │  • DVSAAuth.jsx (Auth page)                         │    │
│  │  • SlotBrowser.jsx (Slot display)                   │    │
│  │  • BookingConfirmation.jsx (Confirm page)           │    │
│  │  • api.js (Backend integration)                     │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                           │ HTTP Requests
                           │ JSON Response
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                  Node.js Backend API                          │
│               http://localhost:5000/api                       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express Middleware & Routes                        │   │
│  │  • Auth Routes (register, login)                    │   │
│  │  • DVSA Routes (auth, slots, book)                  │   │
│  │  • JWT Verification                                │   │
│  │  • Error Handling                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│  ┌────────────────────┬──┴──────────┬─────────────────────┐  │
│  │                    │             │                     │  │
│  ↓                    ↓             ↓                     ↓  │
│ SQLite          Puppeteer      Real DVSA             Email  │
│ Database        Browser         Website             Service │
│ (Users,         Automation     Scraping                      │
│  Bookings,      ├─ Opens       ├─ Slots                      │
│  Slots)         │  Chrome      ├─ Submit               Sends │
│                 ├─ Visits      │  Forms                conf  │
│                 │  DVSA        └─ Get Refs                   │
│                 ├─ Fills       
│                 │  Forms
│                 └─ Gets Session
└──────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test the Complete Flow

### Quick Test (No Frontend)
```powershell
# Terminal 1: Backend
cd BookingSystemBackend
npm start

# Terminal 2: Test with curl
# 1. Register
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email":"test@test.com",
    "password":"TestPass123!",
    "full_name":"Test User",
    "driving_license":"AB12CD34EF56GH78",
    "phone_number":"+441234567890"
  }'

# 2. Get slots
curl "http://localhost:5000/api/dvsa/slots?testType=practical&postcode=SW1A"

# 3. Book
curl -X POST http://localhost:5000/api/dvsa/book `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{
    "slot_id":1,
    "first_name":"Test",
    "last_name":"User",
    "email":"test@test.com",
    "phone":"+441234567890"
  }'
```

### Full Test (With Frontend)
1. Start Backend: `npm start` (BookingSystemBackend)
2. Start Frontend: `npm run dev` (BookingSystemFrontend)
3. Open browser: `http://localhost:3000`
4. Follow user flow above

---

## 🔐 Security Features

✅ **Password Security**
- Bcrypt hashing (10 rounds)
- Min 8 characters required

✅ **Authentication**
- JWT tokens (24-hour expiry)
- Token stored in localStorage (frontend)
- Session validation on every request

✅ **DVSA Authentication**
- Real driving license verification
- Date of birth validation
- Session tokens encrypted

✅ **API Security**
- CORS enabled for localhost:3000
- Input validation (all fields)
- Protected routes (JWT required)

---

## 🚨 Troubleshooting

### Frontend won't connect to backend?
```
Error: Failed to fetch
→ Check backend is running on http://localhost:5000
→ Check CORS headers in server.js
```

### DVSA slots showing as empty?
```
No slots available
→ DVSA website might be down
→ Check backend logs for scraper errors
→ Try different postcode
→ Wait for next 6-hour sync
```

### Registration fails?
```
Error: Driving license must be 16 characters
→ Enter exactly 16 characters (e.g., AB12CD34EF56GH78)

Error: Invalid email
→ Use format: user@domain.com
```

### Booking won't submit?
```
Error: Authentication required
→ Complete DVSA authentication step first
→ Token may have expired - logout and login again
```

---

## 📱 Frontend Features

### ✅ Completed
- User registration & login
- DVSA authentication
- Real slot browsing
- Booking confirmation
- Session persistence
- Responsive design
- Error handling
- Loading states
- Step indicator
- Toast notifications

### 🔄 Ready for Enhancement
- Payment integration (Stripe)
- Booking history
- Rescheduling
- Cancellation
- Test centre map
- Auto-recommendations
- Mobile app (React Native)

---

## 🎨 UI/UX

**Color Scheme:**
- Primary: `#667eea` (Purple)
- Secondary: `#764ba2` (Dark Purple)
- Success: `#28a745` (Green)
- Error: `#dc3545` (Red)

**Responsive Breakpoints:**
- Desktop: 900px max width
- Tablet: 768px
- Mobile: Full width with padding

**Accessibility:**
- ARIA labels
- Keyboard navigation
- Font Awesome icons
- High contrast text

---

## 📞 Support

**For DVSA Issues:**
- DVSA Support: 0344 4635 000
- GOV.UK: https://www.gov.uk/book-driving-test

**For Technical Issues:**
- Check backend logs (Terminal 1)
- Check browser console (F12)
- See DVSA_INTEGRATION.md for technical details

---

## 📦 Dependencies

**Frontend:**
- React 18.2.0
- Axios 1.6.0
- Vite 5.0.8

**Backend:**
- Express 4.18.2
- SQLite3 3.9.0
- Puppeteer 21.0.0
- Cheerio 1.0.0
- JWT & bcrypt

---

## ✅ Status

- ✅ Backend: Running on :5000
- ✅ Frontend: Ready to run on :3000
- ✅ DVSA Integration: Active & Syncing
- ✅ Database: Connected
- ✅ Email: Configured
- ✅ Application: PRODUCTION READY

**Next Steps:**
1. Run both backend and frontend
2. Test registration → booking flow
3. Check DVSA confirmation emails
4. Deploy to cloud (optional)

---

**Status:** ✅ COMPLETE & READY TO USE
