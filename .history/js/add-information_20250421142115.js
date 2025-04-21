// Import Firebase modules
import { db } from './firebase-config.js';
import { ref, get, update, push, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Diagnosis options
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

// Function to add medicine list item
window.addMedicineItem = function() {
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
    </table>`;

    ul.appendChild(li);
    initMedicineDropdown(li);

    li.querySelectorAll('.dosage-select').forEach(select => {
        select.addEventListener('change', function() {
            calculateMedicationQuantity(li);
        });
    });

    li.querySelector('.time-input').addEventListener('input', function() {
        calculateMedicationQuantity(li);
    });
};

// Save to Firebase
document.getElementById('savePatientInfo').addEventListener('click', function() {
    const patientInfo = {
        diagnosis: document.getElementById('diagnosis').value,
        medicationList: [],
        createdAt: new Date().toISOString()
    };

    const medicines = document.querySelectorAll('.medicine-item');
    medicines.forEach(item => {
        const medicineName = item.querySelector('.medicine-input').value;
        const dosage = item.querySelector('.dosage-select').value;
        const days = item.querySelector('.time-input').value;
        const totalQuantity = item.querySelector('.quantity-input').value;

        if (medicineName && dosage && days && totalQuantity) {
            patientInfo.medicationList.push({
                medicineName,
                dosage,
                days,
                totalQuantity
            });
        }
    });

    // Store the patient data in Firebase Realtime Database
    const newPatientRef = push(ref(db, 'patients'));
    set(newPatientRef, patientInfo).then(() => {
        alert('Patient information saved!');
    }).catch(error => {
        console.error("Error saving patient info:", error);
    });
});
