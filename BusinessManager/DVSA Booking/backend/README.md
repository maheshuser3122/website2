# Automated Booking System Backend - Production Grade

A Node.js/Express backend system for automated appointment booking with AI-driven slot matching, payment processing via Stripe, and admin controls.

## Features

✅ **User Authentication**
- Email/password registration and login with JWT tokens
- UK Driving License validation (16-character format)
- Theory pass certificate verification
- Secure password hashing with bcrypt

✅ **Smart AI Booking Algorithm**
- Multi-factor scoring system for slot recommendations
- Considers: price, location, availability, time preference, occupancy
- Automatic best-match booking with `/auto-book` endpoint
- Top 5 personalized recommendations

✅ **Booking Management**
- Create bookings with AI-matched slots
- Reschedule (3+ days notice required)
- Cancel with 3-day window policy
- Full audit trail of all actions

✅ **Payment Processing**
- Stripe integration for secure payments
- Payment intent creation and confirmation
- Refund processing with 3-day window
- Webhook handling for Stripe events
- Transaction ID tracking

✅ **Admin Dashboard**
- View key metrics (bookings, revenue, users)
- Manage test centres
- Add appointment slots (bulk upload)
- View all bookings and payments
- Audit logs for compliance

✅ **Database**
- SQLite3 for portability
- 7 normalized tables with relationships
- Auto-initialization on startup
- Audit trails and transaction tracking

## Quick Start

### 1. Installation

```bash
cd BookingSystemBackend
npm install
```

### 2. Environment Setup

Create a `.env` file:

```env
# Server
PORT=5000
NODE_ENV=production

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:3000

# Stripe Payment Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@bookingsystem.com
```

### 3. Start the Server

```bash
npm start
```

Server runs on `http://localhost:5000`

## API Documentation

### Authentication Routes

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "driving_license": "AB12CD34EF56GH78",
  "phone_number": "+441234567890"
}

Response:
{
  "success": true,
  "user": { id, email, full_name },
  "token": "jwt_token_here"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "success": true,
  "user": { id, email, full_name, verified },
  "token": "jwt_token_here"
}
```

#### Verify Theory Pass
```http
POST /api/auth/verify-theory
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 1,
  "theory_pass_certificate": "PASS123456789",
  "theory_pass_date": "2025-12-31"
}
```

### Bookings Routes

#### Get AI Recommendations
```http
POST /api/bookings/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "test_type": "Practical Test",
  "city": "London",
  "start_date": "2024-01-15",
  "end_date": "2024-02-15",
  "preferred_time": "14",
  "max_distance": 20
}

Response:
{
  "success": true,
  "recommendations": [
    {
      "id": 1,
      "centre_name": "London Test Centre",
      "date": "2024-01-20",
      "time": "14:30",
      "price": 62.50,
      "confidence_score": 95
    }
  ]
}
```

#### Confirm Booking
```http
POST /api/bookings/confirm
Authorization: Bearer {token}
Content-Type: application/json

{
  "appointment_slot_id": 1,
  "notes": "Preferred afternoon slot"
}

Response:
{
  "success": true,
  "booking": {
    "id": 5,
    "reference": "BK-1234567890-ABC123",
    "status": "pending",
    "price": 62.50
  }
}
```

#### List My Bookings
```http
GET /api/bookings/my-bookings
Authorization: Bearer {token}

Response:
{
  "success": true,
  "count": 3,
  "bookings": [
    {
      "id": 5,
      "reference": "BK-1234567890-ABC123",
      "status": "pending",
      "centre": "London Test Centre",
      "date": "2024-01-20",
      "price": 62.50
    }
  ]
}
```

#### Reschedule Booking
```http
PUT /api/bookings/:booking_id/reschedule
Authorization: Bearer {token}
Content-Type: application/json

{
  "new_slot_id": 2
}

Response: { success: true, new_date: "2024-01-27", new_time: "10:00" }
```

#### Cancel Booking
```http
DELETE /api/bookings/:booking_id/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Schedule conflict"
}

Response: { success: true, refund_status: "Processing" }
```

### Test Centres Routes

#### List All Centres
```http
GET /api/centres

Response:
{
  "success": true,
  "count": 45,
  "centres": [
    {
      "id": 1,
      "name": "London Test Centre",
      "location": "London, SW1A 1AA",
      "available_slots": 12
    }
  ]
}
```

#### Search Centres
```http
GET /api/centres/search?city=London&postcode=SW1

Response: Same as list
```

#### Get Centre Details
```http
GET /api/centres/1

Response:
{
  "centre": { id, name, address, phone, hours },
  "available_slots": [
    { id, date, time, test_type, price, available_spaces }
  ]
}
```

### Payments Routes

#### Create Payment Intent
```http
POST /api/payments/create-intent
Authorization: Bearer {token}
Content-Type: application/json

{
  "booking_id": 5,
  "amount": 62.50
}

Response:
{
  "success": true,
  "client_secret": "pi_stripe_client_secret",
  "amount": 62.50
}
```

#### Confirm Payment
```http
POST /api/payments/confirm
Authorization: Bearer {token}
Content-Type: application/json

{
  "booking_id": 5,
  "stripe_payment_id": "pi_stripe_payment_id",
  "amount": 62.50
}

Response:
{
  "success": true,
  "transaction_id": "TXN-1704067200000-abc123",
  "status": "confirmed"
}
```

#### Get Payment Status
```http
GET /api/payments/:booking_id/status
Authorization: Bearer {token}

Response:
{
  "success": true,
  "payment_status": "completed",
  "transaction_id": "TXN-xxx",
  "amount": 62.50
}
```

### AI Routes

#### Get Personalized Recommendations
```http
POST /api/ai/recommend
Authorization: Bearer {token}
Content-Type: application/json

{
  "test_type": "Practical Test",
  "preferred_location": "London",
  "preferred_time": "14",
  "budget_limit": 70
}

Response:
{
  "success": true,
  "recommendations": [
    {
      "id": 1,
      "centre": "London Test Centre",
      "date": "2024-01-20",
      "price": 62.50,
      "ai_confidence": "95%"
    }
  ]
}
```

#### Auto-Book Best Match
```http
POST /api/ai/auto-book
Authorization: Bearer {token}
Content-Type: application/json

{
  "test_type": "Practical Test",
  "preferred_location": "London"
}

Response:
{
  "success": true,
  "booking": {
    "id": 6,
    "reference": "BK-xxx",
    "centre": "London Test Centre",
    "date": "2024-01-20",
    "ai_confidence_score": 92
  }
}
```

### Admin Routes

#### Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer {token} (admin user required)

Response:
{
  "stats": {
    "total_users": 150,
    "confirmed_bookings": 234,
    "total_revenue": 14670.00,
    "available_slots": 45
  },
  "recent_bookings": [...]
}
```

#### Add Test Centre
```http
POST /api/admin/centres
Authorization: Bearer {token} (admin)
Content-Type: application/json

{
  "name": "Manchester Test Centre",
  "address": "123 Main Street",
  "city": "Manchester",
  "postcode": "M1 1AA",
  "capacity": 30,
  "phone": "+441612345678",
  "distance_km": 5
}
```

#### Add Appointment Slots (Bulk)
```http
POST /api/admin/slots
Authorization: Bearer {token} (admin)
Content-Type: application/json

{
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
}
```

#### View All Bookings
```http
GET /api/admin/bookings?status=confirmed&page=1
Authorization: Bearer {token} (admin)

Response:
{
  "page": 1,
  "total_count": 234,
  "bookings": [...]
}
```

## AI Scoring Algorithm

The smart matching engine uses multi-factor scoring (0-100):

| Factor | Weight | Description |
|--------|--------|-------------|
| **Price** | 15 | Lower price within budget preferred |
| **Location** | 20 | Closer to user location |
| **Availability** | 10 | Less crowded slots preferred |
| **Time Preference** | 10 | Match user's preferred hours |
| **Booking Window** | 5 | Sooner bookings encouraged |
| **Test Type** | 5 | Match requested test type |

**Example:**
- Slot in London, 12km away, "14:30", 80% availability, £62.50
- User: prefers London, afternoon, £65 budget
- **Score: 95%** ✅

## Database Schema

### Tables
- `users` - User accounts with driving license
- `test_centres` - Test centre locations
- `appointment_slots` - Available time slots
- `bookings` - User bookings (with status tracking)
- `payments` - Payment transactions
- `audit_logs` - Security audit trail
- `ai_recommendations` - AI matching history

### Key Relationships
- User → Bookings (1:many)
- Booking → Payment (1:1)
- Centre → Slots (1:many)
- Slot → Bookings (1:many)

## Security Features

🔒 JWT token authentication (24-hour expiry)
🔒 Bcrypt password hashing (10 rounds)
🔒 Role-based access control (admin middleware)
🔒 Request validation (email, phone, license format)
🔒 Audit logging of all actions
🔒 CORS protection
🔒 Stripe webhook signature verification

## Error Handling

```javascript
// All errors return standardized JSON response:
{
  "error": "Human readable error message",
  "status": 400
}

// Common status codes:
// 200 - Success
// 201 - Created
// 400 - Bad request (validation error)
// 401 - Unauthorized
// 403 - Forbidden (admin only)
// 404 - Not found
// 409 - Conflict (duplicate email/license)
// 500 - Server error
```

## Testing

### Using curl

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "driving_license": "AB12CD34EF56GH78"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get centres
curl http://localhost:5000/api/centres
```

### Using Postman

Import the `BookingSystemBackend/postman-collection.json` file for complete API testing.

## Deployment

### Docker
```bash
docker build -t booking-system .
docker run -p 5000:5000 booking-system
```

### Heroku
```bash
heroku create your-app-name
heroku config:set STRIPE_SECRET_KEY=sk_...
git push heroku main
```

### AWS/Azure
See deployment guides in `/docs/deployment`

## Troubleshooting

**"Module not found: 'stripe'"**
→ Run `npm install`

**"Database locked"**
→ Delete `system.db` and restart

**"CORS error from frontend"**
→ Add frontend URL to `CORS` origin list in `server.js`

**"Payment intent failed"**
→ Check Stripe keys in `.env`

## Support

For issues, check:
- [x] All environment variables set
- [x] npm dependencies installed
- [x] Database initialized
- [x] Port 5000 available
- [x] Stripe test keys configured

## License

MIT © 2024 Booking System
