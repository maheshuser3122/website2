// Schengen Visa Appointment Booker - JavaScript Logic

// ========== VISA TYPE DATA ==========
const visaTypesData = {
    denmark: {
        country: 'Denmark',
        city: 'Copenhagen',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Schengen Visa - Study', 'Long-term Visa']
    },
    finland: {
        country: 'Finland',
        city: 'Helsinki',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Schengen Visa - Family Visit']
    },
    iceland: {
        country: 'Iceland',
        city: 'Reykjavik',
        types: ['Schengen Visa - Tourism', 'Schengen Visa - Work']
    },
    norway: {
        country: 'Norway',
        city: 'Oslo',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Work Permit']
    },
    sweden: {
        country: 'Sweden',
        city: 'Stockholm',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Student Residence Permit']
    },
    belgium: {
        country: 'Belgium',
        city: 'Brussels',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Schengen Visa - Conference']
    },
    france: {
        country: 'France',
        city: 'Paris',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Schengen Visa - Short-term']
    },
    luxembourg: {
        country: 'Luxembourg',
        city: 'Luxembourg City',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism']
    },
    netherlands: {
        country: 'Netherlands',
        city: 'Amsterdam',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Student Residence']
    },
    austria: {
        country: 'Austria',
        city: 'Vienna',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Schengen Visa - Culture']
    },
    czechrepublic: {
        country: 'Czech Republic',
        city: 'Prague',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Student Visa']
    },
    germany: {
        country: 'Germany',
        city: 'Berlin',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Skilled Worker']
    },
    hungary: {
        country: 'Hungary',
        city: 'Budapest',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism']
    },
    poland: {
        country: 'Poland',
        city: 'Warsaw',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'National Visa']
    },
    slovakia: {
        country: 'Slovakia',
        city: 'Bratislava',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism']
    },
    slovenia: {
        country: 'Slovenia',
        city: 'Ljubljana',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism']
    },
    croatia: {
        country: 'Croatia',
        city: 'Zagreb',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism']
    },
    greece: {
        country: 'Greece',
        city: 'Athens',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Long-term Visa']
    },
    italy: {
        country: 'Italy',
        city: 'Rome',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Cultural Exchange']
    },
    malta: {
        country: 'Malta',
        city: 'Valletta',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism']
    },
    portugal: {
        country: 'Portugal',
        city: 'Lisbon',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Retirement Visa']
    },
    spain: {
        country: 'Spain',
        city: 'Madrid',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'Student Visa']
    },
    romania: {
        country: 'Romania',
        city: 'Bucharest',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism']
    },
    bulgaria: {
        country: 'Bulgaria',
        city: 'Sofia',
        types: ['Schengen Visa - Business', 'Schengen Visa - Tourism', 'National Visa']
    }
};

// ========== MOCK APPOINTMENT DATA ==========
function generateMockAppointments(country, visaType, dateRange) {
    const appointments = [];
    const now = new Date();
    let daysToGenerate = 30;

    if (dateRange === 'week') daysToGenerate = 7;
    else if (dateRange === 'month') daysToGenerate = 30;
    else if (dateRange === '3months') daysToGenerate = 90;

    const countryData = visaTypesData[country];
    const baseTime = parseInt(country.charCodeAt(0)) % 3; // Vary base time by country

    for (let i = 1; i <= daysToGenerate; i += Math.floor(Math.random() * 2) + 1) {
        const appointmentDate = new Date(now);
        appointmentDate.setDate(appointmentDate.getDate() + i);

        // Skip weekends
        if (appointmentDate.getDay() === 0 || appointmentDate.getDay() === 6) continue;

        // Generate multiple time slots per day
        for (let slot = 0; slot < 3; slot++) {
            const hour = 8 + baseTime + (slot * 2) + Math.floor(Math.random() * 2);
            const minute = Math.random() > 0.5 ? 0 : 30;

            appointments.push({
                id: `apt_${country}_${i}_${slot}`,
                date: appointmentDate.toISOString().split('T')[0],
                time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                country: countryData.country,
                city: countryData.city,
                visaType: visaType,
                duration: 15,
                availability: Math.floor(Math.random() * 5) + 1,
                processingTime: Math.floor(Math.random() * 7) + 3,
                difficulty: Math.random() > 0.7 ? 'moderate' : 'easy'
            });
        }
    }

    return appointments.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateA - dateB;
    });
}

// ========== STATE MANAGEMENT ==========
let userBookings = JSON.parse(localStorage.getItem('schengenBookings')) || [];
let selectedSlot = null;
let currentRecommendedSlot = null;

// ========== TAB SWITCHING ==========
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.content-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));

    const activeNavTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeNavTab) {
        activeNavTab.classList.add('active');
    }

    // Load content for specific tabs
    if (tabName === 'bookings') {
        displayBookings();
    }
}

// ========== VISA TYPE POPULATION ==========
function populateVisaTypes() {
    const countrySelect = document.getElementById('country');
    const visaTypeSelect = document.getElementById('visaType');
    const selectedCountry = countrySelect.value;

    visaTypeSelect.innerHTML = '<option value="">-- Select Visa Type --</option>';

    if (selectedCountry && visaTypesData[selectedCountry]) {
        const types = visaTypesData[selectedCountry].types;
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            visaTypeSelect.appendChild(option);
        });
    }
}

// ========== SEARCH APPOINTMENTS ==========
function searchAppointments() {
    const country = document.getElementById('country').value;
    const visaType = document.getElementById('visaType').value;
    const dateRange = document.getElementById('preferredDate').value;

    const appointmentsGrid = document.getElementById('appointmentsGrid');
    const emptyState = document.getElementById('emptyState');
    const appointmentsList = document.getElementById('appointmentsList');

    if (!country || !visaType) {
        showToast('Please select both country and visa type', 'warning');
        return;
    }

    const appointments = generateMockAppointments(country, visaType, dateRange);

    if (appointments.length === 0) {
        appointmentsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        showToast('No appointments available. Try a different date range or country.', 'info');
        return;
    }

    appointmentsList.innerHTML = '';
    appointments.forEach(apt => {
        const card = createAppointmentCard(apt);
        appointmentsList.appendChild(card);
    });

    document.getElementById('slotCount').textContent = `${appointments.length} slots available`;
    appointmentsGrid.style.display = 'block';
    emptyState.style.display = 'none';

    // Update recommended slot
    updateRecommendedSlots();

    // Scroll to results
    appointmentsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`Found ${appointments.length} available appointments!`, 'success');
}

// ========== CREATE APPOINTMENT CARD ==========
function createAppointmentCard(appointment) {
    const card = document.createElement('div');
    card.className = 'appointment-card';
    card.dataset.id = appointment.id;

    const dateObj = new Date(appointment.date + ' ' + appointment.time);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    let availabilityClass = '';
    let availabilityText = appointment.availability + ' slots';
    if (appointment.availability <= 2) {
        availabilityClass = 'very-low';
        availabilityText = 'VERY LIMITED';
    } else if (appointment.availability <= 3) {
        availabilityClass = 'low';
        availabilityText = 'LIMITED';
    }

    card.innerHTML = `
        <div class="appointment-time">${appointment.time}</div>
        <div class="appointment-date">${dayName}, ${formattedDate}</div>
        <div class="appointment-details">
            <p><strong>${appointment.country}</strong></p>
            <p>${appointment.city}</p>
            <p>Duration: ~${appointment.duration} minutes</p>
            <p>Processing: ${appointment.processingTime} days</p>
            <span class="availability ${availabilityClass}">${availabilityText}</span>
        </div>
        <div class="appointment-actions">
            <button class="btn-book" onclick="selectAndBook(this.closest('.appointment-card'))">Book Now</button>
        </div>
    `;

    card.onclick = (e) => {
        if (!e.target.closest('.btn-book')) {
            card.classList.toggle('selected');
        }
    };

    return card;
}

// ========== SELECT AND BOOK ==========
function selectAndBook(card) {
    selectedSlot = {
        id: card.dataset.id,
        time: card.querySelector('.appointment-time').textContent,
        date: card.querySelector('.appointment-date').textContent,
        details: card.querySelector('.appointment-details').innerText
    };
    openBookingModal();
}

// ========== AI RECOMMENDATIONS ==========
function updateRecommendedSlots() {
    const country = document.getElementById('country').value;
    const visaType = document.getElementById('visaType').value;

    if (!country || !visaType) {
        document.getElementById('aiRecommendation').style.display = 'none';
        return;
    }

    const appointments = generateMockAppointments(country, visaType, '');

    if (appointments.length > 0) {
        // AI Algorithm: Find best appointment based on multiple factors
        let bestSlot = appointments[0];
        let bestScore = 0;

        appointments.forEach(apt => {
            let score = 0;

            // Prefer weekday mornings (8-10 AM)
            const hour = parseInt(apt.time.split(':')[0]);
            if (hour >= 8 && hour <= 10) score += 30;

            // Prefer mid-week (Tue, Wed, Thu)
            const date = new Date(apt.date);
            const dayOfWeek = date.getDay();
            if (dayOfWeek >= 2 && dayOfWeek <= 4) score += 25;

            // Prefer shorter processing times
            score += (10 - apt.processingTime);

            // Prefer availability (more slots = not too crowded)
            if (apt.availability >= 3) score += 20;

            // Add some randomness for variety
            score += Math.random() * 10;

            if (score > bestScore) {
                bestScore = score;
                bestSlot = apt;
            }
        });

        currentRecommendedSlot = bestSlot;
        const recText = `🤖 I recommend the <strong>${bestSlot.time}</strong> slot on <strong>${bestSlot.date}</strong>. This is typically one of the fastest-processing appointments with good availability. Wednesday mornings have the shortest wait times!`;

        document.getElementById('recommendationText').innerHTML = recText;
        document.getElementById('aiRecommendation').style.display = 'block';
    }
}

// ========== BOOK RECOMMENDED SLOT ==========
function bookRecommendedSlot() {
    if (currentRecommendedSlot) {
        selectedSlot = {
            id: currentRecommendedSlot.id,
            time: currentRecommendedSlot.time,
            date: currentRecommendedSlot.date,
            details: `${currentRecommendedSlot.country} - ${currentRecommendedSlot.visaType}`
        };
        openBookingModal();
    }
}

// ========== BOOKING MODAL ==========
function openBookingModal() {
    if (!selectedSlot) return;

    const modal = document.getElementById('bookingModal');
    const bookingDetails = document.getElementById('bookingDetails');

    bookingDetails.innerHTML = `
        <p><strong>Country:</strong> ${selectedSlot.details.split(' - ')[0]}</p>
        <p><strong>Visa Type:</strong> ${selectedSlot.details.split(' - ')[1]}</p>
        <p><strong>Time:</strong> ${selectedSlot.time}</p>
        <p><strong>Date:</strong> ${selectedSlot.date}</p>
    `;

    modal.classList.add('show');
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('show');
}

// ========== CONFIRM BOOKING ==========
function confirmBooking() {
    const fullName = document.getElementById('fullName').value;
    const passportNumber = document.getElementById('passportNumber').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    if (!fullName || !passportNumber || !email || !phone) {
        showToast('Please fill in all fields', 'warning');
        return;
    }

    const booking = {
        id: 'booking_' + Date.now(),
        appointmentId: selectedSlot.id,
        fullName: fullName,
        passportNumber: passportNumber,
        email: email,
        phone: phone,
        time: selectedSlot.time,
        date: selectedSlot.date,
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };

    userBookings.push(booking);
    localStorage.setItem('schengenBookings', JSON.stringify(userBookings));

    closeBookingModal();
    document.getElementById('bookingForm').reset();

    showToast('✓ Booking confirmed! Confirmation sent to ' + email, 'success');

    // Update notification badge
    updateNotificationBadge();

    // Send notification
    addNotification(`Booking confirmed for ${fullName}`, 'success');
}

// ========== DISPLAY BOOKINGS ==========
function displayBookings() {
    const bookingsList = document.getElementById('bookingsList');
    const noBookings = document.getElementById('noBookings');

    if (userBookings.length === 0) {
        bookingsList.innerHTML = '';
        noBookings.style.display = 'block';
        return;
    }

    noBookings.style.display = 'none';
    bookingsList.innerHTML = '';

    userBookings.forEach(booking => {
        const card = document.createElement('div');
        card.className = `booking-card ${booking.status}`;
        card.innerHTML = `
            <div class="booking-header">
                <div class="booking-title">${booking.fullName}</div>
                <div class="booking-status ${booking.status}">${booking.status.toUpperCase()}</div>
            </div>
            <div class="booking-info">
                <div class="booking-info-item">
                    <div class="booking-info-label">Appointment ID</div>
                    <div class="booking-info-value">${booking.appointmentId}</div>
                </div>
                <div class="booking-info-item">
                    <div class="booking-info-label">Time</div>
                    <div class="booking-info-value">${booking.time}</div>
                </div>
                <div class="booking-info-item">
                    <div class="booking-info-label">Date</div>
                    <div class="booking-info-value">${booking.date}</div>
                </div>
                <div class="booking-info-item">
                    <div class="booking-info-label">Email</div>
                    <div class="booking-info-value">${booking.email}</div>
                </div>
            </div>
            <div class="booking-actions">
                <button onclick="rescheduleBooking('${booking.id}')">Reschedule</button>
                <button onclick="cancelBooking('${booking.id}')">Cancel</button>
                <button onclick="downloadConfirmation('${booking.id}')">Download</button>
            </div>
        `;
        bookingsList.appendChild(card);
    });
}

// ========== BOOKING MANAGEMENT ==========
function rescheduleBooking(bookingId) {
    showToast('Redirecting to search... Select a new appointment', 'info');
    switchTab('search');
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure? This will cancel your appointment.')) {
        userBookings = userBookings.filter(b => b.id !== bookingId);
        localStorage.setItem('schengenBookings', JSON.stringify(userBookings));
        displayBookings();
        showToast('Booking cancelled', 'info');
        addNotification('Booking cancelled', 'warning');
    }
}

function downloadConfirmation(bookingId) {
    const booking = userBookings.find(b => b.id === bookingId);
    if (booking) {
        showToast('Downloading confirmation PDF...', 'success');
    }
}

// ========== AI CHATBOT ==========
function toggleAIAssistant() {
    const chatbot = document.getElementById('aiChatbot');
    chatbot.classList.toggle('hidden');
}

function handleChatInput(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const userQuery = document.getElementById('userQuery').value.trim();
    if (!userQuery) return;

    // Display user message
    const chatMessages = document.getElementById('chatbotMessages');
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'chat-message user-message';
    userMessageDiv.innerHTML = `<p>${escapeHtml(userQuery)}</p>`;
    chatMessages.appendChild(userMessageDiv);

    // Get AI response
    const response = getAIResponse(userQuery);

    // Display AI response
    setTimeout(() => {
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'chat-message bot-message';
        aiMessageDiv.innerHTML = `<i class="fas fa-robot"></i><p>${response}</p>`;
        chatMessages.appendChild(aiMessageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 500);

    document.getElementById('userQuery').value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ========== AI RESPONSE LOGIC ==========
function getAIResponse(query) {
    const q = query.toLowerCase();

    const responses = {
        requirements: [
            'Common Schengen visa requirements include: valid passport (6 months validity), travel health insurance, proof of accommodation, proof of financial means, round-trip tickets, and completed application form.',
            'Requirements vary by country. Most embassies require a medical exam, proof of employment, and travel itinerary.'
        ],
        processing: [
            'Standard processing time for Schengen visas is typically 5-10 business days. Expedited processing (2-5 days) is available at extra cost.',
            'Processing times vary: Italy 10-15 days, France 5-7 days, Germany 8-10 days. Rush services available for urgent cases.'
        ],
        cost: [
            'Schengen visa fees typically range from €60-€99 for short-term visas ($70-$120 USD). Children often get reduced fees.',
            'Visa fee is usually €80 for adults, €40 for children (6-12 years). Extended visas cost more.'
        ],
        appointment: [
            'I recommend booking appointments on Wednesdays or Thursdays mornings (8-10 AM). These have the shortest wait times and fastest processing.',
            'Peak season is March-June. Book 2-3 months before your travel date for better availability.'
        ],
        documents: [
            'Essential documents: valid passport, completed visa form, travel insurance, proof of funds, hotel booking, and employment letter.',
            'Bring originals and copies. Some embassies require bank statements, property deeds, and family documents.'
        ],
        default: [
            'I can help you find Schengen visa appointments, answer questions about requirements, and provide tips for successful applications. What would you like to know?',
            'Ask me about visa requirements, processing times, appointment availability, document checklist, or visa costs.'
        ]
    };

    // Determine response category
    let category = 'default';
    if (q.includes('requirement') || q.includes('need') || q.includes('document')) category = 'requirements';
    else if (q.includes('process') || q.includes('how long') || q.includes('time')) category = 'processing';
    else if (q.includes('cost') || q.includes('price') || q.includes('fee')) category = 'cost';
    else if (q.includes('appointment') || q.includes('book') || q.includes('slot')) category = 'appointment';
    else if (q.includes('document') || q.includes('bring')) category = 'documents';

    const responseList = responses[category] || responses.default;
    return responseList[Math.floor(Math.random() * responseList.length)];
}

// ========== NOTIFICATIONS ==========
function addNotification(message, type = 'info') {
    const notificationsList = document.getElementById('notificationsList');
    const notif = document.createElement('div');
    notif.className = `notification-item ${type}`;

    const iconMap = {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-circle'
    };

    notif.innerHTML = `
        <i class="fas ${iconMap[type]}"></i>
        <span>${message}</span>
    `;

    notificationsList.insertBefore(notif, notificationsList.firstChild);
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const count = document.querySelectorAll('.notification-item').length;
    const badge = document.getElementById('notificationBadge');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    }
}

// ========== TOAST NOTIFICATION ==========
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.style.background = type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#1f2937';

    setTimeout(() => {
        closeToast();
    }, 4000);
}

function closeToast() {
    document.getElementById('toast').classList.add('hidden');
}

// ========== UTILITY FUNCTIONS ==========
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Hide chatbot initially
    document.getElementById('aiChatbot').classList.add('hidden');

    // Setup event listeners
    document.getElementById('aiToggle').addEventListener('click', toggleAIAssistant);

    // Load initial state
    if (userBookings.length > 0) {
        updateNotificationBadge();
    }

    // Add welcome notification
    setTimeout(() => {
        addNotification('Welcome! Use Search to find visa appointments or ask the AI Assistant for help', 'info');
    }, 1000);
});
