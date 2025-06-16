import { db } from './firebase-config.js';
import { ref, get, push, update, remove, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Global variables
let rowCount = 1;
let patientId = null;
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
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear() + 10) return false;
    const date = new Date(year, month - 1, day);
    return !isNaN(date.getTime());
}

// Utility function to parse date-time string to Date object
function parseDateTime(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr === 'N/A') return null;
    const [datePart, timePart] = dateTimeStr.split(' ');
    if (!datePart || !timePart) return null;
    const [day, month, year] = datePart.split('/').map(num => parseInt(num, 10));
    const [hours, minutes, seconds] = timePart.split(':').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day, hours, minutes, seconds);
}

// Utility function to combine manual date and auto-generated time for Firebase
function combineDateTime(day, month, year, time) {
    day = String(day || '').trim();
    month = String(month || '').trim();
    year = String(year || '').trim();

    if (!day || !month || !year || day === 'DD' || month === 'MM' || year === 'YYYY') return null;

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10) - 1;
    const yearNum = parseInt(year, 10);

    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return null;
    if (dayNum < 1 || dayNum > 31 || monthNum < 0 || monthNum > 11 || yearNum < 1900 || yearNum > new Date().getFullYear() + 10) return null;

    const date = new Date(yearNum, monthNum, dayNum);
    if (isNaN(date.getTime())) return null;

    const dateStr = `${day.padStart(2, '0')}/${(monthNum + 1).toString().padStart(2, '0')}/${year.padStart(4, '0')}`;
    return `${dateStr} ${time}`;
}

// Utility function to split combined date-time for display
function splitDateTime(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr === 'N/A') {
        return { date: '', time: '' };
    }

    const [date, time] = dateTimeStr.split(' ');
    if (!date || !time || !isValidDateString(date)) {
        return { date: '', time: '' };
    }

    return { date: date || '', time: time || '' };
}

// Retry logic for Firebase operations
async function withRetry(operation, maxRetries = 3, delayMs = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.warn(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
    }
}

async function getPatientDetails(id) {
    try {
        console.log(`Fetching patient details for ID: ${id}`);
        const [patientSnapshot, visitsSnapshot] = await Promise.all([
            get(ref(db, 'patients/' + id)),
            get(ref(db, 'patients/' + id + '/visits'))
        ]);

        if (!patientSnapshot.exists()) {
            console.error('Patient not found in Firebase.');
            alert('Patient not found. Please check the patient ID.');
            return false;
        }

        const patientData = patientSnapshot.val();
        console.log('Patient data:', patientData);

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
                commune ? `ឃុំ/សង្កាត់ ${addressMapping.commune[commune] || commune}` : '',
                district ? `ស្រុក/ខណ្ឌ ${addressMapping.district[district] || district}` : '',
                province ? `ខេត្ត/ក្រុង ${addressMapping.province[province] || province}` : ''
            ].filter(Boolean);
            const addressString = addressParts.join(', ');
            updateField('patientAddress', addressString);
        } else {
            updateField('patientAddress', 'N/A');
        }

        isFirstVisit = !visitsSnapshot.exists();
        console.log(`Is first visit: ${isFirstVisit}`);
        return true;

    } catch (error) {
        console.error('Error fetching patient details:', error.message);
        console.error('Error stack:', error.stack);
        alert('Failed to load patient details. Please check your connection or Firebase configuration.');
        return false;
    }
}

async function loadSavedVisits(patientId) {
    try {
        console.log(`Loading visits for patient ID: ${patientId}`);
        const visitsRef = ref(db, `patients/${patientId}/visits`);
        const snapshot = await get(visitsRef);
        
        if (!snapshot.exists()) {
            console.log('No visits found for this patient.');
            return;
        }

        const visits = snapshot.val();
        console.log('Visits data:', visits);

        const tableBody = document.getElementById('checkInTable').querySelector('tbody');
        if (!tableBody) {
            console.error('Table body not found in DOM.');
            return;
        }
        tableBody.innerHTML = '';

        Object.entries(visits).forEach(([visitId, visit], index) => {
            const newRow = tableBody.insertRow();
            newRow.dataset.visitId = visitId;

            const cleanedVisit = { ...visit };
            if (visit.checkIn && !isValidDateString(visit.checkIn.split(' ')[0])) {
                cleanedVisit.checkIn = 'N/A';
            }
            if (visit.checkOut && visit.checkOut !== 'N/A' && !isValidDateString(visit.checkOut.split(' ')[0])) {
                cleanedVisit.checkOut = 'N/A';
            }

            if (cleanedVisit.checkIn !== visit.checkIn || cleanedVisit.checkOut !== visit.checkOut) {
                withRetry(() => set(ref(db, `patients/${patientId}/visits/${visitId}`), cleanedVisit))
                    .catch(error => console.error('Error cleaning visit data:', error));
            }

            const checkInData = splitDateTime(cleanedVisit.checkIn);
            const checkOutData = splitDateTime(cleanedVisit.checkOut);

            newRow.insertCell(0).textContent = index + 1;

            const checkInCell = newRow.insertCell(1);
            checkInCell.innerHTML = `
                <div class="date-inputs">
                    <input type="text" class="day-input" value="${checkInData.date.split('/')[0] || ''}" placeholder="DD" maxlength="2" size="2">/
                    <input type="text" class="month-input" value="${checkInData.date.split('/')[1] || ''}" placeholder="MM" maxlength="2" size="2">/
                    <input type="text" class="year-input" value="${checkInData.date.split('/')[2] || ''}" placeholder="YYYY" maxlength="4" size="4">
                    <span class="time-display">${checkInData.time || 'N/A'}</span>
                </div>
            `;

            const checkOutCell = newRow.insertCell(2);
            checkOutCell.innerHTML = `
                <div class="date-inputs">
                    <input type="text" class="day-input" value="${checkOutData.date.split('/')[0] || ''}" placeholder="DD" maxlength="2" size="2">/
                    <input type="text" class="month-input" value="${checkOutData.date.split('/')[1] || ''}" placeholder="MM" maxlength="2" size="2">/
                    <input type="text" class="year-input" value="${checkOutData.date.split('/')[2] || ''}" placeholder="YYYY" maxlength="4" size="4">
                    <span class="time-display">${checkOutData.time || 'N/A'}</span>
                </div>
            `;

            setupDateInputs(checkInCell);
            setupDateInputs(checkOutCell);

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

            newRow.insertCell(4).textContent = visit.doctor || 'Dr. Minh Hong';

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

    } catch (error) {
        console.error('Error loading visits:', error.message);
        console.error('Error stack:', error.stack);
        alert('Failed to load visits. Please try again.');
    }
}

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

    dayInput.addEventListener('change', () => {
        let day = parseInt(dayInput.value) || 0;
        if (day < 1 || day > 31) {
            alert('Day must be between 01 and 31');
            dayInput.value = '';
        } else {
            dayInput.value = day.toString().padStart(2, '0');
        }
    });

    monthInput.addEventListener('change', () => {
        let month = parseInt(monthInput.value) || 0;
        if (month < 1 || month > 12) {
            alert('Month must be between 01 and 12');
            monthInput.value = '';
        } else {
            monthInput.value = month.toString().padStart(2, '0');
        }
    });

    yearInput.addEventListener('change', () => {
        let year = parseInt(yearInput.value) || 0;
        if (year < 1900 || year > new Date().getFullYear() + 10) {
            alert(`Year must be between 1900 and ${new Date().getFullYear() + 10}`);
            yearInput.value = '';
        } else {
            yearInput.value = year.toString().padStart(4, '0');
        }
    });

    [dayInput, monthInput, yearInput].forEach(input => {
        input.addEventListener('change', () => {
            if (dayInput.value && monthInput.value && yearInput.value) {
                const combined = combineDateTime(dayInput.value, monthInput.value, yearInput.value, cell.querySelector('.time-display').textContent);
                if (!combined) {
                    alert('Please enter a valid date (DD/MM/YYYY).');
                    dayInput.value = '';
                    monthInput.value = '';
                    yearInput.value = '';
                } else {
                    debouncedSaveAllRows();
                }
            }
        });
    });
}

function checkIn() {
    if (!patientId) {
        console.error('No patient ID available');
        return;
    }

    const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const newRow = tableBody.insertRow();
    const visitId = push(ref(db, `patients/${patientId}/visits`)).key;
    newRow.dataset.visitId = visitId;

    const { timeStr } = formatDateTime(new Date());

    const serialCell = newRow.insertCell(0);
    serialCell.textContent = rowCount++;

    const checkInCell = newRow.insertCell(1);
    checkInCell.innerHTML = `
        <div class="date-inputs">
            <input type="text" class="day-input" placeholder="DD" maxlength="2" size="2">/
            <input type="text" class="month-input" placeholder="MM" maxlength="2" size="2">/
            <input type="text" class="year-input" placeholder="YYYY" maxlength="4" size="4">
            <span class="time-display">${timeStr}</span>
        </div>
    `;

    const checkOutCell = newRow.insertCell(2);
    checkOutCell.innerHTML = `
        <div class="date-inputs">
            <input type="text" class="day-input" placeholder="DD" maxlength="2" size="2">/
            <input type="text" class="month-input" placeholder="MM" maxlength="2" size="2">/
            <input type="text" class="year-input" placeholder="YYYY" maxlength="4" size="4">
            <span class="time-display">N/A</span>
        </div>
    `;

    setupDateInputs(checkInCell);
    setupDateInputs(checkOutCell);

    const clinicCell = newRow.insertCell(3);
    const clinicSelect = document.createElement('select');
    ['វែលគ្លីនិក I', 'វែលគ្លីនិក II'].forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        clinicSelect.appendChild(option);
    });
    clinicSelect.addEventListener('change', debouncedSaveAllRows);
    clinicCell.appendChild(clinicSelect);

    const doctorCell = newRow.insertCell(4);
    doctorCell.textContent = 'Dr. Minh Hong';

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
        window.location.href = `${targetPage}?patientId=${patientId}&visitId=${visitId}`;
        isFirstVisit = false;
    });

    actionCell.appendChild(deleteBtn);
    actionCell.appendChild(checkOutBtn);
    actionCell.appendChild(viewBtn);

    const visitData = {
        checkIn: 'N/A',
        checkOut: 'N/A',
        clinic: clinicSelect.value,
        doctor: 'Dr. Minh Hong'
    };

    withRetry(() => set(ref(db, `patients/${patientId}/visits/${visitId}`), visitData))
        .then(() => console.log('New visit saved:', visitId, visitData))
        .catch(error => console.error('Error saving visit:', error));
}

function checkOutAction(row) {
    const visitId = row.dataset.visitId;
    if (!visitId || !patientId) return;

    const { timeStr } = formatDateTime(new Date());
    
    const checkOutCell = row.cells[2];
    const checkOutInputs = checkOutCell.querySelector('.date-inputs');
    const timeDisplay = checkOutInputs.querySelector('.time-display');
    timeDisplay.textContent = timeStr;

    const checkInCell = row.cells[1];
    const checkInInputs = checkInCell.querySelector('.date-inputs');
    const checkInDay = checkInInputs.querySelector('.day-input').value.trim();
    const checkInMonth = checkInInputs.querySelector('.month-input').value.trim();
    const checkInYear = checkInInputs.querySelector('.year-input').value.trim();
    const checkInTime = checkInInputs.querySelector('.time-display').textContent;

    const checkOutDayInput = checkOutInputs.querySelector('.day-input').value.trim();
    const checkOutMonthInput = checkOutInputs.querySelector('.month-input').value.trim();
    const checkOutYearInput = checkOutInputs.querySelector('.year-input').value.trim();

    const checkInDateTime = combineDateTime(checkInDay, checkInMonth, checkInYear, checkInTime);
    const checkOutDateTime = combineDateTime(checkOutDayInput, checkOutMonthInput, checkOutYearInput, timeStr);

    if (!checkInDateTime || !checkOutDateTime) {
        alert('Please enter valid check-in and check-out dates.');
        timeDisplay.textContent = 'N/A';
        return;
    }

    const checkInDate = parseDateTime(checkInDateTime);
    const checkOutDate = parseDateTime(checkOutDateTime);

    if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
        alert('Check-out date must be after check-in date.');
        timeDisplay.textContent = 'N/A';
        return;
    }

    const checkOutBtn = row.querySelector('button:nth-child(2)');
    checkOutBtn.disabled = true;
    checkOutBtn.textContent = 'Checked-out';

    console.log(`Checking out visit ${visitId} with checkIn: ${checkInDateTime}, checkOut: ${checkOutDateTime}`);

    withRetry(() => {
        const visitRef = ref(db, `patients/${patientId}/visits/${visitId}`);
        return get(visitRef).then(snapshot => {
            if (snapshot.exists()) {
                const existingData = snapshot.val();
                return update(visitRef, { ...existingData, checkOut: checkOutDateTime });
            }
        });
    }).catch(error => console.error('Error updating check-out:', error));
}

function deleteRow(row) {
    const visitId = row.dataset.visitId;
    if (!visitId || !patientId) return;

    withRetry(() => remove(ref(db, `patients/${patientId}/visits/${visitId}`)))
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

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

async function saveAllRows() {
    if (!patientId) return;

    const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const rows = tableBody.getElementsByTagName('tr');

    for (let row of rows) {
        const visitId = row.dataset.visitId;
        if (!visitId) continue;

        const visitRef = ref(db, `patients/${patientId}/visits/${visitId}`);

        try {
            const snapshot = await get(visitRef);
            if (snapshot.exists()) {
                const existingData = snapshot.val();

                const checkInInputs = row.cells[1].querySelector('.date-inputs');
                const checkInDay = checkInInputs.querySelector('.day-input').value.trim();
                const checkInMonth = checkInInputs.querySelector('.month-input').value.trim();
                const checkInYear = checkInInputs.querySelector('.year-input').value.trim();
                const checkInTime = checkInInputs.querySelector('.time-display').textContent;

                const checkOutInputs = row.cells[2].querySelector('.date-inputs');
                const checkOutDay = checkOutInputs.querySelector('.day-input').value.trim();
                const checkOutMonth = checkOutInputs.querySelector('.month-input').value.trim();
                const checkOutYear = checkOutInputs.querySelector('.year-input').value.trim();
                const checkOutTime = checkOutInputs.querySelector('.time-display').textContent;

                const checkInDateTime = combineDateTime(checkInDay, checkInMonth, checkInYear, checkInTime);
                const checkOutDateTime = checkOutTime === 'N/A' ? 'N/A' : combineDateTime(checkOutDay, checkOutMonth, checkOutYear, checkOutTime);

                if (!checkInDateTime) {
                    alert(`Invalid check-in date for visit ${visitId}. Please correct the date.`);
                    continue;
                }

                if (checkOutDateTime && checkOutDateTime !== 'N/A') {
                    const checkInDate = parseDateTime(checkInDateTime);
                    const checkOutDate = parseDateTime(checkOutDateTime);
                    if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
                        alert(`Check-out date must be after check-in date for visit ${visitId}.`);
                        continue;
                    }
                }

                const updatedData = {
                    ...existingData,
                    checkIn: checkInDateTime ? checkInDateTime : existingData.checkIn,
                    checkOut: checkOutDateTime && checkOutDateTime !== 'N/A' ? checkOutDateTime : existingData.checkOut,
                    clinic: row.cells[3].querySelector('select').value,
                    doctor: row.cells[4].textContent
                };

                console.log(`Saving visit ${visitId}:`, updatedData);

                await withRetry(() => update(visitRef, updatedData));
            }
        } catch (error) {
            console.error(`Error updating visit ${visitId}:`, error);
        }
    }
}

const debouncedSaveAllRows = debounce(saveAllRows, 300);

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) {
        console.error('No patient ID in URL');
        alert('No patient ID provided in URL. Please check the link.');
        return;
    }

    console.log(`Patient ID from URL: ${id}`);
    patientId = id;
    
    document.getElementById('checkInBtn').addEventListener('click', checkIn);
    document.getElementById('backBtn').addEventListener('click', () => window.history.back());

    const patientLoaded = await getPatientDetails(id);
    if (patientLoaded) {
        await loadSavedVisits(patientId);
    }
});