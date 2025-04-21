import { note4Options } from './dropdown.js';
import { medicineOptions } from './medicine-dropdown.js';

// Initialize Diagnosis Dropdown (រោគវិនិច្ឆ័យ)
function initDiagnosisDropdown() {
    const input = document.getElementById('diagnosisInput');
    const dropdown = document.getElementById('diagnosisDropdown');

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

// Parse dosage like 1+1/2 or 2+1/4
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

// Add a medicine row
window.addMedicineItem = function () {
    const ul = document.getElementById('medicineList');
    const li = document.createElement('li');
    li.classList.add('medicine-item');

    li.innerHTML = `
    <table class="medicine-table">
        <thead>
            <tr>
                <th>ឈ្មោះថ្នាំ</th>
                <th>ប្រភេទថ្នាំ</th>
                <th>រយៈពេល (ថ្ងៃ)</th>
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
                <td><select class="dosage-select morning-dose">...</select></td>
                <td><select class="dosage-select afternoon-dose">...</select></td>
                <td><select class="dosage-select evening-dose">...</select></td>
                <td><input type="text" class="quantity-input" readonly></td>
                <td><button class="btn-delete" onclick="this.closest('li').remove()">❌</button></td>
            </tr>
        </tbody>
    </table>`;

    ul.appendChild(li);
    initMedicineDropdown(li);

    // Event listeners
    const updateQuantity = () => {
        const days = parseFloat(li.querySelector('.time-input').value) || 0;
        const morning = parseDoseValue(li.querySelector('.morning-dose').value);
        const afternoon = parseDoseValue(li.querySelector('.afternoon-dose').value);
        const evening = parseDoseValue(li.querySelector('.evening-dose').value);
        const quantity = (morning + afternoon + evening) * days;
        li.querySelector('.quantity-input').value = quantity % 1 === 0 ? quantity : quantity.toFixed(1);
    };

    li.querySelectorAll('select, input').forEach(el => el.addEventListener('input', updateQuantity));
};

// Initialize medicine dropdown
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

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initDiagnosisDropdown();
    document.getElementById('addMedicineBtn').addEventListener('click', addMedicineItem);

    // Close dropdowns on outside click
    document.addEventListener('click', function (event) {
        const dInput = document.getElementById('diagnosisInput');
        const dDropdown = document.getElementById('diagnosisDropdown');
        if (dInput && dDropdown && !dInput.contains(event.target) && !dDropdown.contains(event.target)) {
            dDropdown.style.display = 'none';
        }

        document.querySelectorAll('.medicine-dropdown').forEach(dropdown => {
            const input = dropdown.previousElementSibling;
            if (!input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    });
});
