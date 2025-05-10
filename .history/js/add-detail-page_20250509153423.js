import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js ';
import { note4Options } from './dropdown.js';
import { medicineOptions } from './medicine-dropdown.js';

// Track initialization state
let medicinesInitialized = false;

// Parse dose values like "1+1/2" or "1/2"
function parseDoseValue(value) {
    if (!value) return 0;
    if (value.includes('+')) {
        return value.split('+').reduce((sum, part) => sum + parseFraction(part), 0);
    } else if (value.includes('/')) {
        return parseFraction(value);
    } else {
        return parseFloat(value) || 0;
    }
}
function parseFraction(fracStr) {
    const [numerator, denominator] = fracStr.split('/').map(Number);
    return denominator ? numerator / denominator : 0;
}

// Calculate medication quantity
function calculateMedicationQuantity(item) {
    const daysInput = item.querySelector('.time-input');
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

// Initialize diagnosis dropdown
function initDiagnosisDropdown() {
    const input = document.getElementById('patientNote4');
    const dropdown = document.getElementById('note4-dropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';
        const filteredOptions = query
            ? note4Options.filter(option => option.toLowerCase().includes(query))
            : [...note4Options];
        filteredOptions.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = () => {
                input.value = option;
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });
        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function () {
        dropdown.innerHTML = '';
        note4Options.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = () => {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });
        dropdown.style.display = 'block';
    });
}

// Initialize medicine dropdown
function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');

    if (!input || !dropdown) return;

    input.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';
        const filtered = medicineOptions.filter(opt => opt.toLowerCase().includes(query));
        filtered.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = () => {
                input.value = option;
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });
        dropdown.style.display = filtered.length ? 'block' : 'none';
    });

    input.addEventListener('click', function () {
        if (dropdown.innerHTML === '') {
            medicineOptions.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = () => {
                    input.value = option;
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(div);
            });
        }
        dropdown.style.display = 'block';
    });
}

// Add a new medicine item
window.addMedicineItem = function (medicineData = null) {
    const ul = document.getElementById('medicineList');
    if (!ul) return;

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
                            <input type="text" class="medicine-input" placeholder="សូមជ្រើសរើសថ្នាំ..." autocomplete="off" value="${medicineData?.name || ''}">
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
        </table>
    `;

    ul.appendChild(li);
    initMedicineDropdown(li);

    // Set up calculation
    const daysInput = li.querySelector('.time-input');
    const morningSelect = li.querySelector('.morning-dose');
    const afternoonSelect = li.querySelector('.afternoon-dose');
    const eveningSelect = li.querySelector('.evening-dose');
    const quantityInput = li.querySelector('.quantity-input');

    function calculateQuantity() {
        const days = parseFloat(daysInput.value) || 0;
        const morning = parseDoseValue(morningSelect.value);
        const afternoon = parseDoseValue(afternoonSelect.value);
        const evening = parseDoseValue(eveningSelect.value);
        const totalPerDay = morning + afternoon + evening;
        const totalQuantity = days * totalPerDay;
        quantityInput.value = totalQuantity % 1 === 0 ? totalQuantity : totalQuantity.toFixed(1);
    }

    daysInput.addEventListener('input', calculateQuantity);
    morningSelect.addEventListener('change', calculateQuantity);
    afternoonSelect.addEventListener('change', calculateQuantity);
    eveningSelect.addEventListener('change', calculateQuantity);

    if (medicineData) calculateQuantity();

    medicinesInitialized = true;
};

// Load patient details
async function getPatientDetails(recordId, visitId = null) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const basicInfo = snapshot.val();
            document.getElementById('patientNote4').value = basicInfo.structuredNotes?.note4 || '';
            document.getElementById('patientNotes').textContent = basicInfo.notes || 'N/A';

            if (basicInfo.structuredNotes?.medicines) {
                basicInfo.structuredNotes.medicines.forEach(med => addMedicineItem(med));
            }
        }
    } catch (error) {
        console.error('Error fetching patient data:', error);
    }
}

// Save structured notes
async function savePatientNotes(recordId, visitId = null) {
    const medicines = Array.from(document.querySelectorAll('.medicine-item')).map(item => ({
        name: item.querySelector('.medicine-input').value,
        dosage: item.querySelector('.dosage-select').value,
        days: item.querySelector('.time-input').value,
        morningDose: item.querySelector('.morning-dose').value,
        afternoonDose: item.querySelector('.afternoon-dose').value,
        eveningDose: item.querySelector('.evening-dose').value,
        quantity: item.querySelector('.quantity-input').value
    }));

    const structuredNotes = {
        note4: document.getElementById('patientNote4').value.trim(),
        medicines
    };

    try {
        const currentRef = ref(db, `patients/${recordId}`);
        const snapshot = await get(currentRef);
        const currentData = snapshot.val() || {};

        await update(currentRef, {
            ...currentData,
            structuredNotes
        });

        alert('ព័ត៌មានត្រូវបានរក្សាទុកដោយជោគជ័យ!');
        window.history.back();
    } catch (err) {
        console.error('Error saving notes:', err);
        alert('កំហុសក្នុងការរក្សាទុកព័ត៌មាន។');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDiagnosisDropdown();

    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');

    if (recordId) {
        getPatientDetails(recordId, visitId);
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => savePatientNotes(recordId, visitId));
        }
        const addMedicineBtn = document.getElementById('addMedicineBtn');
        if (addMedicineBtn) {
            addMedicineBtn.addEventListener('click', () => addMedicineItem());
        }
    }

    addMedicineItem();
});