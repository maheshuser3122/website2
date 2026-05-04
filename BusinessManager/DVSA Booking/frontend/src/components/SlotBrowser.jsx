import { useState, useEffect } from 'react';
import api from '../api';

export function SlotBrowser({ user, onSlotSelected }) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [filters, setFilters] = useState({
        postcode: 'SW1A',
        testType: 'practical'
    });

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.fetchDVSASlots(filters.testType, filters.postcode);
            setSlots(response.data.slots || []);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch slots');
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSlots();
    };

    const handleSelectSlot = (slot) => {
        setSelectedSlot(slot);
    };

    const handleProceed = () => {
        if (selectedSlot) {
            onSlotSelected(selectedSlot);
        }
    };

    return (
        <div className="container">
            <div className="header">
                <h1><i className="fas fa-calendar"></i> Available Test Slots</h1>
                <p>Real slots from DVSA - Book your practical test</p>
            </div>

            {error && <div className="message error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

            <form onSubmit={handleSearch} style={{ marginBottom: '30px' }}>
                <div className="two-column">
                    <div className="form-group">
                        <label>Test Type</label>
                        <select
                            name="testType"
                            value={filters.testType}
                            onChange={handleFilterChange}
                        >
                            <option value="practical">Practical Test</option>
                            <option value="theory">Theory Test</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Postcode</label>
                        <input
                            type="text"
                            name="postcode"
                            value={filters.postcode}
                            onChange={handleFilterChange}
                            placeholder="e.g., SW1A, EC1A"
                        />
                    </div>
                </div>
                <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Searching...' : 'Search Slots'}
                </button>
            </form>

            {loading && (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Fetching real DVSA slots...</p>
                </div>
            )}

            {!loading && slots.length === 0 && !error && (
                <div className="message info">
                    <i className="fas fa-info-circle"></i> No slots available for the selected criteria. Try searching for a different postcode or test type.
                </div>
            )}

            {!loading && slots.length > 0 && (
                <>
                    <div style={{ marginBottom: '20px', color: '#666' }}>
                        Found <strong>{slots.length}</strong> available slots
                    </div>

                    <div className="slot-grid">
                        {slots.map((slot, index) => (
                            <div
                                key={slot.id || index}
                                className={`slot-card ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                                onClick={() => handleSelectSlot(slot)}
                            >
                                <div className="slot-date">
                                    {new Date(slot.date).toLocaleDateString('en-GB', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </div>
                                <div className="slot-time">
                                    <i className="fas fa-clock"></i> {slot.time_slot}
                                </div>
                                {slot.test_centre && (
                                    <div style={{ color: '#667eea', fontWeight: 'bold', marginTop: '10px' }}>
                                        <i className="fas fa-map-marker-alt"></i> {slot.test_centre}
                                    </div>
                                )}
                                {selectedSlot?.id === slot.id && (
                                    <div style={{ marginTop: '10px', color: '#28a745' }}>
                                        <i className="fas fa-check-circle"></i> Selected
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {selectedSlot && (
                        <div style={{ marginTop: '30px' }}>
                            <button type="button" className="btn btn-success" onClick={handleProceed}>
                                Proceed to Book <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
