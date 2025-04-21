import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { note4Options } from './dropdown.js';
import { medicineOptions } from './medicine-dropdown.js';

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

// Function to initialize diagnosis dropdown (Note 4)
function initDiagnosisDropdown() {
    const input = document.getElementById('patientNote4');
    const dropdown = document.getElementById('note4-dropdown');

    if (!input || !dropdown) {
        console.error("Dropdown elements not found");
        return;
    }

    dropdown.innerHTML = '';

    note4Options.forEach(option => {
        const div = document.createElement("div");
        div.classList.add("dropdown-item");
        div.textContent = option;
        div.onclick = function () {
            input.value = option;
            dropdown.style.display = 'none';
        };
        dropdown.appendChild(div);
    });

    input.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        const items = dropdown.querySelectorAll('.dropdown-item');
        
        items.forEach(item => {
            if (item.textContent.toLowerCase().includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    input.addEventListener('focus', function() {
        dropdown.style.display = 'block';
    });

    document.addEventListener('click', function(event) {
        if (!input.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// Function to initialize medicine dropdown
function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');

    if (!input || !dropdown) {
        console.error("Medicine dropdown elements not found");
        return;
    }

    dropdown.innerHTML = '';

    medicineOptions.forEach(option => {
        const div = document.createElement("div");
        div.classList.add("dropdown-item");
        div.textContent = option;
        div.onclick = function () {
            input.value = option;
            dropdown.style.display = 'none';
        };
        dropdown.appendChild(div);
    });

    input.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        const items = dropdown.querySelectorAll('.dropdown-item');
        
        items.forEach(item => {
            if (item.textContent.toLowerCase().includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    input.addEventListener('focus', function() {
        dropdown.style.display = 'block';
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
                <td><input type="number" class="time-input" placeholder="ថ្ងៃ" min="1" value="1"></td>
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

    if (medicineData) {
        li.querySelector('.medicine-input').value = medicineData.name || '';
        li.querySelector('.dosage-select').value = medicineData.dosage || '';
        li.querySelector('.time-input').value = medicineData.days || '1';
        li.querySelector('.morning-dose').value = medicineData.morningDose || '';
        li.querySelector('.afternoon-dose').value = medicineData.afternoonDose || '';
        li.querySelector('.evening-dose').value = medicineData.eveningDose || '';
        li.querySelector('.quantity-input').value = medicineData.quantity || '';
    }

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

    daysInput.value = '1';
    
    daysInput.addEventListener('input', calculateQuantity);
    morningSelect.addEventListener('change', calculateQuantity);
    afternoonSelect.addEventListener('change', calculateQuantity);
    eveningSelect.addEventListener('change', calculateQuantity);

    calculateQuantity();

    return li;
};

// Function to fetch patient data
async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();

            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientPhone').textContent = patientData.phone;
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
            document.getElementById('patientName').textContent = patientData.fullName;
            document.getElementById('patientNotes').textContent = patientData.notes || '';

            const structured = patientData.structuredNotes || {};

            document.getElementById('patientNote1').value = structured.note1 || '';
            document.getElementById('patientNote2').value = structured.note2 || '';
            document.getElementById('patientNote3').value = structured.note3 || '';
            document.getElementById('patientNote4').value = structured.note4 || '';
            document.getElementById('patientNote5').value = structured.note5 || '';

            const ul = document.getElementById('medicineList');
            ul.innerHTML = '';
            if (structured.medicines && Array.isArray(structured.medicines)) {
                structured.medicines.forEach(med => {
                    addMedicineItem(med);
                });
            }
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

// Function to save patient notes
async function savePatientNotes(recordId) {
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

    const structuredNotes = {
        note1: document.getElementById('patientNote1').value.trim(),
        note2: document.getElementById('patientNote2').value.trim(),
        note3: document.getElementById('patientNote3').value.trim(),
        note4: document.getElementById('patientNote4').value.trim(),
        note5: document.getElementById('patientNote5').value.trim(),
        medicines: medicines
    };

    try {
        await update(ref(db, 'patients/' + recordId), { 
            structuredNotes: structuredNotes
        });

        alert('Notes saved successfully!');

            // Optional: reload the page content (if you want to refresh the updated info)
            // await getPatientDetails(recordId);

            // ✅ Redirect to previous page
            window.history.back(); // or use window.location.href = 'your-target-page.html';

        } catch (error) {
            console.error('Error saving patient notes:', error);
            alert('Failed to save notes. Error: ' + error.message);
        }
}


// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        getPatientDetails(recordId);
        initDiagnosisDropdown();

        document.getElementById('saveBtn').addEventListener('click', function () {
            savePatientNotes(recordId);
        });

        const ul = document.getElementById('medicineList');
        if (ul && ul.children.length === 0) {
            addMedicineItem();
        }
    }

    document.addEventListener('click', function (event) {
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
