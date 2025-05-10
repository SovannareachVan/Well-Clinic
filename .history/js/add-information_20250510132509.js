import { db } from './firebase-config.js';
import { ref, get, set, push } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { diagnosisOptions } from './add-info-dropdown.js';

// Track initialization state
let medicinesInitialized = false;

// Medicine options (should ideally be shared with add-detail-page.js)
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
    if (!input || !dropdown) {
        console.error('Diagnosis input or dropdown not found');
        return;
    }

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
            div.onclick = () => {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function () {
        dropdown.innerHTML = '';
        diagnosisOptions.forEach(option => {
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

// Function to parse dose value
function parseDoseValue(value) {
    if (!value) return 0;
    if (value.includes('+')) {
        return value.split('+').reduce((sum, part) => sum + parseDoseValue(part), 0);
    }
    if (value.includes('/')) {
        const [numerator, denominator] = value.split('/').map(Number);
        return numerator / denominator || 0;
    }
    return parseFloat(value) || 0;
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

// Function to initialize medicine dropdown
function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');
    if (!input || !dropdown) {
        console.error('Medicine input or dropdown not found');
        return;
    }

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
            div.onclick = () => {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function () {
        dropdown.innerHTML = '';
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
        dropdown.style.display = 'block';
    });
}

// Function to add a medicine item
window.addMedicineItem = function (medicineData = null, forceAdd = false) {
    const ul = document.getElementById('medicineList');
    if (!ul) {
        console.error("Error: 'medicineList' element not found!");
        return null;
    }

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
                    <td>
                        <select class="dosage-select morning-dose">
                            <option value="" selected>...</option>
                            <option value="1/4">1/4</option>
                            <option value="1/2">1/2</option>
                            <option value="1">1</option>
                            <option value="1+1/4">1+1/4</option>
                            <option value="1+1/2">1+1/2</option>
                            <option value="2">2</option>
                            <option value="2+1/2">2+1/2</option>
                            <option value="3">3</option>
                        </select>
                    </td>
                    <td>
                        <select class="dosage-select afternoon-dose">
                            <option value="" selected>...</option>
                            <option value="1/4">1/4</option>
                            <option value="1/2">1/2</option>
                            <option value="1">1</option>
                            <option value="1+1/4">1+1/4</option>
                            <option value="1+1/2">1+1/2</option>
                            <option value="2">2</option>
                            <option value="2+1/2">2+1/2</option>
                            <option value="3">3</option>
                        </select>
                    </td>
                    <td>
                        <select class="dosage-select evening-dose">
                            <option value="" selected>...</option>
                            <option value="1/4">1/4</option>
                            <option value="1/2">1/2</option>
                            <option value="1">1</option>
                            <option value="1+1/4">1+1/4</option>
                            <option value="1+1/2">1+1/2</option>
                            <option value="2">2</option>
                            <option value="2+1/2">2+1/2</option>
                            <option value="3">3</option>
                        </select>
                    </td>
                    <td><input type="text" class="quantity-input" readonly></td>
                    <td><button class="btn-delete" onclick="this.closest('li').remove()">❌</button></td>
                </tr>
            </tbody>
        </table>
    `;

    ul.appendChild(li);
    initMedicineDropdown(li);

    if (medicineData) {
        li.querySelector('.medicine-input').value = medicineData.name || '';
        li.querySelector('.dosage-select').value = medicineData.dosage || '';
        li.querySelector('.time-input').value = medicineData.days || '';
        li.querySelector('.morning-dose').value = medicineData.morningDose || '';
        li.querySelector('.afternoon-dose').value = medicineData.afternoonDose || '';
        li.querySelector('.evening-dose').value = medicineData.eveningDose || '';
        li.querySelector('.quantity-input').value = medicineData.quantity || '';
        calculateMedicationQuantity(li);
    }

    const daysInput = li.querySelector('.time-input');
    const morningSelect = li.querySelector('.morning-dose');
    const afternoonSelect = li.querySelector('.afternoon-dose');
    const eveningSelect = li.querySelector('.evening-dose');

    [daysInput, morningSelect, afternoonSelect, eveningSelect].forEach(elem => {
        if (elem) elem.addEventListener('change', () => calculateMedicationQuantity(li));
    });

    medicinesInitialized = true;
    return li;
};

// Function to get visit count
async function getVisitCount(patientId) {
    try {
        const visitsRef = ref(db, `patients/${patientId}/visits`);
        const snapshot = await get(visitsRef);
        if (!snapshot.exists()) return 0;
        return Object.keys(snapshot.val()).length;
    } catch (error) {
        console.error('Error fetching visit count:', error);
        return 0;
    }
}

// Function to fetch latest visit data
async function getLatestVisitData(patientId) {
    try {
        const visitsRef = ref(db, `patients/${patientId}/visits`);
        const snapshot = await get(visitsRef);
        if (!snapshot.exists()) return null;

        const visits = snapshot.val();
        const visitEntries = Object.entries(visits);
        const latestVisit = visitEntries.reduce((latest, [visitId, visitData]) => {
            const currentTime = visitData.information?.createdAt || '0';
            const latestTime = latest[1]?.information?.createdAt || ' personally think that you have provided sufficient information for me to assist you with the task at hand. Here's how we can proceed to address your requirements for modifying `add-information.js` to handle the behavior of the **Treatment History** and **Lab Test** fields based on the visit number, while keeping the existing functionality for **Diagnosis** and **Medication Usage** intact.

---

### **Understanding the Requirements**

From your message, you want the following behavior in `add-information.js`:

1. **For the Second Visit (first row in `add-information.js`)**:
   - **Diagnosis** and **Medication Usage** should pre-load from the first visit (already implemented and confirmed working).
   - **Treatment History** and **Lab Test** should be blank by default, allowing users to enter new data, but these fields are optional (not mandatory).

2. **For the Third and Subsequent Visits (second row and beyond in `add-information.js`)**:
   - **Treatment History** and **Lab Test** must be mandatory fields, requiring users to enter new data before saving.
   - **Diagnosis** and **Medication Usage** should continue to pre-load from the latest visit (as already implemented).

3. **Integration with `date-register.js`**:
   - `date-register.js` manages the visit history, where the first visit links to `add-detail-page.js`, and subsequent visits (second, third, etc.) link to `add-information.js`.
   - The visit count (number of rows in the visit table) determines whether `add-information.js` is handling the second or a later visit.

---

### **Updated `add-information.js`**

Below is the updated `add-information.js` that incorporates your requirements. The changes focus on:
- Ensuring `treatmentHistory` and `labTest` are blank for the second visit and optional.
- Making `treatmentHistory` and `labTest` mandatory for third and subsequent visits.
- Preserving the working functionality for `diagnosis` and `medicines` (pre-loading from the latest visit).
- Adding a function to determine the visit count to apply the correct validation logic.

<xaiArtifact artifact_id="241fcc24-e4f4-4cb8-821b-b6c4c6868720" artifact_version_id="1454e2d0-d5ae-49d0-afce-e8ad2d8d3be6" title="add-information.js" contentType="text/javascript">
import { db } from './firebase-config.js';
import { ref, get, set, push } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { diagnosisOptions } from './add-info-dropdown.js';

// Track initialization state
let medicinesInitialized = false;

// Medicine options (should ideally be shared with add-detail-page.js)
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
    if (!input || !dropdown) {
        console.error('Diagnosis input or dropdown not found');
        return;
    }

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
            div.onclick = () => {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function () {
        dropdown.innerHTML = '';
        diagnosisOptions.forEach(option => {
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

// Function to parse dose value
function parseDoseValue(value) {
    if (!value) return 0;
    if (value.includes('+')) {
        return value.split('+').reduce((sum, part) => sum + parseDoseValue(part), 0);
    }
    if (value.includes('/')) {
        const [numerator, denominator] = value.split('/').map(Number);
        return numerator / denominator || 0;
    }
    return parseFloat(value) || 0;
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

// Function to initialize medicine dropdown
function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');
    if (!input || !dropdown) {
        console.error('Medicine input or dropdown not found');
        return;
    }

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
            div.onclick = () => {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function () {
        dropdown.innerHTML = '';
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
        dropdown.style.display = 'block';
    });
}

// Function to add a medicine item
window.addMedicineItem = function (medicineData = null, forceAdd = false) {
    const ul = document.getElementById('medicineList');
    if (!ul) {
        console.error("Error: 'medicineList' element not found!");
        return null;
    }

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
                    <td>
                        <select class="dosage-select morning-dose">
                            <option value="" selected>...</option>
                            <option value="1/4">1/4</option>
                            <option value="1/2">1/2</option>
                            <option value="1">1</option>
                            <option value="1+1/4">1+1/4</option>
                            <option value="1+1/2">1+1/2</option>
                            <option value="2">2</option>
                            <option value="2+1/2">2+1/2</option>
                            <option value="3">3</option>
                        </select>
                    </td>
                    <td>
                        <select class="dosage-select afternoon-dose">
                            <option value="" selected>...</option>
                            <option value="1/4">1/4</option>
                            <option value="1/2">1/2</option>
                            <option value="1">1</option>
                            <option value="1+1/4">1+1/4</option>
                            <option value="1+1/2">1+1/2</option>
                            <option value="2">2</option>
                            <option value="2+1/2">2+1/2</option>
                            <option value="3">3</option>
                        </select>
                    </td>
                    <td>
                        <select class="dosage-select evening-dose">
                            <option value="" selected>...</option>
                            <option value="1/4">1/4</option>
                            <option value="1/2">1/2</option>
                            <option value="1">1</option>
                            <option value="1+1/4">1+1/4</option>
                            <option value="1+1/2">1+1/2</option>
                            <option value="2">2</option>
                            <option value="2+1/2">2+1/2</option>
                            <option value="3">3</option>
                        </select>
                    </td>
                    <td><input type="text" class="quantity-input" readonly></td>
                    <td><button class="btn-delete" onclick="this.closest('li').remove()">❌</button></td>
                </tr>
            </tbody>
        </table>
    `;

    ul.appendChild(li);
    initMedicineDropdown(li);

    if (medicineData) {
        li.querySelector('.medicine-input').value = medicineData.name || '';
        li.querySelector('.dosage-select').value = medicineData.dosage || '';
        li.querySelector('.time-input').value = medicineData.days || '';
        li.querySelector('.morning-dose').value = medicineData.morningDose || '';
        li.querySelector('.afternoon-dose').value = medicineData.afternoonDose || '';
        li.querySelector('.even Hint: Your message was cut off at the end, but I believe I have enough context to address your requirements fully. You provided `date-register.js` and clarified that it manages the visit history, where the first visit links to `add-detail-page.js` (initial registration) and subsequent visits (second, third, etc.) link to `add-information.js` (follow-up visits). Your goal is to modify `add-information.js` to handle the **Treatment History** (`ប្រវត្តិព្យាបាល`) and **Lab Test** (`តេស្តមន្ទីពិសោធន៍`) fields differently based on the visit number, while keeping the existing functionality for **Diagnosis** (`រោគវិនិច្ឆ័យ`) and **Medication Usage** (`របៀបប្រើប្រាស់ថ្នាំ`) intact.

### **Requirements Recap**

1. **Second Visit (first row in `add-information.js`)**:
   - **Diagnosis** and **Medication Usage**: Pre-load from the first visit (already implemented and confirmed working).
   - **Treatment History** and **Lab Test**: Should be blank by default and optional (not mandatory for saving).

2. **Third and Subsequent Visits (second row and beyond in `add-information.js`)**:
   - **Treatment History** and **Lab Test**: Must be filled with new data (mandatory fields).
   - **Diagnosis** and **Medication Usage**: Continue pre-loading from the latest visit.

3. **Integration with `date-register.js`**:
   - `date-register.js` creates visit entries, with the first visit linking to `add-detail-page.js` and subsequent visits to `add-information.js`.
   - The visit count (number of visits in Firebase) determines the behavior of `add-information.js`.

### **Approach**

To implement these requirements, I’ll update `add-information.js` to:
- Check the visit count to determine if it’s the second or a later visit.
- Ensure `treatmentHistory` and `labTest` are blank for the second visit and optional.
- Make `treatmentHistory` and `labTest` mandatory for third and subsequent visits.
- Preserve the existing functionality for `diagnosis` and `medicines` (pre-loading from the latest visit).
- Maintain compatibility with `date-register.js` and `add-detail-page.js`.

### **Updated `add-information.js`**

Below is the updated `add-information.js` that incorporates your requirements. The key changes are:
- Added a `getVisitCount` function to determine the number of visits.
- Modified `displayVisitInfo` to clear `treatmentHistory` and `labTest` for the second visit.
- Updated `savePatientInformation` to enforce mandatory `treatmentHistory` and `labTest` for third and later visits.
- Kept the existing logic for `diagnosis` and `medicines` unchanged.

<xaiArtifact artifact_id="241fcc24-e4f4-4cb8-821b-b6c4c6868720" artifact_version_id="0d759a61-3e71-4203-9c5b-297b3f20f92e" title="add-information.js" contentType="text/javascript">
import { db } from './firebase-config.js';
import { ref, get, set, push } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { diagnosisOptions } from './add-info-dropdown.js';

// Track initialization state
let medicinesInitialized = false;

// Medicine options (should ideally be shared with add-detail-page.js)
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
    if (!input || !dropdown) {
        console.error('Diagnosis input or dropdown not found');
        return;
    }

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
            div.onclick = () => {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function () {
        dropdown.innerHTML = '';
        diagnosisOptions.forEach(option => {
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

// Function to parse dose value
function parseDoseValue(value) {
    if (!value) return 0;
    if (value.includes('+')) {
        return value.split('+').reduce((sum, part) => sum + parseDoseValue(part), 0);
    }
    if (value.includes('/')) {
        const [numerator, denominator] = value.split('/').map(Number);
        return numerator / denominator || 0;
    }
    return parseFloat(value) || 0;
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

// Function to initialize medicine dropdown
function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');
    if (!input || !dropdown) {
        console.error('Medicine input or dropdown not found');
        return;
    }

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
            div.onclick = () => {
                input.value = option;
                dropdown.innerHTML = '';
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(div);
        });

        dropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    input.addEventListener('click', function () {
        dropdown.innerHTML = '';
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
        dropdown.style.display = 'block';
    });
}

// Function to add a medicine item
window.addMedicineItem = function (medicineData = null, forceAdd = false) {
    const ul = document.getElementById('medicineList');
    if (!ul) {
        console.error("Error: 'medicineList' element not found!");
        return null;
    }

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
                    <th>ចំនួនថ្នاំ</th>
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
                    <td>
                        <select class="dosage-select morning-dose">
                            <option value="" selected>...</option>
                            <option value="1/4">1/4</option>
                            <option value="1/2">1/2</option>
                            <option value="1">1</option>
                            <option value="1+1/4">1+1/4</option>
                            <option value="1+1/2">1+1/2</option>
                            <option value="2">2</option>
                            <option value="2+1/2">2+1/2</option>
                            <option value="3">3</option>
                        </select>
                    </td>
                    <td>
                        <select class="dosage-select afternoon-dose">
                            <option value="" selected>...</option>
                            <option value="1/4">1/4</option>
                            <option value="1/2">1/2</option>
                            <option value="1">1</option>
                            <option value="1+1/4">1+1/4</option>
                            <option value="1+1/2">1+1/2</option>
                            <option value="2">2</option>
                            <option value="2+1/2">2+1/2</option>
                            <option value="3">3</option>
                        </select>
                    </td>
                    <td>
                        <select class="dosage-select evening-dose">
                            <option value="" selected>...</option>
                            <option value="1/4">1/4</option>
                            <option value="1/2">1/2</option>
                            <option value="1">1</option>
                            <option value="1+1/4">1+1/4</option>
                            <option value="1+1/2">1+1/2</option>
                            <option value="2">2</option>
                            <option value="2+1/2">2+1/2</option>
                            <option value="3">3</option>
                        </select>
                    </td>
                    <td><input type="text" class="quantity-input" readonly></td>
                    <td><button class="btn-delete" onclick="this.closest('li').remove()">❌</button></td>
                </tr>
            </tbody>
        </table>
    `;

    ul.appendChild(li);
    initMedicineDropdown(li);

    if (medicineData) {
        li.querySelector('.medicine-input').value = medicineData.name || '';
        li.querySelector('.dosage-select').value = medicineData.dosage || '';
        li.querySelector('.time-input').value = medicineData.days || '';
        li.querySelector('.morning-dose').value = medicineData.morningDose || '';
        li.querySelector('.afternoon-dose').value = medicineData.afternoonDose || '';
        li.querySelector('.evening-dose').value = medicineData.eveningDose || '';
        li.querySelector('.quantity-input').value = medicineData.quantity || '';
        calculateMedicationQuantity(li);
    }

    const daysInput = li.querySelector('.time-input');
    const morningSelect = li.querySelector('.morning-dose');
    const afternoonSelect = li.querySelector('.afternoon-dose');
    const eveningSelect = li.querySelector('.evening-dose');

    [daysInput, morningSelect, afternoonSelect, eveningSelect].forEach(elem => {
        if (elem) elem.addEventListener('change', () => calculateMedicationQuantity(li));
    });

    medicinesInitialized = true;
    return li;
};

// Function to get visit count
async function getVisitCount(patientId) {
    try {
        const visitsRef = ref(db, `patients/${patientId}/visits`);
        const snapshot = await get(visitsRef);
        if (!snapshot.exists()) return 0;
        return Object.keys(snapshot.val()).length;
    } catch (error) {
        console.error('Error fetching visit count:', error);
        return 0;
    }
}

// Function to fetch latest visit data
async function getLatestVisitData(patientId) {
    try {
        const visitsRef = ref(db, `patients/${patientId}/visits`);
        const snapshot = await get(visitsRef);
        if (!snapshot.exists()) return null;

        const visits = snapshot.val();
        const visitEntries = Object.entries(visits);
        const latestVisit = visitEntries.reduce((latest, [visitId, visitData]) => {
            const currentTime = visitData.information?.createdAt || '0';
            const latestTime = latest[1]?.information?.createdAt || '0';
            return currentTime > latestTime ? [visitId, visitData] : latest;
        }, [null, null]);

        return latestVisit[1]?.information || null;
    } catch (error) {
        console.error('Error fetching latest visit:', error);
        return null;
    }
}

// Function to save patient information
async function savePatientInformation() {
    const url Minnesotas = new URLSearchParams(window.location.search);
    const patientId = params.get('patientId');
    const visitId = params.get('visitId');
    if (!patientId || !visitId) {
        alert('Missing patient or visit information');
        return;
    }

    const visitCount = await getVisitCount(patientId);
    const treatmentHistory = document.getElementById('treatmentHistory').value.trim();
    const labTest = document.getElementById('labTest').value.trim();
    const diagnosis = document.getElementById('diagnosis').value.trim();

    // Validate diagnosis (mandatory for all visits)
    if (!diagnosis) {
        alert('សូមបំពេញរោគវិនិច្ឆ័យ');
        return;
    }

    // Validate treatmentHistory and labTest for third and subsequent visits
    if (visitCount >= 2) { // Third visit or later (0-based index: 0=first, 1=second, 2=third)
        if (!treatmentHistory) {
            alert('សូមបំពេញប្រវត្តិព្យាបាល');
            return;
        }
        if (!labTest) {
            alert('សូមបំពេញតេស្តមន្ទីពិសោធន៍');
            return;
        }
    }

    const medicines = Array.from(document.querySelectorAll('.medicine-item')).map(item => ({
        name: item.querySelector('.medicine-input').value,
        dosage: item.querySelector('.dosage-select').value,
        days: item.querySelector('.time-input').value,
        morningDose: item.querySelector('.morning-dose').value,
        afternoonDose: item.querySelector('.afternoon-dose').value,
        eveningDose: item.querySelector('.evening-dose').value,
        quantity: item.querySelector('.quantity-input').value
    })).filter(med => med.name && med.dosage && med.days);

    const patientInfo = {
        treatmentHistory: treatmentHistory || 'N/A',
        labTest: labTest || 'N/A',
        diagnosis,
        medicines,
        createdAt: new Date().toISOString()
    };

    try {
        const visitInfoRef = ref(db, `patients/${patientId}/visits/${visitId}/information`);
        await set(visitInfoRef, patientInfo);
        alert('ព័ត៌មានត្រូវបានរក្សាទុកដោយជោគជ័យ!');
        window.history.back();
    } catch (error) {
        console.error('Error saving patient information:', error);
        alert('កំហុសក្នុងការរក្សាទុកព័ត៌មាន៖ ' + error.message);
    }
}

// Function to display visit info
async function displayVisitInfo(patientId, info) {
    const visitCount = await getVisitCount(patientId);
    
    // For second visit, clear treatmentHistory and labTest
    document.getElementById('treatmentHistory').value = (visitCount === 1 && !info?.treatmentHistory) ? '' : (info?.treatmentHistory !== 'N/A' ? info.treatmentHistory : '');
    document.getElementById('labTest').value = (visitCount === 1 && !info?.labTest) ? '' : (info?.labTest !== 'N/A' ? info.labTest : '');
    document.getElementById('diagnosis').value = info?.diagnosis || '';

    const medicineList = document.getElementById('medicineList');
    medicineList.innerHTML = '';
    if (info?.medicines && info.medicines.length > 0) {
        info.medicines.forEach(med => addMedicineItem(med, true));
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

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    initDiagnosisDropdown();

    const params = new URLSearchParams(window.location.search);
    const patientId = params.get('patientId');
    const visitId = params.get('visitId');

    if (patientId && visitId) {
        // Try loading current visit data
        const infoRef = ref(db, `patients/${patientId}/visits/${visitId}/information`);
        const snapshot = await get(infoRef);
        if (snapshot.exists()) {
            await displayVisitInfo(patientId, snapshot.val());
        } else {
            // Load latest visit data (e.g., from initial registration)
            const latestVisitData = await getLatestVisitData(patientId);
            await displayVisitInfo(patientId, latestVisitData);
        }
    } else {
        addMedicineItem(null, true);
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', savePatientInformation);
    } else {
        console.error('Element with id "saveBtn" not found');
    }

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    } else {
        console.error('Element with id "clearBtn" not found');
    }

    const addMedicineBtn = document.getElementById('addMedicineBtn');
    if (addMedicineBtn) {
        addMedicineBtn.addEventListener('click', () => addMedicineItem());
    }

    document.addEventListener('click', event => {
        const diagnosisDropdown = document.getElementById('diagnosis-dropdown');
        const diagnosisInput = document.getElementById('diagnosis');
        if (diagnosisDropdown && diagnosisInput && !diagnosisInput.contains(event.target) && !diagnosisDropdown.contains(event.target)) {
            diagnosisDropdown.style.display = 'none';
        }

        document.querySelectorAll('.medicine-dropdown').forEach(dropdown => {
            const input = dropdown.closest('.dropdown-wrapper')?.querySelector('.medicine-input');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    });
});