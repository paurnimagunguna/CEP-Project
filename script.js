// ==================== DARK MODE ====================
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-toggle i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    updateThemeIcon();
}

// ==================== NAVIGATION ====================
function showSection(sectionId) {
    const sections = document.querySelectorAll(".section");
    const navBtns = document.querySelectorAll(".nav-btn");
    
    sections.forEach(section => {
        section.classList.remove("active");
    });
    
    navBtns.forEach(btn => {
        btn.classList.remove("active");
    });

    document.getElementById(sectionId).classList.add("active");
    document.querySelector(`[data-section="${sectionId}"]`).classList.add("active");
}

// ==================== NOTIFICATIONS ====================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification`;
    notification.classList.add(type);
    notification.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// ==================== REGISTRATION FORM ====================
const registrationForm = document.getElementById("registrationForm");
if (registrationForm) {
    registrationForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const collegeId = document.getElementById('collegeId').value;
        const event = document.getElementById('eventSelect').value;
        const email = document.getElementById('email').value;
        const mobile = document.getElementById('mobile').value;
        const year = document.getElementById('year').value;
        
        // Generate QR data
        const qrData = JSON.stringify({
            name: fullName,
            id: collegeId,
            event: event,
            email: email,
            mobile: mobile,
            year: year,
            timestamp: new Date().toISOString()
        });
        
        // Generate QR code
        const qrCodeBox = document.getElementById('qrCodeBox');
        qrCodeBox.innerHTML = '<div style="text-align: center; padding: 2rem;">Generating QR Code...</div>';
        
        QRCode.toCanvas(qrCodeBox, qrData, { width: 200, height: 200 }, function (error) {
            if (error) {
                console.error(error);
                qrCodeBox.innerHTML = '<div class="qr-placeholder">Error generating QR</div>';
            }
        });
        
        document.getElementById('qrName').textContent = fullName;
        document.getElementById('qrEvent').textContent = event;
        document.getElementById('qrId').textContent = collegeId;
        document.getElementById("qrDisplay").classList.remove("hidden");
        showNotification(`✅ Registration successful, ${fullName}!`, 'success');
        
        // Store registration
        storeRegistration(fullName, collegeId, event, email, mobile, year);
    });
}

function storeRegistration(name, id, event, email, mobile, year) {
    let registrations = JSON.parse(localStorage.getItem('registrations')) || [];
    registrations.push({
        name,
        id,
        event,
        email,
        mobile,
        year,
        timestamp: new Date().toLocaleString(),
        status: 'Pending'
    });
    localStorage.setItem('registrations', JSON.stringify(registrations));
}

// ==================== SCANNER SECTION ====================
let entryCounter = 0;
let deniedCounter = 0;
let html5QrCode = null;

function simulateScan(isValid, customMessage = null) {
    const resultDiv = document.getElementById("scanResult");
    resultDiv.classList.remove("hidden");

    if (isValid) {
        entryCounter++;
        document.getElementById("entryCount").innerText = entryCounter;
        document.getElementById("adminEntryCount").innerText = entryCounter;
        resultDiv.innerHTML = "<i class='fas fa-check-circle'></i> ✅ " + (customMessage || "Entry Allowed - Welcome!");
        resultDiv.className = "scan-result allowed";
        showNotification(customMessage || 'Entry allowed successfully!', 'success');
    } else {
        deniedCounter++;
        document.getElementById("deniedCount").innerText = deniedCounter;
        resultDiv.innerHTML = "<i class='fas fa-times-circle'></i> ❌ " + (customMessage || "Entry Denied (Invalid/Duplicate QR)");
        resultDiv.className = "scan-result denied";
        showNotification(customMessage || 'Entry denied - Invalid QR code', 'error');
    }
    
    updateSuccessRate();
}

function updateSuccessRate() {
    const total = entryCounter + deniedCounter;
    const rate = total === 0 ? 0 : Math.round((entryCounter / total) * 100);
    document.getElementById("successRate").innerText = rate + "%";
}

function startScanner() {
    if (html5QrCode) {
        html5QrCode.clear();
    }
    
    html5QrCode = new Html5Qrcode("reader");
    
    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanFailure
    ).then(() => {
        document.getElementById('scannerText').textContent = 'Camera Active';
        document.getElementById('scannerSubtext').textContent = 'Scanning for QR codes...';
        document.getElementById('startScanBtn').style.display = 'none';
        showNotification('Camera started successfully!', 'success');
    }).catch((err) => {
        console.error('Error starting scanner:', err);
        showNotification('Failed to start camera. Please check permissions.', 'error');
    });
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            document.getElementById('scannerText').textContent = 'Camera Scanner';
            document.getElementById('scannerSubtext').textContent = 'Position QR code in front of camera';
            document.getElementById('startScanBtn').style.display = 'block';
            showNotification('Camera stopped', 'info');
        }).catch((err) => {
            console.error('Error stopping scanner:', err);
        });
    }
}

function onScanSuccess(decodedText, decodedResult) {
    try {
        const data = JSON.parse(decodedText);
        // Validate the QR data
        if (data.name && data.id && data.event) {
            // Check if already entered
            let registrations = JSON.parse(localStorage.getItem('registrations')) || [];
            const existing = registrations.find(r => r.id === data.id && r.event === data.event);
            
            if (existing && existing.status === 'Entered') {
                simulateScan(false, `Duplicate entry: ${data.name} already entered for ${data.event}`);
            } else {
                // Mark as entered
                if (existing) {
                    existing.status = 'Entered';
                    localStorage.setItem('registrations', JSON.stringify(registrations));
                }
                simulateScan(true, `Welcome ${data.name}! Entry allowed for ${data.event}`);
            }
        } else {
            simulateScan(false, 'Invalid QR code format');
        }
    } catch (e) {
        simulateScan(false, 'Invalid QR code data');
    }
}

function onScanFailure(error) {
    // Ignore scan failures, as they happen frequently
}

// ==================== EVENTS SECTION ====================
function registerEvent(eventName) {
    showSection('user');  // ✅ direct registration page

    document.getElementById('eventSelect').value = eventName;

    showNotification(`Selected event: ${eventName}`, 'info');
}

function downloadQR() {
    const canvas = document.querySelector('#qrCodeBox canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = 'qr-code.png';
        link.href = canvas.toDataURL();
        link.click();
        showNotification('QR Code downloaded successfully!', 'success');
    } else {
        showNotification('QR Code not found. Please generate one first.', 'error');
    }
}

function showEventDetails(name, date, location, capacity, time, description) {
    document.getElementById('eventModalTitle').textContent = name;
    document.getElementById('eventDate').textContent = date;
    document.getElementById('eventLocation').textContent = location;
    document.getElementById('eventCapacity').textContent = capacity;
    document.getElementById('eventTime').textContent = time;
    document.getElementById('eventDescription').textContent = description;
    document.getElementById('eventModal').classList.remove('hidden');
}

// ==================== ADMIN SECTION ====================
let isAdminLoggedIn = false;

function authenticateAdmin(event) {
    event.preventDefault();

    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    fetch("admin_login.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "username=" + username + "&password=" + password + "&login=true"
    })
    .then(res => res.text())
    .then(data => {
        if (data.includes("success")) {
            isAdminLoggedIn = true;

            document.getElementById('adminLoginBox').classList.add('hidden');
            document.getElementById('adminDashboard').classList.remove('hidden');
        } else {
            alert("Invalid Login!");
        }
    });
}

function logoutAdmin() {
    isAdminLoggedIn = false;
    document.getElementById('adminLogin').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
    showNotification('Admin logged out', 'info');
}

function createEvent(event) {
    event.preventDefault();
    showNotification('Event created successfully!', 'success');
}

function exportCSV() {
    const registrations = JSON.parse(localStorage.getItem('registrations')) || [];
    let csv = 'Name,College ID,Event,Status,Timestamp\n';
    registrations.forEach(reg => {
        csv += `${reg.name},${reg.id},${reg.event},${reg.status},${reg.timestamp}\n`;
    });
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'registrations.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification('CSV exported successfully!', 'success');
}

function exportPDF() {
    showNotification('PDF export functionality requires PDF library integration', 'info');
}

function updateAdminTable() {
    const tbody = document.getElementById('registrationsTable');
    const registrations = JSON.parse(localStorage.getItem('registrations')) || [];
    
    tbody.innerHTML = '';
    
    if (registrations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No registrations yet</td></tr>';
        return;
    }
    
    registrations.forEach((reg, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reg.name}</td>
            <td>${reg.id}</td>
            <td>${reg.event}</td>
            <td>${reg.year || 'N/A'}</td>
            <td><span class="status-badge ${reg.status.toLowerCase()}">${reg.status}</span></td>
            <td><button class="btn-mini" onclick="viewRegistration(${index})">View</button></td>
        `;
        tbody.appendChild(row);
    });
}

function viewRegistration(index) {
    const registrations = JSON.parse(localStorage.getItem('registrations')) || [];
    const reg = registrations[index];
    if (reg) {
        alert(`Registration Details:\n\nName: ${reg.name}\nID: ${reg.id}\nEvent: ${reg.event}\nEmail: ${reg.email || 'N/A'}\nMobile: ${reg.mobile || 'N/A'}\nYear: ${reg.year || 'N/A'}\nStatus: ${reg.status}\nTime: ${reg.timestamp}`);
    }
}


// ==================== CREATE EVENT ====================
const eventForm = document.getElementById("eventForm");

if (eventForm) {
    eventForm.addEventListener("submit", function(e){
        e.preventDefault();

        const event = {
            name: document.getElementById("eventName").value,
            date: document.getElementById("eventDate").value,
            location: document.getElementById("eventLocation").value,
            capacity: document.getElementById("eventCapacity").value
        };

        let events = JSON.parse(localStorage.getItem("events")) || [];
        events.push(event);
        localStorage.setItem("events", JSON.stringify(events));

        showNotification("✅ Event Created Successfully!");
        eventForm.reset();
    });
}

// ==================== USER PROFILE ====================
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu.classList.toggle('hidden');
}

function showProfileSettings() {
    document.getElementById('profileModal').classList.remove('hidden');
    toggleProfileMenu();
}

function showEventHistory() {
    const registrations = JSON.parse(localStorage.getItem('registrations')) || [];
    if (registrations.length === 0) {
        alert('No registrations found!');
    } else {
        alert('Your registrations:\n\n' + registrations.map(r => `${r.name} - ${r.event} (${r.status})`).join('\n'));
    }
    toggleProfileMenu();
}

function logout() {
    localStorage.removeItem('userName');
    document.getElementById('userName').textContent = 'Guest';
    showNotification('Logged out successfully', 'info');
    toggleProfileMenu();
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
}

function registerFromModal() {
    const eventName = document.getElementById('eventModalTitle').textContent;
    registerEvent(eventName);
    closeEventModal();
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Set user name from localStorage or default
    const userName = localStorage.getItem('userName') || 'Guest';
    document.getElementById('userName').textContent = userName;
    
    // Initialize first section
    showSection('user');
    
    // Event search functionality
    const eventSearch = document.getElementById('eventSearch');
    const eventFilter = document.getElementById('eventFilter');
    
    function filterEvents() {
        const query = eventSearch.value.toLowerCase();
        const filter = eventFilter.value;
        const cards = document.querySelectorAll('.event-card');
        
        cards.forEach(card => {
            const title = card.querySelector('h4').textContent.toLowerCase();
            const badge = card.querySelector('.event-badge');
            const status = badge.classList.contains('ongoing') ? 'ongoing' : 
                          badge.textContent.toLowerCase().includes('completed') ? 'completed' : 'upcoming';
            
            const matchesSearch = title.includes(query);
            const matchesFilter = filter === 'all' || status === filter;
            
            card.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
        });
    }
    
    if (eventSearch) {
        eventSearch.addEventListener('input', filterEvents);
    }
    if (eventFilter) {
        eventFilter.addEventListener('change', filterEvents);
    }
    
    // Close profile menu when clicking outside
    document.addEventListener('click', function(event) {
        const profileMenu = document.getElementById('profileMenu');
        const userProfile = document.querySelector('.user-profile');
        if (profileMenu && !profileMenu.contains(event.target) && !userProfile.contains(event.target)) {
            profileMenu.classList.add('hidden');
        }
    });
});

// ==================== UTILITY FUNCTIONS ====================
function generateQRCode(data) {
    // In real application, use a QR library like qrcode.js
    console.log('Generating QR for:', data);
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN');
}

// ==================== DASHBOARD ====================
function loadDashboard(){
    const data = JSON.parse(localStorage.getItem('registrations')) || [];

    document.getElementById('totalRegs').innerText = data.length;

    const events = JSON.parse(localStorage.getItem('events')) || [];
    document.getElementById('totalEvents').innerText = events.length;

    let html = "";
    data.forEach(d=>{
        html += `
        <tr>
            <td>${d.name}</td>
            <td>${d.id}</td>
            <td>${d.event}</td>
            <td>${d.status}</td>
        </tr>`;
    });

    document.getElementById('tableData').innerHTML = html;
}
// ==================== HOME & STUDENT LOGIN ====================

// Show Home Page First
function showHome() {
    const sections = document.querySelectorAll(".section");
    sections.forEach(s => s.classList.remove("active"));
    document.getElementById("home").classList.add("active");
}

// Student Login
function studentLogin(event) {
    event.preventDefault();

    const name = document.getElementById("studentName").value;

    if (name.trim() === "") {
        showNotification("Enter your name", "error");
        return;
    }

    localStorage.setItem("userName", name);
    document.getElementById("userName").textContent = name;

    showNotification("Login Successful!", "success");

    // Go to Events page
    showSection("events");
}

// Go to Login Sections
function goToAdmin() {
    showSection("adminLogin");
}

function goToStudent() {
    showSection("studentLogin");
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Set user name
    const userName = localStorage.getItem('userName') || 'Guest';
    document.getElementById('userName').textContent = userName;

    // 👉 HE LINE CHANGE KAR
    showSection('Home');

});



