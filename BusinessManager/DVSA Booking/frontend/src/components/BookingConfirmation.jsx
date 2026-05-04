import { useState } from 'react';
import api from '../api';

export function BookingConfirmation({ user, slot, onBookingComplete }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingResult, setBookingResult] = useState(null);

    const handleConfirmBooking = async () => {
        setError('');
        setLoading(true);

        try {
            const names = user.full_name.split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ') || names[0];

            const response = await api.bookSlot(
                slot.id,
                firstName,
                lastName,
                user.email,
                user.phone_number
            );

            setBookingResult(response.data);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Booking failed');
        } finally {
            setLoading(false);
        }
    };

    if (bookingResult) {
        return (
            <div className="container">
                <div className="confirmation">
                    <div className="confirmation-icon">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <h2>Booking Confirmed!</h2>
                    <p>Your driving test has been successfully booked with DVSA.</p>

                    <div className="reference-number">
                        {bookingResult.dvsa_reference || bookingResult.booking_reference}
                    </div>

                    <div className="summary">
                        <h3>Booking Details</h3>
                        <div className="summary-row">
                            <span>Test Date:</span>
                            <strong>{new Date(slot.date).toLocaleDateString('en-GB', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Test Time:</span>
                            <strong>{slot.time_slot}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Test Centre:</span>
                            <strong>{slot.test_centre || 'Specified in confirmation'}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Candidate:</span>
                            <strong>{user.full_name}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Driving License:</span>
                            <strong>••••••••{user.driving_license.slice(-8)}</strong>
                        </div>
                    </div>

                    <div style={{ 
                        background: '#d4edda', 
                        color: '#155724', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginTop: '20px',
                        marginBottom: '20px' 
                    }}>
                        <i className="fas fa-envelope"></i> A confirmation email has been sent to <strong>{user.email}</strong>
                    </div>

                    <div style={{ background: '#e7f3f9', color: '#0c5460', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                        <p style={{ marginBottom: '10px' }}>
                            <i className="fas fa-info-circle"></i> <strong>Important:</strong> Please check your email for further instructions.
                        </p>
                        <ul style={{ textAlign: 'left', marginLeft: '30px' }}>
                            <li>Arrive 10 minutes early</li>
                            <li>Bring all required documents</li>
                            <li>Contact DVSA at 0344 4635 000 for any changes</li>
                        </ul>
                    </div>

                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={onBookingComplete}
                    >
                        <i className="fas fa-home"></i> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <h1><i className="fas fa-check-circle"></i> Confirm Your Booking</h1>
                <p>Review and confirm your driving test booking</p>
            </div>

            {error && <div className="message error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

            <div className="summary">
                <h3>Booking Summary</h3>
                <div className="summary-row">
                    <span>Test Date:</span>
                    <strong>{new Date(slot.date).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}</strong>
                </div>
                <div className="summary-row">
                    <span>Test Time:</span>
                    <strong>{slot.time_slot}</strong>
                </div>
                <div className="summary-row">
                    <span>Test Centre:</span>
                    <strong>{slot.test_centre || 'DVSA Test Centre'}</strong>
                </div>
                <div className="summary-row">
                    <span>Candidate Name:</span>
                    <strong>{user.full_name}</strong>
                </div>
                <div className="summary-row">
                    <span>Email:</span>
                    <strong>{user.email}</strong>
                </div>
                <div className="summary-row">
                    <span>Phone:</span>
                    <strong>{user.phone_number}</strong>
                </div>
            </div>

            <div style={{ 
                background: '#fff3cd', 
                color: '#856404', 
                padding: '15px', 
                borderRadius: '8px', 
                marginTop: '20px',
                marginBottom: '20px' 
            }}>
                <i className="fas fa-exclamation-triangle"></i> By confirming, you acknowledge that the details above are correct and this booking cannot be changed.
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={onBookingComplete}
                    disabled={loading}
                    style={{ flex: 1 }}
                >
                    Cancel
                </button>
                <button 
                    type="button" 
                    className="btn btn-success" 
                    onClick={handleConfirmBooking}
                    disabled={loading}
                    style={{ flex: 1 }}
                >
                    {loading ? 'Processing...' : 'Confirm Booking'}
                </button>
            </div>
        </div>
    );
}
