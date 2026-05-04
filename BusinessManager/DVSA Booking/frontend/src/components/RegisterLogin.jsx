import { useState } from 'react';
import api from '../api';

export function RegisterLogin({ onSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        driving_license: '',
        phone_number: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            let response;
            if (isLogin) {
                if (!formData.email || !formData.password) {
                    throw new Error('Email and password required');
                }
                response = await api.login(formData.email, formData.password);
            } else {
                if (!formData.email || !formData.password || !formData.full_name || !formData.driving_license || !formData.phone_number) {
                    throw new Error('All fields required');
                }
                if (formData.driving_license.length !== 16) {
                    throw new Error('Driving license must be 16 characters');
                }
                response = await api.register(formData);
            }

            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            setSuccess(`${isLogin ? 'Login' : 'Registration'} successful! Redirecting...`);
            setTimeout(() => {
                onSuccess(user);
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="header">
                <h1><i className="fas fa-car"></i> DVSA Booking</h1>
                <p>Book your UK driving test online</p>
            </div>

            {error && <div className="message error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
            {success && <div className="message success"><i className="fas fa-check-circle"></i> {success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 8 characters"
                        required
                    />
                </div>

                {!isLogin && (
                    <>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="form-group">
                            <label>Driving License (16 characters)</label>
                            <input
                                type="text"
                                name="driving_license"
                                value={formData.driving_license}
                                onChange={handleChange}
                                placeholder="AB12CD34EF56GH78"
                                maxLength="16"
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder="+441234567890"
                            />
                        </div>
                    </>
                )}

                <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        textDecoration: 'underline'
                    }}
                >
                    {isLogin ? 'Register' : 'Login'}
                </button>
            </div>
        </div>
    );
}
