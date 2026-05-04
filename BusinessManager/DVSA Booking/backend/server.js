// Main Express server - Production Grade Booking System
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const centreRoutes = require('./routes/centres');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const dvsaRoutes = require('./routes/dvsa');
const { startDVSASyncScheduler } = require('./utils/dvsa');

const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARE ==========
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ========== REQUEST LOGGING ==========
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ========== ROOT WELCOME PAGE ==========
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Booking System Backend API</title>
            <style>
                body { font-family: Arial; max-width: 800px; margin: 50px auto; background: #f5f5f5; }
                .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; }
                .endpoint { background: #f9f9f9; padding: 10px; margin: 10px 0; border-left: 4px solid #667eea; }
                code { color: #d63384; }
                a { color: #667eea; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✅ Booking System Backend</h1>
                <p>Server is running and ready for requests.</p>
                
                <h2>Quick Links</h2>
                <div class="endpoint">
                    <strong>Health Check:</strong> <a href="/api/health">/api/health</a>
                </div>
                <div class="endpoint">
                    <strong>List Centres:</strong> <a href="/api/centres">/api/centres</a>
                </div>
                
                <h2>API Documentation</h2>
                <p>See <code>README.md</code> for complete API documentation and examples.</p>
                
                <h2>Common Endpoints</h2>
                <ul>
                    <li><strong>Auth:</strong> POST /api/auth/register, /api/auth/login</li>
                    <li><strong>Bookings:</strong> POST /api/bookings/create, GET /api/bookings/my-bookings</li>
                    <li><strong>Centres:</strong> GET /api/centres, GET /api/centres/search</li>
                    <li><strong>AI:</strong> POST /api/ai/recommend, POST /api/ai/auto-book</li>
                    <li><strong>Payments:</strong> POST /api/payments/create-intent</li>
                </ul>
                
                <hr>
                <p>🚀 Backend Version 1.0.0</p>
            </div>
        </body>
        </html>
    `);
});

// ========== ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dvsa', dvsaRoutes);

// ========== START DVSA SYNC SCHEDULER ==========
startDVSASyncScheduler();

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        status: err.status || 500
    });
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════════╗`);
    console.log(`║  BOOKING SYSTEM BACKEND - PRODUCTION MODE  ║`);
    console.log(`║  Server running on: http://localhost:${PORT}  ║`);
    console.log(`╚════════════════════════════════════════════╝\n`);
});

module.exports = app;
