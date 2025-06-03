import { db } from './firebase-config.js';
import { ref, set, get, update, push, onValue } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { diagnosisOptions as note4Options } from './add-info-dropdown.js';
import { medicineOptions as hardcodedMedicineOptions } from './medicine-dropdown.js'; // I

// Function to initialize diagnosis dropdown
function initDiagnosisDropdown() {
    const input = document.getElementById('patientNote4');
    const dropdown = document.getElementById('note4-dropdown');
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

// Function to calculate medication quantity and total price
function calculateTotals(item) {
    console.log("Calculating totals for item:", item);
    const daysInput = item.querySelector('.time-input');
    const morningDose = item.querySelector('.morning-dose');
    const afternoonDose = item.querySelector('.afternoon-dose');
    const eveningDose = item.querySelector('.evening-dose');
    const quantityInput = item.querySelector('.quantity-input');
    const retailPriceInput = item.querySelector('.retail-price-input');
    const totalPriceInput = item.querySelector('.total-price-input');

    const days = parseFloat(daysInput.value) || 0;
    const morningValue = parseDoseValue(morningDose.value);
    const afternoonValue = parseDoseValue(afternoonDose.value);
    const eveningValue = parseDoseValue(eveningDose.value);
    const retailPrice = parseFloat(retailPriceInput.value) || 0;

    const totalPerDay = morningValue + afternoonValue + eveningValue;
    const totalQuantity = days * totalPerDay;

    quantityInput.value = totalQuantity % 1 === 0 ? totalQuantity : totalQuantity.toFixed(1);

    const totalPrice = totalQuantity * retailPrice;
    if (totalPriceInput) {
        totalPriceInput.value = totalPrice % 1 === 0 ? totalPrice.toFixed(2) : totalPrice.toFixed(2);
    }
}

// Function to fetch patient data
async function getPatientDetails(patientId, visitId = null) {
    try {
        let structuredNotes = {};
        let basicInfo = {};
        const patientRef = ref(db, 'patients/' + patientId);
        const patientSnapshot = await get(patientRef);
        if (!patientSnapshot.exists()) {
            console.error('Patient not found.');
            return;
        }

        basicInfo = patientSnapshot.val();

        const updateField = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'N/A';
            }
        };

        updateField('patientName', basicInfo.fullName);
        updateField('patientFullName', basicInfo.fullName);
        updateField('patientAge', basicInfo.age);
        updateField('patientGender', basicInfo.gender);
        updateField('patientPhone', basicInfo.phone);
        updateField('patientTelegram', basicInfo.telegram);
        updateField('patientEmail', basicInfo.email);

        if (typeof basicInfo.notes === 'string') {
            updateField('patientNotes', basicInfo.notes);
        } else if (basicInfo.notes?.original) {
            updateField('patientNotes', basicInfo.notes.original);
        } else {
            updateField('patientNotes', '');
        }

        const addressMapping = {
            village: {
                "Village 1": "ទួលក្របៅ",
                "Village 2": "សាមកុក",
                "Village 3": "ហាបី"
            },
            commune: {
                "Commune 1": "គគីរ",
                "Commune 2": "កាស",
                "Commune 3": "ក្អែក"
            },
            district: {
                "District 1": "កៀនស្វាយ",
                "District 2": "ក្អែក",
                "District 3": "កាស"
            },
            province: {
                "Province 1": "ព្រៃវែង",
                "Province 2": "កណ្តាល",
                "Province 3": "ក្អាត់"
            }
        };

        if (basicInfo.address) {
            const { village, commune, district, province } = basicInfo.address;
            const addressParts = [
                village ? `ភូមិ ${addressMapping.village[village] || village}` : '',
                commune ? `ឃុំ/សង្កាត់ ${addressMapping.commune[commune] || commune}` : '',
                district ? `ស្រុក/ខណ្ឌ ${addressMapping.district[district] || district}` : '',
                province ? `ខេត្ត ${addressMapping.province[province] || province}` : ''
            ].filter(Boolean);
            updateField('patientAddress', addressParts.join(', '));
        } else {
            updateField('patientAddress', 'N/A');
        }

        if (visitId) {
            const visitRef = ref(db, `patients/${patientId}/visits/${visitId}/information`);
            const visitSnapshot = await get(visitRef);
            if (visitSnapshot.exists()) {
                structuredNotes = visitSnapshot.val();
            }
        } else {
            structuredNotes = basicInfo.structuredNotes || {};
        }

        document.getElementById('patientNote1').value = structuredNotes.note1 || '';
        document.getElementById('patientNote2').value = structuredNotes.note2 || '';
        document.getElementById('patientNote3').value = structuredNotes.note3 || '';
        document.getElementById('patientNote4').value = structuredNotes.diagnosis || '';
        document.getElementById('patientNote5').value = structuredNotes.note5 || '';
        const totalPriceValue = structuredNotes.totalPrice || '0.00';
        document.getElementById('totalPriceValue').value = '$' + totalPriceValue; // Add $ symbol

        const ul = document.getElementById('medicineList');
        ul.innerHTML = '';
        if (structuredNotes.medicines) {
            structuredNotes.medicines.forEach(med => {
                const li = addMedicineItem(med);
                calculateTotals(li);
            });
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

// Function to save patient notes
async function savePatientNotes(patientId, visitId = null) {
    const medicines = Array.from(document.querySelectorAll('.medicine-item')).map(item => ({
        name: item.querySelector('.medicine-input').value,
        dosage: item.querySelector('.dosage-select').value,
        days: item.querySelector('.time-input').value,
        morningDose: item.querySelector('.morning-dose').value,
        afternoonDose: item.querySelector('.afternoon-dose').value,
        eveningDose: item.querySelector('.evening-dose').value,
        quantity: item.querySelector('.quantity-input').value,
        retailPrice: item.querySelector('.retail-price-input').value,
        totalPrice: item.querySelector('.total-price-input').value
    }));

    const structuredNotes = {
        note1: document.getElementById('patientNote1').value.trim(),
        note2: document.getElementById('patientNote2').value.trim(),
        note3: document.getElementById('patientNote3').value.trim(),
        diagnosis: document.getElementById('patientNote4').value.trim(),
        note5: document.getElementById('patientNote5').value.trim(),
        medicines,
        totalPrice: document.getElementById('totalPriceValue').value || '0.00',
        createdAt: new Date().toISOString()
    };

    if (!structuredNotes.diagnosis) {
        alert('សូមបំពេញរោគវិនិច្ឆ័យ');
        return;
    }

    console.log('Saving structured notes:', structuredNotes);

    try {
        if (!visitId) {
            const visitsRef = ref(db, `patients/${patientId}/visits`);
            const newVisitRef = push(visitsRef);
            visitId = newVisitRef.key;
        }
        await set(ref(db, `patients/${patientId}/visits/${visitId}/information`), structuredNotes);
        alert('Notes saved successfully!');
        window.history.back();
    } catch (err) {
        console.error('Error saving patient notes:', err);
        alert('Failed to save notes: ' + err.message);
    }
}

// Function to initialize medicine dropdown
function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');
    if (!input || !dropdown) {
        console.error('Medicine input or dropdown not found');
        return;
    }

    let medicineOptions = [];

    // Fetch medicines only from Firebase
    const medicinesRef = ref(db, 'medicines');
    onValue(medicinesRef, (snapshot) => {
        medicineOptions = []; // Reset the options array
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const medicineData = childSnapshot.val();
                if (medicineData.name && medicineData.name.trim() !== "" && medicineData.name !== "undefined") {
                    medicineOptions.push(medicineData.name);
                }
            });
        }

        // Remove duplicates and sort alphabetically
        medicineOptions = [...new Set(medicineOptions)].filter(name => name !== "").sort();

        // Update dropdown content
        dropdown.innerHTML = '';
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
    }, (error) => {
        console.error("Error fetching medicines for dropdown:", error);
    });

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
// Existing addMedicineItem function
// Existing addMedicineItem function
window.addMedicineItem = function (medicineData = null) {
    console.log("Adding medicine item");
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
                    <th>ចំនួន</th>
                    <th>តម្លៃរាយ</th>
                    <th>តម្លៃសរុប</th>
                   <th><button class="global-note-icon"><i class="fa-solid fa-file"></i></button></th>
                </tr>
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
                            <option value="ថ្នាំគ្រាប">ថ្នាំគ្រាប់</option>
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
                            <option value="" selected disabled>...</option>
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
                            <option value="" selected disabled>...</option>
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
                    <td><input type="number" class="retail-price-input" placeholder="តម្លៃរាយ" min="0" step="0.01"></td>
                    <td><input type="text" class="total-price-input" readonly></td>
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
        li.querySelector('.retail-price-input').value = medicineData.retailPrice || '';
        li.querySelector('.total-price-input').value = medicineData.totalPrice || '';
    }

    const daysInput = li.querySelector('.time-input');
    const morningSelect = li.querySelector('.morning-dose');
    const afternoonSelect = li.querySelector('.afternoon-dose');
    const eveningSelect = li.querySelector('.evening-dose');
    const retailPriceInput = li.querySelector('.retail-price-input');

    [daysInput, morningSelect, afternoonSelect, eveningSelect, retailPriceInput].forEach(elem => {
        if (elem) elem.addEventListener('change', () => calculateTotals(li));
    });

    calculateTotals(li); // Ensure totals are calculated after adding

    return li;
}

// Function to show the global note popup
window.showGlobalNotePopup = function () {
    // Get the existing global note (if any) from the hidden input or default to empty
    const medicineTable = this.closest('.medicine-table');
    let existingNote = medicineTable.dataset.globalNote || '';

    // Create the popup element
    const popup = document.createElement('div');
    popup.classList.add('global-note-popup');
    popup.innerHTML = `
        <div class="global-note-popup-content">
            <span class="close-global-note-popup">×</span>
            <h3>កំណត់ចំណាំសាកល</h3>
            <textarea class="global-note-input-textarea" placeholder="បញ្ចូលកំណត់ចំណាំនៅទីនេះ...">${existingNote}</textarea>
            <button class="save-global-note-btn">រក្សាទុក</button>
        </div>
    `;

    // Append the popup to the body
    document.body.appendChild(popup);

    // Close the popup when clicking the close button
    const closeBtn = popup.querySelector('.close-global-note-popup');
    closeBtn.addEventListener('click', () => {
        popup.remove();
    });

    // Close the popup when clicking outside
    const handleOutsideClick = (event) => {
        if (!popup.contains(event.target) && !event.target.closest('th').querySelector('.global-note-icon')) {
            popup.remove();
            document.removeEventListener('click', handleOutsideClick);
        }
    };
    document.addEventListener('click', handleOutsideClick);

    // Save the note when clicking the save button
    const saveBtn = popup.querySelector('.save-global-note-btn');
    const noteTextarea = popup.querySelector('.global-note-input-textarea');
    saveBtn.addEventListener('click', () => {
        const noteText = noteTextarea.value.trim();
        medicineTable.dataset.globalNote = noteText; // Store the note in the table's dataset
        popup.remove();
    });
};

// Add event listener for the note icon in the thead using event delegation
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (event) => {
        const noteIcon = event.target.closest('.global-note-icon');
        if (noteIcon) {
            showGlobalNotePopup.call(noteIcon);
        }
    });
});

// Function to update medicine list display with scrollbar
function updateMedicineListDisplay() {
    const ul = document.getElementById('medicineList');
    if (!ul) return;

    const container = ul.parentElement;
    if (container) {
        const medicineItems = ul.querySelectorAll('.medicine-item');
        const maxVisibleItems = 5;
        medicineItems.forEach((item, index) => {
            item.style.display = 'table-row'; // Ensure all items are visible
        });
        // Enable horizontal scrolling if needed
        container.style.overflowX = 'auto';
        container.style.whiteSpace = 'nowrap';
        container.style.maxWidth = '100%';
    }
}
// Function to show total price popup
function showTotalPricePopup() {
    try {
        console.log("Total Price button clicked!");
        const medicineItems = document.querySelectorAll('.medicine-item');
        console.log(`Found ${medicineItems.length} medicine items`);
        if (medicineItems.length === 0) {
            alert("No medicines to calculate total price.");
            return;
        }
        const total = document.getElementById('totalPriceValue');
        if (!total) {
            console.error("Total price input not found!");
            return;
        }
        let selectedTotal = parseFloat(total.value) || 0;
        const popup = document.createElement('div');
        popup.classList.add('total-price-popup');
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>#</th>
                    <th>ឈ្មោះថ្នាំ</th>
                    <th>តម្លៃសរុប</th>
                    <th>ជ្រើសរើស</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        let hasValidItems = false;
        medicineItems.forEach((item, index) => {
            const name = item.querySelector('.medicine-input').value || `ថ្នាំទី ${index + 1}`;
            const itemTotal = parseFloat(item.querySelector('.total-price-input').value) || 0;
            if (isNaN(itemTotal) || itemTotal === 0) {
                console.log(`Skipping item ${name}: invalid total (${itemTotal})`);
                return;
            }
            hasValidItems = true;
            const row = document.createElement('tr');
            if (index === 0 || index === 1 || index === 2) {
                row.classList.add('highlighted');
            }
            row.innerHTML = `
                <td>${index + 1}.</td>
                <td>${name}</td>
                <td>$${itemTotal.toFixed(2)}</td>
                <td><input type="checkbox" data-total="${itemTotal}"></td>
            `;
            table.querySelector('tbody').appendChild(row);
        });
        if (!hasValidItems) {
            alert("No medicines with valid total prices to display.");
            return;
        }
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.onclick = () => {
            const checkboxes = table.querySelectorAll('input[type="checkbox"]:checked');
            selectedTotal = 0; // Reset to calculate new total
            checkboxes.forEach(checkbox => {
                selectedTotal += parseFloat(checkbox.dataset.total);
            });
            total.value = selectedTotal.toFixed(2); // Update the input value on screen
            popup.remove();
        };
        popup.appendChild(table);
        popup.appendChild(okButton);
        Object.assign(popup.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            border: '1px solid #ccc',
            padding: '20px',
            zIndex: '10000',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            maxHeight: '80vh',
            overflowY: 'auto',
            display: 'block'
        });
        document.body.appendChild(popup);
        document.addEventListener('click', function handleOutsideClick(event) {
            if (!popup.contains(event.target) && !event.target.matches('.total-price-section button')) {
                popup.remove();
                document.removeEventListener('click', handleOutsideClick);
            }
        });
    } catch (error) {
        console.error("Error in showTotalPricePopup:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing...");
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');

    if (patientId) {
        getPatientDetails(patientId, visitId);
        initDiagnosisDropdown();

        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => savePatientNotes(patientId, visitId));
        }

        document.addEventListener('click', (event) => {
            if (event.target.matches('.total-price-section button')) {
                event.stopPropagation();
                showTotalPricePopup();
            }
        });
    }

    addMedicineItem();
    updateMedicineListDisplay(); // Initialize scrollbar

    document.addEventListener('click', event => {
        const note4Input = document.getElementById('patientNote4');
        const note4Dropdown = document.getElementById('note4-dropdown');
        if (note4Dropdown && note4Input && !note4Input.contains(event.target) && !note4Dropdown.contains(event.target)) {
            note4Dropdown.style.display = 'none';
        }

        document.querySelectorAll('.medicine-dropdown').forEach(dropdown => {
            const input = dropdown.closest('.dropdown-wrapper')?.querySelector('.medicine-input');
            if (input && !input.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    });
});