// UK Driving License Appointment Booker - JavaScript

// ========== TEST CENTRE DATA ==========
const testCentres = [
    { id: 'centre_london_1', name: 'Central London Test Centre', city: 'London', postcode: 'SW1A 1AA', address: '123 Westminster Road', phone: '020 1234 5678', tests: ['Theory', 'Practical'], availability: 8, region: 'London', testDuration: 40 },
    { id: 'centre_london_2', name: 'Northampton Road Centre', city: 'London', postcode: 'N1 2DJ', address: '456 Northampton Rd', phone: '020 2345 6789', tests: ['Theory', 'Practical'], availability: 3, region: 'London', testDuration: 40 },
    { id: 'centre_manchester_1', name: 'Manchester City Centre', city: 'Manchester', postcode: 'M1 1AA', address: '789 Princess Street', phone: '0161 345 6789', tests: ['Theory', 'Practical'], availability: 6, region: 'North', testDuration: 40 },
    { id: 'centre_birmingham_1', name: 'Birmingham Test Centre', city: 'Birmingham', postcode: 'B4 7ET', address: '321 Broad Street', phone: '0121 456 7890', tests: ['Theory', 'Practical'], availability: 5, region: 'Midlands', testDuration: 40 },
    { id: 'centre_leeds_1', name: 'Leeds City Centre', city: 'Leeds', postcode: 'LS1 1HG', address: '654 City Square', phone: '0113 567 8901', tests: ['Theory', 'Practical'], availability: 7, region: 'North', testDuration: 40 },
    { id: 'centre_bristol_1', name: 'Bristol Test Centre', city: 'Bristol', postcode: 'BS1 3DZ', address: '987 College Green', phone: '0117 678 9012', tests: ['Theory', 'Practical'], availability: 4, region: 'South West', testDuration: 40 },
    { id: 'centre_edinburgh_1', name: 'Edinburgh Test Centre', city: 'Edinburgh', postcode: 'EH1 3AA', address: '234 High Street', phone: '0131 789 0123', tests: ['Theory', 'Practical'], availability: 2, region: 'Scotland', testDuration: 40 },
    { id: 'centre_cardiff_1', name: 'Cardiff Test Centre', city: 'Cardiff', postcode: 'CF10 1AA', address: '567 Queen Street', phone: '029 890 1234', tests: ['Theory', 'Practical'], availability: 6, region: 'Wales', testDuration: 40 }
];

// ========== STATE MANAGEMENT ==========
let userAppointments = JSON.parse(localStorage.getItem('ukDrivingAppointments')) || [];
let selectedCentre = null;;

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

    if (tabName === 'myappointments') displayAppointments();
    if (tabName === 'preparation') loadPreparationTips();
}

// ========== SEARCH TEST CENTRES ==========
function searchTestCentres() {
    const postcode = document.getElementById('postcode').value.toLowerCase().trim();
    const testType = document.getElementById('testType').value;

    let filtered = testCentres;

    if (postcode) {
        filtered = filtered.filter(centre =>
            centre.postcode.toLowerCase().includes(postcode) ||
            centre.city.toLowerCase().includes(postcode) ||
            centre.city.toLowerCase().startsWith(postcode) ||
            centre.address.toLowerCase().includes(postcode) ||
            centre.name.toLowerCase().includes(postcode)
        );
    } else {
        // If no postcode entered, show all centres
        showToast('Showing all test centres near you', 'info');
    }

    const centresContainer = document.getElementById('centresContainer');
    const centresList = document.getElementById('centresList');
    const emptyState = document.getElementById('emptyState');

    // If still empty, show ALL centres as default
    if (filtered.length === 0) {
        filtered = testCentres;
        centresList.innerHTML = '';
        filtered.forEach(centre => {
            const card = createCentreCard(centre, testType);
            centresList.appendChild(card);
        });
        showToast('No exact matches found. Showing all available centres', 'info');
    } else {
        centresList.innerHTML = '';
        filtered.forEach(centre => {
            const card = createCentreCard(centre, testType);
            centresList.appendChild(card);
        });
    }

    document.getElementById('centresTitle').textContent = `${filtered.length} Test Centres Found`;
    centresContainer.style.display = 'block';
    emptyState.style.display = 'none';
    centresContainer.scrollIntoView({ behavior: 'smooth' });

    // Show recommendation
    updateCentreRecommendation(filtered, testType);
}

// ========== CREATE CENTRE CARD ==========
function createCentreCard(centre, testType) {
    const card = document.createElement('div');
    card.className = 'centre-card';
    card.dataset.id = centre.id;

    let availClass = '';
    let availText = `${centre.availability} slots`;
    if (centre.availability <= 2) {
        availClass = 'full';
        availText = 'Very Limited';
    } else if (centre.availability <= 3) {
        availClass = 'limited';
        availText = 'Limited';
    }

    card.innerHTML = `
        <div class="centre-name">${centre.name}</div>
        <div class="centre-info">
            <p><i class="fas fa-map-marker-alt"></i> ${centre.city}, ${centre.postcode}</p>
            <p><i class="fas fa-address-card"></i> ${centre.address}</p>
            <p><i class="fas fa-phone"></i> ${centre.phone}</p>
            <p><i class="fas fa-clock"></i> Usually available within 4 weeks</p>
        </div>
        <div class="availability-badge ${availClass}">${availText}</div>
        <div class="centre-actions">
            <button class="btn-book" onclick="selectCentreAndBook('${centre.id}', this.closest('.centre-card'))">
                <i class="fas fa-calendar"></i> Book Appointment
            </button>
            <button onclick="viewCentreDetails('${centre.id}')">View Details</button>
        </div>
    `;

    return card;
}

// ========== SELECT CENTRE AND BOOK ==========
function selectCentreAndBook(centreId, card) {
    const centre = testCentres.find(c => c.id === centreId);
    if (centre) {
        selectedCentre = centre;
        openBookingModal();
    }
}

// ========== UPDATE CITY RECOMMENDATION ==========
function updateCentreRecommendation(centres, testType) {
    if (centres.length === 0) {
        document.getElementById('aiRecBox').style.display = 'none';
        return;
    }

    // AI scoring: prefer centres with good availability and no extreme wait times
    let bestCentre = centres[0];
    let bestScore = 0;

    centres.forEach(centre => {
        let score = 0;

        // Prefer good availability
        if (centre.availability >= 5) score += 30;
        else if (centre.availability >= 3) score += 20;

        // Prefer major cities for better infrastructure
        if (['London', 'Manchester', 'Birmingham'].includes(centre.city)) score += 15;

        // Add randomness for variety
        score += Math.random() * 10;

        if (score > bestScore) {
            bestScore = score;
            bestCentre = centre;
        }
    });

    const recText = `🤖 I recommend <strong>${bestCentre.name}</strong> in ${bestCentre.city}. This centre has good availability (${bestCentre.availability} slots) and is typically faster to book appointments.`;
    document.getElementById('recText').innerHTML = recText;
    document.getElementById('aiRecBox').style.display = 'block';
}

function bookRecommendedLocation() {
    const recText = document.getElementById('recText').innerHTML;
    const match = recText.match(/<strong>(.*?)<\/strong>/);
    if (match) {
        const centreName = match[1];
        const centre = testCentres.find(c => c.name === centreName);
        if (centre) {
            selectedCentre = centre;
            openBookingModal();
        }
    }
}

// ========== BOOKING MODAL ==========
function openBookingModal() {
    if (!selectedCentre) return;

    const modal = document.getElementById('bookingModal');
    const details = document.getElementById('centreDetails');

    details.innerHTML = `
        <p><strong>Centre:</strong> ${selectedCentre.name}</p>
        <p><strong>Location:</strong> ${selectedCentre.address}, ${selectedCentre.city}</p>
        <p><strong>Test Duration:</strong> ${selectedCentre.testDuration} minutes</p>
    `;

    modal.classList.add('show');
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('show');
}

// ========== CONFIRM BOOKING ==========
function confirmTestBooking() {
    const name = document.getElementById('bookingName').value;
    const licenseNum = document.getElementById('licenseNumber').value;
    const email = document.getElementById('bookingEmail').value;
    const timePreference = document.getElementById('preferredTime').value;

    if (!name || !licenseNum || !email || !timePreference) {
        showToast('Please fill in all fields', 'warning');
        return;
    }

    if (licenseNum.length !== 16) {
        showToast('License number must be 16 digits', 'warning');
        return;
    }

    // Generate random appointment date
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 28) + 1);

    const appointment = {
        id: 'apt_' + Date.now(),
        centreId: selectedCentre.id,
        centreName: selectedCentre.name,
        city: selectedCentre.city,
        name: name,
        licenseNumber: licenseNum,
        email: email,
        timePreference: timePreference,
        appointmentDate: appointmentDate.toISOString().split('T')[0],
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };

    userAppointments.push(appointment);
    localStorage.setItem('ukDrivingAppointments', JSON.stringify(userAppointments));

    closeBookingModal();
    document.getElementById('testBookingForm').reset();

    showToast('✓ Booking confirmed! Confirmation sent to ' + email, 'success');

    // Show success notification
    addDrivingNotification(`Your test at ${selectedCentre.name} is confirmed for ${appointmentDate.toDateString()}`, 'success');
}

// ========== DISPLAY APPOINTMENTS ==========
function displayAppointments() {
    const appointmentsList = document.getElementById('appointmentsList');
    const noAppointments = document.getElementById('noAppointments');

    if (userAppointments.length === 0) {
        appointmentsList.innerHTML = '';
        noAppointments.style.display = 'block';
        return;
    }

    noAppointments.style.display = 'none';
    appointmentsList.innerHTML = '<div class="appointments-list">' +
        userAppointments.map(apt => `
            <div class="appointment-card ${apt.status}">
                <div class="appointment-header">
                    <div class="appointment-title">${apt.centreName}</div>
                    <div class="appointment-status ${apt.status}">${apt.status.toUpperCase()}</div>
                </div>
                <div class="appointment-info">
                    <div class="appointment-info-item">
                        <div class="appointment-info-label">Name</div>
                        <div class="appointment-info-value">${apt.name}</div>
                    </div>
                    <div class="appointment-info-item">
                        <div class="appointment-info-label">Date</div>
                        <div class="appointment-info-value">${new Date(apt.appointmentDate).toDateString()}</div>
                    </div>
                    <div class="appointment-info-item">
                        <div class="appointment-info-label">Time</div>
                        <div class="appointment-info-value">${apt.timePreference}</div>
                    </div>
                    <div class="appointment-info-item">
                        <div class="appointment-info-label">City</div>
                        <div class="appointment-info-value">${apt.city}</div>
                    </div>
                </div>
                <div class="appointment-actions">
                    <button onclick="rescheduleTest('${apt.id}')">Reschedule</button>
                    <button onclick="cancelTest('${apt.id}')">Cancel</button>
                    <button onclick="downloadTestConfirmation('${apt.id}')">Download</button>
                </div>
            </div>
        `).join('') +
        '</div>';
}

// ========== APPOINTMENT MANAGEMENT ==========
function rescheduleTest(aptId) {
    showToast('Redirecting to search...', 'info');
    switchTab('search');
}

function cancelTest(aptId) {
    if (confirm('Are you sure? You can reschedule without additional fees if done 3+ days before.')) {
        userAppointments = userAppointments.filter(a => a.id !== aptId);
        localStorage.setItem('ukDrivingAppointments', JSON.stringify(userAppointments));
        displayAppointments();
        showToast('Appointment cancelled', 'info');
    }
}

function downloadTestConfirmation(aptId) {
    showToast('Downloading confirmation PDF...', 'success');
}

// ========== PREPARATION TAB ==========
function loadPreparationTips() {
    const aiTips = document.getElementById('aiTips');

    const tips = [
        '📚 Start with theory test first. Most people spend 2-4 weeks preparing.',
        '⏱️ Practice mock tests regularly. Aim for 80% consistently before booking.',
        '🚗 Book driving lessons with an approved instructor - schools have approved routes.',
        '📍 Weekday afternoon slots (2-4 PM) tend to have slightly better pass rates.',
        '😴 Get adequate sleep before your test - fatigue is a major factor.',
        '🧠 Learn all road signs thoroughly - they account for ~20% of theory questions.',
        '⛽ Do a vehicle check ("show me, tell me") before your practical test.',
        '📱 Use the official DVLA learning materials - they match the real test.'
    ];

    aiTips.innerHTML = tips.map(tip => `<div class="tip-item">${tip}</div>`).join('');
}

// ========== TOGGLE FAQ ==========
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('i');

    document.querySelectorAll('.faq-answer').forEach(a => {
        if (a !== answer) {
            a.classList.remove('active');
            a.previousElementSibling.classList.remove('active');
        }
    });

    element.classList.toggle('active');
    answer.classList.toggle('active');
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
    const query = document.getElementById('userQuery').value.trim();
    if (!query) return;

    const messages = document.getElementById('chatbotMessages');

    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message';
    userMsg.innerHTML = `<p>${escapeHtml(query)}</p>`;
    messages.appendChild(userMsg);

    setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'chat-message bot-message';
        const response = getDrivingAIResponse(query);
        aiMsg.innerHTML = `<i class="fas fa-robot"></i><p>${response}</p>`;
        messages.appendChild(aiMsg);
        messages.scrollTop = messages.scrollHeight;
    }, 500);

    document.getElementById('userQuery').value = '';
    messages.scrollTop = messages.scrollHeight;
}

// ========== AI RESPONSE ==========
function getDrivingAIResponse(query) {
    const q = query.toLowerCase();

    const responses = {
        theory: [
            'Theory test has 50 multiple choice questions (45 mins) and 14 hazard perception videos (15 mins). You need 43/50 MCQs + 44/75 hazards to pass.',
            'Study the Highway Code thoroughly. Focus on: road signs, speed limits, parking rules, and vehicle safety checks.'
        ],
        practical: [
            'Practical test is 40 minutes: 20 mins guided, 20 mins independent. You\'ll do 3 maneuvers (parallel park, reverse, 3-point turn) and emergency stop.',
            'Common faults: hesitation at junctions, poor mirror checks, and lack of smooth steering. Practice these specifically.'
        ],
        cost: [
            'Practical test costs £62.50. Theory test costs £23. Provisional license is free online.',
            'Rush booking (within 3 weeks) costs extra. Book 6-8 weeks ahead for standard rates in London.'
        ],
        fees: [
            'Cancellation within 3 days forfeits the full fee. Rescheduling 3+ days before costs £11.',
            'If you don\'t show up, you lose the fee. Always confirm your appointment 24 hours before.'
        ],
        time: [
            'Book 6-8 weeks in advance for best availability. Peak season: March-June average 12-week wait.',
            'Early mornings (8-10 AM) have slightly longer waits. Afternoon slots (2-4 PM) are often quicker.'
        ],
        document: [
            'Bring: photocard license, test pass certificate, and ID. Arrive 10 minutes early.',
            'Forget documents? You\'ll forfeit your fee. Doublecheck everything the night before.'
        ],
        default: [
            'I can help you find test centres, book appointments, and answer questions about UK driving tests. What would you like?',
            'Ask me about theory/practical tests, booking, costs, test day tips, or common questions.'
        ]
    };

    let category = 'default';
    if (q.includes('theory')) category = 'theory';
    else if (q.includes('practical')) category = 'practical';
    else if (q.includes('cost') || q.includes('fee') || q.includes('price')) category = 'cost';
    else if (q.includes('reschedule') || q.includes('cancel')) category = 'fees';
    else if (q.includes('when') || q.includes('how long') || q.includes('wait')) category = 'time';
    else if (q.includes('document') || q.includes('bring')) category = 'document';

    const responseList = responses[category] || responses.default;
    return responseList[Math.floor(Math.random() * responseList.length)];
}

// ========== NOTIFICATIONS ==========
function addDrivingNotification(message, type) {
    // Could integrate with a notification system
    console.log(`Notification [${type}]: ${message}`);
}

// ========== TOAST ==========
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    toastMsg.textContent = message;
    toast.classList.remove('hidden');
    toast.style.background = type === 'success' ? '#16a34a' : type === 'warning' ? '#ea580c' : '#1f2937';

    setTimeout(() => {
        closeToast();
    }, 4000);
}

function closeToast() {
    document.getElementById('toast').classList.add('hidden');
}

// ========== UTILITY ==========
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateMinLicenseStatus() {
    // Placeholder for license status check
}

function viewCentreDetails(centreId) {
    const centre = testCentres.find(c => c.id === centreId);
    if (centre) {
        showToast(`${centre.name} - ${centre.address}, ${centre.city}. Phone: ${centre.phone}`, 'info');
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('aiChatbot').classList.add('hidden');
    document.getElementById('aiToggle').addEventListener('click', toggleAIAssistant);

    loadPreparationTips();

    // Welcome message
    setTimeout(() => {
        showToast('Welcome! Search for test centres near you, or ask the AI Assistant for help.', 'info');
    }, 1000);
});
