// Bookings routes - handles booking creation, modification, and retrieval
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { generateBookingReference } = require('../utils/auth');

// ========== AI MATCHING ENGINE ==========
function findBestSlots(userId, preferences) {
    return new Promise((resolve, reject) => {
        // Query available slots matching preferences
        let query = `
            SELECT 
                s.id, s.centre_id, s.slot_date, s.slot_time, 
                s.test_type, s.price, 
                c.name as centre_name, c.city, c.postcode, c.distance_km,
                (SELECT COUNT(*) FROM bookings WHERE appointment_slot_id = s.id AND status = 'confirmed') as bookings_count,
                s.capacity,
                ROUND((s.capacity - (SELECT COUNT(*) FROM bookings WHERE appointment_slot_id = s.id AND status = 'confirmed')) / 
                      NULLIF(s.capacity, 0) * 100) as availability_percentage
            FROM appointment_slots s
            JOIN test_centres c ON s.centre_id = c.id
            WHERE s.is_available = 1
            AND s.slot_date >= date('now')
        `;
        
        const params = [];

        // Filter by test type if specified
        if (preferences.test_type) {
            query += ' AND s.test_type = ?';
            params.push(preferences.test_type);
        }

        // Filter by preferred city/postcode if specified
        if (preferences.city) {
            query += ' AND LOWER(c.city) = LOWER(?)';
            params.push(preferences.city);
        }

        // Filter by date range if specified
        if (preferences.start_date) {
            query += ' AND s.slot_date >= ?';
            params.push(preferences.start_date);
        }
        if (preferences.end_date) {
            query += ' AND s.slot_date <= ?';
            params.push(preferences.end_date);
        }

        query += ' LIMIT 20';

        db.all(query, params, (err, slots) => {
            if (err) reject(err);

            // Score and rank slots
            const scoredSlots = slots.map(slot => {
                let score = 100;

                // Prefer slots with higher availability (less booked)
                score += (slot.availability_percentage || 0) / 2;

                // Prefer slots at preferred time if specified
                if (preferences.preferred_time) {
                    const slotHour = parseInt(slot.slot_time);
                    const prefHour = parseInt(preferences.preferred_time);
                    const hourDiff = Math.abs(slotHour - prefHour);
                    score += (24 - hourDiff) * 2; // Closer time = higher score
                }

                // Prefer closer centres if distance specified
                if (preferences.max_distance && slot.distance_km) {
                    if (slot.distance_km <= preferences.max_distance) {
                        score += 50 - (slot.distance_km * 2);
                    }
                }

                // Prefer earlier dates (book sooner)
                const daysDiff = Math.floor((new Date(slot.slot_date) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysDiff >= 0) {
                    score += Math.max(0, 30 - daysDiff); // Sooner dates = higher score
                }

                return {
                    ...slot,
                    confidence_score: Math.min(100, Math.max(0, score))
                };
            });

            // Sort by confidence score descending
            scoredSlots.sort((a, b) => b.confidence_score - a.confidence_score);

            resolve(scoredSlots.slice(0, 3)); // Return top 3 recommendations
        });
    });
}

// ========== CREATE BOOKING (with AI matching) ==========
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { test_type, city, start_date, end_date, preferred_time, max_distance } = req.body;

        // Verify user has theory pass
        db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
            if (!user || !user.theory_pass_certificate) {
                return res.status(400).json({ error: 'Please verify your theory pass before booking' });
            }

            // Get AI recommendations
            try {
                const recommendations = await findBestSlots(userId, {
                    test_type,
                    city,
                    start_date,
                    end_date,
                    preferred_time,
                    max_distance
                });

                if (recommendations.length === 0) {
                    return res.status(404).json({ error: 'No available slots matching your criteria' });
                }

                return res.json({
                    success: true,
                    message: 'AI matched available slots',
                    recommendations: recommendations.map(slot => ({
                        id: slot.id,
                        centre_name: slot.centre_name,
                        city: slot.city,
                        postcode: slot.postcode,
                        date: slot.slot_date,
                        time: slot.slot_time,
                        test_type: slot.test_type,
                        price: slot.price,
                        availability: `${slot.availability_percentage}%`,
                        confidence_score: Math.round(slot.confidence_score)
                    }))
                });
            } catch (error) {
                return res.status(500).json({ error: 'AI matching failed: ' + error.message });
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== CONFIRM BOOKING ==========
router.post('/confirm', authMiddleware, (req, res) => {
    try {
        const userId = req.user.id;
        const { appointment_slot_id, notes } = req.body;

        if (!appointment_slot_id) {
            return res.status(400).json({ error: 'Appointment slot ID required' });
        }

        // Verify slot exists and is available
        db.get(
            `SELECT * FROM appointment_slots WHERE id = ? AND is_available = 1`,
            [appointment_slot_id],
            (err, slot) => {
                if (!slot) {
                    return res.status(404).json({ error: 'Slot not available' });
                }

                // Generate booking reference
                const bookingReference = generateBookingReference();

                // Create booking
                db.run(
                    `INSERT INTO bookings 
                    (user_id, appointment_slot_id, status, booking_reference, notes, payment_status)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, appointment_slot_id, 'pending', bookingReference, notes || null, 'pending'],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to create booking' });
                        }

                        // Store AI recommendation for audit trail
                        db.run(
                            `INSERT INTO ai_recommendations 
                            (user_id, booking_id, slot_id, algorithm_version, confidence_score)
                             VALUES (?, ?, ?, ?, ?)`,
                            [userId, this.lastID, appointment_slot_id, '1.0', 85],
                            (err) => {
                                if (err) console.error('Failed to store AI recommendation');
                            }
                        );

                        res.status(201).json({
                            success: true,
                            message: 'Booking created successfully',
                            booking: {
                                id: this.lastID,
                                reference: bookingReference,
                                status: 'pending',
                                slot_date: slot.slot_date,
                                slot_time: slot.slot_time,
                                price: slot.price,
                                next_step: 'Complete payment to confirm your booking'
                            }
                        });
                    }
                );
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== LIST USER BOOKINGS ==========
router.get('/my-bookings', authMiddleware, (req, res) => {
    try {
        const userId = req.user.id;

        db.all(
            `SELECT 
                b.id, b.booking_reference, b.status, b.payment_status, b.created_at,
                b.cancellation_date, b.cancellation_reason,
                s.slot_date, s.slot_time, s.test_type, s.price,
                c.name as centre_name, c.city, c.postcode
            FROM bookings b
            JOIN appointment_slots s ON b.appointment_slot_id = s.id
            JOIN test_centres c ON s.centre_id = c.id
            WHERE b.user_id = ?
            ORDER BY s.slot_date DESC`,
            [userId],
            (err, bookings) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch bookings' });
                }

                res.json({
                    success: true,
                    count: bookings.length,
                    bookings: bookings.map(b => ({
                        id: b.id,
                        reference: b.booking_reference,
                        status: b.status,
                        payment_status: b.payment_status,
                        centre: b.centre_name,
                        location: `${b.city}, ${b.postcode}`,
                        date: b.slot_date,
                        time: b.slot_time,
                        test_type: b.test_type,
                        price: b.price,
                        created: b.created_at
                    }))
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== GET BOOKING DETAILS ==========
router.get('/:booking_id', authMiddleware, (req, res) => {
    try {
        const { booking_id } = req.params;
        const userId = req.user.id;

        db.get(
            `SELECT 
                b.*, c.name, c.address, c.city, c.phone,
                s.slot_date, s.slot_time, s.test_type, s.price,
                p.stripe_payment_id, p.amount, p.status as payment_status
            FROM bookings b
            JOIN appointment_slots s ON b.appointment_slot_id = s.id
            JOIN test_centres c ON s.centre_id = c.id
            LEFT JOIN payments p ON b.id = p.booking_id
            WHERE b.id = ? AND b.user_id = ?`,
            [booking_id, userId],
            (err, booking) => {
                if (!booking) {
                    return res.status(404).json({ error: 'Booking not found' });
                }

                res.json({
                    success: true,
                    booking: {
                        reference: booking.booking_reference,
                        status: booking.status,
                        date: booking.slot_date,
                        time: booking.slot_time,
                        test_type: booking.test_type,
                        centre: {
                            name: booking.name,
                            address: booking.address,
                            city: booking.city,
                            phone: booking.phone
                        },
                        price: booking.price,
                        payment: {
                            status: booking.payment_status,
                            stripe_id: booking.stripe_payment_id,
                            amount: booking.amount
                        }
                    }
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== RESCHEDULE BOOKING ==========
router.put('/:booking_id/reschedule', authMiddleware, async (req, res) => {
    try {
        const { booking_id } = req.params;
        const { new_slot_id } = req.body;
        const userId = req.user.id;

        if (!new_slot_id) {
            return res.status(400).json({ error: 'New slot ID required' });
        }

        // Verify booking exists and belongs to user
        db.get(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = ?',
            [booking_id, userId, 'confirmed'],
            (err, booking) => {
                if (!booking) {
                    return res.status(404).json({ error: 'Booking not found or cannot be rescheduled' });
                }

                // Check if reschedule window is open (3+ days before)
                db.get(
                    'SELECT slot_date FROM appointment_slots WHERE id = ?',
                    [booking.appointment_slot_id],
                    (err, oldSlot) => {
                        const daysUntilBooking = Math.floor(
                            (new Date(oldSlot.slot_date) - new Date()) / (1000 * 60 * 60 * 24)
                        );

                        if (daysUntilBooking < 3) {
                            return res.status(400).json({
                                error: 'Cannot reschedule within 3 days of appointment'
                            });
                        }

                        // Verify new slot exists and is available
                        db.get(
                            'SELECT * FROM appointment_slots WHERE id = ? AND is_available = 1',
                            [new_slot_id],
                            (err, newSlot) => {
                                if (!newSlot) {
                                    return res.status(404).json({ error: 'New slot not available' });
                                }

                                // Update booking
                                db.run(
                                    `UPDATE bookings 
                                    SET appointment_slot_id = ?, rescheduled_from_slot_id = ?, modified_at = CURRENT_TIMESTAMP
                                    WHERE id = ?`,
                                    [new_slot_id, booking.appointment_slot_id, booking_id],
                                    function(err) {
                                        if (err) {
                                            return res.status(500).json({ error: 'Reschedule failed' });
                                        }

                                        res.json({
                                            success: true,
                                            message: 'Booking rescheduled successfully',
                                            new_date: newSlot.slot_date,
                                            new_time: newSlot.slot_time
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== CANCEL BOOKING ==========
router.delete('/:booking_id/cancel', authMiddleware, (req, res) => {
    try {
        const { booking_id } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        db.get(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [booking_id, userId],
            (err, booking) => {
                if (!booking) {
                    return res.status(404).json({ error: 'Booking not found' });
                }

                if (['cancelled', 'completed'].includes(booking.status)) {
                    return res.status(400).json({ error: 'Cannot cancel this booking' });
                }

                db.run(
                    `UPDATE bookings 
                    SET status = ?, cancellation_date = CURRENT_TIMESTAMP, cancellation_reason = ?
                    WHERE id = ?`,
                    ['cancelled', reason || null, booking_id],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Cancellation failed' });
                        }

                        res.json({
                            success: true,
                            message: 'Booking cancelled successfully',
                            refund_status: 'Processing'
                        });
                    }
                );
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
