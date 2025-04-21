import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { note4Options } from './dropdown.js';
import { medicineOptions } from './medicine-dropdown.js';

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

function calculateMedicationQuantity(item) {
    const daysInput = item.querySelector('.time-input:first-of-type');
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

function initDiagnosisDropdown() {
    const input = document.getElementById('note3');
    const dropdown = document.getElementById('note3-dropdown');

    if (!input || !dropdown) return;

    input.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = '';

        const filteredOptions = query
            ? note4Options.filter(option => option.toLowerCase().includes(query))
            : note4Options;

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
            note4Options.forEach(option => {
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

function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');

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

window.addMedicineItem = function (medicineData = null) {
    const ul = document.getElementById('medicineList');
    if (!ul) return null;

    const li = document.createElement('li');
    li.classList.add('medicine-item');

    li.innerHTML = `
    <table class="medicine-table">
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
                        <option value="" disabled selected>...</option>
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
                    <option value="3">3</option>
                    <option value="1/4">1/4</option>
                </select></td>
                <td><select class="dosage-select afternoon-dose">...</select></td>
                <td><select class="dosage-select evening-dose">...</select></td>
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
        li.querySelector('.time-input').value = medicineData.days || '';
        li.querySelectorAll('.dosage-select')[1].value = medicineData.morningDose || '';
        li.querySelectorAll('.dosage-select')[2].value = medicineData.afternoonDose || '';
        li.querySelectorAll('.dosage-select')[3].value = medicineData.eveningDose || '';
        li.querySelector('.quantity-input').value = medicineData.quantity || '';
    }

    li.querySelector('.time-input').addEventListener('input', () => calculateMedicationQuantity(li));
    li.querySelector('.morning-dose').addEventListener('change', () => calculateMedicationQuantity(li));
    li.querySelector('.afternoon-dose').addEventListener('change', () => calculateMedicationQuantity(li));
    li.querySelector('.evening-dose').addEventListener('change', () => calculateMedicationQuantity(li));

    return li;
};

async function saveStructuredNotes(recordId) {
    const medicines = [];
    document.querySelectorAll('.medicine-item').forEach(item => {
        medicines.push({
            name: item.querySelector('.medicine-input').value,
            dosage: item.querySelector('.dosage-select').value,
            days: item.querySelector('.time-input:first-of-type').value,
            morningDose: item.querySelectorAll('.dosage-select')[1].value,
            afternoonDose: item.querySelectorAll('.dosage-select')[2].value,
            eveningDose: item.querySelectorAll('.dosage-select')[3].value,
            quantity: item.querySelector('.quantity-input').value
        });
    });

    const structuredNotes = {
        note1: document.getElementById('note1').value.trim(),
        note2: document.getElementById('note2').value.trim(),
        note3: document.getElementById('note3').value.trim(),
        medicines: medicines
    };

    try {
        const patientRef = ref(db, 'patients/' + recordId);
        await update(patientRef, { structuredNotes });
        alert('Notes saved successfully!');
        window.history.back();
    } catch (error) {
        console.error('Error saving notes:', error);
        alert('Failed to save notes.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDiagnosisDropdown(); // Always run this
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        document.getElementById('saveBtn').addEventListener('click', () => saveStructuredNotes(recordId));
        document.getElementById('addMedicineBtn').addEventListener('click', addMedicineItem);
    }
    ...
});


    document.addEventListener('click', function (event) {
        const note3Dropdown = document.getElementById('note3-dropdown');
        const note3Input = document.getElementById('note3');
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
