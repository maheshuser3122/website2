import { useState, useEffect } from 'react';
import { RegisterLogin } from './components/RegisterLogin.jsx';
import { DVSAAuth } from './components/DVSAAuth.jsx';
import { SlotBrowser } from './components/SlotBrowser.jsx';
import { BookingConfirmation } from './components/BookingConfirmation.jsx';

export default function App() {
    const [currentStep, setCurrentStep] = useState('login');
    const [user, setUser] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Try to restore user session on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        if (savedUser && savedToken) {
            try {
                setUser(JSON.parse(savedUser));
                setCurrentStep('dvsa_auth');
            } catch (e) {
                console.error('Failed to parse saved user:', e);
            }
        }
    }, []);

    const handleLoginSuccess = (userData) => {
        console.log('✓ Login successful:', userData);
        setUser(userData);
        setCurrentStep('dvsa_auth');
    };

    const handleDVSAAuthSuccess = () => {
        console.log('✓ DVSA auth successful');
        setCurrentStep('slot_browser');
    };

    const handleSlotSelected = (slot) => {
        console.log('✓ Slot selected:', slot);
        setSelectedSlot(slot);
        setCurrentStep('confirmation');
    };

    const handleBookingComplete = () => {
        console.log('✓ Booking complete');
        setSelectedSlot(null);
        setCurrentStep('slot_browser');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setSelectedSlot(null);
        setCurrentStep('login');
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Navigation */}
            {user && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    padding: '15px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backdropFilter: 'blur(10px)',
                    flexShrink: 0
                }}>
                    <div>
                        <strong>{user.full_name}</strong>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            padding: '8px 16px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '0.9em'
                        }}
                    >
                        Logout
                    </button>
                </div>
            )}

            {/* Step Indicator */}
            {user && currentStep !== 'login' && (
                <div style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '20px', paddingLeft: '20px', paddingRight: '20px', width: '100%', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px' }}>
                        <div style={{ textAlign: 'center', color: currentStep === 'dvsa_auth' ? '#667eea' : '#999' }}>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>1</div>
                            <div>DVSA Auth</div>
                        </div>
                        <div style={{ textAlign: 'center', color: currentStep === 'slot_browser' ? '#667eea' : '#999' }}>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>2</div>
                            <div>Browse Slots</div>
                        </div>
                        <div style={{ textAlign: 'center', color: currentStep === 'confirmation' ? '#667eea' : '#999' }}>
                            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>3</div>
                            <div>Confirm</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
                {currentStep === 'login' && (
                    <RegisterLogin onSuccess={handleLoginSuccess} />
                )}

                {currentStep === 'dvsa_auth' && user && (
                    <DVSAAuth user={user} onSuccess={handleDVSAAuthSuccess} />
                )}

                {currentStep === 'slot_browser' && user && (
                    <SlotBrowser user={user} onSlotSelected={handleSlotSelected} />
                )}

                {currentStep === 'confirmation' && user && selectedSlot && (
                    <BookingConfirmation user={user} slot={selectedSlot} onBookingComplete={handleBookingComplete} />
                )}

                {!currentStep && (
                    <div style={{ color: 'white', fontSize: '1.5em' }}>Loading...</div>
                )}
            </div>
        </div>
    );
}
