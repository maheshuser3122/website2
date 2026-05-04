# Backend Setup & Initialization Guide

Complete step-by-step guide to set up and run the production-grade booking system backend.

## Prerequisites

- Node.js 14+ (LTS recommended)
- npm 6+
- Stripe account (free tier available)
- Git

## Installation Steps

### Step 1: Install Dependencies

```bash
cd BookingSystemBackend
npm install
```

This installs:
- express (web framework)
- sqlite3 (database)
- stripe (payment processing)
- jsonwebtoken (authentication)
- bcrypt (password security)
- validator (input validation)
- dotenv (environment configuration)
- cors (cross-origin requests)

### Step 2: Configure Environment

Copy the example file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
PORT=5000
NODE_ENV=development

# Get these from stripe.com dashboard
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Generate a random JWT secret
JWT_SECRET=your-random-secret-key-here

# Email configuration (optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-specific-password
```

### Step 3: Start the Server

```bash
npm start
```

Expected output:
```
╔════════════════════════════════════════════╗
║  BOOKING SYSTEM BACKEND - PRODUCTION MODE  ║
║  Server running on: http://localhost:5000  ║
╚════════════════════════════════════════════╝
```

## Quick Testing

### Test 1: Health Check

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": 3.456
}
```

### Test 2: Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "full_name": "Test User",
    "driving_license": "AB12CD34EF56GH78",
    "phone_number": "+441234567890"
  }'
```

Save the returned `token` for the next tests.

### Test 3: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```

### Test 4: Get Test Centres

```bash
curl http://localhost:5000/api/centres
```

## Populating Test Data

### Option A: Automatic Seed Data

The `database.js` file includes sample data. To auto-populate on startup:

1. Edit `.env`:
   ```env
   ENABLE_SEED_DATA=true
   ```

2. Restart the server
3. Check SQLite database with:
   ```bash
   sqlite3 system.db "SELECT COUNT(*) FROM test_centres;"
   ```

### Option B: Manual Data Upload via Admin API

#### 1. Create Admin User

```sql
sqlite3 system.db "UPDATE users SET is_admin = 1 WHERE id = 1;"
```

#### 2. Add Test Centres

```bash
# Save JWT token from login first
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123!"}' | jq -r '.token')

# Add a test centre
curl -X POST http://localhost:5000/api/admin/centres \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "London Test Centre",
    "address": "123 Main Street",
    "city": "London",
    "postcode": "SW1A 1AA",
    "capacity": 30,
    "phone": "+441234567890",
    "distance_km": 5
  }'
```

#### 3. Add Appointment Slots

```bash
curl -X POST http://localhost:5000/api/admin/slots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "centre_id": 1,
    "slots": [
      {
        "slot_date": "2024-01-20",
        "slot_time": "09:00",
        "test_type": "Practical Test",
        "price": 62.50,
        "capacity": 1
      },
      {
        "slot_date": "2024-01-20",
        "slot_time": "14:00",
        "test_type": "Practical Test",
        "price": 62.50,
        "capacity": 1
      }
    ]
  }'
```

### Option C: Bulk Import from CSV

Create `slots.csv`:
```
centre_id,slot_date,slot_time,test_type,price,capacity
1,2024-01-20,09:00,Practical Test,62.50,1
1,2024-01-20,14:00,Practical Test,62.50,1
1,2024-01-21,10:00,Practical Test,62.50,1
```

Then import:
```bash
# Parse CSV and POST to API (use your preferred CSV parser)
# Example: using Python
python3 -c "
import csv, requests, json
with open('slots.csv') as f:
    reader = csv.DictReader(f)
    slots = list(reader)
    # POST slots via /api/admin/slots
"
```

## Database Management

### View Database Contents

```bash
# List all test centres
sqlite3 system.db "SELECT * FROM test_centres LIMIT 5;"

# View available slots
sqlite3 system.db "SELECT * FROM appointment_slots WHERE is_available = 1 LIMIT 10;"

# Count bookings
sqlite3 system.db "SELECT COUNT(*) FROM bookings;"

# Check payments
sqlite3 system.db "SELECT * FROM payments WHERE status = 'completed';"
```

### Reset Database

```bash
# Delete and restart
rm system.db
npm start  # This recreates the database
```

### Backup Database

```bash
cp system.db system.db.backup.$(date +%Y%m%d-%H%M%S)
```

## End-to-End Workflow Test

### Complete Booking Flow

```bash
# 1. Register user
REGISTER=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "booking-test@example.com",
    "password": "TestPass123!",
    "full_name": "John Tester",
    "driving_license": "AB12CD34EF56GH78"
  }')

TOKEN=$(echo $REGISTER | jq -r '.token')
USER_ID=$(echo $REGISTER | jq -r '.user.id')

# 2. Verify theory pass
curl -s -X POST http://localhost:5000/api/auth/verify-theory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": $USER_ID,
    \"theory_pass_certificate\": \"PASS123456789\",
    \"theory_pass_date\": \"2025-12-31\"
  }"

# 3. Get AI recommendations
RECOMMENDATIONS=$(curl -s -X POST http://localhost:5000/api/bookings/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "test_type": "Practical Test",
    "city": "London",
    "preferred_time": "14"
  }')

SLOT_ID=$(echo $RECOMMENDATIONS | jq -r '.recommendations[0].id')

# 4. Confirm booking
BOOKING=$(curl -s -X POST http://localhost:5000/api/bookings/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"appointment_slot_id\": $SLOT_ID}")

BOOKING_ID=$(echo $BOOKING | jq -r '.booking.id')
echo "Booking created: $BOOKING_ID"

# 5. Create payment intent
PAYMENT=$(curl -s -X POST http://localhost:5000/api/payments/create-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"booking_id\": $BOOKING_ID, \"amount\": 62.50}")

echo "Payment ready: $(echo $PAYMENT | jq -r '.client_secret')"

# 6. View booking
curl -s -X GET http://localhost:5000/api/bookings/$BOOKING_ID \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "✅ Full booking workflow tested successfully!"
```

## Development Mode

### Enable Debug Logging

```env
DEBUG=true
LOG_LEVEL=debug
NODE_ENV=development
```

### Watch Mode (Auto-restart on file changes)

```bash
npm run dev
```

Or manually:
```bash
npx nodemon server.js
```

### Test Stripe in Sandbox

Use these test card numbers:
- Valid: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Expiry: Any future date
CVC: Any 3 digits

## Troubleshooting

### Port Already in Use

```bash
# Linux/Mac: Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Windows: Find and stop process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database Locked Error

```bash
# SQLite file locked - just delete it
rm system.db
# Restart server to recreate
```

### Stripe Connection Failed

1. Verify internet connection
2. Check Stripe API keys in `.env`
3. Confirm test mode keys are used
4. Check Stripe status: https://status.stripe.com

### CORS Errors from Frontend

Add your frontend URL to `CORS` in `server.js`:
```javascript
origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://YOUR_FRONTEND:PORT'
]
```

### JWT Token Expired

Tokens expire after 24 hours. User must login again:
```bash
curl -X POST http://localhost:5000/api/auth/login ...
```

## Performance Monitoring

### Basic Metrics

```bash
# Get server health
curl http://localhost:5000/api/health

# View in dashboard
curl http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer [admin-token]"
```

### Database Performance

```bash
# Check for large tables
sqlite3 system.db ".tables"
sqlite3 system.db "SELECT COUNT(*) as row_count FROM bookings;"

# Rebuild indexes (maintenance)
sqlite3 system.db "VACUUM;"
sqlite3 system.db "ANALYZE;"
```

## Production Checklist

- [ ] Change `NODE_ENV=production`
- [ ] Generate strong JWT_SECRET (32+ chars)
- [ ] Use Stripe LIVE keys (not test keys)
- [ ] Enable HTTPS/TLS on frontend
- [ ] Set all SMTP email values
- [ ] Configure CORS with only trusted origins
- [ ] Set strong database password (if using PostgreSQL)
- [ ] Enable rate limiting
- [ ] Set up error monitoring (Sentry)
- [ ] Enable audit logging
- [ ] Test with production SSL certificate
- [ ] Backup database regularly
- [ ] Monitor disk space
- [ ] Set up automated backups
- [ ] Document all environment variables
- [ ] Test payment flow with live cards
- [ ] Verify email confirmations are working
- [ ] Test booking cancellation refunds
- [ ] Load test with >100 concurrent users

## Next Steps

1. **Frontend Integration**: Build React/Vue UI to call these APIs
2. **Email Notifications**: Set up Nodemailer templates for confirmations
3. **Real Data**: Integrate with DVSA/embassy APIs for real slots
4. **Analytics**: Add tracking and reporting dashboard
5. **Mobile App**: Build React Native or Flutter app
6. **Scaling**: Move to PostgreSQL and deploy to cloud

## Support Files

- `README.md` - API documentation
- `.env.example` - Environment template
- `database.js` - Database schema
- All routes in `/routes/` directory

## Quick Reference Commands

```bash
# Start server
npm start

# Development with auto-reload
npm run dev

# Run tests
npm test

# Check logs
tail -f server.log

# Create backup
cp system.db system.db.bak

# Reset database
rm system.db && npm start

# Check all endpoints
curl http://localhost:5000/api/health
```

Enjoy your production-grade booking system! 🚀
