// Diagnosis options
import { db } from './firebase-config.js';
import { ref, get, update, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { medicineOptions } from './medicine-dropdown.js';
import { note4Options } from './dropdown.js';

// Track initialization state
let medicinesInitialized = false;

function initNote4Dropdown() {
    const input = document.getElementById('note4-input'); // Change to your actual input ID
    const dropdown = document.getElementById('note4-dropdown'); // Change to your dropdown ID

    if (!input || !dropdown) return; // Safety check

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

// Medicine options
const medicineOptions = [
    "Paracetamol 500mg",
    "Amoxicillin 500mg",
    "Ibuprofen 400mg",
    "Cetirizine 10mg",
    "Loratadine 10mg",
    "Omeprazole 20mg",
    "Metronidazole 500mg",
    "Ciprofloxacin 500mg",
    "Doxycycline 100mg",
    "Azithromycin 250mg",
    "Prednisolone 5mg",
    "Furosemide 40mg",
    "Amlodipine 5mg",
    "Losartan 50mg",
    "Metformin 500mg",
    "Glibenclamide 5mg",
    "Atorvastatin 20mg",
    "Simvastatin 20mg",
    "Salbutamol inhaler",
    "Beclomethasone inhaler"
];

// Function to initialize diagnosis dropdown
function initDiagnosisDropdown() {
    const input = document.getElementById('diagnosis');
    const dropdown = document.getElementById('diagnosis-dropdown');

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

// Function to initialize medicine dropdown for a specific item
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

// MODIFIED: Function to add medicine list item with duplicate prevention
window.addMedicineItem = function(medicineData = null, forceAdd = false) {
    const ul = document.getElementById('medicineList');
    
    // Prevent empty duplicates unless forced
    if (!forceAdd && !medicineData && medicinesInitialized) {
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
                        <input type="text" class="medicine-input" placeholder="សូមជ្រើសរើសថ្នាំ..." autocomplete="off" value="${medicineData ? medicineData.name : ''}">
                        <div class="medicine-dropdown dropdown"></div>
                    </div>
                </td>
                <td>
                    <select class="dosage-select">
                        <option value="" ${!medicineData?.dosage ? 'selected disabled' : ''}>...</option>
                        <option value="ថ្នាំគ្រាប់" ${medicineData?.dosage === 'ថ្នាំគ្រាប់' ? 'selected' : ''}>ថ្នាំគ្រាប់</option>
                        <option value="អំពូល" ${medicineData?.dosage === 'អំពូល' ? 'selected' : ''}>អំពូល</option>
                        <option value="កញ្ចប់" ${medicineData?.dosage === 'កញ្ចប់' ? 'selected' : ''}>កញ្ចប់</option>
                        <option value="បន្ទះ" ${medicineData?.dosage === 'បន្ទះ' ? 'selected' : ''}>បន្ទះ</option>
                    </select>
                </td>
                <td><input type="number" class="time-input" placeholder="ថ្ងៃ" min="1" value="${medicineData?.days || ''}"></td>
                <td><select class="dosage-select morning-dose">
                    <option value="" ${!medicineData?.morningDose ? 'selected' : ''}>...</option>
                    <option value="1/2" ${medicineData?.morningDose === '1/2' ? 'selected' : ''}>1/2</option>
                    <option value="1" ${medicineData?.morningDose === '1' ? 'selected' : ''}>1</option>
                    <option value="1+1/4" ${medicineData?.morningDose === '1+1/4' ? 'selected' : ''}>1+1/4</option>
                    <option value="1+1/2" ${medicineData?.morningDose === '1+1/2' ? 'selected' : ''}>1+1/2</option>
                    <option value="2" ${medicineData?.morningDose === '2' ? 'selected' : ''}>2</option>
                    <option value="2+1/2" ${medicineData?.morningDose === '2+1/2' ? 'selected' : ''}>2+1/2</option>
                    <option value="3" ${medicineData?.morningDose === '3' ? 'selected' : ''}>3</option>
                    <option value="1/4" ${medicineData?.morningDose === '1/4' ? 'selected' : ''}>1/4</option>
                </select></td>
                <td><select class="dosage-select afternoon-dose">
                    <option value="" ${!medicineData?.afternoonDose ? 'selected' : ''}>...</option>
                    <option value="1/2" ${medicineData?.afternoonDose === '1/2' ? 'selected' : ''}>1/2</option>
                    <option value="1" ${medicineData?.afternoonDose === '1' ? 'selected' : ''}>1</option>
                    <option value="1+1/4" ${medicineData?.afternoonDose === '1+1/4' ? 'selected' : ''}>1+1/4</option>
                    <option value="1+1/2" ${medicineData?.afternoonDose === '1+1/2' ? 'selected' : ''}>1+1/2</option>
                    <option value="2" ${medicineData?.afternoonDose === '2' ? 'selected' : ''}>2</option>
                    <option value="2+1/2" ${medicineData?.afternoonDose === '2+1/2' ? 'selected' : ''}>2+1/2</option>
                    <option value="3" ${medicineData?.afternoonDose === '3' ? 'selected' : ''}>3</option>
                    <option value="1/4" ${medicineData?.afternoonDose === '1/4' ? 'selected' : ''}>1/4</option>
                </select></td>
                <td><select class="dosage-select evening-dose">
                    <option value="" ${!medicineData?.eveningDose ? 'selected' : ''}>...</option>
                    <option value="1/2" ${medicineData?.eveningDose === '1/2' ? 'selected' : ''}>1/2</option>
                    <option value="1" ${medicineData?.eveningDose === '1' ? 'selected' : ''}>1</option>
                    <option value="1+1/4" ${medicineData?.eveningDose === '1+1/4' ? 'selected' : ''}>1+1/4</option>
                    <option value="1+1/2" ${medicineData?.eveningDose === '1+1/2' ? 'selected' : ''}>1+1/2</option>
                    <option value="2" ${medicineData?.eveningDose === '2' ? 'selected' : ''}>2</option>
                    <option value="2+1/2" ${medicineData?.eveningDose === '2+1/2' ? 'selected' : ''}>2+1/2</option>
                    <option value="3" ${medicineData?.eveningDose === '3' ? 'selected' : ''}>3</option>
                    <option value="1/4" ${medicineData?.eveningDose === '1/4' ? 'selected' : ''}>1/4</option>
                </select></td>
                <td><input type="text" class="quantity-input" readonly value="${medicineData?.quantity || ''}"></td>
                <td><button class="btn-delete" onclick="this.closest('li').remove()">❌</button></td>
            </tr>
        </tbody>
    </table>`;

    ul.appendChild(li);
    initMedicineDropdown(li);

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

    // If we have data, calculate the quantity immediately
    if (medicineData) {
        calculateQuantity();
    }

    medicinesInitialized = true;
    return li;
};

// MODIFIED: Function to save patient information with duplicate check
async function savePatientInformation() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');
    
    if (!patientId || !visitId) {
        alert("Missing patient or visit information");
        return;
    }

    const treatmentHistory = document.getElementById('treatmentHistory').value.trim();
    const labTest = document.getElementById('labTest').value.trim();
    const diagnosis = document.getElementById('diagnosis').value.trim();

    // Validate required fields
    if (!diagnosis) {
        alert("សូមបំពេញរោគវិនិច្ឆ័យ");
        return;
    }

    const medicines = [];
    const medicineNames = new Set(); // Track names to prevent duplicates

    document.querySelectorAll('.medicine-item').forEach(item => {
        const medicineName = item.querySelector('.medicine-input').value.trim();
        if (medicineName && !medicineNames.has(medicineName)) {
            medicineNames.add(medicineName);
            medicines.push({
                name: medicineName,
                dosage: item.querySelector('.dosage-select').value,
                days: item.querySelector('.time-input').value || 0,
                morningDose: item.querySelector('.morning-dose').value,
                afternoonDose: item.querySelector('.afternoon-dose').value,
                eveningDose: item.querySelector('.evening-dose').value,
                quantity: item.querySelector('.quantity-input').value
            });
        }
    });

    const patientInfo = {
        treatmentHistory: treatmentHistory || "N/A",
        labTest: labTest || "N/A",
        diagnosis,
        medicines,
        createdAt: new Date().toISOString()
    };

    try {
        // Save under the specific visit
        const visitInfoRef = ref(db, `patients/${patientId}/visits/${visitId}/information`);
        await set(visitInfoRef, patientInfo);
        
        // Display the saved information in the form sections
        displaySavedInfoInForm(patientInfo);
        
        alert('ព័ត៌មានត្រូវបានរក្សាទុកដោយជោគជ័យ!');
        
    } catch (error) {
        console.error('Error saving patient information:', error);
        alert('កំហុសក្នុងការរក្សាទុកព័ត៌មាន៖ ' + error.message);
    }
}

// MODIFIED: Function to display saved info in form with initialization control
function displaySavedInfoInForm(info) {
    // Populate form fields with saved data
    document.getElementById('treatmentHistory').value = info.treatmentHistory !== "N/A" ? info.treatmentHistory : '';
    document.getElementById('labTest').value = info.labTest !== "N/A" ? info.labTest : '';
    document.getElementById('diagnosis').value = info.diagnosis || '';
    
    // Clear existing medicine items
    const medicineList = document.getElementById('medicineList');
    medicineList.innerHTML = '';
    
    // Add medicine items if they exist
    if (info.medicines && info.medicines.length > 0) {
        info.medicines.forEach(med => {
            addMedicineItem(med, true);
        });
    } else {
        // Add one empty medicine item by default
        addMedicineItem(null, true);
    }
}

// MODIFIED: Function to clear form with controlled initialization
function clearForm() {
    // Clear form inputs
    document.getElementById('treatmentHistory').value = '';
    document.getElementById('labTest').value = '';
    document.getElementById('diagnosis').value = '';
    document.getElementById('medicineList').innerHTML = '';
    
    // Reset initialization flag
    medicinesInitialized = false;
    
    // Add one empty medicine item
    addMedicineItem(null, true);
}

// MODIFIED: Initialize when DOM is loaded with proper sequencing
document.addEventListener('DOMContentLoaded', async function() {
    initDiagnosisDropdown();
    
    // Get patient and visit IDs from URL
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');
    
    if (patientId && visitId) {
        try {
            // Load saved information for this specific visit
            const infoRef = ref(db, `patients/${patientId}/visits/${visitId}/information`);
            const snapshot = await get(infoRef);
            
            if (snapshot.exists()) {
                const patientInfo = snapshot.val();
                displaySavedInfoInForm(patientInfo);
            } else {
                // Add one empty medicine item by default
                addMedicineItem(null, true);
            }
        } catch (error) {
            console.error('Error loading patient information:', error);
            // Add one empty medicine item by default
            addMedicineItem(null, true);
        }
    } else {
        // Add one empty medicine item by default
        addMedicineItem(null, true);
    }
    
    // Set up event listeners
    document.getElementById('saveBtn').addEventListener('click', savePatientInformation);
    document.getElementById('clearBtn').addEventListener('click', clearForm);

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const diagnosisDropdown = document.getElementById('diagnosis-dropdown');
        const diagnosisInput = document.getElementById('diagnosis');
        if (diagnosisDropdown && diagnosisInput && !diagnosisInput.contains(event.target) && !diagnosisDropdown.contains(event.target)) {
            diagnosisDropdown.style.display = 'none';
        }

        document.querySelectorAll('.medicine-dropdown').forEach(dropdown => {
            const input = dropdown.previousElementSibling;
            if (!input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    });
});