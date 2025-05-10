import { db } from './firebase-config.js';
import { ref, set, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { note4Options } from './dropdown.js';
import { medicineOptions } from './medicine-dropdown.js';

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

// Function to calculate medication quantity
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
// ... other imports and functions unchanged ...

async function getPatientDetails(recordId, visitId = null) {
    try {
        let structuredNotes = {};
        let basicInfo = {};

        // First get the basic patient info
        const patientRef = ref(db, 'patients/' + recordId);
        const patientSnapshot = await get(patientRef);

        if (!patientSnapshot.exists()) {
            console.error('Patient not found.');
            return;
        }

        basicInfo = patientSnapshot.val();

        // Update patient info in DOM safely
        const updateField = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'N/A';
            } else {
                console.warn(`Element with ID '${id}' not found`);
            }
        };

        updateField('patientName', basicInfo.fullName);
        updateField('patientFullName', basicInfo.fullName);
        updateField('patientAge', basicInfo.age);
        updateField('patientGender', basicInfo.gender);
        updateField('patientPhone', basicInfo.phone);
        updateField('patientEmail', basicInfo.email);

        // Handle notes display
        if (typeof basicInfo.notes === 'string') {
            update    updateField('patientNotes', basicInfo.notes);
        } else if (basicInfo.notes?.original) {
            updateField('patientNotes', basicInfo.notes.original);
        } else {
            updateField('patientNotes', '');
        }

        // Address Mapping
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

            const addressString = addressParts.join(', ');
            updateField('patientAddress', addressString);
        } else {
            updateField('patientAddress', 'N/A');
        }

        // Now fetch structured notes
        if (visitId) {
            const visitRef = ref(db, `patients/${recordId}/visits/${visitId}/information`);
            const visitSnapshot = await get(visitRef);

            if (visitSnapshot.exists()) {
                structuredNotes = visitSnapshot.val();
            } else if (basicInfo.structuredNotes) {
                structuredNotes = basicInfo.structuredNotes;
            }
        } else {
            structuredNotes = basicInfo.structuredNotes || {};
        }

        // Populate structured notes fields safely
        const setInputValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
            } else {
                console.warn(`Element with ID '${id}' not found`);
            }
        };

        setInputValue('patientNote1', structuredNotes.note1);
        setInputValue('patientNote2', structuredNotes.note2);
        setInputValue('patientNote3', structuredNotes.note3);
        setInputValue('patientNote4', structuredNotes.note4);
        setInputValue('patientNote5', structuredNotes.note5);

        // Load medicines
        const ul = document.getElementById('medicineList');
        if (ul) {
            ul.innerHTML = '';
            if (structuredNotes.medicines) {
                structuredNotes.medicines.forEach(med => {
                    const li = addMedicineItem(med);
                    calculateMedicationQuantity(li);
                });
            }
        } else {
            console.warn("Element with ID 'medicineList' not found");
        }

    } catch (error) {
        console.error('Error fetching patient details:', error);
    }
}

// ... rest of the file unchanged ...

// Function to save patient notes
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
        note1: document.getElementById('patientNote1').value.trim(),
        note2: document.getElementById('patientNote2').value.trim(),
        note3: document.getElementById('patientNote3').value.trim(),
        note4: document.getElementById('patientNote4').value.trim(),
        note5: document.getElementById('patientNote5').value.trim(),
        medicines
    };

    try {
        if (visitId) {
            await set(ref(db, `patients/${recordId}/visits/${visitId}/information`), structuredNotes);
        } else {
            const snapshot = await get(ref(db, 'patients/' + recordId));
            const currentData = snapshot.val() || {};
            await update(ref(db, 'patients/' + recordId), {
                ...currentData,
                structuredNotes,
                notes: document.getElementById('patientNotes').value.trim()
            }); 
        }javascript
        import { db } from './firebase-config.js';
        import { ref, set, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
        import { note4Options } from './dropdown.js';
        import { medicineOptions } from './medicine-dropdown.js';
        
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
        
        // Function to calculate medication quantity
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
        
        async function getPatientDetails(recordId, visitId = null) {
            try {
                let structuredNotes = {};
                let basicInfo = {};
        
                // First get the basic patient info
                const patientRef = ref(db, 'patients/' + recordId);
                const patientSnapshot = await get(patientRef);
        
                if (!patientSnapshot.exists()) {
                    console.error('Patient not found.');
                    return;
                }
        
                basicInfo = patientSnapshot.val();
        
                // Update patient info in DOM safely
                const updateField = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value || 'N/A';
                    } else {
                        console.warn(`Element with ID '${id}' not found`);
                    }
                };
        
                updateField('patientName', basicInfo.fullName);
                updateField('patientFullName', basicInfo.fullName);
                updateField('patientAge', basicInfo.age);
                updateField('patientGender', basicInfo.gender);
                updateField('patientPhone', basicInfo.phone);
                updateField('patientEmail', basicInfo.email);
        
                // Handle notes display
                if (typeof basicInfo.notes === 'string') {
                    updateField('patientNotes', basicInfo.notes); // Fixed: Removed redundant 'update'
                } else if (basicInfo.notes?.original) {
                    updateField('patientNotes', basicInfo.notes.original);
                } else {
                    updateField('patientNotes', '');
                }
        
                // Address Mapping
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
        
                    const addressString = addressParts.join(', ');
                    updateField('patientAddress', addressString);
                } else {
                    updateField('patientAddress', 'N/A');
                }
        
                // Now fetch structured notes
                if (visitId) {
                    const visitRef = ref(db, `patients/${recordId}/visits/${visitId}/information`);
                    const visitSnapshot = await get(visitRef);
        
                    if (visitSnapshot.exists()) {
                        structuredNotes = visitSnapshot.val();
                    } else if (basicInfo.structuredNotes) {
                        structuredNotes = basicInfo.structuredNotes;
                    }
                } else {
                    structuredNotes = basicInfo.structuredNotes || {};
                }
        
                // Populate structured notes fields safely
                const setInputValue = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.value = value || '';
                    } else {
                        console.warn(`Element with ID '${id}' not found`);
                    }
                };
        
                setInputValue('patientNote1', structuredNotes.note1);
                setInputValue('patientNote2', structuredNotes.note2);
                setInputValue('patientNote3', structuredNotes.note3);
                setInputValue('patientNote4', structuredNotes.note4);
                setInputValue('patientNote5', structuredNotes.note5);
        
                // Load medicines
                const ul = document.getElementById('medicineList');
                if (ul) {
                    ul.innerHTML = '';
                    if (structuredNotes.medicines) {
                        structuredNotes.medicines.forEach(med => {
                            const li = addMedicineItem(med);
                            calculateMedicationQuantity(li);
                        });
                    }
                } else {
                    console.warn("Element with ID 'medicineList' not found");
                }
        
            } catch (error) {
                console.error('Error fetching patient details:', error);
            }
        }
        
        // Function to save patient notes
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
                note1: document.getElementById('patientNote1').value.trim(),
                note2: document.getElementById('patientNote2').value.trim(),
                note3: document.getElementById('patientNote3').value.trim(),
                note4: document.getElementById('patientNote4').value.trim(),
                note5: document.getElementById('patientNote5').value.trim(),
                medicines
            };
        
            try {
                if (visitId) {
                    await set(ref(db, `patients/${recordId}/visits/${visitId}/information`), structuredNotes);
                } else {
                    const snapshot = await get(ref(db, 'patients/' + recordId));
                    const currentData = snapshot.val() || {};
                    await update(ref(db, 'patients/' + recordId), {
                        ...currentData,
                        structuredNotes,
                        notes: document.getElementById('patientNotes').value.trim()
                    }); 
                }
                alert('Notes saved successfully!');
                window.history.back();
            } catch (err) {
                console.error('Error saving patient notes:', err);
                alert('Failed to save notes.');
            }
        }
        
        // Function to initialize medicine dropdown
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
            if (!ul) {
                console.error("Error: 'medicineList' element not found!");
                return null;
            }
        
            const li = document.createElement('li');
            li.classList.add('medicine-item');
        
            li.innerHTML = 
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
                                    <input. type="text" class="medicine-input" placeholder="សូមជ្រើសរើសថ្នាំ..." autocomplete="off">
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
                                    <option value="1+1/4">1/1/4</option>
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
            ;
        
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
            }
        
            const daysInput = li.querySelector('.time-input');
            const morningSelect = li.querySelector('.morning-dose');
            const afternoonSelect = li.querySelector('.afternoon-dose');
            const eveningSelect = li.querySelector('.evening-dose');
        
            daysInput.addEventListener('input', () => calculateMedicationQuantity(li));
            morningSelect.addEventListener('change', () => calculateMedicationQuantity(li));
            afternoonSelect.addEventListener('change', () => calculateMedicationQuantity(li));
            eveningSelect.addEventListener('change', () => calculateMedicationQuantity(li));
        
            return li;
        };
        
        document.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const recordId = urlParams.get('patientId');
            const visitId = urlParams.get('visitId');
        
            if (recordId) {
                getPatientDetails(recordId, visitId);
                initDiagnosisDropdown();
        
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
        alert('Notes saved successfully!');
        window.history.back();
    } catch (err) {
        console.error('Error saving patient notes:', err);
        alert('Failed to save notes.');
    }
}

// Function to initialize medicine dropdown
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
    }

    const daysInput = li.querySelector('.time-input');
    const morningSelect = li.querySelector('.morning-dose');
    const afternoonSelect = li.querySelector('.afternoon-dose');
    const eveningSelect = li.querySelector('.evening-dose');

    daysInput.addEventListener('input', () => calculateMedicationQuantity(li));
    morningSelect.addEventListener('change', () => calculateMedicationQuantity(li));
    afternoonSelect.addEventListener('change', () => calculateMedicationQuantity(li));
    eveningSelect.addEventListener('change', () => calculateMedicationQuantity(li));

    return li;
};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('patientId');
    const visitId = urlParams.get('visitId');

    if (recordId) {
        getPatientDetails(recordId, visitId);
        initDiagnosisDropdown();

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