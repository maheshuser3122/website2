// AI routes - smart matching and recommendations
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

// ========== GET PERSONALIZED RECOMMENDATIONS ==========
router.post('/recommend', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { test_type, preferred_location, preferred_time, budget_limit } = req.body;

        // Fetch user profile and history
        db.get(
            'SELECT * FROM users WHERE id = ?',
            [userId],
            (err, user) => {
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                // Check if user has verified theory pass
                if (!user.theory_pass_certificate) {
                    return res.status(400).json({ 
                        error: 'Please verify your theory pass first',
                        action: 'verify_theory_pass'
                    });
                }

                // Get user's previous bookings to understand patterns
                db.all(
                    `SELECT 
                        b.id, s.test_type, c.city, s.slot_date,
                        (SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = 'completed') as completed_bookings
                    FROM bookings b
                    JOIN appointment_slots s ON b.appointment_slot_id = s.id
                    JOIN test_centres c ON s.centre_id = c.id
                    WHERE b.user_id = ?
                    LIMIT 5`,
                    [userId, userId],
                    (err, bookingHistory) => {
                        // Query available slots with AI scoring
                        db.all(
                            `SELECT 
                                s.id, s.slot_date, s.slot_time, s.test_type, s.price, s.capacity,
                                c.id as centre_id, c.name, c.city, c.distance_km, c.phone,
                                (SELECT COUNT(*) FROM bookings WHERE appointment_slot_id = s.id AND status = 'confirmed') as booked_count
                            FROM appointment_slots s
                            JOIN test_centres c ON s.centre_id = c.id
                            WHERE s.is_available = 1
                            AND s.slot_date >= date('now')
                            AND s.slot_date <= date('now', '+30 days')
                            ${test_type ? "AND s.test_type = '" + test_type.replace(/'/g, "''") + "'" : ''}
                            ORDER BY s.slot_date, s.slot_time
                            LIMIT 100`,
                            [],
                            (err, slots) => {
                                if (err || !slots || slots.length === 0) {
                                    return res.status(404).json({ error: 'No available slots' });
                                }

                                // AI Scoring Algorithm
                                const scoredRecommendations = slots.map(slot => {
                                    let score = 50; // Base score

                                    // Factor 1: Price (15 points - cheaper is better)
                                    if (budget_limit) {
                                        if (slot.price <= budget_limit) {
                                            score += 15;
                                        } else {
                                            score -= (slot.price - budget_limit) / 10;
                                        }
                                    } else {
                                        score += Math.max(0, 15 - (slot.price / 10));
                                    }

                                    // Factor 2: Location (20 points - prefer nearer)
                                    if (preferred_location) {
                                        if (slot.city.toLowerCase() === preferred_location.toLowerCase()) {
                                            score += 20;
                                        } else if (slot.distance_km && slot.distance_km < 20) {
                                            score += Math.max(5, 20 - (slot.distance_km / 2));
                                        }
                                    } else if (slot.distance_km && slot.distance_km < 15) {
                                        score += Math.max(5, 15 - (slot.distance_km / 2));
                                    }

                                    // Factor 3: Availability (10 points - prefer less crowded)
                                    const occupancyRate = (slot.booked_count / slot.capacity) * 100;
                                    score += Math.max(0, 10 - (occupancyRate / 10));

                                    // Factor 4: Time preference (10 points)
                                    if (preferred_time) {
                                        const slotHour = parseInt(slot.slot_time);
                                        const prefHour = parseInt(preferred_time);
                                        const timeDiff = Math.abs(slotHour - prefHour);
                                        score += Math.max(0, 10 - timeDiff);
                                    } else {
                                        // Prefer afternoon slots (14:00-16:00) as they're typically less crowded
                                        const hour = parseInt(slot.slot_time);
                                        if (hour >= 14 && hour <= 16) {
                                            score += 5;
                                        }
                                    }

                                    // Factor 5: Slot availability (5 points)
                                    const daysFromNow = Math.floor((new Date(slot.slot_date) - new Date()) / (1000 * 60 * 60 * 24));
                                    if (daysFromNow <= 7) {
                                        score += 5; // Encourage early booking
                                    }

                                    // Factor 6: Test type match (if specified)
                                    if (test_type && slot.test_type === test_type) {
                                        score += 5;
                                    }

                                    return {
                                        ...slot,
                                        ai_score: Math.min(100, Math.max(0, score)),
                                        occupancy_percent: Math.round(occupancyRate),
                                        days_from_now: daysFromNow,
                                        availability_slots: Math.max(0, slot.capacity - slot.booked_count)
                                    };
                                });

                                // Sort by AI score descending
                                scoredRecommendations.sort((a, b) => b.ai_score - a.ai_score);

                                // Get top 5 recommendations
                                const topRecommendations = scoredRecommendations.slice(0, 5);

                                // Store recommendations for audit trail
                                topRecommendations.forEach((rec, index) => {
                                    db.run(
                                        `INSERT INTO ai_recommendations 
                                        (user_id, slot_id, algorithm_version, confidence_score, recommendation_rank)
                                         VALUES (?, ?, ?, ?, ?)`,
                                        [userId, rec.id, '2.0', rec.ai_score, index + 1],
                                        (err) => {
                                            if (err) console.error('Failed to store recommendation');
                                        }
                                    );
                                });

                                res.json({
                                    success: true,
                                    message: 'AI has found matching appointments',
                                    user_verified: user.verified,
                                    theory_pass_verified: !!user.theory_pass_certificate,
                                    theory_pass_valid_until: user.theory_pass_date,
                                    recommendations: topRecommendations.map(rec => ({
                                        id: rec.id,
                                        centre: rec.name,
                                        location: `${rec.city} (${rec.distance_km}km)`,
                                        date: rec.slot_date,
                                        time: rec.slot_time,
                                        test_type: rec.test_type,
                                        price: rec.price,
                                        availability: `${rec.availability_slots} slots available`,
                                        occupancy: `${rec.occupancy_percent}% booked`,
                                        ai_confidence: `${Math.round(rec.ai_score)}%`,
                                        days_away: rec.days_from_now
                                    }))
                                });
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

// ========== AUTO-BOOK BEST MATCH ==========
router.post('/auto-book', authMiddleware, (req, res) => {
    try {
        const userId = req.user.id;
        const { test_type, preferred_location, preferred_time } = req.body;

        if (!test_type) {
            return res.status(400).json({ error: 'Test type is required' });
        }

        // Get user and verify theory pass
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
            if (!user || !user.theory_pass_certificate) {
                return res.status(400).json({ error: 'Theory pass not verified' });
            }

            // Find the best available slot (same AI logic as /recommend)
            db.all(
                `SELECT 
                    s.id, s.slot_date, s.slot_time, s.test_type, s.price,
                    c.id as centre_id, c.name, c.city, c.distance_km,
                    (SELECT COUNT(*) FROM bookings WHERE appointment_slot_id = s.id AND status = 'confirmed') as booked_count,
                    s.capacity
                FROM appointment_slots s
                JOIN test_centres c ON s.centre_id = c.id
                WHERE s.is_available = 1
                AND s.test_type = ?
                AND s.slot_date >= date('now')
                ORDER BY s.slot_date
                LIMIT 20`,
                [test_type],
                (err, slots) => {
                    if (!slots || slots.length === 0) {
                        return res.status(404).json({ error: 'No slots available for this test type' });
                    }

                    // Score and pick best slot
                    let bestSlot = slots[0];
                    let bestScore = 0;

                    slots.forEach(slot => {
                        let score = 50;

                        // Prefer slots with availability
                        const occupancy = (slot.booked_count / slot.capacity);
                        score += (1 - occupancy) * 30;

                        // Prefer preferred location
                        if (preferred_location && slot.city.toLowerCase() === preferred_location.toLowerCase()) {
                            score += 20;
                        }

                        // Prefer closer slots
                        score += Math.max(0, 20 - (slot.distance_km * 2));

                        if (score > bestScore) {
                            bestScore = score;
                            bestSlot = slot;
                        }
                    });

                    // Create booking automatically
                    const bookingRef = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

                    db.run(
                        `INSERT INTO bookings 
                        (user_id, appointment_slot_id, status, booking_reference, payment_status)
                         VALUES (?, ?, ?, ?, ?)`,
                        [userId, bestSlot.id, 'pending_payment', bookingRef, 'pending'],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ error: 'Failed to create booking' });
                            }

                            // Store as AI-generated recommendation
                            db.run(
                                `INSERT INTO ai_recommendations 
                                (user_id, booking_id, slot_id, algorithm_version, confidence_score)
                                 VALUES (?, ?, ?, ?, ?)`,
                                [userId, this.lastID, bestSlot.id, '2.0', bestScore],
                                (err) => {
                                    if (err) console.error('Failed to store recommendation');
                                }
                            );

                            res.json({
                                success: true,
                                message: 'Auto-booking created successfully',
                                booking: {
                                    id: this.lastID,
                                    reference: bookingRef,
                                    centre: bestSlot.name,
                                    date: bestSlot.slot_date,
                                    time: bestSlot.slot_time,
                                    price: bestSlot.price,
                                    status: 'Ready for payment',
                                    ai_confidence_score: Math.round(bestScore)
                                }
                            });
                        }
                    );
                }
            );
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== GET RECOMMENDATION HISTORY ==========
router.get('/history', authMiddleware, (req, res) => {
    try {
        const userId = req.user.id;

        db.all(
            `SELECT 
                ar.*, s.slot_date, s.slot_time, c.name as centre_name,
                b.booking_reference
            FROM ai_recommendations ar
            LEFT JOIN appointment_slots s ON ar.slot_id = s.id
            LEFT JOIN test_centres c ON s.centre_id = c.id
            LEFT JOIN bookings b ON ar.booking_id = b.id
            WHERE ar.user_id = ?
            ORDER BY ar.created_at DESC
            LIMIT 20`,
            [userId],
            (err, history) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch history' });
                }

                res.json({
                    success: true,
                    count: history.length,
                    recommendations: history.map(h => ({
                        recommendation_id: h.id,
                        algorithm: h.algorithm_version,
                        confidence: Math.round(h.confidence_score),
                        rank: h.recommendation_rank,
                        centre: h.centre_name,
                        date: h.slot_date,
                        time: h.slot_time,
                        booking_reference: h.booking_reference,
                        created: h.created_at
                    }))
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== AI INSIGHTS & ANALYTICS ==========
router.get('/insights/:user_id', authMiddleware, (req, res) => {
    try {
        const { user_id } = req.params;
        const requestUserId = req.user.id;

        // Only allow users to see their own insights
        if (parseInt(user_id) !== requestUserId && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        db.get(
            `SELECT 
                COUNT(DISTINCT b.id) as total_bookings_made,
                COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
                COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
                COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
                AVG(p.amount) as average_booking_cost,
                MIN(s.slot_date) as first_booking_date,
                MAX(s.slot_date) as last_booking_date
            FROM bookings b
            LEFT JOIN appointment_slots s ON b.appointment_slot_id = s.id
            LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'completed'
            WHERE b.user_id = ?`,
            [user_id],
            (err, stats) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch insights' });
                }

                // Get most booked centres
                db.all(
                    `SELECT 
                        c.name as centre_name,
                        COUNT(*) as bookings
                    FROM bookings b
                    JOIN appointment_slots s ON b.appointment_slot_id = s.id
                    JOIN test_centres c ON s.centre_id = c.id
                    WHERE b.user_id = ?
                    GROUP BY c.id
                    ORDER BY bookings DESC
                    LIMIT 5`,
                    [user_id],
                    (err, topCentres) => {
                        res.json({
                            success: true,
                            user_id: user_id,
                            booking_statistics: stats,
                            preferred_centres: topCentres || [],
                            ai_recommendations: {
                                next_suggested_action: 'Book earliest available test',
                                suggested_test_type: 'Practical Test',
                                best_time_to_book: 'Tuesday-Thursday, 14:00-16:00'
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

module.exports = router;
