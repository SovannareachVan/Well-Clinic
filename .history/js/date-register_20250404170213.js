import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
document.getElementById('checkInBtn').addEventListener('click', checkIn);
document.getElementById('checkOutBtn').addEventListener('click', checkOut);

let rowCount = 1;
let checkInTime;

function checkIn() {
    // Disable the check-in button
    document.getElementById('checkInBtn').disabled = true;
    document.getElementById('checkOutBtn').disabled = false;

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
