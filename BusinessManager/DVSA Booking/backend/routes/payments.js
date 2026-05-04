// Payments route - handles Stripe payment processing
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { generateTransactionId } = require('../utils/auth');
const Stripe = require('stripe');

// Initialize Stripe (key from environment)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// ========== CREATE PAYMENT INTENT ==========
router.post('/create-intent', authMiddleware, (req, res) => {
    try {
        const { booking_id, amount } = req.body;
        const userId = req.user.id;

        if (!booking_id || !amount) {
            return res.status(400).json({ error: 'Booking ID and amount required' });
        }

        // Verify booking exists and belongs to user
        db.get(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [booking_id, userId],
            async (err, booking) => {
                if (!booking) {
                    return res.status(404).json({ error: 'Booking not found' });
                }

                if (booking.payment_status === 'completed') {
                    return res.status(400).json({ error: 'Booking already paid' });
                }

                try {
                    // Create Stripe payment intent
                    const paymentIntent = await stripe.paymentIntents.create({
                        amount: Math.round(amount * 100), // Convert to pence
                        currency: 'gbp',
                        metadata: {
                            booking_id: booking_id.toString(),
                            user_id: userId.toString()
                        },
                        receipt_email: req.user.email
                    });

                    res.json({
                        success: true,
                        client_secret: paymentIntent.client_secret,
                        amount: amount,
                        booking_id: booking_id
                    });
                } catch (stripeError) {
                    return res.status(500).json({ error: 'Payment intent creation failed: ' + stripeError.message });
                }
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== CONFIRM PAYMENT ==========
router.post('/confirm', authMiddleware, (req, res) => {
    try {
        const { booking_id, stripe_payment_id, amount } = req.body;
        const userId = req.user.id;

        if (!booking_id || !stripe_payment_id || !amount) {
            return res.status(400).json({ error: 'Missing payment details' });
        }

        // Verify booking belongs to user
        db.get(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [booking_id, userId],
            async (err, booking) => {
                if (!booking) {
                    return res.status(404).json({ error: 'Booking not found' });
                }

                try {
                    // Retrieve payment intent from Stripe
                    const paymentIntent = await stripe.paymentIntents.retrieve(stripe_payment_id);

                    if (paymentIntent.status !== 'succeeded') {
                        return res.status(400).json({ error: 'Payment not successful' });
                    }

                    const transactionId = generateTransactionId();

                    // Create payment record
                    db.run(
                        `INSERT INTO payments 
                        (booking_id, user_id, stripe_payment_id, amount, currency, status, transaction_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [booking_id, userId, stripe_payment_id, amount, 'gbp', 'completed', transactionId],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ error: 'Failed to record payment' });
                            }

                            // Update booking status
                            db.run(
                                `UPDATE bookings 
                                SET status = ?, payment_status = ?, confirmation_sent = 1
                                WHERE id = ?`,
                                ['confirmed', 'completed', booking_id],
                                function(err) {
                                    if (err) {
                                        return res.status(500).json({ error: 'Failed to update booking' });
                                    }

                                    // Log audit
                                    db.run(
                                        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
                                         VALUES (?, ?, ?, ?, ?, ?)`,
                                        [
                                            userId,
                                            'payment_completed',
                                            'booking',
                                            booking_id,
                                            JSON.stringify({ amount, transaction_id: transactionId }),
                                            req.ip
                                        ],
                                        (err) => {
                                            if (err) console.error('Audit log failed');
                                        }
                                    );

                                    res.json({
                                        success: true,
                                        message: 'Payment successful',
                                        booking_id: booking_id,
                                        transaction_id: transactionId,
                                        status: 'confirmed',
                                        next_step: 'Check your email for booking confirmation'
                                    });
                                }
                            );
                        }
                    );
                } catch (stripeError) {
                    return res.status(500).json({ error: 'Payment verification failed: ' + stripeError.message });
                }
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== GET PAYMENT STATUS ==========
router.get('/:booking_id/status', authMiddleware, (req, res) => {
    try {
        const { booking_id } = req.params;
        const userId = req.user.id;

        db.get(
            `SELECT 
                b.id, b.booking_reference, b.payment_status,
                p.stripe_payment_id, p.amount, p.transaction_id, p.created_at
            FROM bookings b
            LEFT JOIN payments p ON b.id = p.booking_id
            WHERE b.id = ? AND b.user_id = ?`,
            [booking_id, userId],
            (err, result) => {
                if (!result) {
                    return res.status(404).json({ error: 'Booking not found' });
                }

                res.json({
                    success: true,
                    payment_status: result.payment_status,
                    stripe_payment_id: result.stripe_payment_id,
                    amount: result.amount,
                    transaction_id: result.transaction_id,
                    paid_at: result.created_at
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== PROCESS REFUND ==========
router.post('/:booking_id/refund', authMiddleware, (req, res) => {
    try {
        const { booking_id } = req.params;
        const userId = req.user.id;
        const { reason } = req.body;

        db.get(
            `SELECT b.*, p.stripe_payment_id, p.amount
            FROM bookings b
            JOIN payments p ON b.id = p.booking_id
            WHERE b.id = ? AND b.user_id = ?`,
            [booking_id, userId],
            async (err, booking) => {
                if (!booking) {
                    return res.status(404).json({ error: 'Booking or payment not found' });
                }

                // Check if booking can be refunded (3+ days before appointment)
                db.get(
                    'SELECT slot_date FROM appointment_slots WHERE id = ?',
                    [booking.appointment_slot_id],
                    async (err, slot) => {
                        const daysUntilBooking = Math.floor(
                            (new Date(slot.slot_date) - new Date()) / (1000 * 60 * 60 * 24)
                        );

                        if (daysUntilBooking < 3) {
                            return res.status(400).json({
                                error: 'Cannot refund within 3 days of appointment'
                            });
                        }

                        try {
                            // Create refund through Stripe
                            const refund = await stripe.refunds.create({
                                payment_intent: booking.stripe_payment_id,
                                amount: Math.round(booking.amount * 100),
                                metadata: {
                                    booking_id: booking_id.toString(),
                                    reason: reason || 'User requested'
                                }
                            });

                            // Update payment record
                            db.run(
                                'UPDATE payments SET status = ?, refund_id = ? WHERE booking_id = ?',
                                ['refunded', refund.id, booking_id],
                                function(err) {
                                    if (err) {
                                        return res.status(500).json({ error: 'Failed to update payment' });
                                    }

                                    // Update booking
                                    db.run(
                                        'UPDATE bookings SET status = ?, cancellation_date = CURRENT_TIMESTAMP WHERE id = ?',
                                        ['cancelled', booking_id],
                                        function(err) {
                                            res.json({
                                                success: true,
                                                message: 'Refund processed successfully',
                                                refund_id: refund.id,
                                                amount_refunded: booking.amount,
                                                status: 'Refund initiated'
                                            });
                                        }
                                    );
                                }
                            );
                        } catch (stripeError) {
                            return res.status(500).json({ error: 'Refund processing failed: ' + stripeError.message });
                        }
                    }
                );
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== WEBHOOK - Handle Stripe Events ==========
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle payment_intent.succeeded
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const { booking_id, user_id } = paymentIntent.metadata;

            // Log the event
            db.run(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    user_id,
                    'payment_webhook_succeeded',
                    'booking',
                    booking_id,
                    JSON.stringify({ stripe_id: paymentIntent.id })
                ],
                (err) => {
                    if (err) console.error('Webhook audit log failed');
                }
            );
        }

        // Handle charge.refunded
        if (event.type === 'charge.refunded') {
            const charge = event.data.object;
            console.log(`Refund processed: ${charge.id}`);

            db.run(
                `INSERT INTO audit_logs (user_id, action, entity_type, details)
                 VALUES (?, ?, ?, ?)`,
                [
                    null,
                    'payment_refunded_webhook',
                    'payment',
                    JSON.stringify({ charge_id: charge.id, refunded_amount: charge.amount_refunded })
                ],
                (err) => {
                    if (err) console.error('Refund audit log failed');
                }
            );
        }

        res.json({ received: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
