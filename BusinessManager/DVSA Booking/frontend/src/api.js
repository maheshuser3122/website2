import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    // Auth endpoints
    register: (data) => 
        apiClient.post('/auth/register', data),
    
    login: (email, password) => 
        apiClient.post('/auth/login', { email, password }),
    
    // DVSA endpoints
    authenticateWithDVSA: (driving_license, date_of_birth) => 
        apiClient.post('/dvsa/authenticate', { driving_license, date_of_birth }),
    
    fetchDVSASlots: (testType, postcode) => 
        apiClient.get('/dvsa/slots', { params: { testType, postcode } }),
    
    bookSlot: (slot_id, first_name, last_name, email, phone) => 
        apiClient.post('/dvsa/book', { slot_id, first_name, last_name, email, phone }),
    
    checkBookingStatus: (booking_reference) => 
        apiClient.get(`/dvsa/status/${booking_reference}`),
    
    // Centres endpoints
    searchCentres: (postcode, radius) => 
        apiClient.get('/centres/search', { params: { postcode, radius } }),
    
    getCentreDetail: (centre_id) => 
        apiClient.get(`/centres/${centre_id}`),
    
    // Health check
    health: () => 
        apiClient.get('/health')
};

export default api;
