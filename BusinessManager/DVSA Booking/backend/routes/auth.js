// Authentication routes
const express = require('express');
const router = express.Router();
const db = require('../database');
const {
    hashPassword,
    verifyPassword,
    generateToken,
    validateDrivingLicense,
    validateEmail,
    validatePhoneNumber
} = require('../utils/auth');

// ========== REGISTER USER ==========
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, driving_license, phone_number } = req.body;

        // Validation
        if (!email || !password || !full_name || !driving_license) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const licenseValidation = validateDrivingLicense(driving_license);
        if (!licenseValidation.valid) {
            return res.status(400).json({ error: licenseValidation.error });
        }

        if (phone_number && !validatePhoneNumber(phone_number)) {
            return res.status(400).json({ error: 'Invalid phone number' });
        }

        // Check if email already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
            if (row) {
                return res.status(409).json({ error: 'Email already registered' });
            }

            // Check if license already exists
            db.get('SELECT id FROM users WHERE driving_license_number = ?', [driving_license], (err, row) => {
                if (row) {
                    return res.status(409).json({ error: 'Driving license already registered' });
                }

                // Hash password and create user
                hashPassword(password).then(hash => {
                    db.run(
                        `INSERT INTO users (email, password_hash, full_name, driving_license_number, phone_number)
                         VALUES (?, ?, ?, ?, ?)`,
                        [email, hash, full_name, driving_license, phone_number || null],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ error: 'Registration failed' });
                            }

                            const token = generateToken(this.lastID, email);

                            res.status(201).json({
                                success: true,
                                message: 'User registered successfully',
                                user: {
                                    id: this.lastID,
                                    email,
                                    full_name,
                                    driving_license: driving_license.substring(0, 3) + '****' + driving_license.substring(-3)
                                },
                                token
                            });
                        }
                    );
                });
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== LOGIN ==========
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const passwordMatch = await verifyPassword(password, user.password_hash);

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const token = generateToken(user.id, user.email);

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    verified: user.verified
                },
                token
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== VERIFY THEORY PASS ==========
router.post('/verify-theory', (req, res) => {
    try {
        const { user_id, theory_pass_certificate, theory_pass_date } = req.body;

        if (!user_id || !theory_pass_certificate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        db.run(
            'UPDATE users SET theory_pass_certificate = ?, theory_pass_date = ? WHERE id = ?',
            [theory_pass_certificate, theory_pass_date, user_id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update theory pass' });
                }

                res.json({
                    success: true,
                    message: 'Theory pass verified successfully'
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== GET USER PROFILE ==========
router.get('/profile/:user_id', (req, res) => {
    try {
        const { user_id } = req.params;

        db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, user) => {
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    phone_number: user.phone_number,
                    verified: user.verified,
                    theory_pass_date: user.theory_pass_date,
                    created_at: user.created_at
                }
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
