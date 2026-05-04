// Email notification service
const nodemailer = require('nodemailer');

// Initialize transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// ========== EMAIL TEMPLATES ==========

function bookingConfirmationEmail(user, booking, centre, slot) {
    return {
        to: user.email,
        subject: `Booking Confirmed: Reference ${booking.booking_reference}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">✅ Your Booking is Confirmed!</h2>
                
                <p>Hi ${user.full_name},</p>
                
                <p>Thank you for booking your appointment. Here are your booking details:</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Booking Details</h3>
                    <p><strong>Reference Number:</strong> ${booking.booking_reference}</p>
                    <p><strong>Test Centre:</strong> ${centre.name}</p>
                    <p><strong>Address:</strong> ${centre.address}, ${centre.city}, ${centre.postcode}</p>
                    <p><strong>Date:</strong> ${slot.slot_date}</p>
                    <p><strong>Time:</strong> ${slot.slot_time}</p>
                    <p><strong>Test Type:</strong> ${slot.test_type}</p>
                    <p><strong>Fee:</strong> £${slot.price.toFixed(2)}</p>
                </div>
                
                <h3>📍 How to Get There</h3>
                <p>Phone: ${centre.phone}</p>
                <p>Email: ${centre.email}</p>
                <p>Hours: ${centre.hours}</p>
                
                <h3>Important Information</h3>
                <ul>
                    <li>Arrive 10 minutes early</li>
                    <li>Bring your photocard driving licence</li>
                    <li>Bring proof of address</li>
                    <li>Bring your theory pass certificate</li>
                </ul>
                
                <h3>Need to Reschedule?</h3>
                <p>You can reschedule your appointment up to 3 days before the scheduled date.</p>
                
                <h3>Need to Cancel?</h3>
                <p>You can cancel your appointment up to 3 days before the scheduled date for a full refund.</p>
                
                <p style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                    This is an automated email. Please don't reply directly to this email.
                    <br>
                    <a href="http://localhost:3000/bookings/${booking.id}">View Booking Online</a>
                </p>
            </div>
        `
    };
}

function paymentConfirmationEmail(user, booking, payment) {
    return {
        to: user.email,
        subject: `Payment Confirmed: ${payment.transaction_id}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #27ae60;">💳 Payment Received</h2>
                
                <p>Hi ${user.full_name},</p>
                
                <p>Your payment has been successfully processed.</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Transaction ID:</strong> ${payment.transaction_id}</p>
                    <p><strong>Amount Paid:</strong> £${payment.amount.toFixed(2)}</p>
                    <p><strong>Date:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
                    <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
                </div>
                
                <p>Your appointment is now fully booked and confirmed. You should receive a separate confirmation email with all your booking details.</p>
                
                <p style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                    <a href="http://localhost:3000/payments/${payment.id}">View Payment</a>
                </p>
            </div>
        `
    };
}

function bookingCancellationEmail(user, booking, centre, refund_amount) {
    return {
        to: user.email,
        subject: `Booking Cancelled: Reference ${booking.booking_reference}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">❌ Booking Cancelled</h2>
                
                <p>Hi ${user.full_name},</p>
                
                <p>Your appointment has been cancelled as requested.</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
                    <p><strong>Test Centre:</strong> ${centre.name}</p>
                    <p><strong>Refund Amount:</strong> £${refund_amount?.toFixed(2) || '0.00'}</p>
                    <p><strong>Refund Status:</strong> Processing (5-7 business days)</p>
                </div>
                
                <p>If you have any questions about your cancellation, please contact us.</p>
                
                <h3>Ready to Rebook?</h3>
                <p><a href="http://localhost:3000/bookings/new" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Book Another Appointment</a></p>
            </div>
        `
    };
}

function reschedulingConfirmationEmail(user, booking, newCentre, newSlot, oldSlot) {
    return {
        to: user.email,
        subject: `Appointment Rescheduled: Reference ${booking.booking_reference}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f39c12;">📅 Appointment Rescheduled</h2>
                
                <p>Hi ${user.full_name},</p>
                
                <p>Your appointment has been successfully rescheduled.</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Original Appointment</h3>
                    <p><strong>Date:</strong> ${oldSlot.slot_date} at ${oldSlot.slot_time}</p>
                    
                    <h3>New Appointment</h3>
                    <p><strong>Reference:</strong> ${booking.booking_reference}</p>
                    <p><strong>Date:</strong> ${newSlot.slot_date} at ${newSlot.slot_time}</p>
                    <p><strong>Test Centre:</strong> ${newCentre.name}</p>
                    <p><strong>Address:</strong> ${newCentre.address}, ${newCentre.city}</p>
                </div>
                
                <p>No additional payment is required for this reschedule.</p>
            </div>
        `
    };
}

function passwordResetEmail(user, resetToken) {
    return {
        to: user.email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                
                <p>If you requested a password reset, click the link below:</p>
                
                <p style="margin: 30px 0; text-align: center;">
                    <a href="http://localhost:3000/reset-password?token=${resetToken}" 
                       style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </p>
                
                <p style="color: #999;">This link expires in 1 hour.</p>
                
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `
    };
}

function reminderEmail(user, booking, centre, slot) {
    const daysUntil = Math.floor((new Date(slot.slot_date) - new Date()) / (1000 * 60 * 60 * 24));
    
    return {
        to: user.email,
        subject: `Reminder: Your appointment is in ${daysUntil} days`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>📢 Appointment Reminder</h2>
                
                <p>Hi ${user.full_name},</p>
                
                <p>Your appointment is coming up in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Reference:</strong> ${booking.booking_reference}</p>
                    <p><strong>Date:</strong> ${slot.slot_date} at ${slot.slot_time}</p>
                    <p><strong>Centre:</strong> ${centre.name}</p>
                    <p><strong>Address:</strong> ${centre.address}</p>
                </div>
                
                <h3>What to Bring</h3>
                <ul>
                    <li>Photocard driving licence</li>
                    <li>Proof of address</li>
                    <li>Theory pass certificate</li>
                </ul>
                
                <h3>Need to Reschedule or Cancel?</h3>
                <p><a href="http://localhost:3000/bookings/${booking.id}">Manage Booking</a></p>
            </div>
        `
    };
}

// ========== SEND FUNCTIONS ==========

async function sendBookingConfirmation(user, booking, centre, slot) {
    try {
        const mailOptions = bookingConfirmationEmail(user, booking, centre, slot);
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Booking confirmation sent to ${user.email}`);
        return result;
    } catch (error) {
        console.error(`❌ Failed to send booking confirmation: ${error.message}`);
        throw error;
    }
}

async function sendPaymentConfirmation(user, booking, payment) {
    try {
        const mailOptions = paymentConfirmationEmail(user, booking, payment);
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Payment confirmation sent to ${user.email}`);
        return result;
    } catch (error) {
        console.error(`❌ Failed to send payment confirmation: ${error.message}`);
        throw error;
    }
}

async function sendCancellationConfirmation(user, booking, centre, refund_amount) {
    try {
        const mailOptions = bookingCancellationEmail(user, booking, centre, refund_amount);
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Cancellation confirmation sent to ${user.email}`);
        return result;
    } catch (error) {
        console.error(`❌ Failed to send cancellation confirmation: ${error.message}`);
        throw error;
    }
}

async function sendReschedulingConfirmation(user, booking, newCentre, newSlot, oldSlot) {
    try {
        const mailOptions = reschedulingConfirmationEmail(user, booking, newCentre, newSlot, oldSlot);
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Rescheduling confirmation sent to ${user.email}`);
        return result;
    } catch (error) {
        console.error(`❌ Failed to send rescheduling confirmation: ${error.message}`);
        throw error;
    }
}

async function sendPasswordResetEmail(user, resetToken) {
    try {
        const mailOptions = passwordResetEmail(user, resetToken);
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${user.email}`);
        return result;
    } catch (error) {
        console.error(`❌ Failed to send password reset email: ${error.message}`);
        throw error;
    }
}

async function sendAppointmentReminder(user, booking, centre, slot) {
    try {
        const mailOptions = reminderEmail(user, booking, centre, slot);
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Reminder email sent to ${user.email}`);
        return result;
    } catch (error) {
        console.error(`❌ Failed to send reminder email: ${error.message}`);
        throw error;
    }
}

// ========== SCHEDULED REMINDERS ==========

async function scheduleAllReminders() {
    const db = require('./database');
    
    try {
        // Get appointments in 24 hours
        db.all(
            `SELECT 
                b.id, b.booking_reference, u.email, u.full_name,
                s.slot_date, s.slot_time, c.name as centre_name, c.address, c.city
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN appointment_slots s ON b.appointment_slot_id = s.id
            JOIN test_centres c ON s.centre_id = c.id
            WHERE b.status = 'confirmed'
            AND DATE(s.slot_date) = DATE('now', '+1 day')
            AND b.reminder_sent = 0`,
            [],
            async (err, bookings) => {
                if (err) {
                    console.error('Failed to fetch bookings for reminders');
                    return;
                }

                for (const booking of bookings) {
                    try {
                        await sendAppointmentReminder(
                            { email: booking.email, full_name: booking.full_name },
                            booking,
                            { name: booking.centre_name, address: booking.address, city: booking.city },
                            { slot_date: booking.slot_date, slot_time: booking.slot_time }
                        );

                        // Mark reminder as sent
                        db.run('UPDATE bookings SET reminder_sent = 1 WHERE id = ?', [booking.id]);
                    } catch (error) {
                        console.error(`Reminder failed for booking ${booking.id}`);
                    }
                }
            }
        );
    } catch (error) {
        console.error('Scheduled reminders error:', error.message);
    }
}

module.exports = {
    transporter,
    sendBookingConfirmation,
    sendPaymentConfirmation,
    sendCancellationConfirmation,
    sendReschedulingConfirmation,
    sendPasswordResetEmail,
    sendAppointmentReminder,
    scheduleAllReminders
};
