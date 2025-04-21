// Import required modules
import { db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { note4Options } from './dropdown.js';
import { medicineOptions } from './medicine-dropdown.js';

// Function to initialize diagnosis dropdown in add-information
function initDiagnosisDropdown() {
    const input = document.getElementById('patientDiagnosis');
    const dropdown = document.getElementById('diagnosis-dropdown');

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

// Function to save patient diagnosis (new code for "Diagnosis" saving)
async function savePatientDiagnosis(recordId) {
    const diagnosis = document.getElementById('patientDiagnosis').value.trim();

    try {
        const patientRef = ref(db, 'patients/' + recordId);
        const snapshot = await get(patientRef);
        const currentData = snapshot.val();
        
        // Preserve original diagnosis if they exist
        const originalDiagnosis = currentData.diagnosis || '';

        await update(patientRef, { 
            diagnosis: originalDiagnosis,  // Keep original diagnosis as string
            structuredNotes: { diagnosis: diagnosis } // Store new diagnosis separately
        });

        alert('Diagnosis saved successfully!');
        window.history.back();
    } catch (error) {
        console.error('Error saving diagnosis:', error);
        alert('Failed to save diagnosis.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const recordId = new URLSearchParams(window.location.search).get('id');
    if (recordId) {
        getPatientDetails(recordId);
        initDiagnosisDropdown();  // Initialize diagnosis dropdown
        document.getElementById('saveBtn').addEventListener('click', function () {
            savePatientDiagnosis(recordId);  // Save the patient diagnosis
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (event) {
        const diagnosisDropdown = document.getElementById('diagnosis-dropdown');
        const diagnosisInput = document.getElementById('patientDiagnosis');
        if (diagnosisDropdown && diagnosisInput && !diagnosisInput.contains(event.target) && !diagnosisDropdown.contains(event.target)) {
            diagnosisDropdown.style.display = 'none';
        }
    });
});
