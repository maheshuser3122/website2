// Authentication utilities
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const validator = require('validator');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

// ========== PASSWORD HASHING ==========
async function hashPassword(password) {
    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }
    return await bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// ========== JWT TOKEN GENERATION ==========
function generateToken(userId, email) {
    return jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

// ========== DRIVING LICENSE VALIDATION ==========
function validateDrivingLicense(licenseNumber) {
    // UK Driving License format: 16 characters
    // Format: 5 surname chars + 6 DOB (YYMMDD) + 5 initials/check
    if (!licenseNumber || licenseNumber.length !== 16) {
        return { valid: false, error: 'License must be 16 characters' };
    }

    if (!/^[A-Z0-9]+$/.test(licenseNumber)) {
        return { valid: false, error: 'License contains invalid characters' };
    }

    return { valid: true };
}

// ========== THEORY PASS CERTIFICATE VALIDATION ==========
function validateTheoryCertificate(certificateNumber) {
    // Theory pass certificates are typically numeric or alphanumeric
    if (!certificateNumber || certificateNumber.length < 5) {
        return { valid: false, error: 'Invalid certificate number' };
    }

    return { valid: true };
}

// ========== EMAIL VALIDATION ==========
function validateEmail(email) {
    return validator.isEmail(email);
}

// ========== PHONE VALIDATION ==========
function validatePhoneNumber(phone) {
    // UK phone format
    return /^(\+44|0)[0-9]{9,11}$/.test(phone.replace(/\s/g, ''));
}

// ========== GENERATE BOOKING REFERENCE ==========
function generateBookingReference() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BK-';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-' + Date.now().toString(36).toUpperCase();
    return result;
}

// ========== GENERATE TRANSACTION ID ==========
function generateTransactionId() {
    return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    validateDrivingLicense,
    validateTheoryCertificate,
    validateEmail,
    validatePhoneNumber,
    generateBookingReference,
    generateTransactionId
};
