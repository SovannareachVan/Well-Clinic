// Diagnosis options
import { db } from './firebase-config.js';
import { ref, get, update, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

let medicinesInitialized = false;

const diagnosisOptions = [
    "ជំងឺគ្រុនចាញ់",
    "ជំងឺគ្រុនចាញ់ធ្ងន់ធ្ងរ",
    "ជំងឺគ្រុនឈាម",
    "ជំងឺរលាកបំពង់ក",
    "ជំងឺរលាកសួត",
    "ជំងឺហឺតៗ",
    "ជំងឺផ្តាសាយ",
    "ជំងឺគ្រុនក្តៅ",
    "ជំងឺរលាកពោះវៀន",
    "ជំងឺរលាកក្រពះ",
    "ជំងឺរលាកសួតធ្ងន់ធ្ងរ",
    "ជំងឺមហារីក",
    "ជំងឺស្វាយ",
    "ជំងឺឆ្កួតជ្រូក",
    "ជំងឺហើមសរសៃប្រសាទ",
    "ជំងឺហើមសរសៃប្រសាទភ្នែក",
    "ជំងឺមហារីកថ្លើម",
    "ជំងឺមហារីកពោះវៀន",
    "ជំងឺមហារីកសួត",
    "ជំងឺមហារីកឈាម"
];

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
    

    return li;
};

// Function to save patient information
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
    document.querySelectorAll('.medicine-item').forEach(item => {
        const medicineName = item.querySelector('.medicine-input').value.trim();
        if (medicineName) { // Only include medicines with names
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
            addMedicineItem(med);
        });
    } else {
        // Add one empty medicine item by default
        addMedicineItem();
    }
    
    // No external display - everything stays in the form fields
}

function clearForm() {
    // Clear form inputs
    document.getElementById('treatmentHistory').value = '';
    document.getElementById('labTest').value = '';
    document.getElementById('diagnosis').value = '';
    document.getElementById('medicineList').innerHTML = '';
    
    // Hide saved data displays
    document.getElementById('savedTreatmentHistory').style.display = 'none';
    document.getElementById('savedLabTest').style.display = 'none';
    document.getElementById('savedDiagnosis').style.display = 'none';
    document.getElementById('savedMedicines').style.display = 'none';
    
    // Add one empty medicine item
    addMedicineItem();
}

// Initialize when DOM is loaded
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
                
                // Populate form fields
                document.getElementById('treatmentHistory').value = patientInfo.treatmentHistory !== "N/A" ? patientInfo.treatmentHistory : '';
                document.getElementById('labTest').value = patientInfo.labTest !== "N/A" ? patientInfo.labTest : '';
                document.getElementById('diagnosis').value = patientInfo.diagnosis || '';
                
                // Add medicine items
                if (patientInfo.medicines && patientInfo.medicines.length > 0) {
                    patientInfo.medicines.forEach(med => {
                        addMedicineItem(med);
                    });
                } else {
                    addMedicineItem(); // Add one empty medicine item by default
                }
            } else {
                addMedicineItem(); // Add one empty medicine item by default
            }
        } catch (error) {
            console.error('Error loading patient information:', error);
            addMedicineItem(); // Add one empty medicine item by default
        }
    } else {
        addMedicineItem(); // Add one empty medicine item by default
    }
    
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