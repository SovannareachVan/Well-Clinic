import { db } from './firebase-config.js';
import { ref, get, push, update, remove, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Global variables
let rowCount = 1;
let recordId = null;
let isFirstVisit = false;

// Utility function for consistent time formatting
function formatTime(date) {
    const pad = num => num.toString().padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Utility function to combine manual date and auto-generated time
function combineDateTime(day, month, year, time) {
    if (!day || !month || !year) return 'N/A';
    const dateStr = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year.padStart(4, '0')}`;
    return `${dateStr} ${time}`;
}

// Utility function to split combined date-time for display
function splitDateTime(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr === 'N/A') return { date: 'N/A', time: 'N/A' };
    const [date, time] = dateTimeStr.split(' ');
    return { date, time };
}

async function getPatientDetails(id) {
    try {
        const [patientSnapshot, visitsSnapshot] = await Promise.all([
            get(ref(db, 'patients/' + id)),
            get(ref(db, 'patients/' + id + '/visits'))
        ]);

        if (!patientSnapshot.exists()) {
            console.error('Patient not found.');
            return false;
        }

        const patientData = patientSnapshot.val();

        // Update patient info in DOM safely
        const updateField = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'N/A';
            }
        };

        updateField('patientName', patientData.fullName);
        updateField('patientFullName', patientData.fullName);
        updateField('patientAge', patientData.age);
        updateField('patientGender', patientData.gender);
        updateField('patientPhone', patientData.phone);
        updateField('patientEmail', patientData.email);
        updateField('patientNotes', patientData.notes);

        // Address Mapping
        const addressMapping = {
            village: {},
            commune: {},
            district: {},
            province: {}
        };

        // Update Address
        if (patientData.address) {
            const { village, commune, district, province } = patientData.address;
            const addressParts = [
                village ? `ភូមិ ${addressMapping.village[village] || village}` : '',
                commune ? `ឃុំ ${addressMapping.commune[commune] || commune}` : '',
                district ? `ស្រុក ${addressMapping.district[district] || district}` : '',
                province ? `ខេត្ត ${addressMapping.province[province] || province}` : ''
            ].filter(Boolean);
            const addressString = addressParts.join(', ');
            updateField('patientAddress', addressString);
        } else {
            updateField('patientAddress', 'N/A');
        }

        // Set first visit flag
        isFirstVisit = !visitsSnapshot.exists();
        return true;

    } catch (error) {
        console.error('Error fetching patient:', error);
        return false;
    }
}

// Load existing visits from Firebase
async function loadSavedVisits(patientId) {
    try {
        const snapshot = await get(ref(db, `patients/${patientId}/visits`));
        const tableBody = document.getElementById('checkInTable').querySelector('tbody');
        tableBody.innerHTML = '';

        if (snapshot.exists()) {
            const visits = snapshot.val();
            
            Object.entries(visits).forEach(([visitId, visit], index) => {
                const newRow = tableBody.insertRow();
                newRow.dataset.visitId = visitId;

                // Serial number
                newRow.insertCell(0).textContent = index + 1;

                // Check-in date and time
                const checkInCell = newRow.insertCell(1);
                const checkInData = splitDateTime(visit.checkIn);
                const [checkInDay, checkInMonth, checkInYear] = checkInData.date.split('/').map(part => part || '');
                checkInCell.innerHTML = `
                    <div class="date-inputs">
                        <input type="text" class="day-input" value="${checkInDay}" placeholder="DD" maxlength="2" size="2">/
                        <input type="text" class="month-input" value="${checkInMonth}" placeholder="MM" maxlength="2" size="2">/
                        <input type="text" class="year-input" value="${checkInYear}" placeholder="YYYY" maxlength="4" size="4">
                        <span class="time-display">${checkInData.time || 'N/A'}</span>
                        <span class="date-time-display" style="margin-left: 10px;"></span>
                    </div>
                `;

                // Check-out date and time
                const checkOutCell = newRow.insertCell(2);
                const checkOutData = splitDateTime(visit.checkOut);
                const [checkOutDay, checkOutMonth, checkOutYear] = checkOutData.date.split('/').map(part => part || '');
                checkOutCell.innerHTML = `
                    <div class="date-inputs">
                        <input type="text" class="day-input" value="${checkOutDay}" placeholder="DD" maxlength="2" size="2">/
                        <input type="text" class="month-input" value="${checkOutMonth}" placeholder="MM" maxlength="2" size="2">/
                        <input type="text" class="year-input" value="${checkOutYear}" placeholder="YYYY" maxlength="4" size="4">
                        <span class="time-display">${checkOutData.time || 'N/A'}</span>
                        <span class="date-time-display" style="margin-left: 10px;"></span>
                    </div>
                `;

                // Add event listeners for auto-jumping and real-time updates
                setupDateInputs(checkInCell);
                setupDateInputs(checkOutCell);

                // Clinic selection
                const clinicCell = newRow.insertCell(3);
                const clinicSelect = document.createElement('select');
                const clinics = ['វែលគ្លីនិក I', 'វែលគ្លីនិក II'];
                clinics.forEach(clinic => {
                    const option = new Option(clinic, clinic);
                    clinicSelect.add(option);
                });
                clinicSelect.value = visit.clinic || clinics[0];
                clinicSelect.addEventListener('change', saveAllRows);
                clinicCell.appendChild(clinicSelect);

                // Doctor information
                newRow.insertCell(4).textContent = visit.doctor || 'Dr. Minh Hong';

                // Action buttons
                const actionCell = newRow.insertCell(5);
                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('btn', 'btn-delete');
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => {
                    const password = prompt('បញ្ចូល 12345 ដើម្បីលុប:');
                    if (password === '12345') {
                        if (confirm('Are you sure you want to delete this visit?')) {
                            deleteRow(newRow);
                        }
                    } else {
                        alert('Incorrect password. Deletion cancelled.');
                    }
                };

                const checkOutBtn = document.createElement('button');
                checkOutBtn.className = 'btn ' + (visit.checkOut === 'N/A' ? 'btn-checkout' : 'btn-disabled');
                checkOutBtn.textContent = visit.checkOut === 'N/A' ? 'Check-out' : 'Checked-out';
                checkOutBtn.disabled = visit.checkOut !== 'N/A';
                checkOutBtn.onclick = () => checkOutAction(newRow);

                const viewBtn = document.createElement('button');
                viewBtn.className = 'btn btn-edit';
                viewBtn.textContent = 'Edit';
                viewBtn.onclick = () => {
                    const targetPage = index === 0 ? 'add-detail-page.html' : 'add-information.html';
                    window.location.href = `${targetPage}?patientId=${patientId}&visitId=${visitId}`;
                };

                actionCell.append(deleteBtn, checkOutBtn, viewBtn);
            });

            rowCount = Object.keys(visits).length + 1;
        }
    } catch (error) {
        console.error('Error loading visits:', error);
        alert('Failed to load visits. Please try again.');
    }
}

// Function to set up auto-jumping and real-time date-time updates
function setupDateInputs(cell) {
    const dayInput = cell.querySelector('.day-input');
    const monthInput = cell.querySelector('.month-input');
    const yearInput = cell.querySelector('.year-input');
    const timeDisplay = cell.querySelector('.time-display');
    const dateTimeDisplay = cell.querySelector('.date-time-display');

    // Auto-jump logic
    dayInput.addEventListener('input', () => {
        if (dayInput.value.length === 2) {
            monthInput.focus();
        }
        updateDateTimeDisplay();
    });

    monthInput.addEventListener('input', () => {
        if (monthInput.value.length === 2) {
            yearInput.focus();
        }
        updateDateTimeDisplay();
    });

    yearInput.addEventListener('input', () => {
        updateDateTimeDisplay();
    });

    // Validation
    dayInput.addEventListener('change', () => {
        const day = parseInt(dayInput.value);
        if (day < 1 || day > 31) {
            alert('Day must be between 01 and 31');
            dayInput.value = '';
            updateDateTimeDisplay();
        }
    });

    monthInput.addEventListener('change', () => {
        const month = parseInt(monthInput.value);
        if (month < 1 || month > 12) {
            alert('Month must be between 01 and 12');
            monthInput.value = '';
            updateDateTimeDisplay();
        }
    });

    // Real-time update of date-time display
    function updateDateTimeDisplay() {
        const day = dayInput.value;
        const month = monthInput.value;
        const year = yearInput.value;
        const time = timeDisplay.textContent;
        const dateTime = combineDateTime(day, month, year, time);
        dateTimeDisplay.textContent = dateTime === 'N/A' ? '' : dateTime;
    }

    // Initial update
    updateDateTimeDisplay();
}

// Handle check-in action
function checkIn() {
    if (!recordId) {
        console.error('No patient ID available');
        return;
    }

    const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const newRow = tableBody.insertRow();
    const visitId = push(ref(db, `patients/${recordId}/visits`)).key;
    newRow.dataset.visitId = visitId;

    const timeStr = formatTime(new Date());

    // Serial number
    const serialCell = newRow.insertCell(0);
    serialCell.textContent = rowCount++;

    // Check-in date and time
    const checkInCell = newRow.insertCell(1);
    checkInCell.innerHTML = `
        <div class="date-inputs">
            <input type="text" class="day-input" placeholder="DD" maxlength="2" size="2">/
            <input type="text" class="month-input" placeholder="MM" maxlength="2" size="2">/
            <input type="text" class="year-input" placeholder="YYYY" maxlength="4" size="4">
            <span class="time-display">${timeStr}</span>
            <span class="date-time-display" style="margin-left: 10px;"></span>
        </div>
    `;

    // Check-out date and time
    const checkOutCell = newRow.insertCell(2);
    checkOutCell.innerHTML = `
        <div class="date-inputs">
            <input type="text" class="day-input" placeholder="DD" maxlength="2" size="2">/
            <input type="text" class="month-input" placeholder="MM" maxlength="2" size="2">/
            <input type="text" class="year-input" placeholder="YYYY" maxlength="4" size="4">
            <span class="time-display">N/A</span>
            <span class="date-time-display" style="margin-left: 10px;"></span>
        </div>
    `;

    // Add event listeners
    setupDateInputs(checkInCell);
    setupDateInputs(checkOutCell);

    // Clinic selection
    const clinicCell = newRow.insertCell(3);
    const clinicSelect = document.createElement('select');
    ['វែលគ្លីនិក I', 'វែលគ្លីនិក II'].forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        clinicSelect.appendChild(option);
    });
    clinicSelect.addEventListener('change', saveAllRows);
    clinicCell.appendChild(clinicSelect);

    // Doctor
    const doctorCell = newRow.insertCell(4);
    doctorCell.textContent = 'Dr. Minh Hong';

    // Action buttons
    const actionCell = newRow.insertCell(5);
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
        const password = prompt('Enter password to delete this visit:');
        if (password === '12345') {
            if (confirm('Are you sure you want to delete this visit?')) {
                deleteRow(newRow);
            }
        } else {
            alert('Incorrect password. Deletion cancelled.');
        }
    });

    const checkOutBtn = document.createElement('button');
    checkOutBtn.textContent = 'Check-out';
    checkOutBtn.addEventListener('click', () => checkOutAction(newRow));

    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'Edit';
    viewBtn.addEventListener('click', () => {
        const targetPage = isFirstVisit ? 'add-detail-page.html' : 'add-information.html';
        window.location.href = `${targetPage}?patientId=${recordId}&visitId=${visitId}`;
        isFirstVisit = false;
    });

    actionCell.appendChild(deleteBtn);
    actionCell.appendChild(checkOutBtn);
    actionCell.appendChild(viewBtn);

    // Save initial visit data
    const visitData = {
        checkIn: combineDateTime('', '', '', timeStr),
        checkOut: 'N/A',
        clinic: clinicSelect.value,
        doctor: 'Dr. Minh Hong'
    };
    set(ref(db, `patients/${recordId}/visits/${visitId}`), visitData)
        .then(() => console.log('New visit saved:', visitId))
        .catch(error => console.error('Error saving visit:', error));
}

// Handle check-out action
function checkOutAction(row) {
    const visitId = row.dataset.visitId;
    if (!visitId || !recordId) return;

    const timeStr = formatTime(new Date());
    
    // Update UI
    const checkOutCell = row.cells[2];
    const checkOutInputs = checkOutCell.querySelector('.date-inputs');
    const timeDisplay = checkOutInputs.querySelector('.time-display');
    timeDisplay.textContent = timeStr;

    const checkOutBtn = row.querySelector('button:nth-child(2)');
    checkOutBtn.disabled = true;
    checkOutBtn.textContent = 'Checked-out';

    // Save to Firebase
    saveAllRows();
}

// Delete a visit row
function deleteRow(row) {
    const visitId = row.dataset.visitId;
    if (!visitId || !recordId) return;

    remove(ref(db, `patients/${recordId}/visits/${visitId}`))
        .then(() => {
            row.remove();
            const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
            const rows = tableBody.getElementsByTagName('tr');
            for (let i = 0; i < rows.length; i++) {
                rows[i].cells[0].textContent = i + 1;
            }
            rowCount = rows.length + 1;
        })
        .catch(error => console.error('Error deleting visit:', error));
}

// Save all rows to Firebase
async function saveAllRows() {
    if (!recordId) return;

    const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const rows = tableBody.getElementsByTagName('tr');

    for (let row of rows) {
        const visitId = row.dataset.visitId;
        if (!visitId) continue;

        const visitRef = ref(db, `patients/${recordId}/visits/${visitId}`);

        try {
            const snapshot = await get(visitRef);
            if (snapshot.exists()) {
                const existingData = snapshot.val();

                // Extract check-in date and time
                const checkInInputs = row.cells[1].querySelector('.date-inputs');
                const checkInDay = checkInInputs.querySelector('.day-input').value.padStart(2, '0');
                const checkInMonth = checkInInputs.querySelector('.month-input').value.padStart(2, '0');
                const checkInYear = checkInInputs.querySelector('.year-input').value.padStart(4, '0');
                const checkInTime = checkInInputs.querySelector('.time-display').textContent;

                // Extract check-out date and time
                const checkOutInputs = row.cells[2].querySelector('.date-inputs');
                const checkOutDay = checkOutInputs.querySelector('.day-input').value.padStart(2, '0');
                const checkOutMonth = checkOutInputs.querySelector('.month-input').value.padStart(2, '0');
                const checkOutYear = checkOutInputs.querySelector('.year-input').value.padStart(4, '0');
                const checkOutTime = checkOutInputs.querySelector('.time-display').textContent;

                // Combine date and time
                const checkInDateTime = combineDateTime(checkInDay, checkInMonth, checkInYear, checkInTime);
                const checkOutDateTime = combineDateTime(checkOutDay, checkOutMonth, checkOutYear, checkOutTime);

                const updatedData = {
                    ...existingData,
                    checkIn: checkInDateTime,
                    checkOut: checkOutDateTime,
                    clinic: row.cells[3].querySelector('select').value,
                    doctor: row.cells[4].textContent
                };

                await update(visitRef, updatedData);
            }
        } catch (error) {
            console.error(`Error updating visit ${visitId}:`, error);
        }
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        console.error('No patient ID in URL');
        return;
    }

    recordId = id;
    
    // Set up event listeners
    document.getElementById('checkInBtn').addEventListener('click', checkIn);
    document.getElementById('backBtn').addEventListener('click', () => window.history.back());

    // Load patient data and visits
    const patientLoaded = await getPatientDetails(id);
    if (patientLoaded) {
        await loadSavedVisits(id);
    }
});