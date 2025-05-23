import { db } from './firebase-config.js';
import { ref, set, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
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

// Function to parse dose values
function parseDoseValue(dose) {
    if (!dose || dose.trim() === "") return 0;
    if (dose.includes('+')) {
        return dose.split('+').reduce((sum, part) => sum + parseDoseValue(part), 0);
    }
    if (dose.includes('/')) {
        const [numerator, denominator] = dose.split('/');
        return parseFloat(numerator) / parseFloat(denominator);
    }
    return parseFloat(dose) || 0;
}

// Function to calculate medication quantity
function calculateMedicationQuantity(item) {
    const daysInput = item.querySelector('.time-input:first-of-type');
    const morningDose = item.querySelectorAll('.dosage-select')[1].value;
    const afternoonDose = item.querySelectorAll('.dosage-select')[2].value;
    const eveningDose = item.querySelectorAll('.dosage-select')[3].value;
    const quantityInput = item.querySelector('.quantity-input');

    const days = parseFloat(daysInput.value) || 0;
    const morningValue = parseDoseValue(morningDose);
    const afternoonValue = parseDoseValue(afternoonDose);
    const eveningValue = parseDoseValue(eveningDose);

    const totalPerDay = morningValue + afternoonValue + eveningValue;
    const totalQuantity = days * totalPerDay;

    quantityInput.value = totalQuantity % 1 === 0 ? totalQuantity : totalQuantity.toFixed(1);
}

// Function to fetch patient data
async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();

            // Display basic info
            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientPhone').textContent = patientData.phone;
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
            document.getElementById('patientName').textContent = patientData.fullName;
            
            // Handle notes display - always show original text
            if (typeof patientData.notes === 'string') {
                document.getElementById('patientNotes').textContent = patientData.notes;
            } else if (patientData.notes?.original) {
                document.getElementById('patientNotes').textContent = patientData.notes.original;
            } else {
                document.getElementById('patientNotes').textContent = '';
            }

            // Load structured notes
            const structured = patientData.structuredNotes || 
                            (patientData.notes?.structured) || {};
            
            document.getElementById('patientNote1').value = structured.note1 || '';
            document.getElementById('patientNote2').value = structured.note2 || '';
            document.getElementById('patientNote3').value = structured.note3 || '';
            document.getElementById('patientNote4').value = structured.note4 || '';
            document.getElementById('patientNote5').value = structured.note5 || '';

            // Load medicines
            const ul = document.getElementById('medicineList');
            ul.innerHTML = '';
            if (structured.medicines) {
                structured.medicines.forEach(med => {
                    const li = addMedicineItem(med);
                    // Calculate quantity for loaded medicines
                    calculateMedicationQuantity(li);
                });
            }
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

// Function to save patient notes
// Modify your savePatientNotes function to handle both new and existing records
async function savePatientNotes(recordId, visitId = null) {
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
        note5: document.getElementById('patientNote5').value.trim(),
        medicines: medicines
    };

    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);
        const currentData = snapshot.val() || {};
        
        // Prepare update data
        const updateData = {
            ...currentData,
            structuredNotes: structuredNotes,
            notes: document.getElementById('patientNotes').value.trim() // Keep original notes
        };

        // If this is a first visit (no visitId), update the root
        if (!visitId) {
            await update(patientRef, updateData);
        } 
        // If this is a subsequent visit (has visitId), update under visits node
        else {
            const visitRef = ref(db, `patients/${recordId}/visits/${visitId}/information`);
            await set(visitRef, structuredNotes);
        }

        alert('Notes saved successfully!');
        window.history.back();
    } catch (error) {
        console.error('Error saving patient notes:', error);
        alert('Failed to save notes.');
    }
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
window.addMedicineItem = function (medicineData = null) {
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

    // Setup calculation listeners
    const daysInput = li.querySelector('.time-input');
    const morningSelect = li.querySelector('.morning-dose');
    const afternoonSelect = li.querySelector('.afternoon-dose');
    const eveningSelect = li.querySelector('.evening-dose');
    const quantityInput = li.querySelector('.quantity-input');

    function calculateQuantity() {
        const days = parseFloat(daysInput.value) || 0;
        const morningValue = parseDoseValue(morningSelect.value);
        const afternoonValue = parseDoseValue(afternoonSelect.value);
        const eveningValue = parseDoseValue(eveningSelect.value);
        const totalPerDay = morningValue + afternoonValue + eveningValue;
        const totalQuantity = days * totalPerDay;
        quantityInput.value = totalQuantity % 1 === 0 ? totalQuantity : totalQuantity.toFixed(1);
    }

    daysInput.addEventListener('input', calculateQuantity);
    morningSelect.addEventListener('change', calculateQuantity);
    afternoonSelect.addEventListener('change', calculateQuantity);
    eveningSelect.addEventListener('change', calculateQuantity);

    return li;
};

// Initialize when DOM is loaded
// Modify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId'); // This will be null for first visit

    if (recordId) {
        getPatientDetails(recordId);
        initDiagnosisDropdown();
        
        // Update the save button click handler
        document.getElementById('saveBtn').addEventListener('click', function () {
            savePatientNotes(recordId, visitId);
        });
        
        document.getElementById('addMedicineBtn').addEventListener('click', addMedicineItem);
    }

        document.querySelectorAll('.medicine-dropdown').forEach(dropdown => {
            const input = dropdown.previousElementSibling;
            if (!input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    });
});