// Importing necessary functions from Firebase
import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { note4Options } from './dropdown.js'; // Assuming you have a list of diagnosis options here
import { medicineList } from './medicine-dropdown.js'; // Assuming you have a list of medicine instructions

// Function to initialize dropdown for Diagnosis (similar to `add-detail-page.js` for diagnosis)
function initDiagnosisDropdown() {
    const diagnosisInput = document.getElementById('patientDiagnosis');
    const diagnosisDropdown = document.getElementById('diagnosis-dropdown');

    if (!diagnosisInput || !diagnosisDropdown) return;

    diagnosisInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        diagnosisDropdown.innerHTML = '';

        const filteredOptions = query
            ? note4Options.filter(option => option.toLowerCase().includes(query))
            : note4Options;

        filteredOptions.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = function () {
                diagnosisInput.value = option;
                diagnosisDropdown.innerHTML = '';
                diagnosisDropdown.style.display = 'none';
            };
            diagnosisDropdown.appendChild(div);
        });

        diagnosisDropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    diagnosisInput.addEventListener('click', function () {
        diagnosisDropdown.style.display = 'block';
        if (diagnosisDropdown.innerHTML === '') {
            note4Options.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = function () {
                    diagnosisInput.value = option;
                    diagnosisDropdown.innerHTML = '';
                    diagnosisDropdown.style.display = 'none';
                };
                diagnosisDropdown.appendChild(div);
            });
        }
    });
}

// Function to initialize dropdown for Medicine Instructions (similar to `add-detail-page.js` for medicine)
function initMedicineDropdown() {
    const medicineInput = document.getElementById('medicineInstructions');
    const medicineDropdown = document.getElementById('medicine-dropdown');

    if (!medicineInput || !medicineDropdown) return;

    medicineInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        medicineDropdown.innerHTML = '';

        const filteredOptions = query
            ? medicineList.filter(option => option.toLowerCase().includes(query))
            : medicineList;

        filteredOptions.forEach(option => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = option;
            div.onclick = function () {
                medicineInput.value = option;
                medicineDropdown.innerHTML = '';
                medicineDropdown.style.display = 'none';
            };
            medicineDropdown.appendChild(div);
        });

        medicineDropdown.style.display = filteredOptions.length ? 'block' : 'none';
    });

    medicineInput.addEventListener('click', function () {
        medicineDropdown.style.display = 'block';
        if (medicineDropdown.innerHTML === '') {
            medicineList.forEach(option => {
                const div = document.createElement("div");
                div.classList.add("dropdown-item");
                div.textContent = option;
                div.onclick = function () {
                    medicineInput.value = option;
                    medicineDropdown.innerHTML = '';
                    medicineDropdown.style.display = 'none';
                };
                medicineDropdown.appendChild(div);
            });
        }
    });
}

// Function to save patient diagnosis and medicine instructions
async function savePatientData(recordId) {
    const diagnosis = document.getElementById('patientDiagnosis').value.trim();
    const medicineInstructions = document.getElementById('medicineInstructions').value.trim();

    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);
        const currentData = snapshot.val();

        // Save both diagnosis and medicine instructions
        await update(patientRef, {
            diagnosis: diagnosis, // Save diagnosis
            medicineInstructions: medicineInstructions // Save medicine instructions
        });

        alert('Patient data saved successfully!');
        window.history.back();
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Failed to save data.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        getPatientDetails(recordId); // Assuming this function fetches the patient's existing data
        initDiagnosisDropdown(); // Initialize the diagnosis dropdown
        initMedicineDropdown(); // Initialize the medicine instructions dropdown
        document.getElementById('saveBtn').addEventListener('click', function () {
            savePatientData(recordId); // Save the patient data (diagnosis and medicine)
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (event) {
        const diagnosisDropdown = document.getElementById('diagnosis-dropdown');
        const medicineDropdown = document.getElementById('medicine-dropdown');
        const diagnosisInput = document.getElementById('patientDiagnosis');
        const medicineInput = document.getElementById('medicineInstructions');
        if (diagnosisDropdown && !diagnosisInput.contains(event.target) && !diagnosisDropdown.contains(event.target)) {
            diagnosisDropdown.style.display = 'none';
        }
        if (medicineDropdown && !medicineInput.contains(event.target) && !medicineDropdown.contains(event.target)) {
            medicineDropdown.style.display = 'none';
        }
    });
});
