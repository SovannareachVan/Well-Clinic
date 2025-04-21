// Import Firebase and other necessary libraries
import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { note4Options } from './dropdown.js';
import { medicineOptions } from './medicine-dropdown.js';

// Function to initialize diagnosis dropdown
function initDiagnosisDropdown() {
    const input = document.getElementById('patientNote4');
    const dropdown = document.getElementById('note4-dropdown');

    if (!input || !dropdown) return;

    input.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';

        const filteredOptions = query
            ? note4Options.filter(option => option.toLowerCase().includes(query))
            : note4Options;

        filteredOptions.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = function () {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function () {
        dropdown.style.display = 'block';
        if (dropdown.innerHTML === '') {
            note4Options.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = function () {
                    input.value = option;
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(div);
            });
        }
    });
}

// Function to initialize medicine dropdown
function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');

    input.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';

        const filteredOptions = query
            ? medicineOptions.filter(option => option.toLowerCase().includes(query))
            : medicineOptions;

        filteredOptions.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = function () {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function () {
        dropdown.style.display = 'block';
        if (dropdown.innerHTML === '') {
            medicineOptions.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = function () {
                    input.value = option;
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(div);
            });
        }
    });
}

// Function to add medicine list item
function addMedicineItem(medicineData = null) {
    const ul = document.getElementById('medicineList');
    if (!ul) {
        console.error("Error: 'medicineList' element not found!");
        return null;
    }

    const li = document.createElement('li');
    li.classList.add('medicine-item');

    li.innerHTML = `
    <table class="medicine-table">
        <thead>
            <tr>
                <th>ឈ្មោះថ្នាំ</th>
                <th>ប្រភេទថ្នាំ</th>
                <th>រយះពេល (ថ្ងៃ)</th>
                <th>ព្រឹក</th>
                <th>ថ្ងៃ</th>
                <th>ល្ងាច</th>
                <th>ចំនួនថ្នាំ</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <div class="dropdown-wrapper">
                        <input type="text" class="medicine-input" placeholder="សូមជ្រើសរើសថ្នាំ..." autocomplete="off">
                        <div class="medicine-dropdown dropdown"></div>
                    </div>
                </td>
                <td>
                    <select class="dosage-select">
                        <option value="" selected disabled>...</option>
                        <option value="ថ្នាំគ្រាប់">ថ្នាំគ្រាប់</option>
                        <option value="អំពូល">អំពូល</option>
                        <option value="កញ្ចប់">កញ្ចប់</option>
                        <option value="បន្ទះ">បន្ទះ</option>
                    </select>
                </td>
                <td><input type="number" class="time-input" placeholder="ថ្ងៃ" min="1"></td>
                <td><select class="dosage-select morning-dose">
                    <option value="" selected>...</option>
                    <option value="1/2">1/2</option>
                    <option value="1">1</option>
                    <option value="1+1/4">1+1/4</option>
                    <option value="1+1/2">1+1/2</option>
                    <option value="2">2</option>
                    <option value="2+1/2">2+1/2</option>
                    <option value="3">3</option>
                    <option value="1/4">1/4</option>
                </select></td>
                <td><select class="dosage-select afternoon-dose">
                    <option value="" selected>...</option>
                    <option value="1/2">1/2</option>
                    <option value="1">1</option>
                    <option value="1+1/4">1+1/4</option>
                    <option value="1+1/2">1+1/2</option>
                    <option value="2">2</option>
                    <option value="2+1/2">2+1/2</option>
                    <option value="3">3</option>
                    <option value="1/4">1/4</option>
                </select></td>
                <td><select class="dosage-select evening-dose">
                    <option value="" selected>...</option>
                    <option value="1/2">1/2</option>
                    <option value="1">1</option>
                    <option value="1+1/4">1+1/4</option>
                    <option value="1+1/2">1+1/2</option>
                    <option value="2">2</option>
                    <option value="2+1/2">2+1/2</option>
                    <option value="3">3</option>
                    <option value="1/4">1/4</option>
                </select></td>
                <td><input type="text" class="quantity-input" readonly></td>
                <td><button class="btn-delete" onclick="this.closest('li').remove()">❌</button></td>
            </tr>
        </tbody>
    </table>`;

    ul.appendChild(li);
    initMedicineDropdown(li);

    // If medicine data provided, populate the fields
    if (medicineData) {
        li.querySelector('.medicine-input').value = medicineData.name || '';
        li.querySelector('.dosage-select').value = medicineData.dosage || '';
        li.querySelector('.time-input').value = medicineData.days || '';
        li.querySelectorAll('.dosage-select')[1].value = medicineData.morningDose || '';
        li.querySelectorAll('.dosage-select')[2].value = medicineData.afternoonDose || '';
        li.querySelectorAll('.dosage-select')[3].value = medicineData.eveningDose || '';
        li.querySelector('.quantity-input').value = medicineData.quantity || '';
    }

    return li;
}

// Function to save patient notes
async function savePatientNotes(recordId) {
    const medicines = [];
    document.querySelectorAll('.medicine-item').forEach(item => {
        medicines.push({
            name: item.querySelector('.medicine-input').value,
            dosage: item.querySelector('.dosage-select').value,
            days: item.querySelector('.time-input:first-of-type').value,
            morningDose: item.querySelectorAll('.dosage-select')[1].value,
            afternoonDose: item.querySelectorAll('.dosage-select')[2].value,
            eveningDose: item.querySelectorAll('.dosage-select')[3].value,
            quantity: item.querySelector('.quantity-input').value
        });
    });

    const structuredNotes = {
        note1: document.getElementById('patientNote1').value.trim(),
        note2: document.getElementById('patientNote2').value.trim(),
        note3: document.getElementById('patientNote3').value.trim(),
        note4: document.getElementById('patientNote4').value.trim(),
        medicines: medicines
    };

    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);
        const currentData = snapshot.val();

        const originalNotes = typeof currentData.notes === 'string' ? currentData.notes :
                            (currentData.notes?.original || '');

        await update(patientRef, {
            notes: originalNotes,
            structuredNotes: structuredNotes
        });

        alert('Notes saved successfully!');
        window.history.back();
    } catch (error) {
        console.error('Error saving patient notes:', error);
        alert('Failed to save notes.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        document.getElementById('saveBtn').addEventListener('click', function () {
            savePatientNotes(recordId);
        });
        document.getElementById('addMedicineBtn').addEventListener('click', addMedicineItem);
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (event) {
        const note4Dropdown = document.getElementById('note4-dropdown');
        const note4Input = document.getElementById('patientNote4');
        if (note4Dropdown && note4Input && !note4Input.contains(event.target) && !note4Dropdown.contains(event.target)) {
            note4Dropdown.style.display = 'none';
        }

        document.querySelectorAll('.medicine-dropdown').forEach(dropdown => {
            const input = dropdown.previousElementSibling;
            if (!input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    });
});
