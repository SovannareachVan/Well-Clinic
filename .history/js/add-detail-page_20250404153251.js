import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { note4Options } from './dropdown.js';
import { medicineOptions } from './medicine-dropdown.js';

// Function to initialize diagnosis dropdown
function initDiagnosisDropdown() {
    const input = document.getElementById('patientNote4');
    const dropdown = document.getElementById('note4-dropdown');

    if (!input || !dropdown) return;

    input.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';

        const filteredOptions = query 
            ? note4Options.filter(option => option.toLowerCase().includes(query)) 
            : note4Options;

        filteredOptions.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = function() {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function() {
        dropdown.style.display = 'block';
        if (dropdown.innerHTML === '') {
            note4Options.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = function() {
                    input.value = option;
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(div);
            });
        }
    });
}

// Function to fetch patient data and populate the details
async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();
            
            // Populate the details
            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientPhone').textContent = patientData.phone;
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
            document.getElementById('patientName').textContent = patientData.fullName;

            // Pre-fill existing notes (if any)
            document.getElementById('patientNote1').value = patientData.notes?.note1 || '';
            document.getElementById('patientNote2').value = patientData.notes?.note2 || '';
            document.getElementById('patientNote3').value = patientData.notes?.note3 || '';
            document.getElementById('patientNote4').value = patientData.notes?.note4 || '';
            document.getElementById('patientNote5').value = patientData.notes?.note5 || '';

            // Populate medicines if they exist
            if (patientData.notes?.medicines) {
                const ul = document.getElementById('medicineList');
                patientData.notes.medicines.forEach(med => {
                    addMedicineItem();
                    const lastItem = ul.lastChild;
                    const medicineInput = lastItem.querySelector('.medicine-input');
                    medicineInput.value = med.name;
                    lastItem.querySelector('.dosage-select').value = med.dosage;
                    lastItem.querySelector('.time-input').value = med.time;
                    lastItem.querySelectorAll('.beforeMeal').forEach(checkbox => {
                        checkbox.checked = med.beforeMeal;
                    });
                    lastItem.querySelector('.rate-select').value = med.rate;
                });
            }
        } else {
            console.log('No data available for this patient.');
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

// Function to save new patient notes
async function savePatientNotes(recordId) {
    // Collect medicine data
    const medicines = [];
    document.querySelectorAll('.medicine-item').forEach(item => {
        medicines.push({
            name: item.querySelector('.medicine-input').value,
            dosage: item.querySelector('.dosage-select').value,
            time: item.querySelector('.time-input').value,
            beforeMeal: item.querySelector('.beforeMeal').checked,
            rate: item.querySelector('.rate-select').value
        });
    });

    const notes = {
        note1: document.getElementById('patientNote1').value.trim(),
        note2: document.getElementById('patientNote2').value.trim(),
        note3: document.getElementById('patientNote3').value.trim(),
        note4: document.getElementById('patientNote4').value.trim(),
        note5: document.getElementById('patientNote5').value.trim(),
        medicines: medicines
    };

    try {
        const patientRef = ref(db, 'patients/' + recordId);
        await update(patientRef, { notes: notes });
        alert('Notes saved successfully!');
    } catch (error) {
        console.error('Error saving patient notes:', error);
    }
}

// Function to initialize medicine dropdown
function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');

    input.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';

        const filteredOptions = query 
            ? medicineOptions.filter(option => option.toLowerCase().includes(query)) 
            : medicineOptions;

        filteredOptions.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = function() {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function() {
        dropdown.style.display = 'block';
        if (dropdown.innerHTML === '') {
            medicineOptions.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = function() {
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
window.addMedicineItem = function() {
    const ul = document.getElementById('medicineList');
    
    if (!ul) {
        console.error("Error: 'medicineList' element not found!");
        return;
    }

    // Create list item
    const li = document.createElement('li');
    li.classList.add('medicine-item');

    // Create table structure
    const tableHTML = `
    <table class="medicine-table">
        <thead>
            <tr>
                <th>ឈ្មោះថ្នាំ</th>
                <th>ប្រភេទថ្នាំ</th>
                <th>រយះពេល</th>
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
                        <option value="">ex</option>
                        <option value="ex">ex</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="time-input" placeholder="ពេលវេលា">
                </td>
                <td>
                    <div class="checkbox-group">
                        <input type="checkbox" class="beforeMeal">
                        <label>យក</label>
                    </div>
                </td>
                <td>
                    <div class="checkbox-group">
                        <input type="checkbox" class="beforeMeal">
                        <label>យក</label>
                    </div>
                </td>
                <td>
                    <div class="checkbox-group">
                        <input type="checkbox" class="beforeMeal">
                        <label>យក</label>
                    </div>
                </td>
                <td>
                    <select class="rate-select">
                        <option value="✗">✗</option>
                        <option value="✓">✓</option>
                    </select>
                </td>
                <td>
                    <button class="btn-delete" onclick="this.closest('li').remove()">❌</button>
                </td>
            </tr>
        </tbody>
    </table>
    `;

    li.innerHTML = tableHTML;
    ul.appendChild(li);

    // Initialize the medicine dropdown for this new item
    initMedicineDropdown(li);
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        getPatientDetails(recordId);
        
        // Initialize diagnosis dropdown
        initDiagnosisDropdown();
        
        // Set up event listeners
        document.getElementById('saveBtn').addEventListener('click', function() {
            savePatientNotes(recordId);
        });

        document.getElementById('addMedicineBtn').addEventListener('click', addMedicineItem);
        
        // Initialize existing medicine dropdowns
        document.querySelectorAll('.medicine-item').forEach(item => {
            initMedicineDropdown(item);
        });
    }

    // Hide dropdowns when clicking outside
    document.addEventListener('click', function(event) {
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