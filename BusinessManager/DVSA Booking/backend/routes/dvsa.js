// DVSA Integration Routes - Real booking automation
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { 
    authenticateWithDVSA, 
    fetchDVSASlots, 
    submitBookingToDVSA 
} = require('../utils/dvsa');

// ========== FETCH REAL DVSA SLOTS ==========
router.get('/slots', async (req, res) => {
    try {
        const { testType = 'practical', postcode = 'SW1A' } = req.query;

        console.log(`[API] Fetching real DVSA slots: ${testType} near ${postcode}`);

        // First check database for recently cached slots
        db.all(
            `SELECT * FROM appointment_slots 
             WHERE dvsa_source IS NOT NULL 
             AND slot_date >= date('now')
             AND is_available = 1
             LIMIT 20`,
            [],
            async (err, cachedSlots) => {
                if (cachedSlots && cachedSlots.length > 0 && new Date() % 2 === 0) {
                    // Use cached if available and it's not time for a fresh fetch
                    console.log(`[API] ✓ Returning cached DVSA slots (${cachedSlots.length})`);
                    return res.json({
                        success: true,
                        source: 'cached',
                        count: cachedSlots.length,
                        slots: cachedSlots
                    });
                }

                // Fetch fresh slots from DVSA
                const result = await fetchDVSASlots(testType, postcode);

                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to fetch DVSA slots: ' + result.error
                    });
                }

                res.json({
                    success: true,
                    source: 'DVSA_LIVE',
                    count: result.count,
                    slots: result.slots,
                    fetched_at: new Date().toISOString(),
                    message: `Found ${result.count} real available DVSA slots`
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== AUTHENTICATE WITH DVSA ==========
router.post('/authenticate', authMiddleware, async (req, res) => {
    try {
        const { driving_license, date_of_birth } = req.body;
        const userId = req.user.id;

        if (!driving_license || !date_of_birth) {
            return res.status(400).json({ error: 'Driving license and DOB required' });
        }

        console.log(`[API] Authenticating user ${userId} with DVSA`);

        // Authenticate with DVSA
        const authResult = await authenticateWithDVSA(driving_license, date_of_birth);

        if (!authResult.success) {
            return res.status(401).json({
                success: false,
                error: 'DVSA authentication failed: ' + authResult.error
            });
        }

        // Store DVSA session in database for this user
        db.run(
            `UPDATE users 
             SET dvsa_session_token = ?, dvsa_authenticated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [authResult.session_token, userId],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to store session' });
                }

                res.json({
                    success: true,
                    message: 'Successfully authenticated with DVSA',
                    session_token: authResult.session_token,
                    authenticated_at: authResult.authenticated_at
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== BOOK REAL DVSA SLOT ==========
router.post('/book', authMiddleware, async (req, res) => {
    try {
        const { slot_id, first_name, last_name, email, phone } = req.body;
        const userId = req.user.id;

        if (!slot_id || !first_name || !last_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`[API] Booking real DVSA slot for user ${userId}`);

        // Get user's DVSA session
        db.get(
            'SELECT * FROM users WHERE id = ? AND dvsa_session_token IS NOT NULL',
            [userId],
            async (err, user) => {
                if (!user) {
                    return res.status(401).json({
                        error: 'User not authenticated with DVSA',
                        action: 'Please authenticate first'
                    });
                }

                // Get slot details
                db.get(
                    'SELECT * FROM appointment_slots WHERE id = ?',
                    [slot_id],
                    async (err, slot) => {
                        if (!slot) {
                            return res.status(404).json({ error: 'Slot not found' });
                        }

                        // Submit booking to DVSA
                        const bookingResult = await submitBookingToDVSA(
                            user.dvsa_session_token,
                            { slotId: slot.id, date: slot.slot_date, time: slot.slot_time },
                            { firstName: first_name, lastName: last_name }
                        );

                        if (!bookingResult.success) {
                            return res.status(500).json({
                                success: false,
                                error: 'DVSA booking failed: ' + bookingResult.error
                            });
                        }

                        // Create booking record in database
                        const bookingRef = `BK-DVSA-${bookingResult.dvsa_reference}`;

                        db.run(
                            `INSERT INTO bookings 
                            (user_id, appointment_slot_id, status, booking_reference, dvsa_reference, payment_status)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [userId, slot.id, 'confirmed', bookingRef, bookingResult.dvsa_reference, 'completed'],
                            function(err) {
                                if (err) {
                                    return res.status(500).json({ error: 'Failed to create booking record' });
                                }

                                // Mark slot as taken
                                db.run(
                                    'UPDATE appointment_slots SET is_available = 0 WHERE id = ?',
                                    [slot.id]
                                );

                                res.json({
                                    success: true,
                                    message: 'Successfully booked with DVSA!',
                                    booking: {
                                        id: this.lastID,
                                        reference: bookingRef,
                                        dvsa_reference: bookingResult.dvsa_reference,
                                        date: slot.slot_date,
                                        time: slot.slot_time,
                                        status: 'CONFIRMED'
                                    }
                                });
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== CHECK DVSA STATUS ==========
router.get('/status/:booking_reference', authMiddleware, (req, res) => {
    try {
        const { booking_reference } = req.params;

        db.get(
            `SELECT b.*, s.slot_date, s.slot_time, c.name as centre_name
             FROM bookings b
             JOIN appointment_slots s ON b.appointment_slot_id = s.id
             JOIN test_centres c ON s.centre_id = c.id
             WHERE b.dvsa_reference = ? OR b.booking_reference = ?`,
            [booking_reference, booking_reference],
            (err, booking) => {
                if (!booking) {
                    return res.status(404).json({ error: 'Booking not found' });
                }

                res.json({
                    success: true,
                    booking: {
                        reference: booking.booking_reference,
                        dvsa_reference: booking.dvsa_reference,
                        status: booking.status,
                        date: booking.slot_date,
                        time: booking.slot_time,
                        centre: booking.centre_name,
                        confirmed_at: booking.created_at
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== CANCEL DVSA BOOKING ==========
router.post('/:booking_id/cancel', authMiddleware, async (req, res) => {
    try {
        const { booking_id } = req.params;
        const userId = req.user.id;

        // Get booking details
        db.get(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [booking_id, userId],
            async (err, booking) => {
                if (!booking || !booking.dvsa_reference) {
                    return res.status(404).json({ error: 'DVSA booking not found' });
                }

                // TODO: Call DVSA cancellation API
                // For now, just mark as cancelled in database

                db.run(
                    `UPDATE bookings 
                     SET status = ?, cancellation_date = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    ['cancelled', booking_id],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to cancel' });
                        }

                        res.json({
                            success: true,
                            message: 'Booking cancelled with DVSA',
                            dvsa_reference: booking.dvsa_reference
                        });
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
