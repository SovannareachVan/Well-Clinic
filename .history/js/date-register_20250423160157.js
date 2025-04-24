import { db } from './firebase-config.js';
import { ref, get, push, update, remove, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

document.getElementById('checkInBtn').addEventListener('click', checkIn);
document.getElementById('backBtn').addEventListener('click', () => window.history.back());

let rowCount = 1;
let recordId;
let isFirstVisit = false;

async function getPatientDetails(id) {
    try {
        const patientRef = ref(db, 'patients/' + id);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            document.getElementById('patientName').textContent = patientData.fullName;
            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientPhone').textContent = patientData.phone;
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
            document.getElementById('patientNotes').textContent = patientData.notes || 'No notes available.';
            
            // Check if this is first visit (no visits node exists)
            const visitsRef = ref(db, 'patients/' + id + '/visits');
            const visitsSnapshot = await get(visitsRef);
            isFirstVisit = !visitsSnapshot.exists();
        }
    } catch (error) {
        console.error('Error fetching patient:', error);
    }
}
async function loadSavedVisits(recordId) {
    try {
        const visitsRef = ref(db, 'patients/' + recordId + '/visits');
        const snapshot = await get(visitsRef);

        if (snapshot.exists()) {
            const visits = snapshot.val();
            const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';

            Object.entries(visits).forEach(([visitId, visit], index) => {
                const newRow = tableBody.insertRow();
                newRow.dataset.visitId = visitId;

                const serialCell = newRow.insertCell(0);
                serialCell.textContent = index + 1;

                const checkInCell = newRow.insertCell(1);
                checkInCell.innerHTML = visit.checkIn.replace(' ', '<br>');

                const checkOutCell = newRow.insertCell(2);
                checkOutCell.innerHTML = visit.checkOut !== 'N/A' ? visit.checkOut.replace(' ', '<br>') : 'N/A';

                const clinicCell = newRow.insertCell(3);
                const clinicSelect = document.createElement('select');
                ['វែលគ្លីនិក I', 'វែលគ្លីនិក II'].forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    if (name === visit.clinic) option.selected = true;
                    clinicSelect.appendChild(option);
                });
                clinicSelect.addEventListener('change', saveAllRows);
                clinicCell.appendChild(clinicSelect);

                const doctorCell = newRow.insertCell(4);
                doctorCell.textContent = visit.doctor || 'Dr. Minh Hong';

                const actionCell = newRow.insertCell(5);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this row?')) {
                        deleteRow(newRow);
                    }
                });

                const checkOutBtn = document.createElement('button');
                checkOutBtn.textContent = visit.checkOut === 'N/A' ? 'Check-out' : 'Checked-out';
                checkOutBtn.disabled = visit.checkOut !== 'N/A';
                checkOutBtn.addEventListener('click', () => checkOutAction(newRow));

                const viewBtn = document.createElement('button');
                viewBtn.textContent = 'View';
                viewBtn.addEventListener('click', () => {
                    window.location.href = `view-page.html?recordId=${recordId}&visitId=${visitId}`;
                });

                actionCell.appendChild(deleteBtn);
                actionCell.appendChild(checkOutBtn);
                actionCell.appendChild(viewBtn);
            });

            rowCount = Object.keys(visits).length + 1;
        }
    } catch (error) {
        console.error('Error loading saved visits:', error);
    }
}



function checkIn() {
    const table = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();
    const visitId = push(ref(db, 'patients/' + recordId + '/visits')).key;
    newRow.dataset.visitId = visitId;

    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('en-GB');
    const timeString = currentDate.toLocaleTimeString('en-GB');

    const serialCell = newRow.insertCell(0);
    serialCell.textContent = rowCount;

    const checkInCell = newRow.insertCell(1);
    checkInCell.innerHTML = `${dateString}<br>${timeString}`;

    const checkOutCell = newRow.insertCell(2);
    checkOutCell.textContent = 'N/A';

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

    const doctorCell = newRow.insertCell(4);
    doctorCell.textContent = 'Dr. Minh Hong';

    const actionCell = newRow.insertCell(5);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteRow(newRow));

    const checkOutBtn = document.createElement('button');
    checkOutBtn.textContent = 'Check-out';
    checkOutBtn.addEventListener('click', () => checkOutAction(newRow));

    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => {
        if (isFirstVisit) {
            // For first visit, go to add-detail-page.html
            window.location.href = `add-detail-page.html?patientId=${recordId}`;
            isFirstVisit = false; // Reset flag after first visit
        } else {
            // For subsequent visits, go to add-information.html
            window.location.href = `add-information.html?patientId=${recordId}&visitId=${visitId}`;
        }
    });

    actionCell.appendChild(deleteBtn);
    actionCell.appendChild(checkOutBtn);
    actionCell.appendChild(viewBtn);

    rowCount++;

    // Save the initial visit data
    const visitRef = ref(db, `patients/${recordId}/visits/${visitId}`);
    const visitData = {
        checkIn: `${dateString} ${timeString}`,
        checkOut: 'N/A',
        clinic: clinicSelect.value,
        doctor: 'Dr. Minh Hong'
    };

    set(visitRef, visitData)
        .then(() => {
            console.log('Visit data saved successfully');
            saveAllRows();
        })
        .catch(error => {
            console.error('Error saving visit data:', error);
        });
}

function checkOutAction(row) {
    const checkOutTime = new Date();
    const dateString = checkOutTime.toLocaleDateString('en-GB');
    const timeString = checkOutTime.toLocaleTimeString('en-GB');
    row.cells[2].innerHTML = `${dateString}<br>${timeString}`;
    row.querySelector('button:nth-child(2)').disabled = true;
    row.querySelector('button:nth-child(2)').textContent = 'Checked-out';

    saveAllRows();
}

function deleteRow(row) {
    const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const visitId = row.dataset.visitId;

    if (visitId && recordId) {
        const visitRef = ref(db, `patients/${recordId}/visits/${visitId}`);
        remove(visitRef)
            .then(() => {
                console.log(`Deleted visit ${visitId} from Firebase.`);
                row.remove();
                const rows = tableBody.getElementsByTagName('tr');
                for (let i = 0; i < rows.length; i++) {
                    rows[i].cells[0].textContent = i + 1;
                }
                rowCount = rows.length + 1;
            })
            .catch(error => {
                console.error('Failed to delete row from Firebase:', error);
            });
    }
}

async function saveAllRows() {
    const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const rows = tableBody.getElementsByTagName('tr');

    for (let row of rows) {
        const visitId = row.dataset.visitId;
        if (!visitId) continue;

        const visitRef = ref(db, `patients/${recordId}/visits/${visitId}`);
        const visitData = {
            checkIn: row.cells[1].innerText.replace('\n', ' '),
            checkOut: row.cells[2].innerText.replace('\n', ' '),
            clinic: row.cells[3].querySelector('select').value,
            doctor: row.cells[4].textContent
        };

        try {
            await update(visitRef, visitData);
        } catch (error) {
            console.error(`Error updating visit ${visitId}:`, error);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) {
        recordId = id; // make sure it's assigned globally
        getPatientDetails(id);
        loadSavedVisits(id); // pass it explicitly
    }
});
