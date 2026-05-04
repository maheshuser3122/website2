import { useState } from 'react';
import api from '../api';

export function DVSAAuth({ user, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [authenticated, setAuthenticated] = useState(false);

    const [formData, setFormData] = useState({
        date_of_birth: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAuthenticate = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!formData.date_of_birth) {
                throw new Error('Date of birth required');
            }

            const response = await api.authenticateWithDVSA(
                user.driving_license,
                formData.date_of_birth
            );

            if (response.data.success) {
                setAuthenticated(true);
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    if (authenticated) {
        return (
            <div className="container">
                <div className="message success">
                    <i className="fas fa-check-circle"></i>
                    Successfully authenticated with DVSA! Fetching available slots...
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <h1><i className="fas fa-lock"></i> DVSA Authentication</h1>
                <p>Verify your identity to access real test slots</p>
            </div>

            {error && <div className="message error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

            <div className="summary">
                <h3>Your Information</h3>
                <div className="summary-row">
                    <span>Name:</span>
                    <strong>{user.full_name}</strong>
                </div>
                <div className="summary-row">
                    <span>Email:</span>
                    <strong>{user.email}</strong>
                </div>
                <div className="summary-row">
                    <span>Driving License:</span>
                    <strong>••••••••{user.driving_license.slice(-8)}</strong>
                </div>
            </div>

            <form onSubmit={handleAuthenticate}>
                <div className="form-group">
                    <label>Date of Birth (DD/MM/YYYY)</label>
                    <input
                        type="text"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        placeholder="15/01/1990"
                        maxLength="10"
                        required
                    />
                </div>

                <div style={{ background: '#e7f3f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#0c5460' }}>
                    <i className="fas fa-info-circle"></i> We'll securely authenticate you with DVSA using your driving license and date of birth.
                </div>

                <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Authenticating...' : 'Authenticate with DVSA'}
                </button>
            </form>
        </div>
    );
}
