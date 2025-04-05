import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

document.getElementById('checkInBtn').addEventListener('click', checkIn);
document.getElementById('saveBtn').addEventListener('click', saveAllRows);
document.getElementById('backBtn').addEventListener('click', () => history.back());

let rowCount = 1;
let checkInTime;

// Fetch patient data and populate it
async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();

            // Populate the patient details
            document.getElementById('patientName').textContent = patientData.fullName;
            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientPhone').textContent = patientData.phone;
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
        } else {
            console.log('No data available for this patient.');
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

function checkIn() {
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const timeString = currentDate.toLocaleTimeString('en-GB'); // HH:MM:SS
    checkInTime = currentDate;

    const table = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    // Serial Number
    const serialCell = newRow.insertCell(0);
    serialCell.textContent = rowCount;

    // Check-in Time
    const checkInCell = newRow.insertCell(1);
    checkInCell.innerHTML = `${dateString}<br>${timeString}`;

    // Check-out Time
    const checkOutCell = newRow.insertCell(2);
    checkOutCell.textContent = 'N/A';

    // Clinic Selector
    const clinicCell = newRow.insertCell(3);
    const clinicSelect = document.createElement('select');
    const option1 = document.createElement('option');
    option1.value = 'វែលគ្លីនិក I';
    option1.textContent = 'វែលគ្លីនិក I';
    const option2 = document.createElement('option');
    option2.value = 'វែលគ្លីនិក II';
    option2.textContent = 'វែលគ្លីនិក II';
    clinicSelect.appendChild(option1);
    clinicSelect.appendChild(option2);
    clinicCell.appendChild(clinicSelect);

    // Doctor Name
    const doctorCell = newRow.insertCell(4);
    doctorCell.textContent = 'Dr. Minh Hong';

    // Action Buttons
    const actionCell = newRow.insertCell(5);
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteRow(newRow));
    const checkOutBtn = document.createElement('button');
    checkOutBtn.textContent = 'Check-out';
    checkOutBtn.addEventListener('click', () => checkOutAction(newRow));
    actionCell.appendChild(deleteBtn);
    actionCell.appendChild(checkOutBtn);

    rowCount++;
}

function checkOutAction(row) {
    const checkOutTime = new Date();
    const dateString = checkOutTime.toLocaleDateString('en-GB');
    const timeString = checkOutTime.toLocaleTimeString('en-GB');
    row.cells[2].innerHTML = `${dateString}<br>${timeString}`;

    // Disable check-out button
    row.querySelector('button:nth-child(2)').disabled = true;
}

function deleteRow(row) {
    row.remove();
}

async function saveAllRows() {
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (!recordId) return;

    const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const rows = tableBody.getElementsByTagName('tr');

    let entries = [];

    for (let row of rows) {
        const checkIn = row.cells[1].innerHTML.replace('<br>', ' ');
        const checkOut = row.cells[2].innerHTML.replace('<br>', ' ');
        const clinic = row.cells[3].querySelector('select').value;
        const doctor = row.cells[4].textContent;

        entries.push({ checkIn, checkOut, clinic, doctor });
    }

    try {
        const updates = {};
        updates[`patients/${recordId}/visits`] = entries;
        await update(ref(db), updates);
        alert('Data saved successfully!');
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data.');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        getPatientDetails(recordId);
    }
});
