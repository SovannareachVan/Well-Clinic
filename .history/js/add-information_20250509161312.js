import { db } from './firebase-config.js';
import { ref, get, set, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js ';
import { diagnosisOptions } from './add-info-dropdown.js';

// Track initialization state
let medicinesInitialized = false;

// Medicine options
const medicineOptions = [
    "ACA 5mg",
    "Amithir 25mg",
    "Amitriptyline CPE 25mg",
    "Amitriptyline 25mg",
    "Arizap 10mg",
    "Asolan 0.5mg",
    "Avestalo 10mg",
    "Avestalo 5mg",
    "Bromark 150mg",
    "Chlorpromazine 100mg",
    "Clozapine 100mg",
    "Dezodone 50mg",
    "Diazepam 5mg",
    "DV-LEO",
    "DV-Lopram",
    "Euphytose",
    "Eziness 30mg",
    "Haloperidol 10mg",
    "Lamnet 25mg",
    "Lamnet 50mg",
    "Lamnet 100mg",
    "Lanzap 2.5mg",
    "Lanzap 5mg",
    "Lanzap 10mg",
    "Lumark 500mg",
    "Merlopam 0.5mg",
    "Merlopam 2mg",
    "Morcet 10mg",
    "MultiV",
    "Nortriptyline 25mg",
    "Perphenazine 8mg",
    "Persidal 2mg",
    "Phenobarbitale 100mg",
    "Phenobarbitale 50mg",
    "Polytanol 25mg",
    "Ratraline 50mg",
    "Rismek 2mg",
    "Sertaline 50mg",
    "Thioridazine 10mg",
    "Trihexyphenidule 8mg",
    "Valdoxan 25mg",
    "Carbamazepine 200mg",
    "Zoloft 50mg"
];

// Function to initialize diagnosis dropdown
function initDiagnosisDropdown() {
    const input = document.getElementById('diagnosis');
    const dropdown = document.getElementById('diagnosis-dropdown');
    if (!input || !dropdown) return;
    input.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';
        const filteredOptions = query
            ? diagnosisOptions.filter(option => option.toLowerCase().includes(query))
            : diagnosisOptions;
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
            diagnosisOptions.forEach(option => {
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

// Function to parse dose value
function parseDoseValue(value) {
    if (!value) return 0;
    if (value.includes('+')) {
        const [whole, frac] = value.split('+');
        return parseFloat(whole) + parseFraction(frac);
    } else if (value.includes('/')) {
        return parseFraction(value);
    } else {
        return parseFloat(value);
    }
}
function parseFraction(fracStr) {
    const [numerator, denominator] = fracStr.split('/').map(Number);
    if (!denominator) return 0;
    return numerator / denominator;
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
    if (!input || !dropdown) return;
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

// Function to add a medicine item
window.addMedicineItem = function(medicineData = null, forceAdd = false) {
    const ul = document.getElementById('medicineList');
    if (!forceAdd && !medicineData && medicinesInitialized && ul.querySelectorAll('li').length > 0) {
        const lastLi = ul.lastElementChild;
        const inputs = lastLi.querySelectorAll('input');
        const selects = lastLi.querySelectorAll('select');
        let isEmpty = true;
        inputs.forEach(input => {
            if (input.value) isEmpty = false;
        });
        selects.forEach(select => {
            if (select.value) isEmpty = false;
        });
        if (isEmpty) return null;
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
                <td>
                    <select class="dosage-select morning-dose">
                        <option value="" ${!medicineData?.morningDose ? 'selected' : ''}>...</option>
                        <option value="1/2" ${medicineData?.morningDose === '1/2' ? 'selected' : ''}>1/2</option>
                        <option value="1" ${medicineData?.morningDose === '1' ? 'selected' : ''}>1</option>
                        <option value="1+1/4" ${medicineData?.morningDose === '1+1/4' ? 'selected' : ''}>1+1/4</option>
                        <option value="1+1/2" ${medicineData?.morningDose === '1+1/2' ? 'selected' : ''}>1+1/2</option>
                        <option value="2" ${medicineData?.morningDose === '2' ? 'selected' : ''}>2</option>
                        <option value="2+1/2" ${medicineData?.morningDose === '2+1/2' ? 'selected' : ''}>2+1/2</option>
                        <option value="3" ${medicineData?.morningDose === '3' ? 'selected' : ''}>3</option>
                        <option value="1/4" ${medicineData?.morningDose === '1/4' ? 'selected' : ''}>1/4</option>
                    </select>
                </td>
                <td>
                    <select class="dosage-select afternoon-dose">
                        <option value="" ${!medicineData?.afternoonDose ? 'selected' : ''}>...</option>
                        <option value="1/2" ${medicineData?.afternoonDose === '1/2' ? 'selected' : ''}>1/2</option>
                        <option value="1" ${medicineData?.afternoonDose === '1' ? 'selected' : ''}>1</option>
                        <option value="1+1/4" ${medicineData?.afternoonDose === '1+1/4' ? 'selected' : ''}>1+1/4</option>
                        <option value="1+1/2" ${medicineData?.afternoonDose === '1+1/2' ? 'selected' : ''}>1+1/2</option>
                        <option value="2" ${medicineData?.afternoonDose === '2' ? 'selected' : ''}>2</option>
                        <option value="2+1/2" ${medicineData?.afternoonDose === '2+1/2' ? 'selected' : ''}>2+1/2</option>
                        <option value="3" ${medicineData?.afternoonDose === '3' ? 'selected' : ''}>3</option>
                        <option value="1/4" ${medicineData?.afternoonDose === '1/4' ? 'selected' : ''}>1/4</option>
                    </select>
                </td>
                <td>
                    <select class="dosage-select evening-dose">
                        <option value="" ${!medicineData?.eveningDose ? 'selected' : ''}>...</option>
                        <option value="1/2" ${medicineData?.eveningDose === '1/2' ? 'selected' : ''}>1/2</option>
                        <option value="1" ${medicineData?.eveningDose === '1' ? 'selected' : ''}>1</option>
                        <option value="1+1/4" ${medicineData?.eveningDose === '1+1/4' ? 'selected' : ''}>1+1/4</option>
                        <option value="1+1/2" ${medicineData?.eveningDose === '1+1/2' ? 'selected' : ''}>1+1/2</option>
                        <option value="2" ${medicineData?.eveningDose === '2' ? 'selected' : ''}>2</option>
                        <option value="2+1/2" ${medicineData?.eveningDose === '2+1/2' ? 'selected' : ''}>2+1/2</option>
                        <option value="3" ${medicineData?.eveningDose === '3' ? 'selected' : ''}>3</option>
                        <option value="1/4" ${medicineData?.eveningDose === '1/4' ? 'selected' : ''}>1/4</option>
                    </select>
                </td>
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

    if (medicineData) {
        calculateQuantity();
    }

    medicinesInitialized = true;
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

    if (!diagnosis) {
        alert("សូមបំពេញរោគវិនិច្ឆ័យ");
        return;
    }

    const medicines = [];
    const medicineNames = new Set();

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
        const visitInfoRef = ref(db, `patients/${patientId}/visits/${visitId}/information`);
        await set(visitInfoRef, patientInfo);
        displaySavedInfoInForm(patientInfo);
        alert('ព័ត៌មានត្រូវបានរក្សាទុកដោយជោគជ័យ!');
    } catch (error) {
        console.error('Error saving patient information:', error);
        alert('កំហុសក្នុងការរក្សាទុកព័ត៌មាន៖ ' + error.message);
    }
}

// Function to display saved info in form
async function displaySavedInfoInForm(info) {
    document.getElementById('treatmentHistory').value = info.treatmentHistory !== "N/A" ? info.treatmentHistory : '';
    document.getElementById('labTest').value = info.labTest !== "N/A" ? info.labTest : '';
    document.getElementById('diagnosis').value = info.diagnosis || '';

    const medicineList = document.getElementById('medicineList');
    medicineList.innerHTML = '';

    if (info.medicines && info.medicines.length > 0) {
        info.medicines.forEach(med => {
            addMedicineItem(med, true);
        });
    } else {
        addMedicineItem(null, true);
    }
}

// Function to clear form
function clearForm() {
    document.getElementById('treatmentHistory').value = '';
    document.getElementById('labTest').value = '';
    document.getElementById('diagnosis').value = '';
    document.getElementById('medicineList').innerHTML = '';
    medicinesInitialized = false;
    addMedicineItem(null, true);
}

// Load data on DOM load
document.addEventListener('DOMContentLoaded', async function () {
    initDiagnosisDropdown();
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');

    if (!patientId || !visitId) {
        addMedicineItem(null, true);
        return;
    }

    try {
        // Try loading visit-specific info
        const infoRef = ref(db, `patients/${patientId}/visits/${visitId}/information`);
        const snapshot = await get(infoRef);

        let patientInfo = null;

        if (snapshot.exists()) {
            patientInfo = snapshot.val();
        } else {
            // Fall back to structuredNotes if no visit info
            const patientSnapshot = await get(ref(db, `patients/${patientId}`));
            if (patientSnapshot.exists()) {
                patientInfo = patientSnapshot.val().structuredNotes || null;
            }
        }

        if (patientInfo) {
            displaySavedInfoInForm(patientInfo);
        } else {
            addMedicineItem(null, true);
        }
    } catch (error) {
        console.error('Error loading patient information:', error);
        addMedicineItem(null, true);
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', savePatientInformation);
    } else {
        console.error('Save button not found');
    }

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }

    document.addEventListener('click', event => {
        const diagnosisInput = document.getElementById('diagnosis');
        const diagnosisDropdown = document.getElementById('diagnosis-dropdown');
        if (diagnosisDropdown && diagnosisInput && !diagnosisInput.contains(event.target) && !diagnosisDropdown.contains(event.target)) {
            diagnosisDropdown.style.display = 'none';
        }

        document.querySelectorAll('.medicine-dropdown').forEach(dropdown => {
            const input = dropdown.previousElementSibling;
            if (!input) return;
            if (!input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    });
});