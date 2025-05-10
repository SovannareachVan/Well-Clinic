import { db } from './firebase-config.js';
import { ref, get, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js ';
import { diagnosisOptions } from './add-info-dropdown.js';

const medicineOptions = [
    "ACA 5mg", "Amithir 25mg", "Amitriptyline CPE 25mg", "Amitriptyline 25mg",
    "Arizap 10mg", "Asolan 0.5mg", "Avestalo 10mg", "Avestalo 5mg", "Bromark 150mg",
    "Chlorpromazine 100mg", "Clozapine 100mg", "Dezodone 50mg", "Diazepam 5mg",
    "DV-LEO", "DV-Lopram", "Euphytose", "Eziness 30mg", "Haloperidol 10mg",
    "Lamnet 25mg", "Lamnet 50mg", "Lamnet 100mg", "Lanzap 2.5mg", "Lanzap 5mg",
    "Lanzap 10mg", "Lumark 500mg", "Merlopam 0.5mg", "Merlopam 2mg", "Morcet 10mg",
    "MultiV", "Nortriptyline 25mg", "Perphenazine 8mg", "Persidal 2mg",
    "Phenobarbitale 100mg", "Phenobarbitale 50mg", "Polytanol 25mg", "Ratraline 50mg",
    "Rismek 2mg", "Sertaline 50mg", "Thioridazine 10mg", "Trihexyphenidule 8mg",
    "Valdoxan 25mg", "Carbamazepine 200mg", "Zoloft 50mg"
];

let medicinesInitialized = false;

// Initialize diagnosis dropdown
function initDiagnosisDropdown() {
    const input = document.getElementById('diagnosis');
    const dropdown = document.getElementById('diagnosis-dropdown');

    if (!input || !dropdown) return;

    input.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';
        const filtered = diagnosisOptions.filter(opt => opt.toLowerCase().includes(query));
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

    input.addEventListener('click', () => {
        if (dropdown.innerHTML === '') {
            diagnosisOptions.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = () => {
                    input.value = option;
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(div);
            });
        }
        dropdown.style.display = 'block';
    });
}

// Add new medicine item
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

    // Setup calculation
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

    input.addEventListener('click', () => {
        if (dropdown.innerHTML === '') {
            medicineOptions.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = () => {
                    input.value = option;
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(div);
            });
        }
        dropdown.style.display = 'block';
    });
}

// Parse dose values
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
    const [n, d] = fracStr.split('/').map(Number);
    return d ? n / d : 0;
}

// Save patient information
async function savePatientInformation() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');

    if (!patientId || !visitId) {
        alert("Missing patient or visit ID");
        return;
    }

    const treatmentHistory = document.getElementById('treatmentHistory')?.value.trim() || '';
    const labTest = document.getElementById('labTest')?.value.trim() || '';
    const diagnosis = document.getElementById('diagnosis')?.value.trim() || '';

    if (!diagnosis) {
        alert("សូមបំពេញរោគវិនិច្ឆ័យ");
        return;
    }

    const medicines = [];
    const names = new Set();

    document.querySelectorAll('.medicine-item').forEach(item => {
        const name = item.querySelector('.medicine-input')?.value.trim();
        if (name && !names.has(name)) {
            names.add(name);
            medicines.push({
                name,
                dosage: item.querySelector('.dosage-select')?.value,
                days: item.querySelector('.time-input')?.value,
                morningDose: item.querySelector('.morning-dose')?.value,
                afternoonDose: item.querySelector('.afternoon-dose')?.value,
                eveningDose: item.querySelector('.evening-dose')?.value,
                quantity: item.querySelector('.quantity-input')?.value
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
        await set(ref(db, `patients/${patientId}/visits/${visitId}/information`), patientInfo);
        displaySavedInfoInForm(patientInfo);
        alert('ព័ត៌មានត្រូវបានរក្សាទុកដោយជោគជ័យ!');
    } catch (error) {
        console.error('Error saving info:', error);
        alert('កំហុសក្នុងការរក្សាទុកព័ត៌មាន៖ ' + error.message);
    }
}

// Display saved info
function displaySavedInfoInForm(info) {
    document.getElementById('treatmentHistory').value = info.treatmentHistory !== "N/A" ? info.treatmentHistory : '';
    document.getElementById('labTest').value = info.labTest !== "N/A" ? info.labTest : '';
    document.getElementById('diagnosis').value = info.diagnosis || '';

    const ul = document.getElementById('medicineList');
    ul.innerHTML = '';
    if (info.medicines && Array.isArray(info.medicines)) {
        info.medicines.forEach(med => addMedicineItem(med));
    } else {
        addMedicineItem(null);
    }
}

// Clear form
function clearForm() {
    document.getElementById('treatmentHistory').value = '';
    document.getElementById('labTest').value = '';
    document.getElementById('diagnosis').value = '';
    document.getElementById('medicineList').innerHTML = '';
    medicinesInitialized = false;
    addMedicineItem(null);
}

// DOM Loaded
document.addEventListener('DOMContentLoaded', async () => {
    initDiagnosisDropdown();

    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');

    if (patientId && visitId) {
        try {
            const infoRef = ref(db, `patients/${patientId}/visits/${visitId}/information`);
            const snapshot = await get(infoRef);

            let patientInfo;

            if (snapshot.exists()) {
                patientInfo = snapshot.val();
            } else {
                const fullRef = ref(db, `patients/${patientId}`);
                const fullSnapshot = await get(fullRef);
                const fullData = fullSnapshot.val() || {};
                patientInfo = {
                    diagnosis: fullData.structuredNotes?.note4 || '',
                    medicines: fullData.structuredNotes?.medicines || []
                };
            }

            displaySavedInfoInForm(patientInfo);
        } catch (error) {
            console.error('Error loading data:', error);
            addMedicineItem(null);
        }
    } else {
        addMedicineItem(null);
    }

    // Event listeners
    document.getElementById('saveBtn')?.addEventListener('click', savePatientInformation);
    document.getElementById('clearBtn')?.addEventListener('click', clearForm);

    // Close dropdowns when clicking outside
    document.addEventListener('click', e => {
        const diagInput = document.getElementById('diagnosis');
        const diagDropdown = document.getElementById('diagnosis-dropdown');
        if (diagInput && diagDropdown &&
            !diagInput.contains(e.target) &&
            !diagDropdown.contains(e.target)) {
            diagDropdown.style.display = 'none';
        }

        document.querySelectorAll('.medicine-dropdown').forEach(dropdown => {
            const input = dropdown.previousElementSibling;
            if (input && !input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    });
});