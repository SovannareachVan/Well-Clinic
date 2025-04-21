import { db } from './firebase-config.js';
import { ref, get, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

document.getElementById('checkInBtn').addEventListener('click', checkIn);
document.getElementById('saveBtn').addEventListener('click', saveAllRows);
document.getElementById('backBtn').addEventListener('click', () => window.history.back());

let rowCount = 1;
let recordId;

// Fetch and show patient data
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
        } else {
            console.log('No patient data found.');
        }
    } catch (error) {
        console.error('Error fetching patient:', error);
    }
}

// Load saved check-in rows
async function loadSavedVisits(id) {
    try {
        const visitsRef = ref(db, 'patients/' + id + '/visits');
        const snapshot = await get(visitsRef);

        if (snapshot.exists()) {
            const visits = snapshot.val();
            const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';

            visits.forEach((visit, index) => {
                const newRow = tableBody.insertRow();

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
                clinicCell.appendChild(clinicSelect);

                const doctorCell = newRow.insertCell(4);
                doctorCell.textContent = visit.doctor;

                const actionCell = newRow.insertCell(5);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', () => {
                    const confirmDelete = confirm('Are you sure you want to delete this row?');
                    if (confirmDelete) {
                        deleteRow(newRow);
                    }
                });
                

                const checkOutBtn = document.createElement('button');
                checkOutBtn.textContent = 'Check-out';
                checkOutBtn.addEventListener('click', () => checkOutAction(newRow));
                
                const addBtn = document.createElement('button');
                addBtn.textContent = 'View/Edit';
                addBtn.addEventListener('click', () => {
                    window.location.href = `add-information.html?id=${recordId}`;
                });
                
                
                actionCell.appendChild(deleteBtn);
                actionCell.appendChild(checkOutBtn);
                actionCell.appendChild(addBtn);
                
            });

            rowCount = visits.length + 1;
        }
    } catch (error) {
        console.error('Error loading saved visits:', error);
    }
}

// Add a new check-in row
function checkIn() {
    const table = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('en-GB');
    const timeString = currentDate.toLocaleTimeString('en-GB');

    const serialCell = newRow.insertCell(0);
    serialCell.textContent = rowCount;  // Use the current rowCount as serial number

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

    rowCount++;  // Increment rowCount for the next row
}

// Perform check-out on a row
function checkOutAction(row) {
    const checkOutTime = new Date();
    const dateString = checkOutTime.toLocaleDateString('en-GB');
    const timeString = checkOutTime.toLocaleTimeString('en-GB');
    row.cells[2].innerHTML = `${dateString}<br>${timeString}`;

    row.querySelector('button:nth-child(2)').disabled = true;
}

// Delete row from table and renumber the remaining rows
function deleteRow(row) {
    // Get the parent table body element
    const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    
    // Remove the row from the table
    row.remove();

    // Renumber the remaining rows
    const rows = tableBody.getElementsByTagName('tr');
    let serial = 1;  // Start serial numbering from 1

    // Update serial numbers for remaining rows
    for (let row of rows) {
        row.cells[0].textContent = serial;  // Update the serial number in the first column
        serial++;  // Increment serial number
    }

    // Update the global rowCount based on the number of remaining rows
    rowCount = rows.length + 1;  // Set rowCount to the next available serial number
}

// Save all rows to Firebase
// Save all rows to Firebase
async function saveAllRows() {
    const tableBody = document.getElementById('checkInTable').getElementsByTagName('tbody')[0];
    const rows = tableBody.getElementsByTagName('tr');

    const visits = [];

    for (let row of rows) {
        const checkIn = row.cells[1].innerText.replace('\n', ' ');
        const checkOut = row.cells[2].innerText.replace('\n', ' ');
        const clinic = row.cells[3].querySelector('select').value;
        const doctor = row.cells[4].textContent;

        visits.push({ checkIn, checkOut, clinic, doctor });
    }

    try {
        await set(ref(db, 'patients/' + recordId + '/visits'), visits);
        alert('Data saved successfully!');
        window.history.back(); // 👈 Go back after success
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data.');
    }
}


// When the page loads
document.addEventListener('DOMContentLoaded', function () {
    recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        getPatientDetails(recordId);
        loadSavedVisits(recordId);
    }
});
