import { db } from './firebase-config.js';
import { ref, get, push, update, remove, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Global variables
let rowCount = 1;
let recordId = null;
let isFirstVisit = false;

// Utility function for consistent date/time formatting
// Update your formatDateTime function to include a space between date and time
function formatDateTime(date) {
    const pad = num => num.toString().padStart(2, '0');
    const dateStr = `${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()}`;
    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    return {
        dateStr,
        timeStr,
        combined: `${dateStr} ${timeStr}`,  // Added space here
        display: `${dateStr}<br>${timeStr}`
    };
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

        // Address Mapping (same as view-page)
        const addressMapping = {
            village: {
                "Village 1": "ទួលក្របៅ",
                "Village 2": "សាមកុក",
                "Village 3": "ហាបី"
            },
            commune: {
                "Commune 1": "គគីរ",
                "Commune 2": "កាស",
                "Commune 3": "ក្អែក"
            },
            district: {
                "District 1": "កៀនស្វាយ",
                "District 2": "ក្អែក",
                "District 3": "កាស"
            },
            province: {
                "Province 1": "ព្រៃវែង",
                "Province 2": "កណ្តាល",
                "Province 3": "ក្អាត់"
            }
        };

        // Update Address
        if (patientData.address) {
            const { village, commune, district, province } = patientData.address;

            const addressParts = [
                village ? `ភូមិ ${addressMapping.village[village] || village}` : '',
                commune ? `ឃុំ/សង្កាត់ ${addressMapping.commune[commune] || commune}` : '',
                district ? `ស្រុក/ខណ្ឌ ${addressMapping.district[district] || district}` : '',
                province ? `ខេត្ត/ ${addressMapping.province[province] || province}` : ''
            ].filter(Boolean); // remove empty

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

                // Helper function to safely format date/time
                const formatDateTimeDisplay = (datetimeStr) => {
                    if (!datetimeStr || datetimeStr === 'N/A') return 'N/A';
                    
                    // Handle both space-separated and concatenated formats
                    if (datetimeStr.includes(' ')) {
                        const [date, time] = datetimeStr.split(' ');
                        return `${date}<br>${time}`;
                    } else if (datetimeStr.length >= 16) { // DD/MM/YYYYHH:MM:SS
                        const date = datetimeStr.slice(0, 10);
                        const time = datetimeStr.slice(10);
                        return `${date}<br>${time}`;
                    }
                    return datetimeStr; // Fallback
                };

                // Serial number
                newRow.insertCell(0).textContent = index + 1;

                // Check-in time
                const checkInCell = newRow.insertCell(1);
                checkInCell.innerHTML = formatDateTimeDisplay(visit.checkIn);

                // Check-out time
                const checkOutCell = newRow.insertCell(2);
                checkOutCell.innerHTML = formatDateTimeDisplay(visit.checkOut);

                // Clinic selection
                const clinicCell = newRow.insertCell(3);
                const clinicSelect = document.createElement('select');
                
                // Configure clinic options
                const clinics = ['វែលគ្លីនិក I', 'វែលគ្លីនិក II'];
                clinics.forEach(clinic => {
                    const option = new Option(clinic, clinic);
                    clinicSelect.add(option);
                });
                
                // Set current value and handle changes
                clinicSelect.value = visit.clinic || clinics[0];
                clinicSelect.addEventListener('change', () => saveAllRows());
                clinicCell.appendChild(clinicSelect);

                // Doctor information
                newRow.insertCell(4).textContent = visit.doctor || 'Dr. Minh Hong';

                // Action buttons
                const actionCell = newRow.insertCell(5);
                
                // Delete button
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
                

                // Check-out button
                const checkOutBtn = document.createElement('button');
                checkOutBtn.className = 'btn ' + (visit.checkOut === 'N/A' ? 'btn-checkout' : 'btn-disabled');
                checkOutBtn.textContent = visit.checkOut === 'N/A' ? 'Check-out' : 'Checked-out';
                checkOutBtn.disabled = visit.checkOut !== 'N/A';
                checkOutBtn.onclick = () => checkOutAction(newRow);

                // View button
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

    const { dateStr, timeStr, combined, display } = formatDateTime(new Date());

    // Serial number
    const serialCell = newRow.insertCell(0);
    serialCell.textContent = rowCount++;

    // Check-in time
    const checkInCell = newRow.insertCell(1);
    checkInCell.innerHTML = display;

    // Check-out time (initially N/A)
    const checkOutCell = newRow.insertCell(2);
    checkOutCell.textContent = 'N/A';

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
    
    // Delete button
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
    

    // Check-out button
    const checkOutBtn = document.createElement('button');
    checkOutBtn.textContent = 'Check-out';
    checkOutBtn.addEventListener('click', () => checkOutAction(newRow));

    // View button
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

    // Save the new visit to Firebase
    const visitData = {
        checkIn: combined,
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

    const { dateStr, timeStr, combined, display } = formatDateTime(new Date());
    
    // Update UI
    row.cells[2].innerHTML = display;
    const checkOutBtn = row.querySelector('button:nth-child(2)');
    checkOutBtn.disabled = true;
    checkOutBtn.textContent = 'Checked-out';

    // Update Firebase
    update(ref(db, `patients/${recordId}/visits/${visitId}`), {
        checkOut: combined
    }).catch(error => console.error('Error updating check-out time:', error));
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
// Update the saveAllRows function to properly handle the time formatting
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

                // Properly extract date and time from cells
                const checkInText = row.cells[1].textContent.replace(/\n/g, ' ').trim();
                const checkOutText = row.cells[2].textContent.replace(/\n/g, ' ').trim();
                
                const updatedData = {
                    ...existingData,
                    checkIn: checkInText === 'undefined' ? existingData.checkIn : checkInText,
                    checkOut: checkOutText === 'N/A' ? 'N/A' : (checkOutText === 'undefined' ? existingData.checkOut : checkOutText),
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
