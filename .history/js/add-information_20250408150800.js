import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Sample diagnosis options (you can expand this list)
const diagnosisOptions = [
    "ជំងឺផ្តាសាយ",
    "ជំងឺក្តៅ",
    "ជំងឺគ្រុនចាញ់",
    "ជំងឺលឿង",
    "ជំងឺឆ្កួត",
    "ជំងឺហឺត",
    "ជំងឺរលាកបំពង់ក",
    "ជំងឺរលាកសួត",
    "ជំងឺរលាកពោះវៀន",
    "ជំងឺស្ពឹកស្ពត់"
];

// Sample medicine options (you can expand this list)
const medicineOptions = [
    "Paracetamol",
    "Amoxicillin",
    "Ibuprofen",
    "Cetirizine",
    "Omeprazole",
    "Metformin",
    "Losartan",
    "Atorvastatin",
    "Aspirin",
    "Vitamin C"
];

// Function to initialize diagnosis dropdown
function initDiagnosisDropdown() {
    const input = document.getElementById('patientNote3');
    const dropdown = document.getElementById('note3-dropdown');

    if (!input || !dropdown) return;

    input.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';

        const filteredOptions = query 
            ? diagnosisOptions.filter(option => option.toLowerCase().includes(query))
            : diagnosisOptions;

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
            diagnosisOptions.forEach(option => {
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

// Function to initialize medicine dropdown for an item
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

// Function to calculate medication quantity
function calculateMedicationQuantity(item) {
    const daysInput = item.querySelector('.time-input');
    const morningDose = item.querySelector('.morning-dose').value;
    const afternoonDose = item.querySelector('.afternoon-dose').value;
    const eveningDose = item.querySelector('.evening-dose').value;
    const quantityInput = item.querySelector('.quantity-input');

    const days = parseFloat(daysInput.value) || 0;
    const morningValue = parseDoseValue(morningDose);
    const afternoonValue = parseDoseValue(afternoonDose);
    const eveningValue = parseDoseValue(eveningDose);

    const totalPerDay = morningValue + afternoonValue + eveningValue;
    const totalQuantity = days * totalPerDay;

    quantityInput.value = totalQuantity % 1 === 0 ? totalQuantity : totalQuantity.toFixed(1);
}

// Function to add medicine list item
window.addMedicineItem = function(medicineData = null) {
    const ul = document.getElementById('medicineList');
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
        </table>
    `;

    ul.appendChild(li);
    initMedicineDropdown(li);

    // If medicine data provided, populate the fields
    if (medicineData) {
        li.querySelector('.medicine-input').value = medicineData.name || '';
        li.querySelector('.dosage-select').value = medicineData.dosage || '';
        li.querySelector('.time-input').value = medicineData.days || '';
        li.querySelector('.morning-dose').value = medicineData.morningDose || '';
        li.querySelector('.afternoon-dose').value = medicineData.afternoonDose || '';
        li.querySelector('.evening-dose').value = medicineData.eveningDose || '';
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

// Function to fetch patient data
async function getPatientDetails(recordId, visitIndex) {
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
            document.getElementById('patientNotes').textContent = patientData.notes || 'No notes available.';

            // Load visit-specific data if visitIndex is provided
            if (visitIndex !== undefined && patientData.visits && patientData.visits[visitIndex]) {
                const visitData = patientData.visits[visitIndex];
                
                // Load notes if they exist in the visit data
                if (visitData.notes) {
                    document.getElementById('patientNote1').value = visitData.notes.note1 || '';
                    document.getElementById('patientNote2').value = visitData.notes.note2 || '';
                    document.getElementById('patientNote3').value = visitData.notes.note3 || '';
                    document.getElementById('patientNote4').value = visitData.notes.note4 || '';
                    
                    // Load medicines if they exist
                    const ul = document.getElementById('medicineList');
                    ul.innerHTML = '';
                    if (visitData.notes.medicines) {
                        visitData.notes.medicines.forEach(med => {
                            addMedicineItem(med);
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

// Function to save patient notes for a specific visit
async function savePatientNotes(recordId, visitIndex) {
    const medicines = [];
    document.querySelectorAll('.medicine-item').forEach(item => {
        medicines.push({
            name: item.querySelector('.medicine-input').value,
            dosage: item.querySelector('.dosage-select').value,
            days: item.querySelector('.time-input').value,
            morningDose: item.querySelector('.morning-dose').value,
            afternoonDose: item.querySelector('.afternoon-dose').value,
            eveningDose: item.querySelector('.evening-dose').value,
            quantity: item.querySelector('.quantity-input').value
        });
    });

    const notes = {
        note1: document.getElementById('patientNote1').value.trim(),
        note2: document.getElementById('patientNote2').value.trim(),
        note3: document.getElementById('patientNote3').value.trim(),
        note4: document.getElementById('patientNote4').value.trim(),
        medicines: medicines
    };

    try {
        // Get current patient data
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);
        const patientData = snapshot.val();

        // Update the specific visit with notes
        const visits = patientData.visits || [];
        if (visits[visitIndex]) {
            visits[visitIndex].notes = notes;
            
            // Update the patient data with modified visits
            await update(patientRef, { 
                visits: visits
            });
            
            alert('Notes saved successfully!');
            window.history.back();
        } else {
            alert('Error: Visit not found!');
        }
    } catch (error) {
        console.error('Error saving patient notes:', error);
        alert('Failed to save notes.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('id');
    const visitIndex = urlParams.get('visitIndex'); // This should be passed from date-register page
    
    if (recordId) {
        // Initialize dropdowns
        initDiagnosisDropdown();
        
        // Load patient details and visit-specific data
        getPatientDetails(recordId, visitIndex ? parseInt(visitIndex) : undefined);
        
        // Set up save button
        document.getElementById('saveBtn').addEventListener('click', function() {
            if (visitIndex !== null) {
                savePatientNotes(recordId, parseInt(visitIndex));
            } else {
                alert('Error: No visit specified!');
            }
        });
        
        // Add one empty medicine item by default
        addMedicineItem();
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const note3Dropdown = document.getElementById('note3-dropdown');
        const note3Input = document.getElementById('patientNote3');
        if (note3Dropdown && note3Input && !note3Input.contains(event.target) && !note3Dropdown.contains(event.target)) {
            note3Dropdown.style.display = 'none';
        }

        document.querySelectorAll('.medicine-dropdown').forEach(dropdown => {
            const input = dropdown.previousElementSibling;
            if (!input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    });
});