// Database initialization and schema - SQLite3
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'booking_system.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database connection error:', err);
    else console.log('✓ Connected to SQLite database');
});

// Create tables
db.serialize(() => {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            driving_license_number TEXT UNIQUE NOT NULL,
            theory_pass_certificate TEXT,
            theory_pass_date DATE,
            phone_number TEXT,
            verified BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Test centres table
    db.run(`
        CREATE TABLE IF NOT EXISTS test_centres (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            postcode TEXT NOT NULL,
            address TEXT NOT NULL,
            phone_number TEXT,
            email TEXT,
            centre_type TEXT DEFAULT 'driving_test',
            capacity_per_day INTEGER DEFAULT 20,
            opening_hours TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Available slots table
    db.run(`
        CREATE TABLE IF NOT EXISTS appointment_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            centre_id INTEGER NOT NULL,
            test_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            test_type TEXT NOT NULL,
            category TEXT DEFAULT 'cat-b',
            price DECIMAL(10,2) DEFAULT 62.50,
            available BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(centre_id) REFERENCES test_centres(id)
        )
    `);

    // Bookings table
    db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            slot_id INTEGER NOT NULL,
            centre_id INTEGER NOT NULL,
            booking_reference TEXT UNIQUE NOT NULL,
            test_type TEXT NOT NULL,
            category TEXT,
            booking_date DATE NOT NULL,
            booking_time TIME NOT NULL,
            status TEXT DEFAULT 'pending',
            payment_status TEXT DEFAULT 'pending',
            payment_id TEXT,
            confirmation_sent BOOLEAN DEFAULT 0,
            reminder_sent BOOLEAN DEFAULT 0,
            cancellation_reason TEXT,
            cancelled_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(slot_id) REFERENCES appointment_slots(id),
            FOREIGN KEY(centre_id) REFERENCES test_centres(id)
        )
    `);

    // Payments table
    db.run(`
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            transaction_id TEXT UNIQUE NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            currency TEXT DEFAULT 'GBP',
            payment_method TEXT,
            status TEXT DEFAULT 'pending',
            stripe_payment_intent_id TEXT,
            failure_reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY(booking_id) REFERENCES bookings(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    // Audit logs table
    db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_id INTEGER,
            details TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    // AI Recommendations table
    db.run(`
        CREATE TABLE IF NOT EXISTS ai_recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            recommended_slot_id INTEGER,
            recommended_centre_id INTEGER,
            confidence_score DECIMAL(3,2),
            reason TEXT,
            accepted BOOLEAN,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(recommended_slot_id) REFERENCES appointment_slots(id),
            FOREIGN KEY(recommended_centre_id) REFERENCES test_centres(id)
        )
    `);

    console.log('✓ Database schema created/verified');
});

module.exports = db;
