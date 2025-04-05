import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
document.getElementById('checkInBtn').addEventListener('click', checkIn);
document.getElementById('checkOutBtn').addEventListener('click', checkOut);

let rowCount = 1;
let checkInTime;

// Fetch patient data and populate it
async function getPatientDetails(recordId) {
    try {
        // Reference to patient data in Firebase
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

            // Optionally, you can also update other parts like Notes or Medicines
            // If applicable, update the notes or medicines section as needed

        } else {
            console.log('No data available for this patient.');
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}
function checkIn() {
    // Disable the check-in button
    document.getElementById('saveBtn').addEventListener('click', saveAllRows);
    document.getElementById('backBtn').addEventListener('click', () => history.back());
    

    // Get current date and time
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const timeString = currentDate.toLocaleTimeString('en-GB'); // HH:MM:SS

    // Save check-in time
    checkInTime = currentDate;

    // Create a new row for the table
    const table = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    // Create cells for the row
    const serialCell = newRow.insertCell(0);
    serialCell.textContent = rowCount;

    const checkInCell = newRow.insertCell(1);
    checkInCell.innerHTML = `${dateString}<br>${timeString}`;

    const checkOutCell = newRow.insertCell(2);
    checkOutCell.textContent = 'N/A';

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

    const doctorCell = newRow.insertCell(4);
    doctorCell.textContent = 'Dr. Minh Hong';

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
    // Set check-out time in the table row
    const checkOutTime = new Date();
    const dateString = checkOutTime.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const timeString = checkOutTime.toLocaleTimeString('en-GB'); // HH:MM:SS
    row.cells[2].textContent = `${dateString}<br>${timeString}`;

    // Disable check-out button after use
    row.querySelector('button:nth-child(2)').disabled = true;
}

function checkOut() {
    // Enable the check-out button after clicking
    document.getElementById('checkOutBtn').disabled = false;
}

function deleteRow(row) {
    // Remove the selected row from the table
    row.remove();
}

document.addEventListener('DOMContentLoaded', function() {
    const recordId = new URLSearchParams(window.location.search).get('id'); // Get ID from URL
    if (recordId) {
        getPatientDetails(recordId); // Fetch and populate data
    }
});