import { db } from './firebase-config.js';
import { ref, get, push, update, remove, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Global variables
let rowCount = 1;
let recordId = null;
let isFirstVisit = false;

// Utility function for consistent date/time formatting
function formatDateTime(date) {
    const pad = num => num.toString().padStart(2, '0');
    const dateStr = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    return {
        dateStr,
        timeStr,
        combined: `${dateStr} ${timeStr}`,
        display: `${dateStr}<br>${timeStr}`
    };
}

// Utility function to validate a date string
function isValidDateString(dateStr) {
    if (!dateStr || dateStr === 'N/A') return false;
    const [day, month, year] = dateStr.split('/').map(num => parseInt(num, 10));
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) return false;
    const date = new Date(year, month - 1, day);
    return !isNaN(date.getTime());
}

// Utility function to combine manual date and auto-generated time for Firebase
function combineDateTime(day, month, year, time) {
    if (!day || !month || !year) return 'N/A';

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10) - 1; // Months are 0-based in JavaScript Date
    const yearNum = parseInt(year, 10);

    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return 'N/A';
    if (dayNum < 1 || dayNum > 31 || monthNum < 0 || monthNum > 11 || yearNum < 1900 || yearNum > new Date().getFullYear()) return 'N/A';

    const date = new Date(yearNum, monthNum, dayNum);
    if (isNaN(date.getTime())) return 'N/A';

    const dateStr = `${day.padStart(2, '0')}/${(monthNum + 1).toString().padStart(2, '0')}/${year.padStart(4, '0')}`;
    return `${dateStr} ${time}`;
}

// Utility function to split combined date-time for display
function splitDateTime(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr === 'N/A') return { date: '', time: '' };

    const [date, time] = dateTimeStr.split(' ');
    if (!date || !time) return { date: '', time: '' };

    // Validate the date part
    if (!isValidDateString(date)) return { date: '', time: '' };

    return { date: date || '', time: time || '' };
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
        updateField('patientTelegram', patientData.telegram);
        updateField('patientEmail', patientData.email);
        updateField('patientNotes', patientData.notes);

        const addressMapping = {
            village: {},
            commune: {},
            district: {},
            province: {}
        };

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

        isFirstVisit = !visitsSnapshot.exists();
        return true;

    } catch (error) {
        console.error('Error fetching patient:', error);
        return false;
    }
}

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

                // Clean up invalid dates in Firebase data
                const cleanedVisit = { ...visit };
                if (visit.checkIn && !isValidDateString(visit.checkIn.split(' ')[0])) {
                    cleanedVisit.checkIn = 'N/A';
                }
                if (visit.checkOut && visit.checkOut !== 'N/A' && !isValidDateString(visit.checkOut.split(' ')[0])) {
                    cleanedVisit.checkOut = 'N/A';
                }

                // Update Firebase if data was cleaned
                if (cleanedVisit.checkIn !== visit.checkIn || cleanedVisit.checkOut !== visit.checkOut) {
                    set(ref(db, `patients/${patientId}/visits/${visitId}`), cleanedVisit)
                        .catch(error => console.error('Error cleaning visit data:', error));
                }

                // Split check-in and check-out date-time
                const checkInData = splitDateTime(cleanedVisit.checkIn);
                const checkOutData = splitDateTime(cleanedVisit.checkOut);

                // Serial number
                newRow.insertCell(0).textContent = index + 1;

                // Check-in date and time
                const checkInCell = newRow.insertCell(1);
                checkInCell.innerHTML = `
                    <div class="date-inputs">
                        <input type="text" class="day-input" value="${checkInData.date.split('/')[0] || ''}" placeholder="DD" maxlength="2" size="2">/
                        <input type="text" class="month-input" value="${checkInData.date.split('/')[1] || ''}" placeholder="MM" maxlength="2" size="2">/
                        <input type="text" class="year-input" value="${checkInData.date.split('/')[2] || ''}" placeholder="YYYY" maxlength="4" size="4">
                        <span class="time-display">${checkInData.time || 'N/A'}</span>
                    </div>
                `;

                // Check-out date and time
                const checkOutCell = newRow.insertCell(2);
                checkOutCell.innerHTML = `
                    <div class="date-inputs">
                        <input type="text" class="day-input" value="${checkOutData.date.split('/')[0] || ''}" placeholder="DD" maxlength="2" size="2">/
                        <input type="text" class="month-input" value="${checkOutData.date.split('/')[1] || ''}" placeholder="MM" maxlength="2" size="2">/
                        <input type="text" class="year-input" value="${checkOutData.date.split('/')[2] || ''}" placeholder="YYYY" maxlength="4" size="4">
                        <span class="time-display">${checkOutData.time || 'N/A'}</span>
                    </div>
                `;

                // Add event listeners for auto-jumping between date fields
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
                checkOutBtn.className = 'btn ' + (cleanedVisit.checkOut === 'N/A' ? 'btn-checkout' : 'btn-disabled');
                checkOutBtn.textContent = cleanedVisit.checkOut === 'N/A' ? 'Check-out' : 'Checked-out';
                checkOutBtn.disabled = cleanedVisit.checkOut !== 'N/A';
                checkOutBtn.onclick = () => checkOutAction(newRow);

                const viewBtn = document.createElement('button');
                viewBtn.className = 'btn btn-edit';
                viewBtn.textContent = 'View';
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

// Function to set up auto-jumping for date inputs
function setupDateInputs(cell) {
    const dayInput = cell.querySelector('.day-input');
    const monthInput = cell.querySelector('.month-input');
    const yearInput = cell.querySelector('.year-input');

    dayInput.addEventListener('input', () => {
        if (dayInput.value.length === 2) {
            monthInput.focus();
        }
    });

    monthInput.addEventListener('input', () => {
        if (monthInput.value.length === 2) {
            yearInput.focus();
        }
    });

    // Validation for day and month
    dayInput.addEventListener('change', () => {
        const day = parseInt(dayInput.value);
        if (day < 1 || day > 31) {
            alert('Day must be between 01 and 31');
            dayInput.value = '';
        }
    });

    monthInput.addEventListener('change', () => {
        const month = parseInt(monthInput.value);
        if (month < 1 || month > 12) {
            alert('Month must be between 01 and 12');
            monthInput.value = '';
        }
    });

    // Save on change
    [dayInput, monthInput, yearInput].forEach(input => {
        input.addEventListener('change', () => {
            const row = cell.closest('tr');
            saveAllRows();
        });
    });
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

    const { timeStr } = formatDateTime(new Date());

    // Serial number
    const serialCell = newRow.insertCell(0);
    serialCell.textContent = rowCount++;

    // Check-in date and time (date manual, time auto-generated)
    const checkInCell = newRow.insertCell(1);
    checkInCell.innerHTML = `
        <div class="date-inputs">
            <input type="text" class="day-input" placeholder="DD" maxlength="2" size="2">/
            <input type="text" class="month-input" placeholder="MM" maxlength="2" size="2">/
            <input type="text" class="year-input" placeholder="YYYY" maxlength="4" size="4">
            <span class="time-display">${timeStr}</span>
        </div>
    `;

    // Check-out date and time (initially empty)
    const checkOutCell = newRow.insertCell(2);
    checkOutCell.innerHTML = `
        <div class="date-inputs">
            <input type="text" class="day-input" placeholder="DD" maxlength="2" size="2">/
            <input type="text" class="month-input" placeholder="MM" maxlength="2" size="2">/
            <input type="text" class="year-input" placeholder="YYYY" maxlength="4" size="4">
            <span class="time-display">N/A</span>
        </div>
    `;

    // Add event listeners for auto-jumping between date fields
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
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => {
        const targetPage = isFirstVisit ? 'add-detail-page.html' : 'add-information.html';
        window.location.href = `${targetPage}?patientId=${recordId}&visitId=${visitId}`;
        isFirstVisit = false;
    });

    actionCell.appendChild(deleteBtn);
    actionCell.appendChild(checkOutBtn);
    actionCell.appendChild(viewBtn);

    // Save the new visit to Firebase with 'N/A' for checkIn and checkOut
    const visitData = {
        checkIn: 'N/A',
        checkOut: 'N/A',
        clinic: clinicSelect.value,
        doctor: 'Dr. Minh Hong'
    };

    set(ref(db, `patients/${recordId}/visits/${visitId}`), visitData)
        .then(() => console.log('New visit saved:', visitId, visitData))
        .catch(error => console.error('Error saving visit:', error));
}

// Handle check-out action
function checkOutAction(row) {
    const visitId = row.dataset.visitId;
    if (!visitId || !recordId) return;

    const { timeStr } = formatDateTime(new Date());
    
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
                const checkInDay = checkInInputs.querySelector('.day-input').value.trim();
                const checkInMonth = checkInInputs.querySelector('.month-input').value.trim();
                const checkInYear = checkInInputs.querySelector('.year-input').value.trim();
                const checkInTime = checkInInputs.querySelector('.time-display').textContent;

                // Extract check-out date and time
                const checkOutInputs = row.cells[2].querySelector('.date-inputs');
                const checkOutDay = checkOutInputs.querySelector('.day-input').value.trim();
                const checkOutMonth = checkOutInputs.querySelector('.month-input').value.trim();
                const checkOutYear = checkOutInputs.querySelector('.year-input').value.trim();
                const checkOutTime = checkOutInputs.querySelector('.time-display').textContent;

                // Combine date and time with validation
                const checkInDateTime = combineDateTime(checkInDay, checkInMonth, checkInYear, checkInTime);
                const checkOutDateTime = checkOutTime === 'N/A' ? 'N/A' : combineDateTime(checkOutDay, checkOutMonth, checkOutYear, checkOutTime);

                const updatedData = {
                    ...existingData,
                    checkIn: checkInDateTime,
                    checkOut: checkOutDateTime,
                    clinic: row.cells[3].querySelector('select').value,
                    doctor: row.cells[4].textContent
                };

                console.log(`Saving visit ${visitId}:`, updatedData);

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