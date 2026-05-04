// Admin routes - manage test centres, slots, and view analytics
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ========== ADMIN DASHBOARD ==========
router.get('/dashboard', authMiddleware, adminMiddleware, (req, res) => {
    try {
        db.get(
            `SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as confirmed_bookings,
                (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
                (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled') as cancelled_bookings,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
                (SELECT COUNT(*) FROM appointment_slots WHERE is_available = 1) as available_slots
            FROM (SELECT 1)`,
            (err, stats) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch stats' });
                }

                // Get recent bookings
                db.all(
                    `SELECT 
                        b.id, b.booking_reference, b.status, b.created_at,
                        u.email, u.full_name,
                        c.name as centre_name, s.slot_date, s.price
                    FROM bookings b
                    JOIN users u ON b.user_id = u.id
                    JOIN appointment_slots s ON b.appointment_slot_id = s.id
                    JOIN test_centres c ON s.centre_id = c.id
                    ORDER BY b.created_at DESC
                    LIMIT 10`,
                    (err, recentBookings) => {
                        res.json({
                            success: true,
                            stats: {
                                total_users: stats.total_users,
                                confirmed_bookings: stats.confirmed_bookings,
                                pending_bookings: stats.pending_bookings,
                                cancelled_bookings: stats.cancelled_bookings,
                                total_revenue: stats.total_revenue,
                                available_slots: stats.available_slots
                            },
                            recent_bookings: recentBookings.map(b => ({
                                reference: b.booking_reference,
                                user: b.full_name,
                                email: b.email,
                                centre: b.centre_name,
                                date: b.slot_date,
                                price: b.price,
                                status: b.status
                            }))
                        });
                    }
                );
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== ADD TEST CENTRE ==========
router.post('/centres', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const { name, address, city, postcode, capacity, phone, email, hours, distance_km } = req.body;

        if (!name || !city || !postcode || !capacity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        db.run(
            `INSERT INTO test_centres (name, address, city, postcode, capacity, phone, email, hours, distance_km)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, address || null, city, postcode, capacity, phone || null, email || null, hours || null, distance_km || 0],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to add centre' });
                }

                res.status(201).json({
                    success: true,
                    message: 'Centre added successfully',
                    centre_id: this.lastID
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== ADD APPOINTMENT SLOTS ==========
router.post('/slots', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const { centre_id, slots } = req.body;

        if (!centre_id || !Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ error: 'Invalid centre ID or slots array' });
        }

        // Verify centre exists
        db.get('SELECT id FROM test_centres WHERE id = ?', [centre_id], (err, centre) => {
            if (!centre) {
                return res.status(404).json({ error: 'Centre not found' });
            }

            let addedCount = 0;
            let failureCount = 0;

            slots.forEach((slot, index) => {
                const { slot_date, slot_time, test_type, price, capacity } = slot;

                if (!slot_date || !slot_time || !test_type || !price || !capacity) {
                    failureCount++;
                    return;
                }

                db.run(
                    `INSERT INTO appointment_slots 
                    (centre_id, slot_date, slot_time, test_type, price, capacity, is_available)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [centre_id, slot_date, slot_time, test_type, price, capacity, 1],
                    function(err) {
                        if (err) {
                            failureCount++;
                        } else {
                            addedCount++;
                        }

                        // Send response after all slots processed
                        if (index === slots.length - 1) {
                            res.json({
                                success: addedCount > 0,
                                message: `Added ${addedCount} slots${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
                                added_count: addedCount,
                                failed_count: failureCount
                            });
                        }
                    }
                );
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== UPDATE APPOINTMENT SLOT ==========
router.put('/slots/:slot_id', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const { slot_id } = req.params;
        const { price, capacity, is_available } = req.body;

        let updateQuery = 'UPDATE appointment_slots SET ';
        const updates = [];
        const params = [];

        if (price !== undefined) {
            updates.push('price = ?');
            params.push(price);
        }
        if (capacity !== undefined) {
            updates.push('capacity = ?');
            params.push(capacity);
        }
        if (is_available !== undefined) {
            updates.push('is_available = ?');
            params.push(is_available ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateQuery += updates.join(', ') + ' WHERE id = ?';
        params.push(slot_id);

        db.run(updateQuery, params, function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update slot' });
            }

            res.json({
                success: true,
                message: 'Slot updated successfully'
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== DELETE APPOINTMENT SLOT ==========
router.delete('/slots/:slot_id', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const { slot_id } = req.params;

        // Check if slot has confirmed bookings
        db.get(
            'SELECT COUNT(*) as count FROM bookings WHERE appointment_slot_id = ? AND status = ?',
            [slot_id, 'confirmed'],
            (err, result) => {
                if (result.count > 0) {
                    return res.status(400).json({ error: 'Cannot delete slot with confirmed bookings' });
                }

                db.run('DELETE FROM appointment_slots WHERE id = ?', [slot_id], function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to delete slot' });
                    }

                    res.json({
                        success: true,
                        message: 'Slot deleted successfully'
                    });
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== VIEW ALL BOOKINGS (ADMIN) ==========
router.get('/bookings', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const { status, page = 1 } = req.query;
        const limit = 50;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                b.id, b.booking_reference, b.status, b.payment_status, b.created_at,
                u.email, u.full_name, u.driving_license_number,
                c.name as centre_name, s.slot_date, s.slot_time, s.price
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN appointment_slots s ON b.appointment_slot_id = s.id
            JOIN test_centres c ON s.centre_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        db.all(query, params, (err, bookings) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch bookings' });
            }

            // Get total count
            db.get(
                'SELECT COUNT(*) as count FROM bookings WHERE 1=1' + (status ? ' AND status = ?' : ''),
                status ? [status] : [],
                (err, countResult) => {
                    res.json({
                        success: true,
                        page: parseInt(page),
                        total_count: countResult.count,
                        page_size: limit,
                        bookings: bookings.map(b => ({
                            id: b.id,
                            reference: b.booking_reference,
                            user: b.full_name,
                            email: b.email,
                            centre: b.centre_name,
                            date: b.slot_date,
                            time: b.slot_time,
                            price: b.price,
                            status: b.status,
                            payment_status: b.payment_status
                        }))
                    });
                }
            );
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== VIEW PAYMENTS ==========
router.get('/payments', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const { status, page = 1 } = req.query;
        const limit = 50;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                p.id, p.transaction_id, p.amount, p.status, p.created_at,
                u.email, u.full_name,
                b.booking_reference
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            JOIN users u ON p.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        db.all(query, params, (err, payments) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch payments' });
            }

            // Get total revenue
            db.get(
                'SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payments WHERE status = ?',
                ['completed'],
                (err, revenueResult) => {
                    res.json({
                        success: true,
                        page: parseInt(page),
                        page_size: limit,
                        total_revenue: revenueResult.total_revenue,
                        payments: payments.map(p => ({
                            transaction_id: p.transaction_id,
                            booking_reference: p.booking_reference,
                            user: p.full_name,
                            email: p.email,
                            amount: p.amount,
                            status: p.status,
                            date: p.created_at
                        }))
                    });
                }
            );
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== VIEW AUDIT LOGS ==========
router.get('/audit-logs', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const { action, page = 1 } = req.query;
        const limit = 100;
        const offset = (page - 1) * limit;

        let query = `
            SELECT * FROM audit_logs
            WHERE 1=1
        `;
        const params = [];

        if (action) {
            query += ' AND action = ?';
            params.push(action);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        db.all(query, params, (err, logs) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch audit logs' });
            }

            res.json({
                success: true,
                page: parseInt(page),
                page_size: limit,
                logs: logs
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
