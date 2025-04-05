import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
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

// Function to parse dose values (including fractions)
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

// Function to fetch patient data and populate the details
async function getPatientDetails(recordId) {
    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);

        if (snapshot.exists()) {
            const patientData = snapshot.val();

            // Update basic patient info
            document.getElementById('patientFullName').textContent = patientData.fullName;
            document.getElementById('patientAge').textContent = patientData.age;
            document.getElementById('patientGender').textContent = patientData.gender;
            document.getElementById('patientPhone').textContent = patientData.phone;
            document.getElementById('patientEmail').textContent = patientData.email || 'N/A';
            document.getElementById('patientName').textContent = patientData.fullName;

            // Update form fields with note values
            document.getElementById('patientNote1').value = patientData.notes?.note1 || '';
            document.getElementById('patientNote2').value = patientData.notes?.note2 || '';
            document.getElementById('patientNote3').value = patientData.notes?.note3 || '';
            document.getElementById('patientNote4').value = patientData.notes?.note4 || '';
            document.getElementById('patientNote5').value = patientData.notes?.note5 || '';

            // Format and display the notes properly
            if (patientData.notes) {
                let notesHtml = '';
                const khmerLabels = [
                    "1. សញ្ញាណតម្អូញ:",
                    "2. ប្រវត្តិព្យាបាល:",
                    "3. តេស្តមន្ទីពិសោធន៍:",
                    "4. រោគវិនិច្ឆ័យ:",
                    "5. រោគវិនិច្ឆ័យញែក:"
                ];
                
                // Add general notes if they exist
                if (patientData.notes.general) {
                    notesHtml += `<div class="note-item"><strong>វេជ្ជបញ្ជា:</strong> ${patientData.notes.general}</div>`;
                }
                
                // Add all 5 notes
                for (let i = 1; i <= 5; i++) {
                    const noteKey = `note${i}`;
                    if (patientData.notes[noteKey]) {
                        notesHtml += `<div class="note-item"><strong>${khmerLabels[i-1]}</strong> ${patientData.notes[noteKey]}</div>`;
                    } else {
                        notesHtml += `<div class="note-item"><strong>${khmerLabels[i-1]}</strong> មិនទាន់បំពេញ</div>`;
                    }
                }
                
                // Add medicines if they exist
                if (patientData.notes.medicines && patientData.notes.medicines.length > 0) {
                    notesHtml += `<div class="note-item"><strong>6. របៀបប្រើប្រាស់ថ្នាំ:</strong></div>`;
                    notesHtml += `<div class="medicine-container">`;
                    notesHtml += `<div class="medicine-header">
                        <div class="medicine-col">ឈ្មោះថ្នាំ</div>
                        <div class="medicine-col">ប្រភេទថ្នាំ</div>
                        <div class="medicine-col">រយះពេល</div>
                        <div class="medicine-col">ព្រឹក</div>
                        <div class="medicine-col">ថ្ងៃ</div>
                        <div class="medicine-col">ល្ងាច</div>
                        <div class="medicine-col">ចំនួន</div>
                    </div>`;
                    
                    patientData.notes.medicines.forEach(med => {
                        notesHtml += `<div class="medicine-row">
                            <div class="medicine-col">${med.name || ''}</div>
                            <div class="medicine-col">${med.dosage || ''}</div>
                            <div class="medicine-col">${med.days || ''} ថ្ងៃ</div>
                            <div class="medicine-col">${med.morningDose || ''}</div>
                            <div class="medicine-col">${med.afternoonDose || ''}</div>
                            <div class="medicine-col">${med.eveningDose || ''}</div>
                            <div class="medicine-col">${med.quantity || ''}</div>
                        </div>`;
                    });
                    
                    notesHtml += `</div>`;
                } else {
                    notesHtml += `<div class="note-item"><strong>6. របៀបប្រើប្រាស់ថ្នាំ:</strong> មិនទាន់បំពេញ</div>`;
                }
                
                document.getElementById('patientNotes').innerHTML = notesHtml;
            } else {
                document.getElementById('patientNotes').innerHTML = '<div class="note-item">មិនមានវេជ្ជបញ្ជា</div>';
            }

            // Populate medicines if they exist
            if (patientData.notes?.medicines) {
                const ul = document.getElementById('medicineList');
                ul.innerHTML = ''; // Clear existing medicines
                patientData.notes.medicines.forEach(med => {
                    addMedicineItem();
                    const lastItem = ul.lastChild;
                    const medicineInput = lastItem.querySelector('.medicine-input');
                    medicineInput.value = med.name;
                    lastItem.querySelector('.dosage-select').value = med.dosage;
                    lastItem.querySelector('.time-input').value = med.days || '';
                    lastItem.querySelectorAll('.dosage-select')[1].value = med.morningDose || '';
                    lastItem.querySelectorAll('.dosage-select')[2].value = med.afternoonDose || '';
                    lastItem.querySelectorAll('.dosage-select')[3].value = med.eveningDose || '';
                    lastItem.querySelector('.quantity-input').value = med.quantity || '';
                });
            }
        } else {
            console.log('No data available for this patient.');
            document.getElementById('patientNotes').innerHTML = '<div class="note-item">មិនមានទិន្នន័យអ្នកជម្ងឺ</div>';
        }
    } catch (error) {
        console.error('Error fetching patient details:', error);
        document.getElementById('patientNotes').innerHTML = '<div class="note-item">កំហុសក្នុងការទាញយកទិន្នន័យ</div>';
    }
}

// [Rest of your existing code remains the same...]

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        getPatientDetails(recordId);
        initDiagnosisDropdown();
        document.getElementById('saveBtn').addEventListener('click', function () {
            savePatientNotes(recordId);
        });
        document.getElementById('addMedicineBtn').addEventListener('click', addMedicineItem);
        document.querySelectorAll('.medicine-item').forEach(item => {
            initMedicineDropdown(item);
        });
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