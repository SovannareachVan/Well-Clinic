import { db } from './firebase-config.js';
import { ref, get, set, push, onValue, remove } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { diagnosisOptions } from './add-info-dropdown.js';
import { medicineOptions as hardcodedMedicineOptions } from './medicine-dropdown.js'; // Import hardcoded list

// Track initialization state
let medicinesInitialized = false;

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

// Function to calculate medication quantity and total price
function calculateTotals(item) {
    const daysInput = item.querySelector('.time-input');
    const morningDose = item.querySelector('.morning-dose').value;
    const afternoonDose = item.querySelector('.afternoon-dose').value;
    const eveningDose = item.querySelector('.evening-dose').value;
    const quantityInput = item.querySelector('.quantity-input');
    const retailPriceInput = item.querySelector('.retail-price-input');
    const totalPriceInput = item.querySelector('.total-price-input');

    const days = parseFloat(daysInput.value) || 0;
    const morningValue = parseDoseValue(morningDose);
    const afternoonValue = parseDoseValue(afternoonDose);
    const eveningValue = parseDoseValue(eveningDose);
    const retailPrice = parseFloat(retailPriceInput.value) || 0;

    const totalPerDay = morningValue + afternoonValue + eveningValue;
    const totalQuantity = days * totalPerDay;
    quantityInput.value = totalQuantity % 1 === 0 ? totalQuantity : totalQuantity.toFixed(1);

    const totalPrice = totalQuantity * retailPrice;
    if (totalPriceInput) {
        totalPriceInput.value = totalPrice % 1 === 0 ? totalPrice : totalPrice.toFixed(2);
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
        let selectedTotal = parseFloat(total.value.replace('$', '')) || 0;
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
            total.value = `$${selectedTotal.toFixed(2)}`; // Update the input value on screen
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

// Function to initialize medicine dropdown
function initMedicineDropdown(parentElement) {
    const input = parentElement.querySelector('.medicine-input');
    const dropdown = parentElement.querySelector('.medicine-dropdown');
    if (!input || !dropdown) {
        console.error('Medicine input or dropdown not found');
        return;
    }

    let medicineOptions = [];

    // Fetch medicines only from the global medicines node
    const medicinesRef = ref(db, 'medicines');
    onValue(medicinesRef, (snapshot) => {
        medicineOptions = []; // Reset to empty array
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
window.addMedicineItem = function (medicineData = null, forceAdd = true) {
    console.log("Adding medicine item");
    const ul = document.getElementById('medicineList');
    if (!ul) {
        console.error("Error: 'medicineList' element not found!");
        return null;
    }

    const li = document.createElement('li');
    li.classList.add('medicine-item');
    // Generate a unique ID for this medicine item
    const itemId = 'medicine_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    li.dataset.itemId = itemId;

    li.innerHTML = `
        <table class="medicine-table" data-item-id="${itemId}">
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
                            <option value="1+1/4">1/1+4</option>
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
                    <td><button class="btn-delete" onclick="window.deleteMedicineItem(this, '${itemId}')">❌</button></td>
                </tr>
            </tbody>
        </table>
    `;

    ul.appendChild(li);
    initMedicineDropdown(li);

    // Load existing data if provided
    if (medicineData) {
        console.log("Populating medicine item with data:", medicineData);
        li.querySelector('.medicine-input').value = medicineData.name || '';
        li.querySelector('.dosage-select').value = medicineData.dosage || '';
        li.querySelector('.time-input').value = medicineData.days || '';
        li.querySelector('.morning-dose').value = medicineData.morningDose || '';
        li.querySelector('.afternoon-dose').value = medicineData.afternoonDose || '';
        li.querySelector('.evening-dose').value = medicineData.eveningDose || '';
        li.querySelector('.quantity-input').value = medicineData.quantity || '';
        li.querySelector('.retail-price-input').value = medicineData.retailPrice || '';
        li.querySelector('.total-price-input').value = medicineData.totalPrice || '';
        li.querySelector('.medicine-table').dataset.globalNote = medicineData.globalNote || '';
    }

    const daysInput = li.querySelector('.time-input');
    const morningSelect = li.querySelector('.morning-dose');
    const afternoonSelect = li.querySelector('.afternoon-dose');
    const eveningSelect = li.querySelector('.evening-dose');
    const retailPriceInput = li.querySelector('.retail-price-input');

    [daysInput, morningSelect, afternoonSelect, eveningSelect, retailPriceInput].forEach(elem => {
        if (elem) elem.addEventListener('change', () => calculateTotals(li));
    });

    calculateTotals(li);

    medicinesInitialized = true;

    // Update display to show only last 5 items
    updateMedicineListDisplay();

    return li;
};

// Function to delete a medicine item and its associated note
window.deleteMedicineItem = function (button, itemId) {
    const patientId = new URLSearchParams(window.location.search).get('patientId');
    const visitId = new URLSearchParams(window.location.search).get('visitId');
    if (patientId && visitId) {
        const noteRef = ref(db, `patients/${patientId}/visits/${visitId}/information/medicines/${itemId}`);
        remove(noteRef).then(() => {
            console.log(`Successfully removed medicine item ${itemId} from Firebase`);
        }).catch(error => {
            console.error('Error removing medicine item from Firebase:', error);
        });
    }
    button.closest('li').remove();
};

// Function to show the global note popup
window.showGlobalNotePopup = function () {
    const medicineTable = this.closest('.medicine-table');
    const itemId = medicineTable.dataset.itemId;
    const patientId = new URLSearchParams(window.location.search).get('patientId');
    const visitId = new URLSearchParams(window.location.search).get('visitId');

    // Fetch existing note from Firebase
    let existingNote = medicineTable.dataset.globalNote || '';
    if (patientId && visitId && itemId) {
        const noteRef = ref(db, `patients/${patientId}/visits/${visitId}/information/medicines/${itemId}/globalNote`);
        get(noteRef).then(snapshot => {
            if (snapshot.exists()) {
                existingNote = snapshot.val();
                medicineTable.dataset.globalNote = existingNote;
                noteTextarea.value = existingNote; // Update textarea if note is fetched after popup creation
                console.log(`Loaded global note for item ${itemId}:`, existingNote);
            } else {
                console.log(`No global note found in Firebase for item ${itemId}`);
            }
        }).catch(error => {
            console.error('Error fetching note from Firebase:', error);
        });
    }

    const popup = document.createElement('div');
    popup.classList.add('global-note-popup');
    popup.innerHTML = `
        <div class="global-note-popup-content">
            <span class="close-global-note-popup">×</span>
            <h3>Note</h3>
            <textarea class="global-note-input-textarea" placeholder="បញ្ចូលកំណត់ចំណាំនៅទីនេះ...">${existingNote}</textarea>
            <button class="save-global-note-btn">រក្សាទុក</button>
        </div>
    `;

    document.body.appendChild(popup);

    const closeBtn = popup.querySelector('.close-global-note-popup');
    closeBtn.addEventListener('click', () => {
        popup.remove();
    });

    const handleOutsideClick = (event) => {
        if (!popup.contains(event.target) && !event.target.closest('.global-note-icon')) {
            popup.remove();
            document.removeEventListener('click', handleOutsideClick);
        }
    };
    document.addEventListener('click', handleOutsideClick);

    const saveBtn = popup.querySelector('.save-global-note-btn');
    const noteTextarea = popup.querySelector('.global-note-input-textarea');
    saveBtn.addEventListener('click', () => {
        const noteText = noteTextarea.value.trim();
        medicineTable.dataset.globalNote = noteText;

        // Save note to Firebase
        if (patientId && visitId && itemId) {
            const noteRef = ref(db, `patients/${patientId}/visits/${visitId}/information/medicines/${itemId}/globalNote`);
            set(noteRef, noteText).then(() => {
                console.log(`Successfully saved global note for item ${itemId}:`, noteText);
            }).catch(error => {
                console.error('Error saving note to Firebase:', error);
            });
        }

        popup.remove();
    });
};

// Function to update medicine list display
function updateMedicineListDisplay() {
    const ul = document.getElementById('medicineList');
    if (!ul) return;

    const medicineItems = ul.querySelectorAll('.medicine-item');
    const maxVisibleItems = 5;
    medicineItems.forEach((item, index) => {
        item.style.display = index >= medicineItems.length - maxVisibleItems ? 'block' : 'none';
    });
}

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

// Function to fetch current visit data including checkIn and checkOut
async function getCurrentVisitData(patientId, visitId) {
    try {
        const visitRef = ref(db, `patients/${patientId}/visits/${visitId}`);
        const visitSnapshot = await get(visitRef);
        if (!visitSnapshot.exists()) {
            console.error('Visit not found.');
            alert('Visit not found.');
            return null;
        }

        const visitData = visitSnapshot.val();
        console.log('Fetched visit data for visitId', visitId, ':', visitData);

        const updateField = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'N/A';
            }
        };

        updateField('checkInDate', visitData.checkIn || 'N/A');
        updateField('checkOutDate', visitData.checkOut || 'N/A');

        return visitData.information || null;
    } catch (error) {
        console.error('Error fetching current visit:', error);
        alert('Failed to load visit data: ' + error.message);
        return null;
    }
}

// Function to save patient information
async function savePatientInformation() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');
    if (!patientId || !visitId) {
        alert('Missing patient or visit information');
        return;
    }

    const visitCount = await getVisitCount(patientId);
    const treatmentHistory = document.getElementById('treatmentHistory').value.trim();
    const labTest = document.getElementById('labTest').value.trim();
    const diagnosis = document.getElementById('diagnosis').value.trim();
    const totalPrice = document.getElementById('totalPriceValue').value.replace('$', '') || '0.00';

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
        quantity: item.querySelector('.quantity-input').value,
        retailPrice: item.querySelector('.retail-price-input').value,
        totalPrice: item.querySelector('.total-price-input').value,
        globalNote: item.querySelector('.medicine-table').dataset.globalNote || '',
        itemId: item.querySelector('.medicine-table').dataset.itemId || ''
    })).filter(med => med.name && med.dosage && med.days);

    const patientInfo = {
        treatmentHistory: treatmentHistory || 'N/A',
        labTest: labTest || 'N/A',
        diagnosis,
        medicines,
        totalPrice,
        createdAt: new Date().toISOString()
    };

    try {
        const visitInfoRef = ref(db, `patients/${patientId}/visits/${visitId}/information`);
        // Save medicines with their itemId as the key
        const medicinesData = {};
        medicines.forEach(med => {
            if (med.itemId) {
                medicinesData[med.itemId] = {
                    name: med.name,
                    dosage: med.dosage,
                    days: med.days,
                    morningDose: med.morningDose,
                    afternoonDose: med.afternoonDose,
                    eveningDose: med.eveningDose,
                    quantity: med.quantity,
                    retailPrice: med.retailPrice,
                    totalPrice: med.totalPrice,
                    globalNote: med.globalNote
                };
            }
        });

        await set(visitInfoRef, {
            ...patientInfo,
            medicines: medicinesData
        });
        alert('ព័ត៌មានត្រូវបានរក្សាទុកដោយជោគជ័យ!');
        window.history.back();
    } catch (error) {
        console.error('Error saving patient information:', error);
        alert('កំហុសក្នុងការរក្សាទុកព័ត៌មាន៖ ' + error.message);
    }
}

// Function to display visit info
async function displayVisitInfo(patientId, info, isNewVisit) {
    const visitCount = await getVisitCount(patientId);

    // If this is a new visit, treatmentHistory and labTest should be empty
    // If editing an existing visit, load the saved data
    document.getElementById('treatmentHistory').value = isNewVisit ? '' : (info?.treatmentHistory && info.treatmentHistory !== 'N/A' ? info.treatmentHistory : '');
    document.getElementById('labTest').value = isNewVisit ? '' : (info?.labTest && info.labTest !== 'N/A' ? info.labTest : '');
    document.getElementById('diagnosis').value = info?.diagnosis || '';
    document.getElementById('totalPriceValue').value = info?.totalPrice ? `$${info.totalPrice}` : '$0.00';

    const medicineList = document.getElementById('medicineList');
    medicineList.innerHTML = '';
    if (info?.medicines && Object.keys(info.medicines).length > 0) {
        Object.entries(info.medicines).forEach(([itemId, med]) => {
            const li = addMedicineItem(med, true);
            if (li) li.querySelector('.medicine-table').dataset.itemId = itemId;
        });
    } else {
        addMedicineItem(null, true);
    }

    // Update display to show only last 5 items
    updateMedicineListDisplay();
}

// Function to clear form
function clearForm() {
    document.getElementById('treatmentHistory').value = '';
    document.getElementById('labTest').value = '';
    document.getElementById('diagnosis').value = '';
    document.getElementById('totalPriceValue').value = '$0.00';
    document.getElementById('medicineList').innerHTML = '';
    medicinesInitialized = false;
    addMedicineItem(null, true);
    updateMedicineListDisplay();
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    initDiagnosisDropdown();

    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');

    if (patientId && visitId) {
        // Load current visit data including checkIn and checkOut
        const visitInfo = await getCurrentVisitData(patientId, visitId);
        if (visitInfo) {
            // Existing visit: load the saved data
            await displayVisitInfo(patientId, visitInfo, false);
        } else {
            // New visit: load diagnosis and medicines from latest visit, but keep treatmentHistory and labTest empty
            const latestVisitData = await getLatestVisitData(patientId);
            await displayVisitInfo(patientId, latestVisitData || {}, true);
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

    // Add event listener for total price button
    document.addEventListener('click', (event) => {
        if (event.target.matches('.total-price-section button')) {
            event.stopPropagation();
            showTotalPricePopup();
        }
    });

    // Add event listener for the note icon in the thead using event delegation
    document.addEventListener('click', (event) => {
        const noteIcon = event.target.closest('.global-note-icon');
        if (noteIcon) {
            showGlobalNotePopup.call(noteIcon);
        }
    });

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